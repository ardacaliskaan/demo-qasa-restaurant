// scripts/seed-demo.js
// Minimal demo data oluşturur

const { MongoClient, ObjectId } = require('mongodb')

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/demo-qasa-restaurant'

// Demo data
const CATEGORIES = [
  { _id: new ObjectId(), name: 'Ana Yemek', slug: 'ana-yemek', sortOrder: 1, isActive: true },
  { _id: new ObjectId(), name: 'İçecek', slug: 'icecek', sortOrder: 2, isActive: true },
  { _id: new ObjectId(), name: 'Tatlı', slug: 'tatli', sortOrder: 3, isActive: true },
]

const INGREDIENTS = [
  { _id: new ObjectId(), name: 'Et', category: 'protein', allergens: [] },
  { _id: new ObjectId(), name: 'Tavuk', category: 'protein', allergens: [] },
  { _id: new ObjectId(), name: 'Pirinç', category: 'grain', allergens: ['gluten'] },
  { _id: new ObjectId(), name: 'Domates', category: 'vegetable', allergens: [] },
  { _id: new ObjectId(), name: 'Biber', category: 'vegetable', allergens: [] },
  { _id: new ObjectId(), name: 'Süt', category: 'dairy', allergens: ['lactose'] },
  { _id: new ObjectId(), name: 'Fıstık', category: 'nut', allergens: ['nut'] },
]

const MENU_ITEMS = [
  // Ana Yemekler
  {
    _id: new ObjectId(),
    name: 'İskender',
    slug: 'iskender',
    description: 'Döner, tereyağı, domates sos, pide',
    price: 180,
    categoryId: CATEGORIES[0]._id.toString(),
    ingredients: [INGREDIENTS[0]._id, INGREDIENTS[3]._id],
    available: true,
    spicyLevel: 0,
    cookingTime: 15,
  },
  {
    _id: new ObjectId(),
    name: 'Adana Kebap',
    slug: 'adana-kebap',
    description: 'Acılı kıyma kebap, pilav, közlenmiş sebze',
    price: 160,
    categoryId: CATEGORIES[0]._id.toString(),
    ingredients: [INGREDIENTS[0]._id, INGREDIENTS[2]._id, INGREDIENTS[4]._id],
    available: true,
    spicyLevel: 2,
    cookingTime: 20,
  },
  {
    _id: new ObjectId(),
    name: 'Tavuk Şiş',
    slug: 'tavuk-sis',
    description: 'Marine tavuk, pilav, salata',
    price: 140,
    categoryId: CATEGORIES[0]._id.toString(),
    ingredients: [INGREDIENTS[1]._id, INGREDIENTS[2]._id],
    available: true,
    spicyLevel: 0,
    cookingTime: 18,
  },
  {
    _id: new ObjectId(),
    name: 'Köfte',
    slug: 'kofte',
    description: 'El yapımı köfte, patates kızartması',
    price: 150,
    categoryId: CATEGORIES[0]._id.toString(),
    ingredients: [INGREDIENTS[0]._id],
    available: true,
    spicyLevel: 0,
    cookingTime: 15,
  },
  {
    _id: new ObjectId(),
    name: 'Beyti',
    slug: 'beyti',
    description: 'Kıymalı dürüm, yoğurt, domates sos',
    price: 170,
    categoryId: CATEGORIES[0]._id.toString(),
    ingredients: [INGREDIENTS[0]._id, INGREDIENTS[3]._id],
    available: true,
    spicyLevel: 1,
    cookingTime: 20,
  },
  
  // İçecekler
  {
    _id: new ObjectId(),
    name: 'Ayran',
    slug: 'ayran',
    description: 'Taze ayran',
    price: 15,
    categoryId: CATEGORIES[1]._id.toString(),
    ingredients: [INGREDIENTS[5]._id],
    available: true,
    cookingTime: 0,
  },
  {
    _id: new ObjectId(),
    name: 'Kola',
    slug: 'kola',
    description: 'Coca Cola 330ml',
    price: 20,
    categoryId: CATEGORIES[1]._id.toString(),
    ingredients: [],
    available: true,
    cookingTime: 0,
  },
  {
    _id: new ObjectId(),
    name: 'Fanta',
    slug: 'fanta',
    description: 'Fanta 330ml',
    price: 20,
    categoryId: CATEGORIES[1]._id.toString(),
    ingredients: [],
    available: true,
    cookingTime: 0,
  },
  {
    _id: new ObjectId(),
    name: 'Şalgam',
    slug: 'salgam',
    description: 'Acılı şalgam suyu',
    price: 18,
    categoryId: CATEGORIES[1]._id.toString(),
    ingredients: [],
    available: true,
    spicyLevel: 2,
    cookingTime: 0,
  },
  {
    _id: new ObjectId(),
    name: 'Çay',
    slug: 'cay',
    description: 'Türk çayı',
    price: 10,
    categoryId: CATEGORIES[1]._id.toString(),
    ingredients: [],
    available: true,
    cookingTime: 3,
  },
  
  // Tatlılar
  {
    _id: new ObjectId(),
    name: 'Künefe',
    slug: 'kunefe',
    description: 'Sıcak künefe, fıstık',
    price: 120,
    categoryId: CATEGORIES[2]._id.toString(),
    ingredients: [INGREDIENTS[6]._id],
    available: true,
    cookingTime: 10,
  },
  {
    _id: new ObjectId(),
    name: 'Baklava',
    slug: 'baklava',
    description: 'Antep fıstıklı baklava',
    price: 100,
    categoryId: CATEGORIES[2]._id.toString(),
    ingredients: [INGREDIENTS[6]._id],
    available: true,
    cookingTime: 0,
  },
  {
    _id: new ObjectId(),
    name: 'Sütlaç',
    slug: 'sutlac',
    description: 'Fırın sütlaç',
    price: 60,
    categoryId: CATEGORIES[2]._id.toString(),
    ingredients: [INGREDIENTS[5]._id, INGREDIENTS[2]._id],
    available: true,
    cookingTime: 5,
  },
]

const TABLES = [
  { _id: new ObjectId(), number: '1', capacity: 4, location: 'Bahçe', status: 'empty' },
  { _id: new ObjectId(), number: '2', capacity: 2, location: 'İçeri', status: 'empty' },
  { _id: new ObjectId(), number: '3', capacity: 6, location: 'Bahçe', status: 'empty' },
  { _id: new ObjectId(), number: '4', capacity: 4, location: 'İçeri', status: 'empty' },
  { _id: new ObjectId(), number: '5', capacity: 2, location: 'Teras', status: 'empty' },
]

async function seedDemo() {
  console.log('🌱 DEMO DATA SEED BAŞLIYOR...\n')
  
  const client = new MongoClient(MONGODB_URI)
  
  try {
    await client.connect()
    console.log('✅ MongoDB bağlantısı başarılı!\n')
    
    const db = client.db()
    
    // Kategorileri ekle
    console.log('📂 Kategoriler ekleniyor...')
    await db.collection('categories').insertMany(CATEGORIES)
    console.log(`✅ ${CATEGORIES.length} kategori eklendi`)
    
    // Malzemeleri ekle
    console.log('\n🥘 Malzemeler ekleniyor...')
    await db.collection('ingredients').insertMany(INGREDIENTS)
    console.log(`✅ ${INGREDIENTS.length} malzeme eklendi`)
    
    // Menü ürünlerini ekle
    console.log('\n🍽️  Menü ürünleri ekleniyor...')
    await db.collection('menu').insertMany(MENU_ITEMS)
    console.log(`✅ ${MENU_ITEMS.length} ürün eklendi`)
    
    // Masaları ekle
    console.log('\n🪑 Masalar ekleniyor...')
    await db.collection('tables').insertMany(TABLES)
    console.log(`✅ ${TABLES.length} masa eklendi`)
    
    console.log('\n📊 ÖZET:')
    console.log(`  Kategoriler: ${CATEGORIES.length}`)
    console.log(`  Malzemeler: ${INGREDIENTS.length}`)
    console.log(`  Ürünler: ${MENU_ITEMS.length}`)
    console.log(`  Masalar: ${TABLES.length}`)
    
    console.log('\n✨ Demo data başarıyla oluşturuldu!')
    
  } catch (error) {
    console.error('❌ Hata:', error.message)
    process.exit(1)
  } finally {
    await client.close()
    console.log('\n👋 MongoDB bağlantısı kapatıldı')
  }
}

seedDemo()
  .then(() => {
    console.log('\n🎉 Seed işlemi tamamlandı!')
    process.exit(0)
  })
  .catch(err => {
    console.error('❌ Fatal error:', err)
    process.exit(1)
  })