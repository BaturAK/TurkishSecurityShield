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
    this.detectionDate = detectionDate instanceof Date ? detectionDate : new Date(detectionDate);
    this.userId = null; // Bu tehdidin hangi kullanıcıya ait olduğu (null ise sistem genel)
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
      detectionDate: this.detectionDate,
      userId: this.userId
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
      if (!db) throw new Error('Veritabanı bağlantısı bulunamadı');

      const collection = db.collection('threats');
      
      // Tehdidin daha önce kaydedilip kaydedilmediğini kontrol et
      const existingThreat = await collection.findOne({ id: this.id });
      
      if (existingThreat) {
        // Tehdit güncelleme
        await collection.updateOne(
          { id: this.id },
          { $set: this.toJSON() }
        );
      } else {
        // Yeni tehdit ekleme
        await collection.insertOne(this.toJSON());
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
      if (!db) throw new Error('Veritabanı bağlantısı bulunamadı');

      const collection = db.collection('threats');
      const threatData = await collection.findOne({ id });
      
      if (!threatData) return null;
      
      const threat = new Threat(
        threatData.id,
        threatData.name,
        threatData.type,
        threatData.description,
        threatData.severity,
        threatData.filePath,
        threatData.isCleaned,
        new Date(threatData.detectionDate)
      );
      
      threat.userId = threatData.userId;
      
      return threat;
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
      if (!db) throw new Error('Veritabanı bağlantısı bulunamadı');

      const collection = db.collection('threats');
      const threatsData = await collection.find(filter)
        .sort({ detectionDate: -1 })
        .toArray();
      
      return threatsData.map(threatData => {
        const threat = new Threat(
          threatData.id,
          threatData.name,
          threatData.type,
          threatData.description,
          threatData.severity,
          threatData.filePath,
          threatData.isCleaned,
          new Date(threatData.detectionDate)
        );
        
        threat.userId = threatData.userId;
        
        return threat;
      });
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
      if (!db) throw new Error('Veritabanı bağlantısı bulunamadı');

      const collection = db.collection('threats');
      return await collection.countDocuments(filter);
    } catch (error) {
      console.error('Tehdit sayısı getirme hatası:', error);
      return 0;
    }
  }

  /**
   * Rastgele tehditler üretir (Simülasyon amaçlı)
   * @param {number} count - Üretilecek tehdit sayısı
   * @returns {Threat[]} - Üretilen tehdit nesneleri dizisi
   */
  static getRandomThreats(count = 3) {
    // Olası tehdit tipleri
    const threatTypes = [
      'Trojan', 'Virus', 'Spyware', 'Adware', 'Ransomware', 
      'Worm', 'Rootkit', 'Keylogger', 'Backdoor', 'Botnet'
    ];
    
    // Tehdit veritabanı (örnek)
    const threatDatabase = [
      {
        name: 'AndroidOS.Malware.123',
        type: 'Trojan',
        description: 'Kullanıcı bilgilerini çalan ve arka planda çalışan bir truva atı.',
        severity: 'HIGH'
      },
      {
        name: 'AndroidOS.Adware.456',
        type: 'Adware',
        description: 'İstenmeyen reklamlar gösteren ve kullanıcı davranışlarını izleyen bir reklam yazılımı.',
        severity: 'MEDIUM'
      },
      {
        name: 'AndroidOS.Spyware.789',
        type: 'Spyware',
        description: 'Kullanıcı konumunu ve kişisel bilgilerini izleyen ve dışarı sızdıran bir casus yazılım.',
        severity: 'HIGH'
      },
      {
        name: 'AndroidOS.Virus.ABC',
        type: 'Virus',
        description: 'Sistemde istenmeyen değişiklikler yapan ve yavaşlamaya neden olan bir virüs.',
        severity: 'MEDIUM'
      },
      {
        name: 'AndroidOS.Ransomware.XYZ',
        type: 'Ransomware',
        description: 'Kullanıcı dosyalarını şifreleyen ve fidye talep eden zararlı yazılım.',
        severity: 'HIGH'
      },
      {
        name: 'AndroidOS.Worm.123',
        type: 'Worm',
        description: 'Kendi kendini çoğaltabilen ve ağ üzerinden yayılan zararlı yazılım.',
        severity: 'MEDIUM'
      },
      {
        name: 'AndroidOS.Rootkit.456',
        type: 'Rootkit',
        description: 'Sistem düzeyinde gizlenen ve tespit edilmesi zor olan zararlı yazılım.',
        severity: 'HIGH'
      },
      {
        name: 'AndroidOS.PUP.789',
        type: 'PUP',
        description: 'Potansiyel olarak istenmeyen program. Sistem performansını düşürebilir.',
        severity: 'LOW'
      },
      {
        name: 'AndroidOS.Keylogger.ABC',
        type: 'Keylogger',
        description: 'Kullanıcı tuş vuruşlarını kaydeden ve dışarı sızdıran zararlı yazılım.',
        severity: 'HIGH'
      },
      {
        name: 'AndroidOS.Backdoor.XYZ',
        type: 'Backdoor',
        description: 'Uzaktan erişim sağlayan ve sistem güvenliğini tehdit eden bir arka kapı.',
        severity: 'HIGH'
      }
    ];
    
    // Olası dosya yolları
    const filePaths = [
      '/storage/emulated/0/Download/suspicious_file.apk',
      '/storage/emulated/0/WhatsApp/Media/suspicious_image.jpg',
      '/storage/emulated/0/DCIM/Camera/suspicious_video.mp4',
      '/data/app/com.suspicious.app-1/base.apk',
      '/data/data/com.suspicious.app/shared_prefs/config.xml',
      null // Bazen dosya yolu olmayabilir
    ];
    
    // Rastgele tehditler oluştur
    const threats = [];
    
    for (let i = 0; i < count; i++) {
      // Rastgele bir tehdit seç
      const randomThreatIndex = Math.floor(Math.random() * threatDatabase.length);
      const threatTemplate = threatDatabase[randomThreatIndex];
      
      // Rastgele bir dosya yolu seç
      const randomFilePath = filePaths[Math.floor(Math.random() * filePaths.length)];
      
      // Yeni bir tehdit oluştur
      const threat = new Threat(
        null, // ID otomatik oluşturulacak
        threatTemplate.name,
        threatTemplate.type,
        threatTemplate.description,
        threatTemplate.severity,
        randomFilePath,
        false, // isCleaned
        new Date(Date.now() - Math.floor(Math.random() * 86400000)) // Son 24 saat içinde
      );
      
      threats.push(threat);
    }
    
    return threats;
  }
}

module.exports = Threat;