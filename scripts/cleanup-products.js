// scripts/cleanup-demo.js
// Demo database'ini temizler (sadece menu, categories, ingredients, tables, orders)

const { MongoClient } = require('mongodb')

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/demo-qasa-restaurant'

async function cleanupDemo() {
  console.log('🧹 DEMO DATABASE TEMİZLEME BAŞLIYOR...\n')
  
  const client = new MongoClient(MONGODB_URI)
  
  try {
    await client.connect()
    console.log('✅ MongoDB bağlantısı başarılı!\n')
    
    const db = client.db()
    
    // Silinecek collections
    const collectionsToClean = ['menu', 'categories', 'ingredients', 'tables', 'orders']
    
    console.log('📊 Mevcut durumu kontrol ediliyor...\n')
    
    for (const collectionName of collectionsToClean) {
      const count = await db.collection(collectionName).countDocuments()
      console.log(`  ${collectionName}: ${count} kayıt`)
    }
    
    console.log('\n⚠️  TÜM VERİLER SİLİNECEK!')
    console.log('⚠️  Yazıcı ayarları (printer_*) korunacak!\n')
    console.log('⏳ 3 saniye içinde iptal etmek için Ctrl+C basın...\n')
    
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    // Temizleme
    console.log('🗑️  Temizleme başlıyor...\n')
    
    for (const collectionName of collectionsToClean) {
      const result = await db.collection(collectionName).deleteMany({})
      console.log(`✅ ${collectionName}: ${result.deletedCount} kayıt silindi`)
    }
    
    console.log('\n✨ Database temizlendi!')
    console.log('ℹ️  printer_configs, printer_devices, print_logs korundu')
    
  } catch (error) {
    console.error('❌ Hata:', error.message)
    process.exit(1)
  } finally {
    await client.close()
    console.log('\n👋 MongoDB bağlantısı kapatıldı')
  }
}

cleanupDemo()
  .then(() => {
    console.log('\n🎉 Temizlik tamamlandı!')
    process.exit(0)
  })
  .catch(err => {
    console.error('❌ Fatal error:', err)
    process.exit(1)
  })