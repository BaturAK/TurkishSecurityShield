/**
 * Ana Rotalar
 * Uygulamanın ana sayfaları için router
 */

const express = require('express');
const router = express.Router();

// Models
const Threat = require('../models/threat');
const ScanResult = require('../models/scanResult');

// Middleware
const authMiddleware = require('../middleware/auth');

/**
 * Ana Sayfa
 */
router.get('/', (req, res) => {
  res.render('index', {
    title: 'Android Antivirüs & Güvenlik'
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
 * İndirme Sayfası
 */
router.get('/download', (req, res) => {
  res.render('download', {
    title: 'Android Uygulamasını İndir'
  });
});

/**
 * Fiyatlandırma Sayfası
 */
router.get('/pricing', (req, res) => {
  res.render('pricing', {
    title: 'Fiyatlandırma'
  });
});

/**
 * Profil Sayfası (Giriş yapılmış olmalı)
 */
router.get('/profile', authMiddleware.isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.user.id;
    
    // Kullanıcının taramalarını getir
    const recentScans = await ScanResult.findByUserId(userId, 5);
    
    // İstatistikler
    const totalScans = await ScanResult.count({ userId });
    
    res.render('profile', {
      title: 'Profilim',
      recentScans,
      stats: {
        totalScans
      }
    });
  } catch (error) {
    console.error('Profil sayfası yüklenirken hata:', error);
    res.status(500).render('error', {
      title: 'Hata',
      error: {
        status: 500,
        message: 'Profil bilgileri yüklenirken bir hata oluştu.'
      }
    });
  }
});

/**
 * Yapım Aşamasında Sayfası (Henüz tamamlanmamış sayfalar için)
 */
router.get('/under-construction', (req, res) => {
  res.render('under-construction', {
    title: 'Yapım Aşamasında',
    returnUrl: req.query.returnUrl || '/'
  });
});

/**
 * Tarama İlerleme Sayfası
 */
router.get('/scan-progress/:scanId', async (req, res) => {
  try {
    const scanId = req.params.scanId;
    
    // Taramayı getir
    const scanResult = await ScanResult.findById(scanId);
    
    if (!scanResult) {
      return res.status(404).render('error', {
        title: 'Hata',
        error: {
          status: 404,
          message: 'Tarama bulunamadı.'
        }
      });
    }
    
    res.render('scan-progress', {
      title: 'Tarama İlerlemesi',
      scanResult
    });
  } catch (error) {
    console.error('Tarama ilerleme sayfası yüklenirken hata:', error);
    res.status(500).render('error', {
      title: 'Hata',
      error: {
        status: 500,
        message: 'Tarama ilerleme bilgisi yüklenirken bir hata oluştu.'
      }
    });
  }
});

/**
 * Tarama Sonuç Sayfası
 */
router.get('/scan-result/:scanId', async (req, res) => {
  try {
    const scanId = req.params.scanId;
    
    // Taramayı getir
    const scanResult = await ScanResult.findById(scanId);
    
    if (!scanResult) {
      return res.status(404).render('error', {
        title: 'Hata',
        error: {
          status: 404,
          message: 'Tarama sonucu bulunamadı.'
        }
      });
    }
    
    // Tarama tamamlanmadıysa, tarama ilerleme sayfasına yönlendir
    if (scanResult.getStatus() !== 'COMPLETED') {
      return res.redirect(`/scan-progress/${scanId}`);
    }
    
    res.render('scan-result', {
      title: 'Tarama Sonucu',
      scanResult
    });
  } catch (error) {
    console.error('Tarama sonuç sayfası yüklenirken hata:', error);
    res.status(500).render('error', {
      title: 'Hata',
      error: {
        status: 500,
        message: 'Tarama sonucu yüklenirken bir hata oluştu.'
      }
    });
  }
});

module.exports = router;