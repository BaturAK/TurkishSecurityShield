/**
 * API Rotaları
 * Mobil uygulama için API endpointleri
 */

const express = require('express');
const router = express.Router();
const User = require('../models/user');
const ScanResult = require('../models/scanResult');
const Threat = require('../models/threat');
const { v4: uuidv4 } = require('uuid');

/**
 * API Durum Kontrolü
 * GET /api/status
 */
router.get('/status', (req, res) => {
  res.json({
    status: 'online',
    version: '1.0.0',
    timestamp: new Date()
  });
});

/**
 * Kimlik Doğrulama
 * POST /api/auth/login
 */
router.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'E-posta ve şifre gereklidir.'
      });
    }
    
    // Demo admin hesabı kontrolü
    if (email === 'admin@example.com' && password === 'password') {
      const user = await User.findByEmail(email);
      
      if (user) {
        return res.json({
          success: true,
          message: 'Giriş başarılı',
          user: user.toJSON()
        });
      } else {
        // Admin kullanıcısı oluştur
        const newUser = new User('admin123', email, 'Admin', null, true);
        await newUser.save();
        
        return res.json({
          success: true,
          message: 'Giriş başarılı',
          user: newUser.toJSON()
        });
      }
    }
    
    // Firebase Auth ile kimlik doğrulama
    const firebaseConfig = require('../config/firebase');
    const auth = firebaseConfig.getAuth();
    
    if (auth) {
      try {
        // Firebase ile giriş
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        const firebaseUser = userCredential.user;
        
        // Veritabanında kullanıcı kontrolü
        let user = await User.findByEmail(email);
        
        if (!user) {
          // Kullanıcı yoksa oluştur
          user = new User(
            firebaseUser.uid,
            email,
            firebaseUser.displayName,
            firebaseUser.photoURL
          );
          await user.save();
        }
        
        return res.json({
          success: true,
          message: 'Giriş başarılı',
          user: user.toJSON()
        });
      } catch (firebaseError) {
        console.error('Firebase giriş hatası:', firebaseError);
        return res.status(401).json({
          success: false,
          message: 'Geçersiz e-posta veya şifre.'
        });
      }
    } else {
      // Demo mod - sadece demo kullanıcılar için
      if (email.endsWith('@demo.com') && password === 'demo123') {
        let user = await User.findByEmail(email);
        
        if (!user) {
          // Demo kullanıcı oluştur
          user = new User(
            `demo_${Date.now()}`,
            email,
            email.split('@')[0],
            null
          );
          await user.save();
        }
        
        return res.json({
          success: true,
          message: 'Giriş başarılı',
          user: user.toJSON()
        });
      } else {
        return res.status(401).json({
          success: false,
          message: 'Geçersiz e-posta veya şifre.'
        });
      }
    }
  } catch (error) {
    console.error('API giriş sırasında hata:', error);
    res.status(500).json({
      success: false,
      message: 'Giriş sırasında bir hata oluştu.'
    });
  }
});

/**
 * Yeni Tarama Başlat
 * POST /api/scans/start
 */
router.post('/scans/start', async (req, res) => {
  try {
    const { type, userId } = req.body;
    
    // Geçerli tarama tipi kontrolü
    const validTypes = ['QUICK', 'FULL', 'WIFI', 'CUSTOM', 'QR'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Geçersiz tarama tipi.'
      });
    }
    
    // Kullanıcı kontrolü
    if (userId) {
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Kullanıcı bulunamadı.'
        });
      }
    }
    
    // Yeni tarama oluştur
    const scanResult = ScanResult.createSimulatedScan(type, userId);
    await scanResult.save();
    
    // Tarama simülasyonu (gerçek bir tarama yerine)
    simulateScan(scanResult.id, type, userId);
    
    res.json({
      success: true,
      scanId: scanResult.id,
      message: 'Tarama başlatıldı.'
    });
  } catch (error) {
    console.error('Tarama başlatılırken hata:', error);
    res.status(500).json({
      success: false,
      message: 'Tarama başlatılırken bir hata oluştu.'
    });
  }
});

/**
 * Tarama simülasyonu
 * @param {string} scanId - Tarama ID'si
 * @param {string} type - Tarama tipi
 * @param {string|null} userId - Kullanıcı ID'si
 */
async function simulateScan(scanId, type, userId) {
  try {
    // Tarama tipleri için simüle edilmiş süreler (saniye)
    const scanDurations = {
      'QUICK': 5,
      'FULL': 15,
      'WIFI': 8,
      'CUSTOM': 10,
      'QR': 3
    };
    
    // Tarama tipleri için maksimum tehdit sayısı
    const maxThreatCounts = {
      'QUICK': 2,
      'FULL': 5,
      'WIFI': 3,
      'CUSTOM': 4,
      'QR': 1
    };
    
    // Tarama tipleri için taranan öğe sayısı (min, max)
    const scanCounts = {
      'QUICK': [50, 150],
      'FULL': [200, 500],
      'WIFI': [20, 50],
      'CUSTOM': [100, 300],
      'QR': [1, 1]
    };
    
    const duration = scanDurations[type] || 10; // Varsayılan 10 saniye
    const maxThreats = maxThreatCounts[type] || 3; // Varsayılan maksimum 3 tehdit
    
    // Rastgele tehdit sayısı (0 ile maksimum arasında)
    const threatCount = Math.floor(Math.random() * (maxThreats + 1));
    const threats = Threat.getRandomThreats(threatCount);
    
    // Taranan öğe sayısı
    const [minCount, maxCount] = scanCounts[type] || [50, 200];
    const totalScanned = Math.floor(Math.random() * (maxCount - minCount + 1)) + minCount;
    
    // Tarama tamamlandığında güncelle
    setTimeout(async () => {
      try {
        const scanResult = await ScanResult.findById(scanId);
        if (scanResult) {
          scanResult.complete(totalScanned, threats);
          await scanResult.save();
          
          // Bulunan tehditleri veritabanına kaydet
          for (const threat of threats) {
            await threat.save();
          }
          
          console.log(`Tarama tamamlandı: ${scanId}, Tehdit sayısı: ${threatCount}`);
        }
      } catch (error) {
        console.error(`Tarama tamamlanırken hata: ${scanId}`, error);
      }
    }, duration * 1000);
    
    console.log(`Tarama başlatıldı: ${scanId}, Süre: ${duration} saniye`);
  } catch (error) {
    console.error(`Tarama simülasyonu sırasında hata: ${scanId}`, error);
  }
}

/**
 * Tarama Durumu Getir
 * GET /api/scans/:scanId/status
 */
router.get('/scans/:scanId/status', async (req, res) => {
  try {
    const { scanId } = req.params;
    
    // Taramayı getir
    const scanResult = await ScanResult.findById(scanId);
    
    if (!scanResult) {
      return res.status(404).json({
        success: false,
        message: 'Tarama sonucu bulunamadı.'
      });
    }
    
    res.json({
      success: true,
      status: scanResult.getStatus(),
      progress: scanResult.endTime ? 100 : Math.floor(Math.random() * 100),
      totalScanned: scanResult.totalScanned,
      threatCount: scanResult.threatsFound.length,
      duration: scanResult.getDuration()
    });
  } catch (error) {
    console.error('Tarama durumu alınırken hata:', error);
    res.status(500).json({
      success: false,
      message: 'Tarama durumu alınırken bir hata oluştu.'
    });
  }
});

/**
 * Tarama Sonucu Getir
 * GET /api/scans/:scanId
 */
router.get('/scans/:scanId', async (req, res) => {
  try {
    const { scanId } = req.params;
    
    // Taramayı getir
    const scanResult = await ScanResult.findById(scanId);
    
    if (!scanResult) {
      return res.status(404).json({
        success: false,
        message: 'Tarama sonucu bulunamadı.'
      });
    }
    
    res.json({
      success: true,
      scan: scanResult.toJSON()
    });
  } catch (error) {
    console.error('Tarama sonucu alınırken hata:', error);
    res.status(500).json({
      success: false,
      message: 'Tarama sonucu alınırken bir hata oluştu.'
    });
  }
});

/**
 * Kullanıcı Bilgisi Getir
 * GET /api/users/:userId
 */
router.get('/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Kullanıcıyı getir
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Kullanıcı bulunamadı.'
      });
    }
    
    // Kullanıcı ayarlarını getir
    const db = require('../config/database').getDb();
    const usersCollection = db.collection('users');
    const userSettings = await usersCollection.findOne(
      { _id: userId },
      { 
        projection: { 
          settings: 1, 
          isPremium: 1, 
          premiumValidUntil: 1 
        } 
      }
    );
    
    const settings = userSettings?.settings || {
      autoScan: true,
      scanFrequency: 'weekly',
      notifications: true,
      darkMode: false,
      language: 'tr'
    };
    
    const isPremium = userSettings?.isPremium || false;
    const premiumValidUntil = userSettings?.premiumValidUntil || null;
    
    res.json({
      success: true,
      user: {
        ...user.toJSON(),
        settings,
        isPremium,
        premiumValidUntil
      }
    });
  } catch (error) {
    console.error('Kullanıcı bilgisi alınırken hata:', error);
    res.status(500).json({
      success: false,
      message: 'Kullanıcı bilgisi alınırken bir hata oluştu.'
    });
  }
});

/**
 * Tehdit Temizle
 * POST /api/threats/:threatId/clean
 */
router.post('/threats/:threatId/clean', async (req, res) => {
  try {
    const { threatId } = req.params;
    
    // Tehdidi getir
    const threat = await Threat.findById(threatId);
    
    if (!threat) {
      return res.status(404).json({
        success: false,
        message: 'Tehdit bulunamadı.'
      });
    }
    
    // Tehdit zaten temizlenmiş mi?
    if (threat.isCleaned) {
      return res.json({
        success: true,
        message: 'Bu tehdit zaten temizlenmiş.'
      });
    }
    
    // Premium kontrolü
    const { userId } = req.body;
    if (userId) {
      const db = require('../config/database').getDb();
      const usersCollection = db.collection('users');
      const userData = await usersCollection.findOne({ _id: userId });
      
      // Yüksek tehlike seviyeli tehditler için premium gerekli
      if (threat.severity === 'HIGH' && !(userData?.isPremium)) {
        return res.status(403).json({
          success: false,
          message: 'Yüksek tehlike seviyeli tehditleri temizlemek için premium üyelik gereklidir.'
        });
      }
    }
    
    // Tehdidi temizle
    threat.clean();
    await threat.save();
    
    res.json({
      success: true,
      message: 'Tehdit başarıyla temizlendi.',
      threat: threat.toJSON()
    });
  } catch (error) {
    console.error('Tehdit temizlenirken hata:', error);
    res.status(500).json({
      success: false,
      message: 'Tehdit temizlenirken bir hata oluştu.'
    });
  }
});

/**
 * Kullanıcı Taramaları Getir
 * GET /api/users/:userId/scans
 */
router.get('/users/:userId/scans', async (req, res) => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit) || 10;
    
    // Kullanıcıyı kontrol et
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Kullanıcı bulunamadı.'
      });
    }
    
    // Kullanıcıya ait taramaları getir
    const scans = await ScanResult.findByUserId(userId, limit);
    
    res.json({
      success: true,
      scans: scans.map(scan => scan.toJSON())
    });
  } catch (error) {
    console.error('Kullanıcı taramaları alınırken hata:', error);
    res.status(500).json({
      success: false,
      message: 'Kullanıcı taramaları alınırken bir hata oluştu.'
    });
  }
});

/**
 * Kullanıcı İstatistikleri Getir
 * GET /api/users/:userId/stats
 */
router.get('/users/:userId/stats', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Kullanıcıyı kontrol et
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Kullanıcı bulunamadı.'
      });
    }
    
    // Veritabanı bağlantısı
    const db = require('../config/database').getDb();
    
    // Tarama sayıları
    const scanResults = db.collection('scanResults');
    const totalScans = await scanResults.countDocuments({ userId });
    
    // Son tarama
    const lastScanData = await scanResults.find({ userId })
      .sort({ startTime: -1 })
      .limit(1)
      .toArray();
    
    const lastScan = lastScanData.length > 0 ? lastScanData[0] : null;
    
    // Tehdit sayıları
    const threats = db.collection('threats');
    
    // Taramalardaki tehdit ID'lerini getir
    const scansWithThreats = await scanResults.find({ userId }).toArray();
    const threatIds = [];
    
    for (const scan of scansWithThreats) {
      if (scan.threatsFound && scan.threatsFound.length > 0) {
        threatIds.push(...scan.threatsFound);
      }
    }
    
    // Tehdit sayıları
    let totalThreats = 0;
    let cleanedThreats = 0;
    
    if (threatIds.length > 0) {
      totalThreats = await threats.countDocuments({ _id: { $in: threatIds } });
      cleanedThreats = await threats.countDocuments({ _id: { $in: threatIds }, isCleaned: true });
    }
    
    res.json({
      success: true,
      stats: {
        totalScans,
        lastScan: lastScan ? {
          id: lastScan._id,
          type: lastScan.type,
          startTime: lastScan.startTime,
          endTime: lastScan.endTime,
          threatCount: lastScan.threatsFound.length
        } : null,
        totalThreats,
        cleanedThreats,
        activeThreats: totalThreats - cleanedThreats
      }
    });
  } catch (error) {
    console.error('Kullanıcı istatistikleri alınırken hata:', error);
    res.status(500).json({
      success: false,
      message: 'Kullanıcı istatistikleri alınırken bir hata oluştu.'
    });
  }
});

/**
 * Tüm Aktif Tehditleri Getir
 * GET /api/threats
 */
router.get('/threats', async (req, res) => {
  try {
    const filter = req.query.filter || 'active';
    
    // Filtre oluştur
    const dbFilter = {};
    if (filter === 'active') {
      dbFilter.isCleaned = false;
    } else if (filter === 'cleaned') {
      dbFilter.isCleaned = true;
    }
    
    // Tehditleri getir
    const threats = await Threat.findAll(dbFilter);
    
    res.json({
      success: true,
      threats: threats.map(threat => threat.toJSON())
    });
  } catch (error) {
    console.error('Tehditler alınırken hata:', error);
    res.status(500).json({
      success: false,
      message: 'Tehditler alınırken bir hata oluştu.'
    });
  }
});

/**
 * Premium Aktivasyon
 * POST /api/premium/activate
 */
router.post('/premium/activate', async (req, res) => {
  try {
    const { activationCode, userId } = req.body;
    
    if (!activationCode || !userId) {
      return res.status(400).json({
        success: false,
        message: 'Aktivasyon kodu ve kullanıcı ID'si gereklidir.'
      });
    }
    
    // Kullanıcı kontrolü
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Kullanıcı bulunamadı.'
      });
    }
    
    // Veritabanında kod kontrolü
    const db = require('../config/database').getDb();
    const premium = db.collection('premium');
    const codeData = await premium.findOne({ code: activationCode, isUsed: false });
    
    if (!codeData) {
      return res.status(400).json({
        success: false,
        message: 'Geçersiz veya kullanılmış aktivasyon kodu.'
      });
    }
    
    // Kodu kullanıldı olarak işaretle
    await premium.updateOne(
      { _id: codeData._id },
      {
        $set: {
          isUsed: true,
          usedBy: userId,
          usedAt: new Date()
        }
      }
    );
    
    // Kullanıcıyı premium yap
    const users = db.collection('users');
    await users.updateOne(
      { _id: userId },
      {
        $set: {
          isPremium: true,
          premiumValidUntil: new Date(Date.now() + (codeData.validDays * 24 * 60 * 60 * 1000)),
          premiumCode: activationCode
        }
      }
    );
    
    res.json({
      success: true,
      message: 'Premium aktivasyonu başarılı!',
      validDays: codeData.validDays,
      validUntil: new Date(Date.now() + (codeData.validDays * 24 * 60 * 60 * 1000))
    });
  } catch (error) {
    console.error('Premium aktivasyonu sırasında hata:', error);
    res.status(500).json({
      success: false,
      message: 'Premium aktivasyonu sırasında bir hata oluştu.'
    });
  }
});

/**
 * Uygulama Ayarlarını Güncelle
 * POST /api/users/:userId/settings
 */
router.post('/users/:userId/settings', async (req, res) => {
  try {
    const { userId } = req.params;
    const { settings } = req.body;
    
    if (!settings) {
      return res.status(400).json({
        success: false,
        message: 'Ayarlar gereklidir.'
      });
    }
    
    // Kullanıcı kontrolü
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Kullanıcı bulunamadı.'
      });
    }
    
    // Ayarları güncelle
    const db = require('../config/database').getDb();
    const usersCollection = db.collection('users');
    
    await usersCollection.updateOne(
      { _id: userId },
      { $set: { settings } }
    );
    
    res.json({
      success: true,
      message: 'Ayarlar başarıyla güncellendi.',
      settings
    });
  } catch (error) {
    console.error('Ayarlar güncellenirken hata:', error);
    res.status(500).json({
      success: false,
      message: 'Ayarlar güncellenirken bir hata oluştu.'
    });
  }
});

module.exports = router;