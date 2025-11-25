// scripts/init-printer-collections.js
const { MongoClient } = require('mongodb')

const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/demo-qasa-restaurant'

async function initPrinterCollections() {
  const client = new MongoClient(uri)
  
  try {
    await client.connect()
    console.log('✅ Connected to MongoDB')
    
    const db = client.db()
    
    // Create collections if they don't exist
    const collections = ['printer_configs', 'printer_devices', 'print_logs']
    
    for (const collectionName of collections) {
      const exists = await db.listCollections({ name: collectionName }).hasNext()
      
      if (!exists) {
        await db.createCollection(collectionName)
        console.log(`✅ Created collection: ${collectionName}`)
      } else {
        console.log(`ℹ️  Collection already exists: ${collectionName}`)
      }
    }
    
    // Create indexes
    console.log('\n📊 Creating indexes...')
    
    // printer_devices indexes
    await db.collection('printer_devices').createIndex(
      { apiKey: 1 }, 
      { unique: true }
    )
    console.log('✅ Index created: printer_devices.apiKey (unique)')
    
    await db.collection('printer_devices').createIndex({ restaurantId: 1 })
    console.log('✅ Index created: printer_devices.restaurantId')
    
    // printer_configs indexes
    await db.collection('printer_configs').createIndex(
      { restaurantId: 1 }, 
      { unique: true }
    )
    console.log('✅ Index created: printer_configs.restaurantId (unique)')
    
    // print_logs indexes
    await db.collection('print_logs').createIndex({ timestamp: -1 })
    console.log('✅ Index created: print_logs.timestamp')
    
    await db.collection('print_logs').createIndex({ restaurantId: 1 })
    console.log('✅ Index created: print_logs.restaurantId')
    
    console.log('\n🎉 Printer collections initialized successfully!')
    console.log('\n📋 Collections created:')
    console.log('  - printer_configs: Yazıcı konfigürasyonları')
    console.log('  - printer_devices: Bağlı cihazlar ve API keyleri')
    console.log('  - print_logs: Yazdırma logları')
    
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  } finally {
    await client.close()
    console.log('\n✅ Connection closed')
  }
}

initPrinterCollections()