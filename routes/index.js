/**
 * Ana Rotalar
 * Uygulamanın ana sayfaları için router
 */

const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');
const ScanResult = require('../models/scanResult');
const Threat = require('../models/threat');

// Ana Sayfa
router.get('/', (req, res) => {
  res.render('index', { 
    title: 'AntiVirüs Uygulaması',
    activeLink: 'home'
  });
});

// Hakkımızda
router.get('/about', (req, res) => {
  res.render('about', { 
    title: 'Hakkımızda',
    activeLink: 'about'
  });
});

// Kullanıcı Dashboard
router.get('/dashboard', isAuthenticated, async (req, res) => {
  try {
    // Kullanıcıya ait son tarama sonuçlarını getir
    const scanResults = await ScanResult.findByUserId(req.session.user.id, 5);
    
    // Temizlenmemiş tehdit sayısını bul
    let activeThreats = 0;
    scanResults.forEach(scan => {
      activeThreats += scan.threatsFound.filter(threat => !threat.isCleaned).length;
    });
    
    res.render('dashboard', { 
      title: 'Dashboard',
      activeLink: 'dashboard',
      scanResults,
      stats: {
        totalScans: scanResults.length,
        activeThreats,
        lastScanDate: scanResults.length > 0 ? scanResults[0].startTime : null
      }
    });
  } catch (error) {
    console.error('Dashboard hatası:', error);
    res.status(500).render('error', { 
      title: 'Hata',
      message: 'Dashboard yüklenirken bir hata oluştu.'
    });
  }
});

// Tarama Sonuçları
router.get('/scan-results', isAuthenticated, async (req, res) => {
  try {
    // Kullanıcıya ait tüm tarama sonuçlarını getir
    const scanResults = await ScanResult.findByUserId(req.session.user.id);
    
    res.render('scan-results', { 
      title: 'Tarama Sonuçları',
      activeLink: 'scan-results',
      scanResults
    });
  } catch (error) {
    console.error('Tarama sonuçları hatası:', error);
    res.status(500).render('error', { 
      title: 'Hata',
      message: 'Tarama sonuçları yüklenirken bir hata oluştu.'
    });
  }
});

// Tarama Detayı
router.get('/scan/:id', isAuthenticated, async (req, res) => {
  try {
    const scanId = req.params.id;
    // Tarama sonucunu bul
    const scanResult = await ScanResult.findById(scanId);
    
    if (!scanResult) {
      return res.status(404).render('error', { 
        title: 'Bulunamadı',
        message: 'Tarama sonucu bulunamadı.'
      });
    }
    
    // Kullanıcı kendi tarama sonuçlarını görebilmeli (veya admin tüm sonuçları görebilmeli)
    if (scanResult.userId !== req.session.user.id && !req.session.user.isAdmin) {
      return res.status(403).render('error', { 
        title: 'Erişim Engellendi',
        message: 'Bu tarama sonucunu görüntüleme yetkiniz yok.'
      });
    }
    
    res.render('scan-detail', { 
      title: 'Tarama Detayı',
      activeLink: 'scan-results',
      scan: scanResult
    });
  } catch (error) {
    console.error('Tarama detayı hatası:', error);
    res.status(500).render('error', { 
      title: 'Hata',
      message: 'Tarama detayı yüklenirken bir hata oluştu.'
    });
  }
});

// Yeni Tarama Başlat (POST)
router.post('/scan/start', isAuthenticated, async (req, res) => {
  try {
    const scanType = req.body.scanType || 'QUICK';
    
    // Simülasyon amaçlı rastgele tarama oluştur
    const newScan = ScanResult.createSimulatedScan(scanType, req.session.user.id);
    
    // Veritabanına kaydet
    await newScan.save();
    
    // Taramayı JSON olarak dön (AJAX isteği için)
    res.json({
      success: true,
      message: 'Tarama başlatıldı',
      scanId: newScan.id
    });
  } catch (error) {
    console.error('Tarama başlatma hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Tarama başlatılırken bir hata oluştu.'
    });
  }
});

// Tehdit Temizle (POST)
router.post('/threat/clean/:id', isAuthenticated, async (req, res) => {
  try {
    const threatId = req.params.id;
    
    // Tehdidi bul
    const threat = await Threat.findById(threatId);
    
    if (!threat) {
      return res.status(404).json({
        success: false,
        message: 'Tehdit bulunamadı.'
      });
    }
    
    // Tehdidi temizle
    threat.clean();
    
    // Güncellenmiş tehdidi kaydet
    await threat.save();
    
    res.json({
      success: true,
      message: 'Tehdit başarıyla temizlendi.'
    });
  } catch (error) {
    console.error('Tehdit temizleme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Tehdit temizlenirken bir hata oluştu.'
    });
  }
});

// API - Tarama Durumu
router.get('/api/scan-status/:id', isAuthenticated, async (req, res) => {
  try {
    const scanId = req.params.id;
    
    // Tarama sonucunu bul
    const scanResult = await ScanResult.findById(scanId);
    
    if (!scanResult) {
      return res.status(404).json({
        success: false,
        message: 'Tarama bulunamadı.'
      });
    }
    
    // Kullanıcı kontrolü
    if (scanResult.userId !== req.session.user.id && !req.session.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Bu taramaya erişim izniniz yok.'
      });
    }
    
    // Demo amaçlı, taramayı ilerlet/tamamla
    if (!scanResult.endTime && Math.random() > 0.7) {
      const totalScanned = scanResult.totalScanned + Math.floor(Math.random() * 100);
      const newThreats = Math.random() > 0.7 ? Threat.getRandomThreats(Math.floor(Math.random() * 3)) : [];
      
      scanResult.totalScanned = totalScanned;
      scanResult.threatsFound = [...scanResult.threatsFound, ...newThreats];
      
      if (totalScanned > 500 || Math.random() > 0.8) {
        scanResult.complete(totalScanned, scanResult.threatsFound);
      }
      
      await scanResult.save();
    }
    
    res.json({
      success: true,
      scan: {
        id: scanResult.id,
        type: scanResult.type,
        status: scanResult.getStatus(),
        totalScanned: scanResult.totalScanned,
        threatCount: scanResult.threatsFound.length,
        progress: scanResult.endTime ? 100 : Math.min(Math.floor((scanResult.totalScanned / 600) * 100), 99),
        duration: Math.floor(scanResult.getDuration() / 1000) // saniye cinsinden
      }
    });
  } catch (error) {
    console.error('Tarama durumu hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Tarama durumu alınırken bir hata oluştu.'
    });
  }
});

module.exports = router;