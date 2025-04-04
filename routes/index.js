/**
 * Ana Rotalar
 * Uygulamanın ana sayfaları için router
 */

const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');
const ScanResult = require('../models/scanResult');
const Threat = require('../models/threat');

/**
 * Ana Sayfa
 */
router.get('/', async (req, res) => {
  try {
    // Son tehditler ve tarama sonuçları
    const recentThreats = await Threat.findAll({ isCleaned: false });
    const recentScans = await ScanResult.findRecent(5);
    
    // Toplam istatistikler
    const totalThreats = await Threat.count();
    const activeThreats = await Threat.count({ isCleaned: false });
    const totalScans = await ScanResult.count();
    
    res.render('index', {
      title: 'AntiVirüs Koruma',
      recentThreats,
      recentScans,
      stats: {
        totalThreats,
        activeThreats,
        totalScans
      }
    });
  } catch (error) {
    console.error('Ana sayfa yüklenirken hata:', error);
    res.status(500).render('error', {
      title: 'Hata',
      error: {
        status: 500,
        message: 'Sayfa yüklenirken bir hata oluştu.'
      }
    });
  }
});

/**
 * Hakkımızda Sayfası
 */
router.get('/hakkimizda', (req, res) => {
  res.render('about', { 
    title: 'Hakkımızda'
  });
});

/**
 * Özellikler Sayfası
 */
router.get('/ozellikler', (req, res) => {
  res.render('features', { 
    title: 'Özellikler'
  });
});

/**
 * İletişim Sayfası
 */
router.get('/iletisim', (req, res) => {
  res.render('contact', { 
    title: 'İletişim'
  });
});

/**
 * Gizlilik Politikası Sayfası
 */
router.get('/gizlilik-politikasi', (req, res) => {
  res.render('privacy', { 
    title: 'Gizlilik Politikası'
  });
});

/**
 * Kullanım Şartları Sayfası
 */
router.get('/kullanim-sartlari', (req, res) => {
  res.render('terms', { 
    title: 'Kullanım Şartları'
  });
});

/**
 * SSS Sayfası
 */
router.get('/sss', (req, res) => {
  res.render('faq', { 
    title: 'Sıkça Sorulan Sorular'
  });
});

/**
 * Dökümanlar Sayfası
 */
router.get('/dokumanlar', (req, res) => {
  res.render('docs', { 
    title: 'Dökümanlar'
  });
});

/**
 * İndirme Sayfası
 */
router.get('/indir', (req, res) => {
  res.render('download', { 
    title: 'Uygulamayı İndir'
  });
});

/**
 * Fiyatlandırma Sayfası
 */
router.get('/fiyatlandirma', (req, res) => {
  res.render('pricing', { 
    title: 'Fiyatlandırma'
  });
});

/**
 * Premium Sayfası
 */
router.get('/premium', (req, res) => {
  res.render('premium', { 
    title: 'Premium'
  });
});

/**
 * Premium Kod Doğrulama
 */
router.post('/premium/dogrula', isAuthenticated, async (req, res) => {
  try {
    const { activationCode } = req.body;
    
    if (!activationCode) {
      return res.status(400).json({ 
        success: false, 
        message: 'Aktivasyon kodu gereklidir.' 
      });
    }
    
    // Veritabanında kod kontrolü yapılacak
    const db = require('../config/database').getDb();
    if (!db) {
      return res.status(500).json({ 
        success: false, 
        message: 'Veritabanı bağlantısı kurulamadı.' 
      });
    }
    
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
          usedBy: req.session.user.id,
          usedAt: new Date()
        }
      }
    );
    
    // Kullanıcı verisini güncelle
    const users = db.collection('users');
    await users.updateOne(
      { _id: req.session.user.id },
      { 
        $set: { 
          isPremium: true,
          premiumValidUntil: new Date(Date.now() + (codeData.validDays * 24 * 60 * 60 * 1000)),
          premiumCode: activationCode
        }
      }
    );
    
    // Oturum bilgisini güncelle
    req.session.user.isPremium = true;
    
    res.json({ 
      success: true, 
      message: 'Premium aktivasyonu başarılı! Premium özellikler etkinleştirildi.',
      validDays: codeData.validDays
    });
  } catch (error) {
    console.error('Premium aktivasyonu sırasında hata:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Aktivasyon sırasında bir hata oluştu.'
    });
  }
});

/**
 * Profil Sayfası (Giriş yapılmış olmalı)
 */
router.get('/profil', isAuthenticated, (req, res) => {
  res.render('profile', { 
    title: 'Profilim'
  });
});

/**
 * Yapım Aşamasında Sayfası (Henüz tamamlanmamış sayfalar için)
 */
router.get('/yapim-asamasinda', (req, res) => {
  res.render('under-construction', { 
    title: 'Yapım Aşamasında'
  });
});

/**
 * Tarama İlerleme Sayfası
 */
router.get('/tarama/:scanId', async (req, res) => {
  try {
    const scanId = req.params.scanId;
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
    
    if (scanResult.getStatus() === 'RUNNING') {
      // Tarama devam ediyor, ilerleme sayfasını göster
      res.render('scan-progress', {
        title: 'Tarama Devam Ediyor',
        scanResult
      });
    } else {
      // Tarama tamamlandı, sonuç sayfasına yönlendir
      res.redirect(`/tarama-sonuc/${scanId}`);
    }
  } catch (error) {
    console.error('Tarama ilerleme sayfası yüklenirken hata:', error);
    res.status(500).render('error', {
      title: 'Hata',
      error: {
        status: 500,
        message: 'Tarama ilerleme bilgisi alınırken bir hata oluştu.'
      }
    });
  }
});

/**
 * Tarama Sonuç Sayfası
 */
router.get('/tarama-sonuc/:scanId', async (req, res) => {
  try {
    const scanId = req.params.scanId;
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
    
    if (scanResult.getStatus() === 'RUNNING') {
      // Tarama devam ediyor, ilerleme sayfasına yönlendir
      return res.redirect(`/tarama/${scanId}`);
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
        message: 'Tarama sonucu alınırken bir hata oluştu.'
      }
    });
  }
});

module.exports = router;