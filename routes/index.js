/**
 * Ana Rotalar
 * Uygulamanın ana sayfaları için router
 */

const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');
const ScanResult = require('../models/scanResult');
const Threat = require('../models/threat');
const User = require('../models/user');

// Ana sayfa
router.get('/', (req, res) => {
  // Aktif kullanıcı varsa dashboard'a yönlendir
  if (req.session.user) {
    return res.redirect('/dashboard');
  }
  
  res.render('index', {
    title: 'AntiVirüs - Android Güvenlik Çözümü',
    styles: []
  });
});

// Kullanıcı paneli
router.get('/dashboard', isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.user.id;
    
    // Kullanıcının tarama geçmişi
    const scans = await ScanResult.findByUserId(userId, 5);
    
    // Kullanıcının bulunan tehditleri
    const threats = await Threat.findAll({ userId, isCleaned: false }); // Sadece temizlenmemiş tehditler
    
    // Kullanıcının istatistikleri
    const stats = {
      scanCount: await ScanResult.count({ userId }),
      threatCount: await Threat.count({ userId }),
      cleanedCount: await Threat.count({ userId, isCleaned: true })
    };
    
    res.render('dashboard', {
      title: 'Kontrol Paneli',
      scans,
      threats,
      stats,
      user: req.session.user
    });
  } catch (error) {
    console.error('Dashboard hatası:', error);
    res.locals.addMessage('danger', 'Kontrol paneli yüklenirken bir hata oluştu');
    res.render('dashboard', {
      title: 'Kontrol Paneli',
      scans: [],
      threats: [],
      stats: { scanCount: 0, threatCount: 0, cleanedCount: 0 },
      user: req.session.user
    });
  }
});

// Hızlı tarama başlat
router.get('/scan/quick', isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.user.id;
    
    // Taramayı oluştur (gerçek değil, simüle edilmiş)
    const scan = ScanResult.createSimulatedScan('QUICK', userId);
    
    // Taramayı kaydet
    await scan.save();
    
    res.redirect(`/scan/${scan.id}`);
  } catch (error) {
    console.error('Hızlı tarama hatası:', error);
    res.locals.addMessage('danger', 'Tarama başlatılırken bir hata oluştu');
    res.redirect('/dashboard');
  }
});

// Tam tarama başlat
router.get('/scan/full', isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.user.id;
    
    // Taramayı oluştur (gerçek değil, simüle edilmiş)
    const scan = ScanResult.createSimulatedScan('FULL', userId);
    
    // Taramayı kaydet
    await scan.save();
    
    res.redirect(`/scan/${scan.id}`);
  } catch (error) {
    console.error('Tam tarama hatası:', error);
    res.locals.addMessage('danger', 'Tarama başlatılırken bir hata oluştu');
    res.redirect('/dashboard');
  }
});

// Wifi tarama başlat
router.get('/scan/wifi', isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.user.id;
    
    // Taramayı oluştur (gerçek değil, simüle edilmiş)
    const scan = ScanResult.createSimulatedScan('WIFI', userId);
    
    // Taramayı kaydet
    await scan.save();
    
    res.redirect(`/scan/${scan.id}`);
  } catch (error) {
    console.error('Wifi tarama hatası:', error);
    res.locals.addMessage('danger', 'Tarama başlatılırken bir hata oluştu');
    res.redirect('/dashboard');
  }
});

// Tarama sonucu sayfası
router.get('/scan/:id', isAuthenticated, async (req, res) => {
  try {
    const scanId = req.params.id;
    
    // Taramayı getir
    const scan = await ScanResult.findById(scanId);
    
    if (!scan) {
      res.locals.addMessage('warning', 'Tarama bulunamadı');
      return res.redirect('/dashboard');
    }
    
    // Kullanıcının yetkisini kontrol et
    if (scan.userId && scan.userId !== req.session.user.id && !req.session.user.isAdmin) {
      res.locals.addMessage('warning', 'Bu taramayı görüntüleme yetkiniz yok');
      return res.redirect('/dashboard');
    }
    
    // Tarama devam ediyorsa güncelle (simülasyon)
    if (scan.getStatus() === 'RUNNING') {
      // 20 saniyeden fazla geçtiyse tamamla
      const elapsedTime = (new Date() - scan.startTime) / 1000;
      
      if (elapsedTime > 20) {
        // Simüle edilmiş tehditler
        const threatCount = Math.floor(Math.random() * 3); // 0-2 tehdit
        const threats = Threat.getRandomThreats(threatCount);
        
        if (scan.userId) {
          threats.forEach(threat => {
            threat.userId = scan.userId;
          });
        }
        
        scan.complete(Math.floor(Math.random() * 500) + 1000, threats);
        await scan.save();
        
        // Tehditleri veritabanına kaydet
        for (const threat of threats) {
          await threat.save();
        }
      }
    }
    
    // Tarama tipine göre ikon ve açıklama belirle
    const scanTypeInfo = {
      'QUICK': {
        icon: 'fa-bolt',
        description: 'Hızlı tarama, sistem için kritik olan bölümleri tarar'
      },
      'FULL': {
        icon: 'fa-shield-alt',
        description: 'Tam tarama, tüm sistemi derinlemesine kontrol eder'
      },
      'WIFI': {
        icon: 'fa-wifi',
        description: 'WiFi taraması, ağ güvenliğini kontrol eder'
      },
      'SYSTEM': {
        icon: 'fa-server',
        description: 'Sistem taraması, sistem dosyalarını kontrol eder'
      },
      'QR': {
        icon: 'fa-qrcode',
        description: 'QR Kod taraması, zararlı bağlantıları tespit eder'
      },
      'APP': {
        icon: 'fa-mobile-alt',
        description: 'Uygulama taraması, kurulu uygulamaları kontrol eder'
      }
    };
    
    const scanInfo = scanTypeInfo[scan.type] || { icon: 'fa-search', description: 'Özel tarama' };
    
    res.render('scan-result', {
      title: `${scan.type} Tarama Sonucu`,
      scan,
      scanInfo
    });
  } catch (error) {
    console.error('Tarama sonucu hatası:', error);
    res.locals.addMessage('danger', 'Tarama sonuçları yüklenirken bir hata oluştu');
    res.redirect('/dashboard');
  }
});

// Tüm tarama geçmişi
router.get('/scan-history', isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.user.id;
    
    // Sayfalama için parametreler
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Taramaları getir
    const scans = await ScanResult.findByUserId(userId);
    
    // Toplam tarama sayısı
    const totalScans = await ScanResult.count({ userId });
    
    // Toplam sayfa sayısı
    const totalPages = Math.ceil(totalScans / limit);
    
    res.render('scan-history', {
      title: 'Tarama Geçmişi',
      scans,
      currentPage: page,
      totalPages,
      totalScans
    });
  } catch (error) {
    console.error('Tarama geçmişi hatası:', error);
    res.locals.addMessage('danger', 'Tarama geçmişi yüklenirken bir hata oluştu');
    res.render('scan-history', {
      title: 'Tarama Geçmişi',
      scans: [],
      currentPage: 1,
      totalPages: 0,
      totalScans: 0
    });
  }
});

// Tehditler sayfası
router.get('/threats', isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.user.id;
    
    // Sayfalama için parametreler
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Filtreleme
    const status = req.query.status || 'all'; // 'all', 'active', 'cleaned'
    
    // Filtreleme
    const filter = { userId };
    
    if (status === 'active') {
      filter.isCleaned = false;
    } else if (status === 'cleaned') {
      filter.isCleaned = true;
    }
    
    // Tehditleri getir
    const threats = await Threat.findAll(filter);
    
    // Toplam tehdit sayısı
    const totalThreats = await Threat.count(filter);
    
    // Toplam sayfa sayısı
    const totalPages = Math.ceil(totalThreats / limit);
    
    res.render('threats', {
      title: 'Tehditler',
      threats,
      currentPage: page,
      totalPages,
      totalThreats,
      status
    });
  } catch (error) {
    console.error('Tehditler sayfası hatası:', error);
    res.locals.addMessage('danger', 'Tehditler yüklenirken bir hata oluştu');
    res.render('threats', {
      title: 'Tehditler',
      threats: [],
      currentPage: 1,
      totalPages: 0,
      totalThreats: 0,
      status: 'all'
    });
  }
});

// Tehdit temizleme
router.post('/threat/:id/clean', isAuthenticated, async (req, res) => {
  try {
    const threatId = req.params.id;
    const userId = req.session.user.id;
    
    // Tehdidi getir
    const threat = await Threat.findById(threatId);
    
    if (!threat) {
      res.locals.addMessage('warning', 'Tehdit bulunamadı');
      return res.redirect('/threats');
    }
    
    // Tehdidin bu kullanıcıya ait olup olmadığını kontrol et
    if (threat.userId !== userId && !req.session.user.isAdmin) {
      res.locals.addMessage('warning', 'Bu tehdit üzerinde işlem yapma yetkiniz yok');
      return res.redirect('/threats');
    }
    
    // Tehdit zaten temizlenmişse
    if (threat.isCleaned) {
      res.locals.addMessage('info', 'Tehdit zaten temizlenmiş');
      return res.redirect('/threats');
    }
    
    // Tehdidi temizle
    threat.clean();
    await threat.save();
    
    res.locals.addMessage('success', 'Tehdit başarıyla temizlendi');
    
    // AJAX isteği ise JSON döndür
    if (req.xhr) {
      return res.json({
        success: true,
        message: 'Tehdit başarıyla temizlendi'
      });
    }
    
    // Normal istek ise sayfaya yönlendir
    res.redirect('/threats');
  } catch (error) {
    console.error('Tehdit temizleme hatası:', error);
    res.locals.addMessage('danger', 'Tehdit temizlenirken bir hata oluştu');
    
    // AJAX isteği ise JSON döndür
    if (req.xhr) {
      return res.status(500).json({
        success: false,
        message: 'Tehdit temizlenirken bir hata oluştu'
      });
    }
    
    // Normal istek ise sayfaya yönlendir
    res.redirect('/threats');
  }
});

// Kullanıcı profili
router.get('/profile', isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.user.id;
    
    // Kullanıcıyı getir
    const user = await User.findById(userId);
    
    if (!user) {
      res.locals.addMessage('warning', 'Kullanıcı bulunamadı');
      return res.redirect('/dashboard');
    }
    
    // Kullanıcı istatistiklerini getir
    const stats = {
      scanCount: await ScanResult.count({ userId }),
      threatCount: await Threat.count({ userId }),
      cleanedCount: await Threat.count({ userId, isCleaned: true })
    };
    
    res.render('profile', {
      title: 'Profil',
      user,
      stats
    });
  } catch (error) {
    console.error('Profil sayfası hatası:', error);
    res.locals.addMessage('danger', 'Profil bilgileri yüklenirken bir hata oluştu');
    res.redirect('/dashboard');
  }
});

// Profil güncelleme
router.post('/profile', isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.user.id;
    const { displayName } = req.body;
    
    // Kullanıcıyı getir
    const user = await User.findById(userId);
    
    if (!user) {
      res.locals.addMessage('warning', 'Kullanıcı bulunamadı');
      return res.redirect('/profile');
    }
    
    // Kullanıcı bilgilerini güncelle
    user.displayName = displayName;
    
    // Kullanıcıyı kaydet
    await user.save();
    
    // Oturum bilgilerini güncelle
    req.session.user = user.toJSON();
    
    res.locals.addMessage('success', 'Profil bilgileri başarıyla güncellendi');
    res.redirect('/profile');
  } catch (error) {
    console.error('Profil güncelleme hatası:', error);
    res.locals.addMessage('danger', 'Profil bilgileri güncellenirken bir hata oluştu');
    res.redirect('/profile');
  }
});

// Kullanıcı ayarları
router.get('/settings', isAuthenticated, (req, res) => {
  // Şimdilik yapım aşamasında sayfası göster
  res.render('under-construction', {
    title: 'Ayarlar',
    pageName: 'Ayarlar'
  });
});

// Hakkında sayfası
router.get('/about', (req, res) => {
  res.render('about', {
    title: 'Hakkımızda'
  });
});

// SSS sayfası
router.get('/faq', (req, res) => {
  // Şimdilik yapım aşamasında sayfası göster
  res.render('under-construction', {
    title: 'Sıkça Sorulan Sorular',
    pageName: 'SSS'
  });
});

// İletişim sayfası
router.get('/contact', (req, res) => {
  // Şimdilik yapım aşamasında sayfası göster
  res.render('under-construction', {
    title: 'İletişim',
    pageName: 'İletişim'
  });
});

// 404 sayfası - Express, hiçbir router eşleşmediğinde bu middleware'e düşer
router.use((req, res) => {
  res.status(404).render('404', {
    title: 'Sayfa Bulunamadı'
  });
});

module.exports = router;