import { NextResponse } from 'next/server'
import { getPrintLogCollection, getDeviceCollection } from '@/lib/mongodb-printer'

// Verify API Key
async function verifyApiKey(apiKey) {
  if (!apiKey) return null
  
  const devicesCollection = await getDeviceCollection()
  const device = await devicesCollection.findOne({ apiKey })
  
  if (device) {
    await devicesCollection.updateOne(
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
}

// POST - Log test print
export async function POST(request) {
  try {
    const authHeader = request.headers.get('authorization')
    const apiKey = authHeader?.replace('Bearer ', '')

    const device = await verifyApiKey(apiKey)
    if (!device) {
      return NextResponse.json(
        { success: false, error: 'Invalid API key' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { printerId, printerName, status, errorMessage } = body

    const printLogsCollection = await getPrintLogCollection()
    
    const logEntry = {
      restaurantId: device.restaurantId,
      deviceId: device._id,
      deviceName: device.deviceName,
      printerId,
      printerName,
      type: 'test',
      status: status || 'success',
      errorMessage: errorMessage || null,
      timestamp: new Date(),
    }

    await printLogsCollection.insertOne(logEntry)

    return NextResponse.json({
      success: true,
      message: 'Test print logged successfully',
    })
  } catch (error) {
    console.error('Test print log error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to log test print' },
      { status: 500 }
    )
  }
}

// GET - Get print logs
export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization')
    const apiKey = authHeader?.replace('Bearer ', '')

    const device = await verifyApiKey(apiKey)
    if (!device) {
      return NextResponse.json(
        { success: false, error: 'Invalid API key' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')

    const printLogsCollection = await getPrintLogCollection()
    const logs = await printLogsCollection
      .find({ restaurantId: device.restaurantId })
      .sort({ timestamp: -1 })
      .limit(limit)
      .toArray()

    return NextResponse.json({
      success: true,
      logs,
    })
  } catch (error) {
    console.error('Get logs error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch logs' },
      { status: 500 }
    )
  }
}