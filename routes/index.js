/**
 * Ana Rotalar
 * Uygulamanın ana sayfaları için router
 */

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/user');
const Threat = require('../models/threat');
const ScanResult = require('../models/scanResult');

/**
 * Ana Sayfa
 */
router.get('/', (req, res) => {
  res.render('index', {
    title: 'Android AntiVirüs Koruma'
  });
});

/**
 * Hakkımızda Sayfası
 */
router.get('/about', (req, res) => {
  res.render('about', {
    title: 'Hakkımızda'
  });
});

/**
 * Özellikler Sayfası
 */
router.get('/features', (req, res) => {
  res.render('features', {
    title: 'Özellikler'
  });
});

/**
 * İletişim Sayfası
 */
router.get('/contact', (req, res) => {
  res.render('contact', {
    title: 'İletişim'
  });
});

/**
 * Gizlilik Politikası Sayfası
 */
router.get('/privacy', (req, res) => {
  res.render('privacy', {
    title: 'Gizlilik Politikası'
  });
});

/**
 * Kullanım Şartları Sayfası
 */
router.get('/terms', (req, res) => {
  res.render('terms', {
    title: 'Kullanım Şartları'
  });
});

/**
 * SSS Sayfası
 */
router.get('/faq', (req, res) => {
  res.render('faq', {
    title: 'Sıkça Sorulan Sorular'
  });
});

/**
 * Dökümanlar Sayfası
 */
router.get('/docs', (req, res) => {
  res.render('docs', {
    title: 'Dökümanlar'
  });
});

/**
 * Profil Sayfası (Giriş yapılmış olmalı)
 */
router.get('/profile', auth.isAuthenticated, (req, res) => {
  res.render('profile', {
    title: 'Profil',
    user: req.session.user
  });
});

/**
 * Kullanıcı Kontrol Paneli (Giriş yapılmış olmalı)
 */
router.get('/dashboard', auth.isAuthenticated, async (req, res) => {
  try {
    // Kullanıcı tarama geçmişini al
    const userId = req.session.user.id;
    const scanHistory = await ScanResult.findByUserId(userId, 5);
    
    // Tehditleri sorgula
    const activeThreats = await Threat.findAll({ isCleaned: false });
    const cleanedThreats = await Threat.count({ isCleaned: true });
    
    // İstatistikleri hazırla
    const stats = {
      totalScans: await ScanResult.count({ userId }),
      activeThreats: activeThreats.length,
      cleanedThreats,
      lastScanDate: scanHistory.length > 0 ? scanHistory[0].endTime : null
    };
    
    res.render('dashboard', {
      title: 'Kontrol Paneli',
      scanHistory,
      activeThreats,
      stats
    });
  } catch (error) {
    console.error('Dashboard hatası:', error);
    req.session.flashMessages = {
      error: 'Kontrol paneli bilgileri yüklenirken bir hata oluştu.'
    };
    res.redirect('/');
  }
});

/**
 * Tarama Başlat Sayfası (Giriş yapılmış olmalı)
 */
router.get('/scan', auth.isAuthenticated, (req, res) => {
  res.render('scan', {
    title: 'Tarama Başlat'
  });
});

/**
 * Tarama İşlemi Başlat (Giriş yapılmış olmalı)
 */
router.post('/scan', auth.isAuthenticated, async (req, res) => {
  try {
    const { type } = req.body;
    const userId = req.session.user.id;
    
    // Yeni tarama oluştur
    const scan = new ScanResult(
      null,
      type,
      new Date(),
      null,
      0,
      [],
      userId
    );
    
    // Veritabanına kaydet
    await scan.save();
    
    // Tarama sayfasına yönlendir
    res.redirect(`/scan/${scan.id}/progress`);
  } catch (error) {
    console.error('Tarama başlatma hatası:', error);
    req.session.flashMessages = {
      error: 'Tarama başlatılırken bir hata oluştu.'
    };
    res.redirect('/scan');
  }
});

/**
 * Tarama İlerleme Sayfası (Giriş yapılmış olmalı)
 */
router.get('/scan/:id/progress', auth.isAuthenticated, async (req, res) => {
  try {
    const scanId = req.params.id;
    const scan = await ScanResult.findById(scanId);
    
    if (!scan) {
      req.session.flashMessages = {
        error: 'Tarama bulunamadı.'
      };
      return res.redirect('/dashboard');
    }
    
    // Kullanıcı kontrolü
    if (scan.userId !== req.session.user.id) {
      req.session.flashMessages = {
        error: 'Bu taramaya erişim yetkiniz yok.'
      };
      return res.redirect('/dashboard');
    }
    
    res.render('scan-progress', {
      title: 'Tarama İlerlemesi',
      scan
    });
  } catch (error) {
    console.error('Tarama ilerleme sayfası hatası:', error);
    req.session.flashMessages = {
      error: 'Tarama bilgileri yüklenirken bir hata oluştu.'
    };
    res.redirect('/dashboard');
  }
});

/**
 * Tarama Sonuçları Sayfası (Giriş yapılmış olmalı)
 */
router.get('/scan/:id/results', auth.isAuthenticated, async (req, res) => {
  try {
    const scanId = req.params.id;
    const scan = await ScanResult.findById(scanId);
    
    if (!scan) {
      req.session.flashMessages = {
        error: 'Tarama bulunamadı.'
      };
      return res.redirect('/dashboard');
    }
    
    // Kullanıcı kontrolü
    if (scan.userId !== req.session.user.id) {
      req.session.flashMessages = {
        error: 'Bu taramaya erişim yetkiniz yok.'
      };
      return res.redirect('/dashboard');
    }
    
    // Tarama devam ediyor mu kontrolü
    if (!scan.endTime) {
      return res.redirect(`/scan/${scanId}/progress`);
    }
    
    res.render('scan-results', {
      title: 'Tarama Sonuçları',
      scan
    });
  } catch (error) {
    console.error('Tarama sonuçları sayfası hatası:', error);
    req.session.flashMessages = {
      error: 'Tarama sonuçları yüklenirken bir hata oluştu.'
    };
    res.redirect('/dashboard');
  }
});

/**
 * Yapım Aşamasında Sayfası (Henüz tamamlanmamış sayfalar için)
 */
router.get('/under-construction', (req, res) => {
  res.render('under-construction', {
    title: 'Yapım Aşamasında'
  });
});

module.exports = router;