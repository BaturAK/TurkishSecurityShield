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
    this.id = id;
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
      const db = getDb();
      
      if (!db) {
        throw new Error('Veritabanı bağlantısı kurulamadı');
      }
      
      const threatCollection = db.collection('threats');
      
      // Tehdit zaten var mı kontrol et
      const existingThreat = await threatCollection.findOne({ id: this.id });
      
      if (existingThreat) {
        // Tehdit var, güncelle
        await threatCollection.updateOne(
          { id: this.id },
          { $set: this.toJSON() }
        );
      } else {
        // Tehdit yok, yeni kayıt ekle
        await threatCollection.insertOne(this.toJSON());
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
      const db = getDb();
      
      if (!db) {
        throw new Error('Veritabanı bağlantısı kurulamadı');
      }
      
      const threatCollection = db.collection('threats');
      const threatData = await threatCollection.findOne({ id });
      
      if (!threatData) {
        return null;
      }
      
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
      console.error('ID ile tehdit bulunurken hata:', error);
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
      const db = getDb();
      
      if (!db) {
        throw new Error('Veritabanı bağlantısı kurulamadı');
      }
      
      const threatCollection = db.collection('threats');
      const threats = await threatCollection.find(filter).sort({ detectionDate: -1 }).toArray();
      
      return threats.map(threatData => new Threat(
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
      console.error('Tehditler getirilirken hata:', error);
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
      const db = getDb();
      
      if (!db) {
        throw new Error('Veritabanı bağlantısı kurulamadı');
      }
      
      const threatCollection = db.collection('threats');
      return await threatCollection.countDocuments(filter);
    } catch (error) {
      console.error('Tehdit sayısı hesaplanırken hata:', error);
      return 0;
    }
  }

  /**
   * Rastgele tehditler üretir (Simülasyon amaçlı)
   * @param {number} count - Üretilecek tehdit sayısı
   * @returns {Threat[]} - Üretilen tehdit nesneleri dizisi
   */
  static getRandomThreats(count = 3) {
    const threatTypes = ['Trojan', 'Virus', 'Spyware', 'Adware', 'Ransomware', 'Worm', 'Rootkit'];
    const severities = ['LOW', 'MEDIUM', 'HIGH'];
    
    const filePaths = [
      '/data/app/com.example.suspicious.app/base.apk',
      '/sdcard/Download/suspicious_file.apk',
      '/sdcard/DCIM/malicious_attachment.jpg',
      '/data/data/com.example.game/cache/ad_library.dex',
      '/system/app/bloatware.apk',
      '/data/app/com.example.modified.app/classes.dex'
    ];
    
    const threatNames = [
      'Android.Trojan.BankBot',
      'Android.Virus.Locker',
      'Android.Spyware.Pegasus',
      'Android.Adware.Ewind',
      'Android.Ransomware.WannaLocker',
      'Android.Worm.Selfmite',
      'Android.Rootkit.GhostPush',
      'Android.Trojan.FakeBank',
      'Android.Virus.Judy',
      'Android.Spyware.Flexispy'
    ];
    
    const descriptions = [
      'Bu tehdit bankacılık bilgilerinizi çalmayı amaçlar ve SMS izinlerini kullanır.',
      'Cihazınızı kilitleyerek erişimi engeller ve kişisel verilerinizi şifreler.',
      'Arka planda çalışarak kişisel bilgilerinizi ve iletişimlerinizi izler.',
      'İstenmeyen reklamlar gösterir ve tarama geçmişinizi takip eder.',
      'Verilerinizi şifreleyerek fidye talep eder.',
      'SMS yoluyla kendini diğer cihazlara yayar.',
      'Sistem seviyesinde erişim sağlayarak kendini gizler.',
      'Gerçek bankacılık uygulamalarını taklit ederek kimlik bilgilerinizi çalar.',
      'Zararlı reklam kodları içerir ve otomatik tıklama işlemleri gerçekleştirir.',
      'Çağrıları ve mesajları dinleyerek kişisel bilgilerinizi toplar.'
    ];
    
    const threats = [];
    
    for (let i = 0; i < count; i++) {
      const type = threatTypes[Math.floor(Math.random() * threatTypes.length)];
      const severity = severities[Math.floor(Math.random() * severities.length)];
      const nameIndex = Math.floor(Math.random() * threatNames.length);
      const descIndex = Math.floor(Math.random() * descriptions.length);
      const filePath = filePaths[Math.floor(Math.random() * filePaths.length)];
      
      threats.push(new Threat(
        uuidv4(),
        threatNames[nameIndex],
        type,
        descriptions[descIndex],
        severity,
        filePath,
        false,
        new Date()
      ));
    }
    
    return threats;
  }
}

module.exports = Threat;