/**
 * ScanResult Model
 * Tarama sonuçlarını temsil eden model sınıfı
 */

const { getDb } = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const Threat = require('./threat');

/**
 * ScanResult model
 * Tarama sonuçlarını temsil eden model sınıfı
 */
class ScanResult {
  /**
   * Yeni bir tarama sonucu nesnesi oluşturur
   * @param {string} id - Tarama ID'si
   * @param {string} type - Tarama tipi (QUICK, FULL, WIFI, QR, vb.)
   * @param {Date} startTime - Tarama başlangıç zamanı
   * @param {Date|null} endTime - Tarama bitiş zamanı (null ise devam ediyor)
   * @param {number} totalScanned - Taranan öğe sayısı
   * @param {Threat[]} threatsFound - Bulunan tehditler dizisi
   * @param {string|null} userId - Taramayı yapan kullanıcı ID'si (null ise sistem taraması)
   */
  constructor(id, type, startTime, endTime = null, totalScanned = 0, threatsFound = [], userId = null) {
    this.id = id || uuidv4();
    this.type = type;
    this.startTime = startTime instanceof Date ? startTime : new Date(startTime);
    this.endTime = endTime instanceof Date ? endTime : (endTime ? new Date(endTime) : null);
    this.totalScanned = totalScanned;
    this.threatsFound = threatsFound;
    this.userId = userId;
  }

  /**
   * Tarama sonucunu JSON formatına dönüştürür
   * @returns {object} JSON formatında tarama sonucu
   */
  toJSON() {
    return {
      id: this.id,
      type: this.type,
      startTime: this.startTime,
      endTime: this.endTime,
      totalScanned: this.totalScanned,
      threatsFound: this.threatsFound.map(threat => typeof threat.toJSON === 'function' ? threat.toJSON() : threat),
      userId: this.userId,
      status: this.getStatus()
    };
  }

  /**
   * Tarama durumunu kontrol eder
   * @returns {string} - Tarama durumu (RUNNING, COMPLETED, FAILED)
   */
  getStatus() {
    if (!this.endTime) {
      return 'RUNNING';
    }
    
    if (this.endTime && this.totalScanned > 0) {
      return 'COMPLETED';
    }
    
    return 'FAILED';
  }

  /**
   * Tarama süresini hesaplar (milisaniye cinsinden)
   * @returns {number} - Tarama süresi
   */
  getDuration() {
    if (!this.startTime) {
      return 0;
    }
    
    const endTime = this.endTime || new Date();
    return endTime - this.startTime;
  }

  /**
   * Taramayı tamamlar
   * @param {number} totalScanned - Toplam taranan öğe sayısı
   * @param {Threat[]} threatsFound - Bulunan tehditler
   */
  complete(totalScanned, threatsFound) {
    this.endTime = new Date();
    this.totalScanned = totalScanned;
    this.threatsFound = threatsFound;
  }

  /**
   * Tarama sonucunu veritabanına kaydeder
   * @returns {Promise<boolean>} - Kaydetme işlemi başarılı ise true döner
   */
  async save() {
    try {
      const db = getDb();
      if (!db) throw new Error('Veritabanı bağlantısı bulunamadı');

      const collection = db.collection('scans');
      
      // Taramanın daha önce kaydedilip kaydedilmediğini kontrol et
      const existingScan = await collection.findOne({ id: this.id });
      
      if (existingScan) {
        // Tarama güncelleme
        await collection.updateOne(
          { id: this.id },
          { $set: this.toJSON() }
        );
      } else {
        // Yeni tarama ekleme
        await collection.insertOne(this.toJSON());
      }
      
      return true;
    } catch (error) {
      console.error('Tarama sonucu kaydetme hatası:', error);
      return false;
    }
  }

  /**
   * ID'ye göre tarama sonucu bulur
   * @param {string} id - Tarama ID'si
   * @returns {Promise<ScanResult|null>} - Bulunan tarama sonucu, yoksa null
   */
  static async findById(id) {
    try {
      const db = getDb();
      if (!db) throw new Error('Veritabanı bağlantısı bulunamadı');

      const collection = db.collection('scans');
      const scanData = await collection.findOne({ id });
      
      if (!scanData) return null;
      
      return new ScanResult(
        scanData.id,
        scanData.type,
        new Date(scanData.startTime),
        scanData.endTime ? new Date(scanData.endTime) : null,
        scanData.totalScanned,
        scanData.threatsFound,
        scanData.userId
      );
    } catch (error) {
      console.error('Tarama sonucu bulma hatası:', error);
      return null;
    }
  }

  /**
   * Kullanıcıya ait tarama sonuçlarını getirir
   * @param {string} userId - Kullanıcı ID'si
   * @param {number} limit - Maksimum sonuç sayısı
   * @returns {Promise<ScanResult[]>} - Tarama sonuçları dizisi
   */
  static async findByUserId(userId, limit = 10) {
    try {
      const db = getDb();
      if (!db) throw new Error('Veritabanı bağlantısı bulunamadı');

      const collection = db.collection('scans');
      const scansData = await collection.find({ userId })
        .sort({ startTime: -1 })
        .limit(limit)
        .toArray();
      
      return scansData.map(scanData => new ScanResult(
        scanData.id,
        scanData.type,
        new Date(scanData.startTime),
        scanData.endTime ? new Date(scanData.endTime) : null,
        scanData.totalScanned,
        scanData.threatsFound,
        scanData.userId
      ));
    } catch (error) {
      console.error('Kullanıcı tarama sonuçları getirme hatası:', error);
      return [];
    }
  }

  /**
   * Son tarama sonuçlarını getirir
   * @param {number} limit - Maksimum sonuç sayısı
   * @returns {Promise<ScanResult[]>} - Tarama sonuçları dizisi
   */
  static async findRecent(limit = 10) {
    try {
      const db = getDb();
      if (!db) throw new Error('Veritabanı bağlantısı bulunamadı');

      const collection = db.collection('scans');
      const scansData = await collection.find()
        .sort({ startTime: -1 })
        .limit(limit)
        .toArray();
      
      return scansData.map(scanData => new ScanResult(
        scanData.id,
        scanData.type,
        new Date(scanData.startTime),
        scanData.endTime ? new Date(scanData.endTime) : null,
        scanData.totalScanned,
        scanData.threatsFound,
        scanData.userId
      ));
    } catch (error) {
      console.error('Son tarama sonuçları getirme hatası:', error);
      return [];
    }
  }

  /**
   * Tarama sayısını getirir
   * @param {object} filter - Filtreleme seçenekleri
   * @returns {Promise<number>} - Tarama sayısı
   */
  static async count(filter = {}) {
    try {
      const db = getDb();
      if (!db) throw new Error('Veritabanı bağlantısı bulunamadı');

      const collection = db.collection('scans');
      return await collection.countDocuments(filter);
    } catch (error) {
      console.error('Tarama sayısı getirme hatası:', error);
      return 0;
    }
  }

  /**
   * Simüle edilmiş tarama sonucu oluşturur (Test ve demo amacıyla)
   * @param {string} type - Tarama tipi
   * @param {string|null} userId - Kullanıcı ID'si
   * @returns {ScanResult} - Simüle edilmiş tarama sonucu
   */
  static createSimulatedScan(type, userId = null) {
    // Tarama başlangıç zamanı (şimdi)
    const startTime = new Date();
    
    // Tarama tipi
    const scanType = type.toUpperCase();
    
    // Oluşturulacak tehdit sayısı (rastgele)
    const threatCount = scanType === 'QUICK' 
      ? Math.floor(Math.random() * 3) // 0-2 tehdit
      : scanType === 'FULL' 
        ? Math.floor(Math.random() * 5) + 1 // 1-5 tehdit
        : scanType === 'WIFI' 
          ? Math.floor(Math.random() * 2) // 0-1 tehdit
          : Math.floor(Math.random() * 2); // 0-1 tehdit
    
    // Rastgele tehditler
    const threats = Threat.getRandomThreats(threatCount);
    
    // Kullanıcı ID'sini tehdit nesnelerine ekle
    if (userId) {
      threats.forEach(threat => {
        threat.userId = userId;
      });
    }
    
    // Toplam taranan öğe sayısı (rastgele)
    const totalScanned = scanType === 'QUICK' 
      ? Math.floor(Math.random() * 500) + 500 // 500-999 öğe
      : scanType === 'FULL' 
        ? Math.floor(Math.random() * 2000) + 2000 // 2000-3999 öğe
        : scanType === 'WIFI' 
          ? Math.floor(Math.random() * 20) + 5 // 5-24 öğe
          : Math.floor(Math.random() * 50) + 20; // 20-69 öğe
    
    // Tarama bitiş zamanı (rastgele ama kısa bir süre sonra)
    const endTime = new Date(startTime.getTime() + (Math.random() * 20000) + 5000); // 5-25 saniye
    
    // Tarama sonucu
    return new ScanResult(
      uuidv4(),
      scanType,
      startTime,
      endTime,
      totalScanned,
      threats.map(t => t.toJSON()),
      userId
    );
  }
}

module.exports = ScanResult;