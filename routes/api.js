/**
 * API Rotaları
 * Mobil uygulama için API endpointleri
 */

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/user');
const Threat = require('../models/threat');
const ScanResult = require('../models/scanResult');

// API anahtarı doğrulama middleware
const apiKeyAuth = (req, res, next) => {
  const apiKey = req.headers['x-api-key'] || req.query.api_key;
  
  if (!apiKey || apiKey !== process.env.API_KEY) {
    return res.status(401).json({
      success: false,
      error: 'Geçersiz API anahtarı'
    });
  }
  
  next();
};

/**
 * API Durum Kontrolü
 * GET /api/status
 */
router.get('/status', (req, res) => {
  res.json({
    success: true,
    status: 'API çalışıyor',
    timestamp: new Date()
  });
});

/**
 * Kullanıcı Bilgisi Getir
 * GET /api/users/:userId
 */
router.get('/users/:userId', apiKeyAuth, async (req, res) => {
  try {
    const userId = req.params.userId;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Kullanıcı bulunamadı'
      });
    }
    
    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('API kullanıcı getirme hatası:', error);
    res.status(500).json({
      success: false,
      error: 'Sunucu hatası'
    });
  }
});

/**
 * Tarama Durumu Getir
 * GET /api/scans/:scanId/status
 */
router.get('/scans/:scanId/status', apiKeyAuth, async (req, res) => {
  try {
    const scanId = req.params.scanId;
    const scan = await ScanResult.findById(scanId);
    
    if (!scan) {
      return res.status(404).json({
        success: false,
        error: 'Tarama bulunamadı'
      });
    }
    
    // Simülasyon: Devam eden taramalar için ilerleyiş hesapla
    let progress = 100;
    if (!scan.endTime) {
      const totalDuration = 30 * 1000; // 30 saniye tarama süresi
      const elapsed = new Date() - scan.startTime;
      progress = Math.min(Math.floor((elapsed / totalDuration) * 100), 99);
      
      // Simüle edilmiş tamamlanma
      if (progress >= 99) {
        // Rastgele tehditler oluştur
        const threatCount = Math.floor(Math.random() * 3);
        const threatsFound = Threat.getRandomThreats(threatCount);
        
        // Taramayı tamamla
        scan.complete(Math.floor(Math.random() * 500) + 100, threatsFound);
        await scan.save();
        
        progress = 100;
      }
    }
    
    res.json({
      success: true,
      status: scan.getStatus(),
      progress: progress,
      totalScanned: scan.totalScanned,
      threatsCount: scan.threatsFound.length,
      startTime: scan.startTime,
      endTime: scan.endTime,
      duration: scan.getDuration()
    });
  } catch (error) {
    console.error('API tarama durumu hatası:', error);
    res.status(500).json({
      success: false,
      error: 'Sunucu hatası'
    });
  }
});

/**
 * Tehdit Temizle
 * POST /api/threats/:threatId/clean
 */
router.post('/threats/:threatId/clean', apiKeyAuth, async (req, res) => {
  try {
    const threatId = req.params.threatId;
    const threat = await Threat.findById(threatId);
    
    if (!threat) {
      return res.status(404).json({
        success: false,
        error: 'Tehdit bulunamadı'
      });
    }
    
    // Tehdit zaten temizlendi mi?
    if (threat.isCleaned) {
      return res.json({
        success: true,
        message: 'Tehdit zaten temizlenmiş',
        threat: threat.toJSON()
      });
    }
    
    // Tehdidi temizle
    threat.clean();
    await threat.save();
    
    res.json({
      success: true,
      message: 'Tehdit başarıyla temizlendi',
      threat: threat.toJSON()
    });
  } catch (error) {
    console.error('API tehdit temizleme hatası:', error);
    res.status(500).json({
      success: false,
      error: 'Sunucu hatası'
    });
  }
});

/**
 * Kullanıcı Taramaları Getir
 * GET /api/users/:userId/scans
 */
router.get('/users/:userId/scans', apiKeyAuth, async (req, res) => {
  try {
    const userId = req.params.userId;
    const limit = parseInt(req.query.limit) || 10;
    
    const scanHistory = await ScanResult.findByUserId(userId, limit);
    
    res.json({
      success: true,
      scans: scanHistory.map(scan => ({
        id: scan.id,
        type: scan.type,
        startTime: scan.startTime,
        endTime: scan.endTime,
        totalScanned: scan.totalScanned,
        threatsCount: scan.threatsFound.length,
        status: scan.getStatus(),
        duration: scan.getDuration()
      }))
    });
  } catch (error) {
    console.error('API kullanıcı taramaları hatası:', error);
    res.status(500).json({
      success: false,
      error: 'Sunucu hatası'
    });
  }
});

/**
 * Kullanıcı İstatistikleri Getir
 * GET /api/users/:userId/stats
 */
router.get('/users/:userId/stats', apiKeyAuth, async (req, res) => {
  try {
    const userId = req.params.userId;
    
    // Kullanıcıyı kontrol et
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Kullanıcı bulunamadı'
      });
    }
    
    // İstatistikleri hazırla
    const totalScans = await ScanResult.count({ userId });
    const scanHistory = await ScanResult.findByUserId(userId, 1);
    
    // Kullanıcıya ait tüm taramaları al
    const allScans = await ScanResult.findByUserId(userId, 100);
    
    // Tehdit istatistikleri
    let totalThreats = 0;
    let cleanedThreats = 0;
    
    allScans.forEach(scan => {
      scan.threatsFound.forEach(threat => {
        totalThreats++;
        if (threat.isCleaned) {
          cleanedThreats++;
        }
      });
    });
    
    res.json({
      success: true,
      stats: {
        totalScans,
        lastScanDate: scanHistory.length > 0 ? scanHistory[0].endTime : null,
        totalThreats,
        cleanedThreats,
        activeThreats: totalThreats - cleanedThreats,
        memberSince: user.createdAt
      }
    });
  } catch (error) {
    console.error('API kullanıcı istatistikleri hatası:', error);
    res.status(500).json({
      success: false,
      error: 'Sunucu hatası'
    });
  }
});

/**
 * Tüm Aktif Tehditleri Getir
 * GET /api/threats
 */
router.get('/threats', apiKeyAuth, async (req, res) => {
  try {
    const filter = req.query.all === 'true' ? {} : { isCleaned: false };
    const threats = await Threat.findAll(filter);
    
    res.json({
      success: true,
      threats: threats.map(threat => threat.toJSON())
    });
  } catch (error) {
    console.error('API tehdit listesi hatası:', error);
    res.status(500).json({
      success: false,
      error: 'Sunucu hatası'
    });
  }
});

module.exports = router;