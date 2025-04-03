/**
 * ScanResult Model
 * Tarama sonuçlarını temsil eden model sınıfı
 */

const { getDb } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

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
    this.id = id;
    this.type = type;
    this.startTime = startTime;
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
    if (!this.endTime) {
      return 'RUNNING';
    }
    return 'COMPLETED';
  }

  /**
   * Tarama süresini hesaplar (milisaniye cinsinden)
   * @returns {number} - Tarama süresi
   */
  getDuration() {
    const end = this.endTime || new Date();
    return end.getTime() - this.startTime.getTime();
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
      
      if (!db) {
        throw new Error('Veritabanı bağlantısı kurulamadı');
      }
      
      const scanCollection = db.collection('scan_results');
      
      // Tarama sonucu zaten var mı kontrol et
      const existingScan = await scanCollection.findOne({ id: this.id });
      
      if (existingScan) {
        // Tarama sonucu var, güncelle
        await scanCollection.updateOne(
          { id: this.id },
          { $set: this.toJSON() }
        );
      } else {
        // Tarama sonucu yok, yeni kayıt ekle
        await scanCollection.insertOne(this.toJSON());
      }
      
      return true;
    } catch (error) {
      console.error('Tarama sonucu kaydedilirken hata:', error);
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
      
      if (!db) {
        throw new Error('Veritabanı bağlantısı kurulamadı');
      }
      
      const scanCollection = db.collection('scan_results');
      const scanData = await scanCollection.findOne({ id });
      
      if (!scanData) {
        return null;
      }
      
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
      console.error('ID ile tarama sonucu bulunurken hata:', error);
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
      
      if (!db) {
        throw new Error('Veritabanı bağlantısı kurulamadı');
      }
      
      const scanCollection = db.collection('scan_results');
      const scans = await scanCollection.find({ userId })
        .sort({ startTime: -1 })
        .limit(limit)
        .toArray();
      
      return scans.map(scanData => new ScanResult(
        scanData.id,
        scanData.type,
        new Date(scanData.startTime),
        scanData.endTime ? new Date(scanData.endTime) : null,
        scanData.totalScanned,
        scanData.threatsFound,
        scanData.userId
      ));
    } catch (error) {
      console.error('Kullanıcıya ait tarama sonuçları getirilirken hata:', error);
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
      
      if (!db) {
        throw new Error('Veritabanı bağlantısı kurulamadı');
      }
      
      const scanCollection = db.collection('scan_results');
      const scans = await scanCollection.find()
        .sort({ startTime: -1 })
        .limit(limit)
        .toArray();
      
      return scans.map(scanData => new ScanResult(
        scanData.id,
        scanData.type,
        new Date(scanData.startTime),
        scanData.endTime ? new Date(scanData.endTime) : null,
        scanData.totalScanned,
        scanData.threatsFound,
        scanData.userId
      ));
    } catch (error) {
      console.error('Son tarama sonuçları getirilirken hata:', error);
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
      
      if (!db) {
        throw new Error('Veritabanı bağlantısı kurulamadı');
      }
      
      const scanCollection = db.collection('scan_results');
      return await scanCollection.countDocuments(filter);
    } catch (error) {
      console.error('Tarama sayısı hesaplanırken hata:', error);
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
    // Tarama ID'si oluştur
    const scanId = uuidv4();
    
    // Tarama tipi belirlenmemişse, varsayılan olarak QUICK kullan
    const scanType = type || 'QUICK';
    
    // Başlangıç zamanı
    const startTime = new Date();
    
    // Bitiş zamanı (tarama tamamlandıysa)
    const endTime = null; // Devam eden bir tarama olarak oluştur
    
    // Taranan öğe sayısı
    const totalScanned = 0; // Henüz tarama başladığı için 0
    
    // Tehditler (henüz tarama tamamlanmadığı için boş)
    const threatsFound = [];
    
    return new ScanResult(
      scanId,
      scanType,
      startTime,
      endTime,
      totalScanned,
      threatsFound,
      userId
    );
  }
}

module.exports = ScanResult;