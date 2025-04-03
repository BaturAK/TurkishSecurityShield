/**
 * Database Configuration
 * MongoDB bağlantı ayarları
 */

const { MongoClient } = require('mongodb');
require('dotenv').config();

// MongoDB bağlantı URL'i
const mongoUrl = process.env.MONGODB_URI || 'mongodb+srv://webdb:Hacked_22@mongodb.sgpezuw.mongodb.net/';
const dbName = process.env.MONGODB_DB || 'antivirus_db';

// MongoDB istemcisi
let client;
let db;

/**
 * MongoDB veritabanına bağlanır
 * @returns {Promise<object>} Bağlantı başarılı ise veritabanı nesnesi, değilse hata
 */
async function connectToDatabase() {
  try {
    if (client && client.topology && client.topology.isConnected()) {
      console.log('Veritabanı bağlantısı zaten mevcut.');
      return db;
    }
    
    console.log('MongoDB bağlantısı kuruluyor...');
    client = new MongoClient(mongoUrl, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    await client.connect();
    console.log('MongoDB bağlantısı başarılı.');
    
    db = client.db(dbName);
    
    // Gerekli koleksiyonları oluştur
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
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    
    // Users koleksiyonu
    if (!collectionNames.includes('users')) {
      await db.createCollection('users');
      console.log('users koleksiyonu oluşturuldu.');
      
      // Admin kullanıcısı ekle
      const usersCollection = db.collection('users');
      const adminUser = {
        id: 'admin',
        email: 'admin@example.com',
        displayName: 'Admin',
        photoURL: null,
        isAdmin: true,
        createdAt: new Date(),
        lastLogin: new Date(),
        status: 'active'
      };
      
      const existingAdmin = await usersCollection.findOne({ id: 'admin' });
      if (!existingAdmin) {
        await usersCollection.insertOne(adminUser);
        console.log('Admin kullanıcısı oluşturuldu.');
      }
    }
    
    // Threats koleksiyonu
    if (!collectionNames.includes('threats')) {
      await db.createCollection('threats');
      console.log('threats koleksiyonu oluşturuldu.');
    }
    
    // Scan Results koleksiyonu
    if (!collectionNames.includes('scan_results')) {
      await db.createCollection('scan_results');
      console.log('scan_results koleksiyonu oluşturuldu.');
    }
    
    // API Tokens koleksiyonu
    if (!collectionNames.includes('api_tokens')) {
      await db.createCollection('api_tokens');
      console.log('api_tokens koleksiyonu oluşturuldu.');
    }
    
    console.log('Veritabanı koleksiyonları hazır.');
  } catch (error) {
    console.error('Koleksiyonlar oluşturulurken hata:', error);
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
    console.log('MongoDB bağlantısı kapatıldı.');
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

process.on('SIGTERM', async () => {
  await closeConnection();
  process.exit(0);
});

module.exports = {
  connectToDatabase,
  closeConnection,
  getDb
};