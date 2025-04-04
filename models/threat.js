/**
 * Threat Model
 * Tehditleri temsil eden model sınıfı
 */

const { v4: uuidv4 } = require('uuid');
const database = require('../config/database');

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
    try {
      const db = database.getDb();
      if (!db) return false;

      const threats = db.collection('threats');
      
      const threatData = {
        _id: this.id,
        name: this.name,
        type: this.type,
        description: this.description,
        severity: this.severity,
        filePath: this.filePath,
        isCleaned: this.isCleaned,
        detectionDate: this.detectionDate
      };

      // Tehdidin daha önce kaydedilip kaydedilmediğini kontrol et
      const existingThreat = await threats.findOne({ _id: this.id });
      
      if (existingThreat) {
        // Tehdit zaten var, güncelle
        await threats.updateOne({ _id: this.id }, { $set: threatData });
      } else {
        // Yeni tehdit ekle
        await threats.insertOne(threatData);
      }
      
      return true;
    } catch (error) {
      console.error('Tehdit kaydedilirken hata:', error);
      return false;
    }
  }

  /**
   * ID'ye göre tehdit bulur
   * @param {string} id - Tehdit ID'si
   * @returns {Promise<Threat|null>} - Bulunan tehdit nesnesi, yoksa null
   */
  static async findById(id) {
    try {
      const db = database.getDb();
      if (!db) return null;

      const threats = db.collection('threats');
      const threatData = await threats.findOne({ _id: id });
      
      if (!threatData) return null;
      
      return new Threat(
        threatData._id,
        threatData.name,
        threatData.type,
        threatData.description,
        threatData.severity,
        threatData.filePath,
        threatData.isCleaned,
        threatData.detectionDate
      );
    } catch (error) {
      console.error('ID ile tehdit aranırken hata:', error);
      return null;
    }
  }

  /**
   * Tüm tehditleri getirir
   * @param {object} filter - Filtreleme seçenekleri (isCleaned vb.)
   * @returns {Promise<Threat[]>} - Tehdit nesneleri dizisi
   */
  static async findAll(filter = {}) {
    try {
      const db = database.getDb();
      if (!db) return [];

      const threats = db.collection('threats');
      const threatDataList = await threats.find(filter).toArray();
      
      return threatDataList.map(threatData => new Threat(
        threatData._id,
        threatData.name,
        threatData.type,
        threatData.description,
        threatData.severity,
        threatData.filePath,
        threatData.isCleaned,
        threatData.detectionDate
      ));
    } catch (error) {
      console.error('Tüm tehditler getirilirken hata:', error);
      return [];
    }
  }

  /**
   * Tehdit sayısını getirir
   * @param {object} filter - Filtreleme seçenekleri
   * @returns {Promise<number>} - Tehdit sayısı
   */
  static async count(filter = {}) {
    try {
      const db = database.getDb();
      if (!db) return 0;

      const threats = db.collection('threats');
      return await threats.countDocuments(filter);
    } catch (error) {
      console.error('Tehdit sayısı getirilirken hata:', error);
      return 0;
    }
  }

  /**
   * Rastgele tehditler üretir (Simülasyon amaçlı)
   * @param {number} count - Üretilecek tehdit sayısı
   * @returns {Threat[]} - Üretilen tehdit nesneleri dizisi
   */
  static getRandomThreats(count = 3) {
    const threatTypes = ['TROJAN', 'VIRUS', 'SPYWARE', 'ADWARE', 'RANSOMWARE', 'WORM'];
    const severityLevels = ['LOW', 'MEDIUM', 'HIGH'];
    
    const threats = [];
    
    for (let i = 0; i < count; i++) {
      const type = threatTypes[Math.floor(Math.random() * threatTypes.length)];
      const severity = severityLevels[Math.floor(Math.random() * severityLevels.length)];
      
      let name, description;
      
      switch (type) {
        case 'TROJAN':
          name = `Trojan.AndroidOS.${['Agent', 'Banker', 'SMS', 'Spy'][Math.floor(Math.random() * 4)]}`;
          description = 'Cihazın sistem yetkilerini ele geçirebilen ve kişisel verileri çalabilecek bir Truva atı tehdidir.';
          break;
        case 'VIRUS':
          name = `Virus.AndroidOS.${['Boot', 'File', 'Script'][Math.floor(Math.random() * 3)]}`;
          description = 'Sisteme zarar veren ve kendini kopyalayarak yayılan zararlı bir yazılımdır.';
          break;
        case 'SPYWARE':
          name = `Spyware.AndroidOS.${['Track', 'Keylog', 'Info'][Math.floor(Math.random() * 3)]}`;
          description = 'Kullanıcı bilgilerini gizlice toplayan ve uzak sunuculara gönderen bir casus yazılımdır.';
          break;
        case 'ADWARE':
          name = `Adware.AndroidOS.${['Ewind', 'PopUp', 'Banner'][Math.floor(Math.random() * 3)]}`;
          description = 'Rahatsız edici reklamlar gösteren ve kullanıcı davranışlarını takip eden bir reklam yazılımıdır.';
          break;
        case 'RANSOMWARE':
          name = `Ransom.AndroidOS.${['Locker', 'Crypt', 'Block'][Math.floor(Math.random() * 3)]}`;
          description = 'Cihaz verilerini şifreleyen ve fidye talep eden bir fidye yazılımıdır.';
          break;
        case 'WORM':
          name = `Worm.AndroidOS.${['Net', 'Spread', 'Link'][Math.floor(Math.random() * 3)]}`;
          description = 'Kendini kopyalayarak ağ üzerinden yayılan ve sistem kaynaklarını tüketen bir solucan türüdür.';
          break;
        default:
          name = `Unknown.AndroidOS.Type${Math.floor(Math.random() * 100)}`;
          description = 'Tanımlanamayan şüpheli bir yazılım.';
      }
      
      const filePath = Math.random() > 0.3 ? `/data/app/com.example.suspicious${Math.floor(Math.random() * 10)}/base.apk` : null;
      
      const threat = new Threat(
        `threat${uuidv4().substring(0, 8)}`,
        name,
        type,
        description,
        severity,
        filePath,
        false,
        new Date(Date.now() - Math.floor(Math.random() * 86400000))
      );
      
      threats.push(threat);
    }
    
    return threats;
  }
}

module.exports = Threat;