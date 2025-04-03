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
    this.startTime = startTime || new Date();
    this.endTime = endTime;
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
      threatsFound: this.threatsFound.map(threat => 
        typeof threat.toJSON === 'function' ? threat.toJSON() : threat
      ),
      userId: this.userId,
      status: this.getStatus(),
      duration: this.getDuration()
    };
  }

  /**
   * Tarama durumunu kontrol eder
   * @returns {string} - Tarama durumu (RUNNING, COMPLETED, FAILED)
   */
  getStatus() {
    if (!this.endTime) return 'RUNNING';
    return this.threatsFound ? 'COMPLETED' : 'FAILED';
  }

  /**
   * Tarama süresini hesaplar (milisaniye cinsinden)
   * @returns {number} - Tarama süresi
   */
  getDuration() {
    if (!this.startTime) return 0;
    
    const endTime = this.endTime || new Date();
    return endTime.getTime() - this.startTime.getTime();
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
    return this;
  }

  /**
   * Tarama sonucunu veritabanına kaydeder
   * @returns {Promise<boolean>} - Kaydetme işlemi başarılı ise true döner
   */
  async save() {
    const db = getDb();
    if (!db) throw new Error('Veritabanı bağlantısı yok');

    try {
      const scanCollection = db.collection('scanResults');
      
      // Mevcut taramayı kontrol et
      const existingScan = await scanCollection.findOne({ id: this.id });
      
      if (existingScan) {
        // Tarama var, güncelle
        const result = await scanCollection.updateOne(
          { id: this.id },
          { $set: this.toJSON() }
        );
        return result.modifiedCount > 0;
      } else {
        // Yeni tarama ekle
        const result = await scanCollection.insertOne(this.toJSON());
        return !!result.insertedId;
      }
    } catch (error) {
      console.error('Tarama sonucu kaydederken hata:', error);
      throw error;
    }
  }

  /**
   * ID'ye göre tarama sonucu bulur
   * @param {string} id - Tarama ID'si
   * @returns {Promise<ScanResult|null>} - Bulunan tarama sonucu, yoksa null
   */
  static async findById(id) {
    const db = getDb();
    if (!db) throw new Error('Veritabanı bağlantısı yok');

    try {
      const scanCollection = db.collection('scanResults');
      const scanData = await scanCollection.findOne({ id });
      
      if (!scanData) return null;
      
      // Tehdit nesnelerini oluştur
      const threatsFound = scanData.threatsFound.map(threatData => 
        new Threat(
          threatData.id,
          threatData.name,
          threatData.type,
          threatData.description,
          threatData.severity,
          threatData.filePath,
          threatData.isCleaned,
          new Date(threatData.detectionDate)
        )
      );
      
      return new ScanResult(
        scanData.id,
        scanData.type,
        new Date(scanData.startTime),
        scanData.endTime ? new Date(scanData.endTime) : null,
        scanData.totalScanned,
        threatsFound,
        scanData.userId
      );
    } catch (error) {
      console.error('ID ile tarama sonucu arama hatası:', error);
      throw error;
    }
  }

  /**
   * Kullanıcıya ait tarama sonuçlarını getirir
   * @param {string} userId - Kullanıcı ID'si
   * @param {number} limit - Maksimum sonuç sayısı
   * @returns {Promise<ScanResult[]>} - Tarama sonuçları dizisi
   */
  static async findByUserId(userId, limit = 10) {
    const db = getDb();
    if (!db) throw new Error('Veritabanı bağlantısı yok');

    try {
      const scanCollection = db.collection('scanResults');
      const scansData = await scanCollection
        .find({ userId })
        .sort({ startTime: -1 })
        .limit(limit)
        .toArray();
      
      return scansData.map(scanData => {
        // Tehdit nesnelerini oluştur
        const threatsFound = scanData.threatsFound.map(threatData => 
          new Threat(
            threatData.id,
            threatData.name,
            threatData.type,
            threatData.description,
            threatData.severity,
            threatData.filePath,
            threatData.isCleaned,
            new Date(threatData.detectionDate)
          )
        );
        
        return new ScanResult(
          scanData.id,
          scanData.type,
          new Date(scanData.startTime),
          scanData.endTime ? new Date(scanData.endTime) : null,
          scanData.totalScanned,
          threatsFound,
          scanData.userId
        );
      });
    } catch (error) {
      console.error('Kullanıcı ID ile tarama sonuçları arama hatası:', error);
      throw error;
    }
  }

  /**
   * Son tarama sonuçlarını getirir
   * @param {number} limit - Maksimum sonuç sayısı
   * @returns {Promise<ScanResult[]>} - Tarama sonuçları dizisi
   */
  static async findRecent(limit = 10) {
    const db = getDb();
    if (!db) throw new Error('Veritabanı bağlantısı yok');

    try {
      const scanCollection = db.collection('scanResults');
      const scansData = await scanCollection
        .find()
        .sort({ startTime: -1 })
        .limit(limit)
        .toArray();
      
      return scansData.map(scanData => {
        // Tehdit nesnelerini oluştur
        const threatsFound = scanData.threatsFound.map(threatData => 
          new Threat(
            threatData.id,
            threatData.name,
            threatData.type,
            threatData.description,
            threatData.severity,
            threatData.filePath,
            threatData.isCleaned,
            new Date(threatData.detectionDate)
          )
        );
        
        return new ScanResult(
          scanData.id,
          scanData.type,
          new Date(scanData.startTime),
          scanData.endTime ? new Date(scanData.endTime) : null,
          scanData.totalScanned,
          threatsFound,
          scanData.userId
        );
      });
    } catch (error) {
      console.error('Son tarama sonuçlarını getirme hatası:', error);
      throw error;
    }
  }

  /**
   * Tarama sayısını getirir
   * @param {object} filter - Filtreleme seçenekleri
   * @returns {Promise<number>} - Tarama sayısı
   */
  static async count(filter = {}) {
    const db = getDb();
    if (!db) throw new Error('Veritabanı bağlantısı yok');

    try {
      const scanCollection = db.collection('scanResults');
      return await scanCollection.countDocuments(filter);
    } catch (error) {
      console.error('Tarama sayma hatası:', error);
      throw error;
    }
  }

  /**
   * Simüle edilmiş tarama sonucu oluşturur (Test ve demo amacıyla)
   * @param {string} type - Tarama tipi
   * @param {string|null} userId - Kullanıcı ID'si
   * @returns {ScanResult} - Simüle edilmiş tarama sonucu
   */
  static createSimulatedScan(type, userId = null) {
    const startTime = new Date();
    startTime.setMinutes(startTime.getMinutes() - Math.floor(Math.random() * 10));
    
    const endTime = new Date(startTime);
    endTime.setMinutes(endTime.getMinutes() + Math.floor(Math.random() * 5) + 1);
    
    const totalScanned = Math.floor(Math.random() * 500) + 100;
    
    // Rastgele tehditler oluştur
    const threatCount = Math.floor(Math.random() * 5);
    const threatsFound = Threat.getRandomThreats(threatCount);
    
    return new ScanResult(
      uuidv4(),
      type,
      startTime,
      endTime,
      totalScanned,
      threatsFound,
      userId
    );
  }
}

module.exports = ScanResult;