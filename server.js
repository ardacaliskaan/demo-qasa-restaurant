// server.js - Custom Next.js server with WebSocket (Port 3007)
const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')
const WebSocket = require('ws')
const { MongoClient } = require('mongodb')

const dev = process.env.NODE_ENV !== 'production'
const hostname = 'localhost'
const port = parseInt(process.env.PORT || '3007', 10)

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

// MongoDB connection
const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/demo-qasa-restaurant'
console.log('🔗 MongoDB URI:', mongoUri)
console.log('📝 Environment MONGODB_URI:', process.env.MONGODB_URI)
let mongoClient

// WebSocket clients storage
const wsClients = new Set()

// Verify API Key
async function verifyApiKey(apiKey) {
  try {
    const db = mongoClient.db()
    const device = await db.collection('printer_devices').findOne({ apiKey })
    
    if (device) {
      // Update last seen
      await db.collection('printer_devices').updateOne(
        { _id: device._id },
        { 
          $set: { 
            lastSeen: new Date(),
            status: 'online'
          } 
        }
      )
    }
    
    return device
  } catch (error) {
    console.error('API Key verification error:', error)
    return null
  }
}

// Start server
app.prepare().then(async () => {
  // Connect to MongoDB
  try {
    mongoClient = new MongoClient(mongoUri)
    await mongoClient.connect()
    console.log('✅ MongoDB connected')
  } catch (error) {
    console.error('❌ MongoDB connection error:', error)
    console.log('⚠️  Server will start without printer WebSocket functionality')
  }

  const server = createServer(async (req, res) => {
    const parsedUrl = parse(req.url, true)
    await handle(req, res, parsedUrl)
  })

  // WebSocket Server
  const wss = new WebSocket.Server({ 
    noServer: true,
    path: '/api/printer/ws'
  })

  // Handle WebSocket upgrade
  server.on('upgrade', async (request, socket, head) => {
    const { pathname, query } = parse(request.url, true)

    if (pathname === '/api/printer/ws') {
      const apiKey = query.apiKey

      if (!apiKey) {
        socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n')
        socket.destroy()
        return
      }

      // Verify API key
      const device = await verifyApiKey(apiKey)
      
      if (!device) {
        socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n')
        socket.destroy()
        return
      }

      // Accept WebSocket connection
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request, device)
      })
    } else {
      socket.destroy()
    }
  })

  // WebSocket connection handler
  wss.on('connection', (ws, request, device) => {
    console.log(`🔌 WebSocket connected: ${device.deviceName} (${device._id})`)
    
    // Add to clients
    wsClients.add(ws)
    
    // Make wsClients available globally for orders API
    global.wsClients = wsClients

    // Send welcome message
    ws.send(JSON.stringify({
      type: 'CONNECTED',
      timestamp: new Date().toISOString(),
      message: `Welcome ${device.deviceName}!`,
      deviceId: device._id.toString(),
    }))

    // Handle incoming messages
    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString())
        console.log(`📨 Received from ${device.deviceName}:`, data)

        // Handle PONG (heartbeat response)
        if (data.type === 'PONG') {
          await verifyApiKey(device.apiKey) // Update last seen
        }

        // Handle PRINT_SUCCESS
        if (data.type === 'PRINT_SUCCESS') {
          const db = mongoClient.db()
          await db.collection('print_logs').insertOne({
            restaurantId: device.restaurantId,
            deviceId: device._id,
            deviceName: device.deviceName,
            printerId: data.printerId,
            printerName: data.printerName,
            orderId: data.orderId,
            type: 'order',
            status: 'success',
            timestamp: new Date(),
          })
          console.log('✅ Print logged as success')
        }

        // Handle PRINT_ERROR
        if (data.type === 'PRINT_ERROR') {
          const db = mongoClient.db()
          await db.collection('print_logs').insertOne({
            restaurantId: device.restaurantId,
            deviceId: device._id,
            deviceName: device.deviceName,
            printerId: data.printerId,
            printerName: data.printerName,
            orderId: data.orderId,
            type: 'order',
            status: 'error',
            errorMessage: data.error,
            timestamp: new Date(),
          })
          console.error('❌ Print error logged:', data.error)
        }

      } catch (error) {
        console.error('Message handling error:', error)
      }
    })

    // Handle disconnect
    ws.on('close', async () => {
      console.log(`🔌 WebSocket disconnected: ${device.deviceName}`)
      wsClients.delete(ws)
      
      // Update device status
      const db = mongoClient.db()
      await db.collection('printer_devices').updateOne(
        { _id: device._id },
        { 
          $set: { 
            status: 'offline',
            lastSeen: new Date()
          } 
        }
      )
    })

    // Handle errors
    ws.on('error', (error) => {
      console.error(`WebSocket error for ${device.deviceName}:`, error)
      wsClients.delete(ws)
    })

    // Heartbeat - Send PING every 30 seconds
    const heartbeat = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'PING',
          timestamp: new Date().toISOString(),
        }))
      } else {
        clearInterval(heartbeat)
      }
    }, 30000)
  })

  // Start HTTP server
  server.listen(port, (err) => {
    if (err) throw err
    console.log(`🚀 Server ready on http://${hostname}:${port}`)
    console.log(`🔌 WebSocket ready on ws://${hostname}:${port}/api/printer/ws`)
  })
})

process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing connections...')
  if (mongoClient) {
    await mongoClient.close()
  }
  process.exit(0)
})