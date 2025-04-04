/**
 * Dashboard Rotaları
 * Kullanıcı dashboard için router
 */

const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');
const User = require('../models/user');
const ScanResult = require('../models/scanResult');
const Threat = require('../models/threat');

// Tüm dashboard rotaları için kimlik doğrulama gerekli
router.use(isAuthenticated);

/**
 * Dashboard Ana Sayfa
 * GET /dashboard
 */
router.get('/', async (req, res) => {
  try {
    const userId = req.session.user.id;
    
    // Kullanıcıya ait son taramalar
    const recentScans = await ScanResult.findByUserId(userId, 5);
    
    // İstatistikleri hesapla
    const totalScans = await ScanResult.count({ userId });
    const activeThreats = await Threat.count({ isCleaned: false });
    const cleanedThreats = await Threat.count({ isCleaned: true });
    
    res.render('dashboard/index', {
      title: 'Dashboard',
      recentScans,
      stats: {
        totalScans,
        activeThreats,
        cleanedThreats,
        totalThreats: activeThreats + cleanedThreats
      }
    });
  } catch (error) {
    console.error('Dashboard yüklenirken hata:', error);
    res.status(500).render('error', {
      title: 'Hata',
      error: {
        status: 500,
        message: 'Dashboard yüklenirken bir hata oluştu.'
      }
    });
  }
});

/**
 * Dashboard Taramalar Sayfası
 * GET /dashboard/scans
 */
router.get('/scans', async (req, res) => {
  try {
    const userId = req.session.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;
    
    // Kullanıcıya ait taramaları getir
    const db = require('../config/database').getDb();
    const scanResults = db.collection('scanResults');
    
    const totalScans = await scanResults.countDocuments({ userId });
    const totalPages = Math.ceil(totalScans / limit);
    
    const scanDataList = await scanResults.find({ userId })
      .sort({ startTime: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();
    
    const scans = [];
    
    for (const scanData of scanDataList) {
      scans.push({
        id: scanData._id,
        type: scanData.type,
        startTime: scanData.startTime,
        endTime: scanData.endTime,
        totalScanned: scanData.totalScanned,
        threatCount: scanData.threatsFound.length,
        status: scanData.endTime ? 'COMPLETED' : 'RUNNING'
      });
    }
    
    res.render('dashboard/scans', {
      title: 'Taramalarım',
      scans,
      pagination: {
        page,
        totalPages,
        totalItems: totalScans,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Taramalar sayfası yüklenirken hata:', error);
    res.status(500).render('error', {
      title: 'Hata',
      error: {
        status: 500,
        message: 'Taramalar sayfası yüklenirken bir hata oluştu.'
      }
    });
  }
});

/**
 * Dashboard Tehditler Sayfası
 * GET /dashboard/threats
 */
router.get('/threats', async (req, res) => {
  try {
    const filter = req.query.filter || 'all';
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;
    
    // Filtre oluştur
    const dbFilter = {};
    if (filter === 'active') {
      dbFilter.isCleaned = false;
    } else if (filter === 'cleaned') {
      dbFilter.isCleaned = true;
    }
    
    // Tehditleri getir
    const db = require('../config/database').getDb();
    const threats = db.collection('threats');
    
    const totalThreats = await threats.countDocuments(dbFilter);
    const totalPages = Math.ceil(totalThreats / limit);
    
    const threatDataList = await threats.find(dbFilter)
      .sort({ detectionDate: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();
    
    const threatsList = threatDataList.map(threatData => new Threat(
      threatData._id,
      threatData.name,
      threatData.type,
      threatData.description,
      threatData.severity,
      threatData.filePath,
      threatData.isCleaned,
      threatData.detectionDate
    ));
    
    res.render('dashboard/threats', {
      title: 'Tehditler',
      threats: threatsList,
      filter,
      pagination: {
        page,
        totalPages,
        totalItems: totalThreats,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Tehditler sayfası yüklenirken hata:', error);
    res.status(500).render('error', {
      title: 'Hata',
      error: {
        status: 500,
        message: 'Tehditler sayfası yüklenirken bir hata oluştu.'
      }
    });
  }
});

/**
 * Dashboard Ayarlar Sayfası
 * GET /dashboard/settings
 */
router.get('/settings', async (req, res) => {
  try {
    const userId = req.session.user.id;
    
    // Kullanıcı bilgilerini getir
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).render('error', {
        title: 'Hata',
        error: {
          status: 404,
          message: 'Kullanıcı bulunamadı.'
        }
      });
    }
    
    // Veritabanından kullanıcı ayarlarını getir
    const db = require('../config/database').getDb();
    const usersCollection = db.collection('users');
    const userSettings = await usersCollection.findOne(
      { _id: userId },
      { projection: { 
        settings: 1, 
        isPremium: 1, 
        premiumValidUntil: 1 
      }}
    );
    
    // Varsayılan ayarlar
    const settings = userSettings?.settings || {
      autoScan: true,
      scanFrequency: 'weekly',
      notifications: true,
      darkMode: false,
      language: 'tr'
    };
    
    const isPremium = userSettings?.isPremium || false;
    const premiumValidUntil = userSettings?.premiumValidUntil || null;
    
    res.render('dashboard/settings', {
      title: 'Ayarlar',
      user,
      settings,
      isPremium,
      premiumValidUntil
    });
  } catch (error) {
    console.error('Ayarlar sayfası yüklenirken hata:', error);
    res.status(500).render('error', {
      title: 'Hata',
      error: {
        status: 500,
        message: 'Ayarlar sayfası yüklenirken bir hata oluştu.'
      }
    });
  }
});

/**
 * Dashboard Ayarlar Kaydetme
 * POST /dashboard/settings/save
 */
router.post('/settings/save', async (req, res) => {
  try {
    const userId = req.session.user.id;
    const { autoScan, scanFrequency, notifications, darkMode, language } = req.body;
    
    // Ayarları güncelle
    const db = require('../config/database').getDb();
    const usersCollection = db.collection('users');
    
    await usersCollection.updateOne(
      { _id: userId },
      { 
        $set: { 
          settings: {
            autoScan: autoScan === 'on',
            scanFrequency: scanFrequency || 'weekly',
            notifications: notifications === 'on',
            darkMode: darkMode === 'on',
            language: language || 'tr'
          }
        }
      }
    );
    
    req.session.settingsSaved = true;
    
    res.redirect('/dashboard/settings');
  } catch (error) {
    console.error('Ayarlar kaydedilirken hata:', error);
    res.status(500).render('error', {
      title: 'Hata',
      error: {
        status: 500,
        message: 'Ayarlar kaydedilirken bir hata oluştu.'
      }
    });
  }
});

/**
 * Dashboard Yardım Sayfası
 * GET /dashboard/help
 */
router.get('/help', (req, res) => {
  res.render('dashboard/help', {
    title: 'Yardım'
  });
});

/**
 * Yeni Tarama Başlat
 * POST /dashboard/scan/start
 */
router.post('/scan/start', async (req, res) => {
  try {
    const userId = req.session.user.id;
    const { type } = req.body;
    
    // Geçerli tarama tipi kontrolü
    const validTypes = ['QUICK', 'FULL', 'WIFI', 'CUSTOM', 'QR'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Geçersiz tarama tipi.'
      });
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
 * @param {string} userId - Kullanıcı ID'si
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
 * Tehdit Temizleme (API)
 * POST /dashboard/threats/:threatId/clean
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
    
    // Tehdidi temizle
    threat.clean();
    await threat.save();
    
    res.json({
      success: true,
      message: 'Tehdit başarıyla temizlendi.'
    });
  } catch (error) {
    console.error('Tehdit temizlenirken hata:', error);
    res.status(500).json({
      success: false,
      message: 'Tehdit temizlenirken bir hata oluştu.'
    });
  }
});

module.exports = router;