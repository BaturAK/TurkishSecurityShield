/**
 * Admin Rotaları
 * Admin paneli için router
 */

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/user');
const Threat = require('../models/threat');
const ScanResult = require('../models/scanResult');

// Admin paneli ana sayfa
router.get('/', auth.isAuthenticated, auth.isAdmin, async (req, res) => {
  try {
    // İstatistikleri al
    const userCount = await User.count();
    const threatCount = await Threat.count();
    const scanCount = await ScanResult.count();
    const cleanedThreats = await Threat.count({ isCleaned: true });
    
    // Son kullanıcıları getir
    const recentUsers = await User.findRecent(5);
    
    // Son taramaları getir
    const recentScans = await ScanResult.findRecent(5);
    
    res.render('admin/dashboard', {
      title: 'Admin Paneli',
      stats: {
        userCount,
        threatCount,
        scanCount,
        cleanedThreats,
        activeThreats: threatCount - cleanedThreats
      },
      recentUsers,
      recentScans
    });
  } catch (error) {
    console.error('Admin panel hatası:', error);
    req.session.flashMessages = {
      error: 'Admin paneli yüklenirken bir hata oluştu.'
    };
    res.redirect('/');
  }
});

// Kullanıcı Yönetimi
router.get('/users', auth.isAuthenticated, auth.isAdmin, async (req, res) => {
  try {
    const users = await User.findAll();
    
    res.render('admin/users', {
      title: 'Kullanıcı Yönetimi',
      users
    });
  } catch (error) {
    console.error('Kullanıcı yönetimi hatası:', error);
    req.session.flashMessages = {
      error: 'Kullanıcı listesi yüklenirken bir hata oluştu.'
    };
    res.redirect('/admin');
  }
});

// Tek Kullanıcı Detayı
router.get('/users/:userId', auth.isAuthenticated, auth.isAdmin, async (req, res) => {
  try {
    const userId = req.params.userId;
    const user = await User.findById(userId);
    
    if (!user) {
      req.session.flashMessages = {
        error: 'Kullanıcı bulunamadı.'
      };
      return res.redirect('/admin/users');
    }
    
    // Kullanıcı taramalarını al
    const scanHistory = await ScanResult.findByUserId(userId, 10);
    
    res.render('admin/user-detail', {
      title: 'Kullanıcı Detayı',
      user,
      scanHistory
    });
  } catch (error) {
    console.error('Kullanıcı detay hatası:', error);
    req.session.flashMessages = {
      error: 'Kullanıcı bilgileri yüklenirken bir hata oluştu.'
    };
    res.redirect('/admin/users');
  }
});

// Kullanıcı Admin Yetkisi Ver
router.post('/users/:userId/make-admin', auth.isAuthenticated, auth.isAdmin, async (req, res) => {
  try {
    const userId = req.params.userId;
    const user = await User.findById(userId);
    
    if (!user) {
      req.session.flashMessages = {
        error: 'Kullanıcı bulunamadı.'
      };
      return res.redirect('/admin/users');
    }
    
    // Admin yetkisini güncelle
    user.isAdmin = true;
    await user.save();
    
    req.session.flashMessages = {
      success: `${user.displayName || user.email} kullanıcısına admin yetkisi verildi.`
    };
    
    res.redirect(`/admin/users/${userId}`);
  } catch (error) {
    console.error('Admin yetkisi verme hatası:', error);
    req.session.flashMessages = {
      error: 'Admin yetkisi verilirken bir hata oluştu.'
    };
    res.redirect('/admin/users');
  }
});

// Tehdit Yönetimi
router.get('/threats', auth.isAuthenticated, auth.isAdmin, async (req, res) => {
  try {
    const threats = await Threat.findAll();
    
    res.render('admin/threats', {
      title: 'Tehdit Yönetimi',
      threats
    });
  } catch (error) {
    console.error('Tehdit yönetimi hatası:', error);
    req.session.flashMessages = {
      error: 'Tehdit listesi yüklenirken bir hata oluştu.'
    };
    res.redirect('/admin');
  }
});

// Tehdit Temizle
router.post('/threats/:threatId/clean', auth.isAuthenticated, auth.isAdmin, async (req, res) => {
  try {
    const threatId = req.params.threatId;
    const threat = await Threat.findById(threatId);
    
    if (!threat) {
      req.session.flashMessages = {
        error: 'Tehdit bulunamadı.'
      };
      return res.redirect('/admin/threats');
    }
    
    // Tehdidi temizle
    threat.clean();
    await threat.save();
    
    req.session.flashMessages = {
      success: `"${threat.name}" tehdidi başarıyla temizlendi.`
    };
    
    res.redirect('/admin/threats');
  } catch (error) {
    console.error('Tehdit temizleme hatası:', error);
    req.session.flashMessages = {
      error: 'Tehdit temizlenirken bir hata oluştu.'
    };
    res.redirect('/admin/threats');
  }
});

// Tarama Yönetimi
router.get('/scans', auth.isAuthenticated, auth.isAdmin, async (req, res) => {
  try {
    const scans = await ScanResult.findRecent(50);
    
    res.render('admin/scans', {
      title: 'Tarama Yönetimi',
      scans
    });
  } catch (error) {
    console.error('Tarama yönetimi hatası:', error);
    req.session.flashMessages = {
      error: 'Tarama listesi yüklenirken bir hata oluştu.'
    };
    res.redirect('/admin');
  }
});

// Sistem İstatistikleri
router.get('/stats', auth.isAuthenticated, auth.isAdmin, async (req, res) => {
  try {
    // İstatistikleri hesapla
    const userCount = await User.count();
    const usersByDay = []; // Bu veri gerçek uygulamada veritabanından çekilir
    
    // Test için rastgele veriler oluştur
    for (let i = 30; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      usersByDay.push({
        date: date.toISOString().split('T')[0],
        count: Math.floor(Math.random() * 50) + 1
      });
    }
    
    // Tarama istatistikleri
    const scanStats = {
      total: await ScanResult.count(),
      byType: {
        QUICK: await ScanResult.count({ type: 'QUICK' }),
        FULL: await ScanResult.count({ type: 'FULL' }),
        WIFI: await ScanResult.count({ type: 'WIFI' }),
        QR: await ScanResult.count({ type: 'QR' })
      }
    };
    
    // Tehdit istatistikleri
    const threatStats = {
      total: await Threat.count(),
      cleaned: await Threat.count({ isCleaned: true }),
      active: await Threat.count({ isCleaned: false }),
      byType: {
        Trojan: await Threat.count({ type: 'Trojan' }),
        Virus: await Threat.count({ type: 'Virus' }),
        Spyware: await Threat.count({ type: 'Spyware' }),
        Adware: await Threat.count({ type: 'Adware' }),
        Ransomware: await Threat.count({ type: 'Ransomware' }),
        Worm: await Threat.count({ type: 'Worm' }),
        Rootkit: await Threat.count({ type: 'Rootkit' })
      }
    };
    
    res.render('admin/stats', {
      title: 'Sistem İstatistikleri',
      userCount,
      usersByDay,
      scanStats,
      threatStats
    });
  } catch (error) {
    console.error('İstatistik hatası:', error);
    req.session.flashMessages = {
      error: 'İstatistikler yüklenirken bir hata oluştu.'
    };
    res.redirect('/admin');
  }
});

// Test Tehdit Oluştur
router.post('/create-test-threat', auth.isAuthenticated, auth.isAdmin, async (req, res) => {
  try {
    // Rastgele tehdit oluştur
    const threat = Threat.getRandomThreats(1)[0];
    await threat.save();
    
    req.session.flashMessages = {
      success: `Test tehdidi oluşturuldu: ${threat.name}`
    };
    
    res.redirect('/admin/threats');
  } catch (error) {
    console.error('Test tehdit oluşturma hatası:', error);
    req.session.flashMessages = {
      error: 'Test tehdit oluşturulurken bir hata oluştu.'
    };
    res.redirect('/admin');
  }
});

// Test Tarama Oluştur
router.post('/create-test-scan', auth.isAuthenticated, auth.isAdmin, async (req, res) => {
  try {
    const { userId, type } = req.body;
    
    // Simüle edilmiş tarama oluştur
    const scan = ScanResult.createSimulatedScan(type || 'QUICK', userId);
    await scan.save();
    
    req.session.flashMessages = {
      success: `Test taraması oluşturuldu: ${scan.id}`
    };
    
    res.redirect('/admin/scans');
  } catch (error) {
    console.error('Test tarama oluşturma hatası:', error);
    req.session.flashMessages = {
      error: 'Test tarama oluşturulurken bir hata oluştu.'
    };
    res.redirect('/admin');
  }
});

module.exports = router;