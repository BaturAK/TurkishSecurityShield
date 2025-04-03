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
    // Gerçek bir uygulamada burada tehdidi temizleyecek kod olacak
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
      const threatsCollection = db.collection('threats');
      
      const existingThreat = await threatsCollection.findOne({ id: this.id });
      
      if (existingThreat) {
        // Tehdit zaten varsa güncelle
        await threatsCollection.updateOne(
          { id: this.id },
          { $set: this.toJSON() }
        );
      } else {
        // Tehdit yoksa yeni kayıt oluştur
        await threatsCollection.insertOne(this.toJSON());
      }
      
      return true;
    } catch (error) {
      console.error('Tehdit kaydetme hatası:', error);
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
      const threatsCollection = db.collection('threats');
      
      const threatData = await threatsCollection.findOne({ id });
      
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
      console.error('Tehdit bulma hatası:', error);
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
      const threatsCollection = db.collection('threats');
      
      const threatsData = await threatsCollection.find(filter).toArray();
      
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
      const threatsCollection = db.collection('threats');
      
      return await threatsCollection.countDocuments(filter);
    } catch (error) {
      console.error('Tehdit sayma hatası:', error);
      return 0;
    }
  }

  /**
   * Rastgele tehditler üretir (Simülasyon amaçlı)
   * @param {number} count - Üretilecek tehdit sayısı
   * @returns {Threat[]} - Üretilen tehdit nesneleri dizisi
   */
  static getRandomThreats(count = 3) {
    const threatTypes = ['Trojan', 'Virus', 'Spyware', 'Adware', 'Malware', 'Ransomware', 'Worm'];
    const severityLevels = ['LOW', 'MEDIUM', 'HIGH'];
    const filePaths = [
      '/data/app/com.example.malicious/base.apk',
      '/storage/emulated/0/Download/suspicious_file.zip',
      '/storage/emulated/0/DCIM/hidden_script.js',
      '/data/data/com.unknown.app/shared_prefs/tracker.xml',
      '/system/app/modified_system_app.apk'
    ];
    
    const threatNames = [
      'Android.Trojan.BankBot',
      'Andr.Malware.GrifthHorse',
      'AndroidOS.FakeApp.123',
      'Trojan.AndroidOS.Agent',
      'Android.Backdoor.Spy',
      'Android.Downloader.234',
      'Android.Spyware.Pegasus',
      'Andr.Adware.Necro',
      'Android.Virus.Joker',
      'Android.Exploit.CVE202X'
    ];
    
    const threatDescriptions = [
      'Bu kötü amaçlı yazılım banka bilgilerinizi çalabilir ve finansal dolandırıcılık yapabilir.',
      'Kullanıcının bilgisi olmadan premium SMS servislere abone yapan kötü amaçlı yazılım.',
      'Kullanıcı verilerini toplayan ve uzak sunuculara gönderen casus yazılım.',
      'Cihazda arka kapı oluşturan ve uzaktan kontrol imkanı veren kötü amaçlı yazılım.',
      'Kişisel bilgileri çalmak için tasarlanmış keylogger yazılımı.',
      'Reklam göstererek gelir elde etmeyi amaçlayan adware.',
      'Cihazın kamerasına ve mikrofonuna izinsiz erişim sağlayan gizli yazılım.',
      'Dosyaları şifreleyerek fidye isteyen ransomware.',
      'Kendini çoğaltarak yayılan ve sistem performansını düşüren virüs.',
      'Cihazdaki diğer uygulamaların verilerine erişim sağlayan kötü amaçlı yazılım.'
    ];
    
    const threats = [];
    
    for (let i = 0; i < count; i++) {
      const threatTypeIndex = Math.floor(Math.random() * threatTypes.length);
      const severityIndex = Math.floor(Math.random() * severityLevels.length);
      const filePathIndex = Math.floor(Math.random() * filePaths.length);
      const nameIndex = Math.floor(Math.random() * threatNames.length);
      const descIndex = Math.floor(Math.random() * threatDescriptions.length);
      
      threats.push(new Threat(
        uuidv4(),
        threatNames[nameIndex],
        threatTypes[threatTypeIndex],
        threatDescriptions[descIndex],
        severityLevels[severityIndex],
        filePaths[filePathIndex],
        false,
        new Date(Date.now() - Math.floor(Math.random() * 86400000)) // Son 24 saat içinde rastgele bir zaman
      ));
    }
    
    return threats;
  }
}

module.exports = Threat;