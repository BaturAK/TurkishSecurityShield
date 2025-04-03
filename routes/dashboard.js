/**
 * Dashboard Rotaları
 * Kullanıcı dashboard için router
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

// Tüm dashboard sayfaları için kimlik doğrulama gerekli
router.use(authMiddleware.isAuthenticated);

/**
 * Dashboard Ana Sayfa
 * GET /dashboard
 */
router.get('/', async (req, res) => {
  try {
    const userId = req.session.user.id;
    
    // Kullanıcının son taramalarını getir
    const recentScans = await ScanResult.findByUserId(userId, 5);
    
    // Temizlenmemiş tehditleri getir
    const threats = await Threat.findAll({ isCleaned: false });
    
    // İstatistikleri getir
    const totalScans = await ScanResult.count({ userId });
    const totalThreats = threats.length;
    const cleanedThreats = await Threat.count({ isCleaned: true });
    
    res.render('dashboard/index', {
      title: 'Dashboard',
      recentScans,
      threats,
      stats: {
        totalScans,
        totalThreats,
        cleanedThreats
      }
    });
  } catch (error) {
    console.error('Dashboard sayfası yüklenirken hata:', error);
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
    
    // Kullanıcının tüm taramalarını getir (son 20)
    const scans = await ScanResult.findByUserId(userId, 20);
    
    res.render('dashboard/scans', {
      title: 'Taramalar',
      scans
    });
  } catch (error) {
    console.error('Taramalar sayfası yüklenirken hata:', error);
    res.status(500).render('error', {
      title: 'Hata',
      error: {
        status: 500,
        message: 'Tarama geçmişi yüklenirken bir hata oluştu.'
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
    // Tüm tehditleri getir
    const threats = await Threat.findAll();
    
    res.render('dashboard/threats', {
      title: 'Tehditler',
      threats
    });
  } catch (error) {
    console.error('Tehditler sayfası yüklenirken hata:', error);
    res.status(500).render('error', {
      title: 'Hata',
      error: {
        status: 500,
        message: 'Tehditler yüklenirken bir hata oluştu.'
      }
    });
  }
});

/**
 * Dashboard Ayarlar Sayfası
 * GET /dashboard/settings
 */
router.get('/settings', (req, res) => {
  res.render('dashboard/settings', {
    title: 'Ayarlar',
    user: req.session.user,
    success: req.query.success,
    error: req.query.error
  });
});

/**
 * Dashboard Ayarlar Kaydetme
 * POST /dashboard/settings/save
 */
router.post('/settings/save', async (req, res) => {
  try {
    const userId = req.session.user.id;
    const { displayName, email, notificationsEnabled, autoScan } = req.body;
    
    // Kullanıcıyı getir
    const user = await User.findById(userId);
    
    if (!user) {
      return res.redirect('/dashboard/settings?error=Kullanıcı bulunamadı');
    }
    
    // Kullanıcı bilgilerini güncelle
    user.displayName = displayName || user.displayName;
    
    // E-posta değiştiyse, daha önce kullanılıyor mu kontrol et
    if (email && email !== user.email) {
      const existingUser = await User.findByEmail(email);
      if (existingUser && existingUser.id !== userId) {
        return res.redirect('/dashboard/settings?error=Bu e-posta adresi zaten kullanılıyor');
      }
      user.email = email;
    }
    
    // Kullanıcıyı kaydet
    await user.save();
    
    // Oturum bilgilerini güncelle
    req.session.user = user.toJSON();
    
    res.redirect('/dashboard/settings?success=Ayarlar başarıyla kaydedildi');
  } catch (error) {
    console.error('Ayarlar kaydedilirken hata:', error);
    res.redirect('/dashboard/settings?error=Ayarlar kaydedilirken bir hata oluştu');
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
 * Tehdit Temizleme (API)
 * POST /dashboard/threats/:threatId/clean
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

module.exports = router;