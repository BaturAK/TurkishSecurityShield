/**
 * API Rotaları
 * Mobil uygulama için API endpointleri
 */

const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');

// Models
const User = require('../models/user');
const Threat = require('../models/threat');
const ScanResult = require('../models/scanResult');

// Middleware
const authMiddleware = require('../middleware/auth');

/**
 * API Durum Kontrolü
 * GET /api/status
 */
router.get('/status', (req, res) => {
  res.json({
    status: 'success',
    message: 'API çalışıyor',
    timestamp: new Date(),
    version: '1.0.0'
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
        status: 'error',
        message: 'E-posta ve şifre gereklidir'
      });
    }
    
    // Kullanıcıyı getir
    const user = await User.findByEmail(email);
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'Kullanıcı bulunamadı'
      });
    }
    
    // Demo amaçlı basit şifre kontrolü
    // NOT: Gerçek bir uygulamada şifreler plain text olarak saklanmaz!
    if (password === 'password') {
      // Başarılı giriş
      // API token oluştur
      const token = uuidv4();
      
      // Token'ı veritabanına kaydet
      // Bu bir demo, gerçek bir uygulamada token doğru şekilde saklanmalı
      const db = require('../config/database').getDb();
      await db.collection('api_tokens').insertOne({
        token,
        userId: user.id,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 1 hafta
      });
      
      res.json({
        status: 'success',
        message: 'Giriş başarılı',
        data: {
          token,
          user: {
            id: user.id,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL
          }
        }
      });
    } else {
      // Başarısız giriş
      res.status(401).json({
        status: 'error',
        message: 'Geçersiz şifre'
      });
    }
  } catch (error) {
    console.error('API giriş hatası:', error);
    res.status(500).json({
      status: 'error',
      message: 'Giriş yapılırken bir hata oluştu'
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
    
    if (!type) {
      return res.status(400).json({
        status: 'error',
        message: 'Tarama tipi gereklidir'
      });
    }
    
    // Kullanıcı belirtilmişse, var mı kontrol et
    if (userId) {
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          status: 'error',
          message: 'Kullanıcı bulunamadı'
        });
      }
    }
    
    // Tarama oluştur
    const scanResult = new ScanResult(
      uuidv4(),
      type.toUpperCase(),
      new Date(),
      null,
      0,
      [],
      userId
    );
    
    // Taramayı kaydet
    await scanResult.save();
    
    res.json({
      status: 'success',
      message: 'Tarama başarıyla başlatıldı',
      data: {
        scanId: scanResult.id,
        type: scanResult.type,
        startTime: scanResult.startTime
      }
    });
    
    // Asenkron olarak tarama simülasyonu başlat
    simulateScan(scanResult.id, scanResult.type, userId);
  } catch (error) {
    console.error('Tarama başlatılırken hata:', error);
    res.status(500).json({
      status: 'error',
      message: 'Tarama başlatılırken bir hata oluştu'
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
    // Taramayı getir
    const scanResult = await ScanResult.findById(scanId);
    
    if (!scanResult) {
      console.error('Tarama bulunamadı:', scanId);
      return;
    }
    
    // Tarama süresini belirle
    const scanDuration = type === 'QUICK' 
      ? Math.floor(Math.random() * 5000) + 3000  // Hızlı tarama: 3-8 saniye
      : type === 'FULL' 
        ? Math.floor(Math.random() * 10000) + 8000  // Tam tarama: 8-18 saniye
        : Math.floor(Math.random() * 5000) + 5000;  // Diğer taramalar: 5-10 saniye
    
    // Taramayı tamamla
    setTimeout(async () => {
      // Taranan öğe sayısını belirle
      const totalScanned = type === 'QUICK' 
        ? Math.floor(Math.random() * 100) + 50
        : type === 'FULL' 
          ? Math.floor(Math.random() * 1000) + 500
          : Math.floor(Math.random() * 300) + 100;
      
      // Rastgele tehdit sayısı
      const threatCount = type === 'QUICK' 
        ? Math.floor(Math.random() * 3)
        : type === 'FULL' 
          ? Math.floor(Math.random() * 5) + 1
          : Math.floor(Math.random() * 2);
      
      // Rastgele tehditler oluştur
      const threats = Threat.getRandomThreats(threatCount);
      
      // Tehditleri veritabanına kaydet
      for (const threat of threats) {
        await threat.save();
      }
      
      // Taramayı tamamla
      scanResult.complete(totalScanned, threats);
      await scanResult.save();
      
      console.log(`Tarama tamamlandı: ${scanId}, tehdit sayısı: ${threats.length}`);
    }, scanDuration);
    
  } catch (error) {
    console.error('Tarama simülasyonu sırasında hata:', error);
  }
}

/**
 * Tarama Durumu Getir
 * GET /api/scans/:scanId/status
 */
router.get('/scans/:scanId/status', async (req, res) => {
  try {
    const scanId = req.params.scanId;
    
    // Taramayı getir
    const scanResult = await ScanResult.findById(scanId);
    
    if (!scanResult) {
      return res.status(404).json({
        status: 'error',
        message: 'Tarama bulunamadı'
      });
    }
    
    // Tarama durumunu hesapla
    const status = scanResult.getStatus();
    
    // Tarama ilerleme yüzdesi
    const progress = status === 'COMPLETED' 
      ? 100 
      : status === 'RUNNING' 
        ? Math.min(95, Math.floor(((Date.now() - scanResult.startTime) / 10000) * 100))
        : 0;
    
    // Durum metni
    const statusText = status === 'COMPLETED' 
      ? 'Tarama tamamlandı' 
      : status === 'RUNNING' 
        ? 'Taranıyor...' 
        : 'Tarama başarısız';
    
    res.json({
      status: 'success',
      data: {
        scanId: scanResult.id,
        type: scanResult.type,
        status,
        progress,
        statusText,
        startTime: scanResult.startTime,
        endTime: scanResult.endTime,
        totalScanned: scanResult.totalScanned,
        threatCount: scanResult.threatsFound.length
      }
    });
  } catch (error) {
    console.error('Tarama durumu alınırken hata:', error);
    res.status(500).json({
      status: 'error',
      message: 'Tarama durumu alınırken bir hata oluştu'
    });
  }
});

/**
 * Tarama Sonucu Getir
 * GET /api/scans/:scanId
 */
router.get('/scans/:scanId', async (req, res) => {
  try {
    const scanId = req.params.scanId;
    
    // Taramayı getir
    const scanResult = await ScanResult.findById(scanId);
    
    if (!scanResult) {
      return res.status(404).json({
        status: 'error',
        message: 'Tarama bulunamadı'
      });
    }
    
    res.json({
      status: 'success',
      data: scanResult
    });
  } catch (error) {
    console.error('Tarama sonucu alınırken hata:', error);
    res.status(500).json({
      status: 'error',
      message: 'Tarama sonucu alınırken bir hata oluştu'
    });
  }
});

/**
 * Kullanıcı Bilgisi Getir
 * GET /api/users/:userId
 */
router.get('/users/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    
    // Kullanıcıyı getir
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'Kullanıcı bulunamadı'
      });
    }
    
    // Hassas bilgileri filtreleme
    res.json({
      status: 'success',
      data: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
      }
    });
  } catch (error) {
    console.error('Kullanıcı bilgisi alınırken hata:', error);
    res.status(500).json({
      status: 'error',
      message: 'Kullanıcı bilgisi alınırken bir hata oluştu'
    });
  }
});

/**
 * Tehdit Temizle
 * POST /api/threats/:threatId/clean
 */
router.post('/threats/:threatId/clean', async (req, res) => {
  try {
    const threatId = req.params.threatId;
    
    // Tehdidi getir
    const threat = await Threat.findById(threatId);
    
    if (!threat) {
      return res.status(404).json({
        status: 'error',
        message: 'Tehdit bulunamadı'
      });
    }
    
    // Tehdit zaten temizlendi mi kontrol et
    if (threat.isCleaned) {
      return res.json({
        status: 'success',
        message: 'Tehdit zaten temizlendi',
        data: threat
      });
    }
    
    // Tehdidi temizle
    threat.clean();
    
    // Tehdidi kaydet
    await threat.save();
    
    res.json({
      status: 'success',
      message: 'Tehdit başarıyla temizlendi',
      data: threat
    });
  } catch (error) {
    console.error('Tehdit temizlenirken hata:', error);
    res.status(500).json({
      status: 'error',
      message: 'Tehdit temizlenirken bir hata oluştu'
    });
  }
});

/**
 * Kullanıcı Taramaları Getir
 * GET /api/users/:userId/scans
 */
router.get('/users/:userId/scans', async (req, res) => {
  try {
    const userId = req.params.userId;
    const limit = parseInt(req.query.limit) || 10;
    
    // Kullanıcı var mı kontrol et
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'Kullanıcı bulunamadı'
      });
    }
    
    // Kullanıcının taramalarını getir
    const scans = await ScanResult.findByUserId(userId, limit);
    
    res.json({
      status: 'success',
      data: scans
    });
  } catch (error) {
    console.error('Kullanıcı taramaları alınırken hata:', error);
    res.status(500).json({
      status: 'error',
      message: 'Kullanıcı taramaları alınırken bir hata oluştu'
    });
  }
});

/**
 * Kullanıcı İstatistikleri Getir
 * GET /api/users/:userId/stats
 */
router.get('/users/:userId/stats', async (req, res) => {
  try {
    const userId = req.params.userId;
    
    // Kullanıcı var mı kontrol et
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'Kullanıcı bulunamadı'
      });
    }
    
    // Kullanıcının istatistiklerini getir
    const totalScans = await ScanResult.count({ userId });
    const scans = await ScanResult.findByUserId(userId, 100);
    
    // Tehditleri topla
    let totalThreats = 0;
    let cleanedThreats = 0;
    
    scans.forEach(scan => {
      if (scan.threatsFound && Array.isArray(scan.threatsFound)) {
        totalThreats += scan.threatsFound.length;
        scan.threatsFound.forEach(threat => {
          if (threat.isCleaned) {
            cleanedThreats++;
          }
        });
      }
    });
    
    // Son tarama zamanı
    const lastScan = scans.length > 0 ? scans[0].startTime : null;
    
    res.json({
      status: 'success',
      data: {
        totalScans,
        totalThreats,
        cleanedThreats,
        activeThreats: totalThreats - cleanedThreats,
        lastScan
      }
    });
  } catch (error) {
    console.error('Kullanıcı istatistikleri alınırken hata:', error);
    res.status(500).json({
      status: 'error',
      message: 'Kullanıcı istatistikleri alınırken bir hata oluştu'
    });
  }
});

/**
 * Tüm Aktif Tehditleri Getir
 * GET /api/threats
 */
router.get('/threats', async (req, res) => {
  try {
    const onlyActive = req.query.active === 'true';
    
    // Tehditleri getir
    const threats = await Threat.findAll(onlyActive ? { isCleaned: false } : {});
    
    res.json({
      status: 'success',
      data: threats
    });
  } catch (error) {
    console.error('Tehditler alınırken hata:', error);
    res.status(500).json({
      status: 'error',
      message: 'Tehditler alınırken bir hata oluştu'
    });
  }
});

module.exports = router;