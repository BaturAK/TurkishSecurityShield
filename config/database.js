/**
 * Database Configuration
 * MongoDB bağlantı ayarları
 */

const { MongoClient } = require('mongodb');

// MongoDB bağlantı URL'i
const uri = process.env.MONGODB_URI;

// MongoDB istemcisi
let client;
let db;

/**
 * MongoDB veritabanına bağlanır
 * @returns {Promise<object>} Bağlantı başarılı ise veritabanı nesnesi, değilse hata
 */
async function connectToDatabase() {
  try {
    if (!client) {
      client = new MongoClient(uri);
      await client.connect();
      console.log('MongoDB bağlantısı başarıyla kuruldu.');
    }
    
    // antivirus_app veritabanını seç
    db = client.db('antivirus_app');
    
    return db;
  } catch (error) {
    console.error('MongoDB bağlantı hatası:', error);
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
    client = null;
    db = null;
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

// Uygulama kapatıldığında veritabanı bağlantısını kapat
process.on('SIGINT', async () => {
  await closeConnection();
  process.exit(0);
});

module.exports = {
  connectToDatabase,
  closeConnection,
  getDb
};