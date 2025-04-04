/**
 * Database Configuration
 * MongoDB bağlantı ayarları
 */

const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');

// .env değişkenlerini yükle
dotenv.config();

// MongoDB bağlantı bilgileri
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://webdb:Hacked_22@mongodb.sgpezuw.mongodb.net/';
const DB_NAME = process.env.DB_NAME || 'antivirus_app';

// Bağlantı seçenekleri
const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true
};

// Global database değişkeni
let db;

/**
 * MongoDB veritabanına bağlanır
 * @returns {Promise<object>} Bağlantı başarılı ise veritabanı nesnesi, değilse hata
 */
async function connectToDatabase() {
  try {
    if (db) {
      return db;
    }
    
    console.log('MongoDB bağlantısı kuruluyor...');
    const client = new MongoClient(MONGODB_URI, options);
    await client.connect();
    
    db = client.db(DB_NAME);
    console.log('MongoDB bağlantısı başarılı');
    
    // Koleksiyonları ve varsayılan verileri oluştur
    await initializeCollections();
    
    return db;
  } catch (error) {
    console.error('MongoDB bağlantı hatası:', error);
    console.log('Demo mod etkinleştiriliyor...');
    return null;
  }
}

/**
 * Gerekli koleksiyonları oluşturur ve varsayılan verileri ekler
 */
async function initializeCollections() {
  try {
    // Koleksiyonların varlığını kontrol et
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    
    // Users koleksiyonu
    if (!collectionNames.includes('users')) {
      console.log('Users koleksiyonu oluşturuluyor...');
      await db.createCollection('users');
      
      // Demo admin kullanıcısı ekle
      const users = db.collection('users');
      const adminExists = await users.findOne({ email: 'admin@example.com' });
      
      if (!adminExists) {
        await users.insertOne({
          _id: 'admin123',
          email: 'admin@example.com',
          displayName: 'Admin',
          isAdmin: true,
          createdAt: new Date()
        });
        console.log('Demo admin kullanıcısı oluşturuldu');
      }
    }
    
    // Threats koleksiyonu
    if (!collectionNames.includes('threats')) {
      console.log('Threats koleksiyonu oluşturuluyor...');
      await db.createCollection('threats');
      
      // Demo tehdit verileri ekle
      const threats = db.collection('threats');
      const threatCount = await threats.countDocuments();
      
      if (threatCount === 0) {
        await threats.insertMany([
          {
            _id: 'threat1',
            name: 'Trojan.AndroidOS.Agent',
            type: 'TROJAN',
            description: 'Cihazın sistem yetkilerini ele geçirebilen ve kişisel verileri çalabilecek bir Truva atı tehdidir.',
            severity: 'HIGH',
            isCleaned: false,
            detectionDate: new Date()
          },
          {
            _id: 'threat2',
            name: 'Adware.AndroidOS.Ewind',
            type: 'ADWARE',
            description: 'Rahatsız edici reklamlar gösteren ve kullanıcı davranışlarını takip eden bir reklam yazılımıdır.',
            severity: 'MEDIUM',
            isCleaned: false,
            detectionDate: new Date()
          },
          {
            _id: 'threat3',
            name: 'Spyware.AndroidOS.Agent',
            type: 'SPYWARE',
            description: 'Kullanıcı bilgilerini gizlice toplayan ve uzak sunuculara gönderen bir casus yazılımdır.',
            severity: 'HIGH',
            isCleaned: true,
            detectionDate: new Date(Date.now() - 86400000) // 1 gün önce
          }
        ]);
        console.log('Demo tehdit verileri eklendi');
      }
    }
    
    // ScanResults koleksiyonu
    if (!collectionNames.includes('scanResults')) {
      console.log('ScanResults koleksiyonu oluşturuluyor...');
      await db.createCollection('scanResults');
      
      // Demo tarama sonuçları ekle
      const scanResults = db.collection('scanResults');
      const scanCount = await scanResults.countDocuments();
      
      if (scanCount === 0) {
        await scanResults.insertMany([
          {
            _id: 'scan1',
            type: 'QUICK',
            startTime: new Date(Date.now() - 3600000), // 1 saat önce
            endTime: new Date(Date.now() - 3540000),   // 59 dakika önce
            totalScanned: 120,
            threatsFound: ['threat1', 'threat2'],
            userId: 'admin123'
          },
          {
            _id: 'scan2',
            type: 'FULL',
            startTime: new Date(Date.now() - 86400000), // 1 gün önce
            endTime: new Date(Date.now() - 86100000),   
            totalScanned: 320,
            threatsFound: ['threat3'],
            userId: 'admin123'
          }
        ]);
        console.log('Demo tarama sonuçları eklendi');
      }
    }
    
    // Premium koleksiyonu
    if (!collectionNames.includes('premium')) {
      console.log('Premium koleksiyonu oluşturuluyor...');
      await db.createCollection('premium');
      
      // Premium aktivasyon kodlarını ekle
      const premium = db.collection('premium');
      const premiumCount = await premium.countDocuments();
      
      if (premiumCount === 0) {
        await premium.insertMany([
          {
            _id: 'premium1',
            code: '7426270308',
            isUsed: false,
            validDays: 365,
            createdAt: new Date()
          }
        ]);
        console.log('Demo premium kodları eklendi');
      }
    }
    
    console.log('Koleksiyonlar başarıyla oluşturuldu');
  } catch (error) {
    console.error('Koleksiyonlar oluşturulurken hata:', error);
  }
}

/**
 * MongoDB bağlantısını kapatır
 * @returns {Promise<void>}
 */
async function closeConnection() {
  if (db) {
    await db.client.close();
    db = null;
    console.log('MongoDB bağlantısı kapatıldı');
  }
}

/**
 * Veritabanı nesnesini döndürür
 * @returns {object|null} Veritabanı nesnesi, bağlantı yoksa null
 */
function getDb() {
  return db;
}

module.exports = {
  connectToDatabase,
  closeConnection,
  getDb
};