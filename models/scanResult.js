/**
 * ScanResult Model
 * Tarama sonuçlarını temsil eden model sınıfı
 */

const { v4: uuidv4 } = require('uuid');
const database = require('../config/database');
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
    this.threatsFound = threatsFound || [];
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
        typeof threat === 'string' ? threat : threat.toJSON()
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
    return 'COMPLETED';
  }

  /**
   * Tarama süresini hesaplar (milisaniye cinsinden)
   * @returns {number} - Tarama süresi
   */
  getDuration() {
    if (!this.endTime) {
      return Date.now() - this.startTime.getTime();
    }
    return this.endTime.getTime() - this.startTime.getTime();
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
      const db = database.getDb();
      if (!db) return false;

      const scanResults = db.collection('scanResults');
      
      const threatIds = [];
      
      // Tehdit objeleri varsa, bunları önce kaydet ve ID'lerini al
      for (const threat of this.threatsFound) {
        if (typeof threat === 'string') {
          threatIds.push(threat);
        } else {
          await threat.save();
          threatIds.push(threat.id);
        }
      }
      
      const scanData = {
        _id: this.id,
        type: this.type,
        startTime: this.startTime,
        endTime: this.endTime,
        totalScanned: this.totalScanned,
        threatsFound: threatIds,
        userId: this.userId
      };

      // Tarama sonucunun daha önce kaydedilip kaydedilmediğini kontrol et
      const existingScan = await scanResults.findOne({ _id: this.id });
      
      if (existingScan) {
        // Tarama sonucu zaten var, güncelle
        await scanResults.updateOne({ _id: this.id }, { $set: scanData });
      } else {
        // Yeni tarama sonucu ekle
        await scanResults.insertOne(scanData);
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
      const db = database.getDb();
      if (!db) return null;

      const scanResults = db.collection('scanResults');
      const scanData = await scanResults.findOne({ _id: id });
      
      if (!scanData) return null;
      
      // Tehditleri getir
      const threatIds = scanData.threatsFound || [];
      let threats = [];
      
      if (threatIds.length > 0) {
        const threatsCollection = db.collection('threats');
        const threatsData = await threatsCollection.find({ _id: { $in: threatIds } }).toArray();
        
        threats = threatsData.map(threatData => new Threat(
          threatData._id,
          threatData.name,
          threatData.type,
          threatData.description,
          threatData.severity,
          threatData.filePath,
          threatData.isCleaned,
          threatData.detectionDate
        ));
      }
      
      return new ScanResult(
        scanData._id,
        scanData.type,
        scanData.startTime,
        scanData.endTime,
        scanData.totalScanned,
        threats,
        scanData.userId
      );
    } catch (error) {
      console.error('ID ile tarama sonucu aranırken hata:', error);
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
      const db = database.getDb();
      if (!db) return [];

      const scanResults = db.collection('scanResults');
      const scanDataList = await scanResults.find({ userId })
        .sort({ startTime: -1 })
        .limit(limit)
        .toArray();
      
      const results = [];
      
      for (const scanData of scanDataList) {
        // Tehditleri getir
        const threatIds = scanData.threatsFound || [];
        let threats = [];
        
        if (threatIds.length > 0) {
          const threatsCollection = db.collection('threats');
          const threatsData = await threatsCollection.find({ _id: { $in: threatIds } }).toArray();
          
          threats = threatsData.map(threatData => new Threat(
            threatData._id,
            threatData.name,
            threatData.type,
            threatData.description,
            threatData.severity,
            threatData.filePath,
            threatData.isCleaned,
            threatData.detectionDate
          ));
        }
        
        results.push(new ScanResult(
          scanData._id,
          scanData.type,
          scanData.startTime,
          scanData.endTime,
          scanData.totalScanned,
          threats,
          scanData.userId
        ));
      }
      
      return results;
    } catch (error) {
      console.error('Kullanıcı ID\'si ile tarama sonuçları aranırken hata:', error);
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
      const db = database.getDb();
      if (!db) return [];

      const scanResults = db.collection('scanResults');
      const scanDataList = await scanResults.find()
        .sort({ startTime: -1 })
        .limit(limit)
        .toArray();
      
      const results = [];
      
      for (const scanData of scanDataList) {
        // Tehditleri getir
        const threatIds = scanData.threatsFound || [];
        let threats = [];
        
        if (threatIds.length > 0) {
          const threatsCollection = db.collection('threats');
          const threatsData = await threatsCollection.find({ _id: { $in: threatIds } }).toArray();
          
          threats = threatsData.map(threatData => new Threat(
            threatData._id,
            threatData.name,
            threatData.type,
            threatData.description,
            threatData.severity,
            threatData.filePath,
            threatData.isCleaned,
            threatData.detectionDate
          ));
        }
        
        results.push(new ScanResult(
          scanData._id,
          scanData.type,
          scanData.startTime,
          scanData.endTime,
          scanData.totalScanned,
          threats,
          scanData.userId
        ));
      }
      
      return results;
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
      const db = database.getDb();
      if (!db) return 0;

      const scanResults = db.collection('scanResults');
      return await scanResults.countDocuments(filter);
    } catch (error) {
      console.error('Tarama sayısı getirilirken hata:', error);
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
    const id = `scan${uuidv4().substring(0, 8)}`;
    const startTime = new Date();
    const totalScanned = Math.floor(Math.random() * 500) + 50; // 50-550 arası
    
    // Rastgele tehdit sayısı (0-5 arası)
    const threatCount = Math.floor(Math.random() * 6);
    const threatsFound = Threat.getRandomThreats(threatCount);
    
    const scanResult = new ScanResult(
      id,
      type,
      startTime,
      null, // endTime
      0, // totalScanned (tarama devam ediyor)
      threatsFound,
      userId
    );
    
    return scanResult;
  }
}

module.exports = ScanResult;