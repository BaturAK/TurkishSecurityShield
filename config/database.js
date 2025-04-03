/**
 * Database Configuration
 * MongoDB bağlantı ayarları
 */

const { MongoClient } = require('mongodb');

// Bağlantı URL ve veritabanı adı
const url = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const dbName = process.env.DB_NAME || 'antivirus';

// Veritabanı bağlantısı ve koleksiyon referansları
let db = null;
let client = null;

/**
 * MongoDB veritabanına bağlanır
 * @returns {Promise<object>} Bağlantı başarılı ise veritabanı nesnesi, değilse hata
 */
async function connectToDatabase() {
  if (db) return db;
  
  try {
    console.log('MongoDB bağlantısı kuruluyor...');
    client = new MongoClient(url);
    await client.connect();
    
    db = client.db(dbName);
    console.log(`MongoDB bağlantısı başarılı: ${dbName}`);
    
    // Koleksiyonları ve varsayılan verileri başlat
    await initializeCollections();
    
    return db;
  } catch (error) {
    console.error('MongoDB bağlantı hatası:', error);
    throw error;
  }
}

/**
 * Gerekli koleksiyonları oluşturur ve varsayılan verileri ekler
 */
async function initializeCollections() {
  try {
    // Koleksiyonlar mevcut değilse oluştur
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    
    // Users koleksiyonu
    if (!collectionNames.includes('users')) {
      await db.createCollection('users');
      console.log('Users koleksiyonu oluşturuldu');
      
      // Admin kullanıcısını ekle
      const adminExists = await db.collection('users').findOne({ email: 'admin@example.com' });
      if (!adminExists) {
        await db.collection('users').insertOne({
          id: 'admin-user-uid',
          email: 'admin@example.com',
          displayName: 'Admin User',
          photoURL: null,
          isAdmin: true,
          createdAt: new Date()
        });
        console.log('Admin kullanıcısı oluşturuldu');
      }
    }
    
    // Threats koleksiyonu
    if (!collectionNames.includes('threats')) {
      await db.createCollection('threats');
      console.log('Threats koleksiyonu oluşturuldu');
    }
    
    // ScanResults koleksiyonu
    if (!collectionNames.includes('scanResults')) {
      await db.createCollection('scanResults');
      console.log('ScanResults koleksiyonu oluşturuldu');
    }
    
    return true;
  } catch (error) {
    console.error('Koleksiyon başlatma hatası:', error);
    throw error;
  }
}

/**
 * MongoDB bağlantısını kapatır
 * @returns {Promise<void>}
 */
async function closeConnection() {
  if (client) {
    await client.close();
    console.log('MongoDB bağlantısı kapatıldı');
    db = null;
    client = null;
  }
}

/**
 * Veritabanı nesnesini döndürür
 * @returns {object|null} Veritabanı nesnesi, bağlantı yoksa null
 */
function getDb() {
  return db;
}

// Process kapatıldığında bağlantıyı kapat
process.on('SIGINT', async () => {
  await closeConnection();
  process.exit(0);
});

module.exports = {
  connectToDatabase,
  closeConnection,
  getDb
};