/**
 * Threat Model
 * Tehditleri temsil eden model sınıfı
 */

const { getDb } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

/**
 * Threat model
 * Tehditleri temsil eden model sınıfı
 */
class Threat {
  /**
   * Yeni bir tehdit nesnesi oluşturur
   * @param {string} id - Tehdit ID'si
   * @param {string} name - Tehdit adı
   * @param {string} type - Tehdit tipi (Trojan, Virus, Spyware, Adware, vb.)
   * @param {string} description - Tehdit açıklaması
   * @param {string} severity - Tehdit tehlike seviyesi (LOW, MEDIUM, HIGH)
   * @param {string|null} filePath - Tehdidin tespit edildiği dosya yolu (opsiyonel)
   * @param {boolean} isCleaned - Temizlenmiş durumu
   * @param {Date} detectionDate - Tespit edilme tarihi
   */
  constructor(id, name, type, description, severity = 'MEDIUM', filePath = null, isCleaned = false, detectionDate = new Date()) {
    this.id = id || uuidv4();
    this.name = name;
    this.type = type;
    this.description = description;
    this.severity = severity;
    this.filePath = filePath;
    this.isCleaned = isCleaned;
    this.detectionDate = detectionDate;
  }

  /**
   * Tehdidi JSON formatına dönüştürür
   * @returns {object} JSON formatında tehdit
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      description: this.description,
      severity: this.severity,
      filePath: this.filePath,
      isCleaned: this.isCleaned,
      detectionDate: this.detectionDate
    };
  }

  /**
   * Tehdidi temizler
   * @returns {boolean} - Temizleme işlemi başarılı ise true döner
   */
  clean() {
    this.isCleaned = true;
    return true;
  }

  /**
   * Tehdidi veritabanına kaydeder
   * @returns {Promise<boolean>} - Kaydetme işlemi başarılı ise true döner
   */
  async save() {
    const db = getDb();
    if (!db) throw new Error('Veritabanı bağlantısı yok');

    try {
      const threatCollection = db.collection('threats');
      
      // Mevcut tehdidi kontrol et
      const existingThreat = await threatCollection.findOne({ id: this.id });
      
      if (existingThreat) {
        // Tehdit var, güncelle
        const result = await threatCollection.updateOne(
          { id: this.id },
          { $set: this.toJSON() }
        );
        return result.modifiedCount > 0;
      } else {
        // Yeni tehdit ekle
        const result = await threatCollection.insertOne(this.toJSON());
        return !!result.insertedId;
      }
    } catch (error) {
      console.error('Tehdit kaydederken hata:', error);
      throw error;
    }
  }

  /**
   * ID'ye göre tehdit bulur
   * @param {string} id - Tehdit ID'si
   * @returns {Promise<Threat|null>} - Bulunan tehdit nesnesi, yoksa null
   */
  static async findById(id) {
    const db = getDb();
    if (!db) throw new Error('Veritabanı bağlantısı yok');

    try {
      const threatCollection = db.collection('threats');
      const threatData = await threatCollection.findOne({ id });
      
      if (!threatData) return null;
      
      return new Threat(
        threatData.id,
        threatData.name,
        threatData.type,
        threatData.description,
        threatData.severity,
        threatData.filePath,
        threatData.isCleaned,
        threatData.detectionDate
      );
    } catch (error) {
      console.error('ID ile tehdit arama hatası:', error);
      throw error;
    }
  }

  /**
   * Tüm tehditleri getirir
   * @param {object} filter - Filtreleme seçenekleri (isCleaned vb.)
   * @returns {Promise<Threat[]>} - Tehdit nesneleri dizisi
   */
  static async findAll(filter = {}) {
    const db = getDb();
    if (!db) throw new Error('Veritabanı bağlantısı yok');

    try {
      const threatCollection = db.collection('threats');
      const threatsData = await threatCollection.find(filter).toArray();
      
      return threatsData.map(threatData => new Threat(
        threatData.id,
        threatData.name,
        threatData.type,
        threatData.description,
        threatData.severity,
        threatData.filePath,
        threatData.isCleaned,
        threatData.detectionDate
      ));
    } catch (error) {
      console.error('Tehditleri getirme hatası:', error);
      throw error;
    }
  }

  /**
   * Tehdit sayısını getirir
   * @param {object} filter - Filtreleme seçenekleri
   * @returns {Promise<number>} - Tehdit sayısı
   */
  static async count(filter = {}) {
    const db = getDb();
    if (!db) throw new Error('Veritabanı bağlantısı yok');

    try {
      const threatCollection = db.collection('threats');
      return await threatCollection.countDocuments(filter);
    } catch (error) {
      console.error('Tehdit sayma hatası:', error);
      throw error;
    }
  }

  /**
   * Rastgele tehditler üretir (Simülasyon amaçlı)
   * @param {number} count - Üretilecek tehdit sayısı
   * @returns {Threat[]} - Üretilen tehdit nesneleri dizisi
   */
  static getRandomThreats(count = 3) {
    const threatTypes = ['Trojan', 'Virus', 'Spyware', 'Adware', 'Ransomware', 'Worm', 'Rootkit'];
    const severityLevels = ['LOW', 'MEDIUM', 'HIGH'];
    const filePaths = [
      '/data/app/com.example.malicious',
      '/sdcard/download/suspicious.apk',
      '/system/bin/infected',
      null
    ];
    
    const threats = [];
    
    for (let i = 0; i < count; i++) {
      const type = threatTypes[Math.floor(Math.random() * threatTypes.length)];
      const severity = severityLevels[Math.floor(Math.random() * severityLevels.length)];
      const filePath = filePaths[Math.floor(Math.random() * filePaths.length)];
      
      const threat = new Threat(
        uuidv4(),
        `${type}.AndroidTest.${Math.floor(Math.random() * 1000)}`,
        type,
        `Bu bir ${type.toLowerCase()} test tehdididir. ${severity} seviyeli bir tehlikedir.`,
        severity,
        filePath,
        false,
        new Date()
      );
      
      threats.push(threat);
    }
    
    return threats;
  }
}

module.exports = Threat;