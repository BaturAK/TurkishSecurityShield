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
      userId: this.userId
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
    if (!this.endTime) {
      // Devam eden tarama için şu ana kadar geçen süre
      return Date.now() - this.startTime.getTime();
    }
    // Tamamlanan tarama için toplam süre
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
      const db = getDb();
      const scanResultsCollection = db.collection('scan_results');
      
      const existingScan = await scanResultsCollection.findOne({ id: this.id });
      
      if (existingScan) {
        // Tarama zaten varsa güncelle
        await scanResultsCollection.updateOne(
          { id: this.id },
          { $set: this.toJSON() }
        );
      } else {
        // Tarama yoksa yeni kayıt oluştur
        await scanResultsCollection.insertOne(this.toJSON());
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
      const scanResultsCollection = db.collection('scan_results');
      
      const scanData = await scanResultsCollection.findOne({ id });
      
      if (!scanData) return null;
      
      // Tehdit verilerini Threat nesnelerine dönüştür
      const threats = scanData.threatsFound.map(threatData => 
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
        threats,
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
      const scanResultsCollection = db.collection('scan_results');
      
      const scanDataList = await scanResultsCollection
        .find({ userId })
        .sort({ startTime: -1 })
        .limit(limit)
        .toArray();
      
      return scanDataList.map(scanData => {
        // Tehdit verilerini Threat nesnelerine dönüştür
        const threats = scanData.threatsFound.map(threatData => 
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
          threats,
          scanData.userId
        );
      });
    } catch (error) {
      console.error('Kullanıcı tarama sonuçlarını getirme hatası:', error);
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
      const scanResultsCollection = db.collection('scan_results');
      
      const scanDataList = await scanResultsCollection
        .find()
        .sort({ startTime: -1 })
        .limit(limit)
        .toArray();
      
      return scanDataList.map(scanData => {
        // Tehdit verilerini Threat nesnelerine dönüştür
        const threats = scanData.threatsFound.map(threatData => 
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
          threats,
          scanData.userId
        );
      });
    } catch (error) {
      console.error('Son tarama sonuçlarını getirme hatası:', error);
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
      const scanResultsCollection = db.collection('scan_results');
      
      return await scanResultsCollection.countDocuments(filter);
    } catch (error) {
      console.error('Tarama sayma hatası:', error);
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
    const startTime = new Date(Date.now() - Math.floor(Math.random() * 3600000)); // Son 1 saat içinde
    let endTime = null;
    
    // Tesadüfi olarak bazı taramalar tamamlanmış olsun
    if (Math.random() > 0.3) {
      endTime = new Date(startTime.getTime() + Math.floor(Math.random() * 300000)); // 0-5 dakika arası sürmüş
    }
    
    const totalScanned = Math.floor(Math.random() * 500) + 100; // 100-600 arası
    
    // Rastgele tehditler oluştur
    const threatCount = Math.floor(Math.random() * 5); // 0-4 arası tehdit
    const threats = Threat.getRandomThreats(threatCount);
    
    return new ScanResult(
      uuidv4(),
      type,
      startTime,
      endTime,
      totalScanned,
      threats,
      userId
    );
  }
}

module.exports = ScanResult;