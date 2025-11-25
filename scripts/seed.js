// scripts/seed.js - Sadece Admin Kullanıcı

const { MongoClient } = require('mongodb')
const bcrypt = require('bcryptjs')

const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/demo-qasa-restaurant'

async function seedDatabase() {
  const client = new MongoClient(uri)
  
  try {
    await client.connect()
    console.log('✅ MongoDB bağlantısı başarılı!')
    
const db = client.db('demo-qasa-restaurant')    
    // Sadece admin kullanıcı
    const adminUser = {
      name: 'Admin',
      username: 'admin',
      email: 'admin@ayisigicafe.com',
      password: bcrypt.hashSync('admin123', 12),
      role: 'admin',
      phone: null,
      avatar: null,
      isActive: true,
      permissions: [
        'users.*',
        'orders.*',
        'menu.*',
        'categories.*',
        'ingredients.*',
        'tables.*',
        'reports.*',
        'settings.*'
      ],
      metadata: {
        lastLogin: null,
        loginCount: 0,
        createdBy: null
      },
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    console.log('\n📝 Admin kullanıcı oluşturuluyor...')
    
    // Önce var mı kontrol et
    const existingAdmin = await db.collection('users').findOne({ username: 'admin' })
    
    if (existingAdmin) {
      console.log('ℹ️  Admin kullanıcı zaten mevcut')
    } else {
      await db.collection('users').insertOne(adminUser)
      console.log('✅ Admin kullanıcı eklendi')
    }
    
    console.log('\n🔐 Giriş Bilgileri:')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('👨‍💼 Admin:')
    console.log('   Kullanıcı Adı: admin')
    console.log('   Şifre: ayisigi123')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
    
    console.log('✨ Seed işlemi tamamlandı!')
    
  } catch (error) {
    console.error('❌ Seed hatası:', error)
    process.exit(1)
  } finally {
    await client.close()
  }
}

seedDatabase()