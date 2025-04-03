/**
 * Admin Rotaları
 * Admin paneli için router
 */

const express = require('express');
const router = express.Router();
const { isAdmin } = require('../middleware/auth');
const User = require('../models/user');
const Threat = require('../models/threat');
const ScanResult = require('../models/scanResult');
const { getDb } = require('../config/database');

// Admin ana sayfa
router.get('/', isAdmin, async (req, res) => {
  try {
    // İstatistikler
    const stats = {
      userCount: await User.count(),
      scanCount: await ScanResult.count(),
      threatCount: await Threat.count(),
      dailyActiveUsers: 5 // Örnek değer
    };
    
    // Son kayıt olan kullanıcılar
    const recentUsers = await User.findRecent(5);
    
    // Son tespit edilen tehditler
    const recentThreats = await Threat.findAll({ isCleaned: false });
    
    // Sistem uyarıları (örnek)
    const systemAlerts = [
      {
        type: 'info',
        title: 'Sistem Güncellemesi',
        message: 'Yeni bir sistem güncellemesi kullanılabilir. Tehdit veritabanı güncellendi.',
        date: new Date()
      },
      {
        type: 'warning',
        title: 'Disk Alanı Uyarısı',
        message: 'Disk alanı %80 doluluk seviyesine ulaştı. Eski log dosyalarını temizlemeyi düşünün.',
        date: new Date(Date.now() - 86400000) // 1 gün önce
      }
    ];
    
    // Grafik verileri
    const lastWeek = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    }).reverse();
    
    // Grafik verileri (örnek)
    const chartData = {
      users: [3, 5, 2, 6, 4, 8, 7],
      scans: [12, 15, 8, 20, 18, 25, 22],
      threats: [2, 0, 1, 3, 2, 4, 1]
    };
    
    res.render('admin/dashboard', {
      title: 'Admin Panel',
      stats,
      recentUsers,
      recentThreats,
      systemAlerts,
      chartData,
      chartLabels: lastWeek
    });
  } catch (error) {
    console.error('Admin dashboard hatası:', error);
    res.locals.addMessage('danger', 'Admin paneli yüklenirken bir hata oluştu');
    res.render('admin/dashboard', {
      title: 'Admin Panel',
      stats: { userCount: 0, scanCount: 0, threatCount: 0, dailyActiveUsers: 0 },
      recentUsers: [],
      recentThreats: [],
      systemAlerts: [],
      chartData: { users: [], scans: [], threats: [] },
      chartLabels: []
    });
  }
});

// Kullanıcı yönetimi
router.get('/users', isAdmin, async (req, res) => {
  try {
    // Sayfalama için parametreler
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Filtreleme ve arama
    const search = req.query.search || '';
    
    // MongoDB filtresini oluştur
    let filter = {};
    
    if (search) {
      // Tam metin araması
      filter = {
        $or: [
          { email: { $regex: search, $options: 'i' } },
          { displayName: { $regex: search, $options: 'i' } }
        ]
      };
    }
    
    // Veritabanı bağlantısı
    const db = getDb();
    if (!db) throw new Error('Veritabanı bağlantısı bulunamadı');
    
    // Kullanıcıları getir
    const users = await db.collection('users')
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();
    
    // Toplam kullanıcı sayısı
    const totalUsers = await db.collection('users').countDocuments(filter);
    
    // Toplam sayfa sayısı
    const totalPages = Math.ceil(totalUsers / limit);
    
    res.render('admin/users', {
      title: 'Kullanıcı Yönetimi',
      users,
      currentPage: page,
      totalPages,
      totalUsers,
      limit,
      search
    });
  } catch (error) {
    console.error('Kullanıcı yönetimi hatası:', error);
    res.locals.addMessage('danger', 'Kullanıcı listesi yüklenirken bir hata oluştu');
    res.render('admin/users', {
      title: 'Kullanıcı Yönetimi',
      users: [],
      currentPage: 1,
      totalPages: 0,
      totalUsers: 0,
      limit: 10,
      search: ''
    });
  }
});

// Kullanıcı detayı
router.get('/users/:id', isAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Kullanıcıyı getir
    const user = await User.findById(userId);
    
    if (!user) {
      res.locals.addMessage('warning', 'Kullanıcı bulunamadı');
      return res.redirect('/admin/users');
    }
    
    // Kullanıcının tarama geçmişi
    const scans = await ScanResult.findByUserId(userId);
    
    // Kullanıcının bulunan tehditleri
    const threats = await Threat.findAll({ userId });
    
    res.render('admin/user-detail', {
      title: `Kullanıcı: ${user.displayName || user.email}`,
      user,
      scans,
      threats,
      stats: {
        scanCount: scans.length,
        threatCount: threats.length,
        cleanedCount: threats.filter(t => t.isCleaned).length
      }
    });
  } catch (error) {
    console.error('Kullanıcı detayı hatası:', error);
    res.locals.addMessage('danger', 'Kullanıcı detayları yüklenirken bir hata oluştu');
    res.redirect('/admin/users');
  }
});

// Kullanıcı düzenleme
router.post('/users/:id', isAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    const { displayName, isAdmin } = req.body;
    
    // Kullanıcıyı getir
    const user = await User.findById(userId);
    
    if (!user) {
      res.locals.addMessage('warning', 'Kullanıcı bulunamadı');
      return res.redirect('/admin/users');
    }
    
    // Kullanıcı bilgilerini güncelle
    user.displayName = displayName;
    user.isAdmin = isAdmin === 'on';
    
    // Kullanıcıyı kaydet
    await user.save();
    
    res.locals.addMessage('success', 'Kullanıcı bilgileri başarıyla güncellendi');
    res.redirect(`/admin/users/${userId}`);
  } catch (error) {
    console.error('Kullanıcı güncelleme hatası:', error);
    res.locals.addMessage('danger', 'Kullanıcı güncellenirken bir hata oluştu');
    res.redirect(`/admin/users/${req.params.id}`);
  }
});

// Tehdit yönetimi
router.get('/threats', isAdmin, async (req, res) => {
  try {
    // Sayfalama için parametreler
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Filtreleme ve arama
    const search = req.query.search || '';
    const type = req.query.type || '';
    const severity = req.query.severity || '';
    const status = req.query.status || '';
    
    // MongoDB filtresini oluştur
    let filter = {};
    
    if (search) {
      // Tam metin araması
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (type) {
      filter.type = type;
    }
    
    if (severity) {
      filter.severity = severity;
    }
    
    if (status === 'cleaned') {
      filter.isCleaned = true;
    } else if (status === 'active') {
      filter.isCleaned = false;
    }
    
    // Veritabanı bağlantısı
    const db = getDb();
    if (!db) throw new Error('Veritabanı bağlantısı bulunamadı');
    
    // Tehditleri getir
    const threats = await db.collection('threats')
      .find(filter)
      .sort({ detectionDate: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();
    
    // Toplam tehdit sayısı
    const totalThreats = await db.collection('threats').countDocuments(filter);
    
    // Toplam sayfa sayısı
    const totalPages = Math.ceil(totalThreats / limit);
    
    // Tehdit tipleri (filtreleme için)
    const threatTypes = await db.collection('threats').distinct('type');
    
    res.render('admin/threats', {
      title: 'Tehdit Yönetimi',
      threats,
      currentPage: page,
      totalPages,
      totalThreats,
      limit,
      search,
      type,
      severity,
      status,
      threatTypes
    });
  } catch (error) {
    console.error('Tehdit yönetimi hatası:', error);
    res.locals.addMessage('danger', 'Tehdit listesi yüklenirken bir hata oluştu');
    res.render('admin/threats', {
      title: 'Tehdit Yönetimi',
      threats: [],
      currentPage: 1,
      totalPages: 0,
      totalThreats: 0,
      limit: 10,
      search: '',
      type: '',
      severity: '',
      status: '',
      threatTypes: []
    });
  }
});

// Tehdit detayı
router.get('/threats/:id', isAdmin, async (req, res) => {
  try {
    const threatId = req.params.id;
    
    // Tehdidi getir
    const threat = await Threat.findById(threatId);
    
    if (!threat) {
      res.locals.addMessage('warning', 'Tehdit bulunamadı');
      return res.redirect('/admin/threats');
    }
    
    // Tehdidin sahibi kullanıcı
    let user = null;
    if (threat.userId) {
      user = await User.findById(threat.userId);
    }
    
    res.render('admin/threat-detail', {
      title: `Tehdit: ${threat.name}`,
      threat,
      user
    });
  } catch (error) {
    console.error('Tehdit detayı hatası:', error);
    res.locals.addMessage('danger', 'Tehdit detayları yüklenirken bir hata oluştu');
    res.redirect('/admin/threats');
  }
});

// Tehdit düzenleme
router.post('/threats/:id', isAdmin, async (req, res) => {
  try {
    const threatId = req.params.id;
    const { name, description, severity, isCleaned } = req.body;
    
    // Tehdidi getir
    const threat = await Threat.findById(threatId);
    
    if (!threat) {
      res.locals.addMessage('warning', 'Tehdit bulunamadı');
      return res.redirect('/admin/threats');
    }
    
    // Tehdit bilgilerini güncelle
    threat.name = name;
    threat.description = description;
    threat.severity = severity;
    threat.isCleaned = isCleaned === 'on';
    
    // Tehdidi kaydet
    await threat.save();
    
    res.locals.addMessage('success', 'Tehdit bilgileri başarıyla güncellendi');
    res.redirect(`/admin/threats/${threatId}`);
  } catch (error) {
    console.error('Tehdit güncelleme hatası:', error);
    res.locals.addMessage('danger', 'Tehdit güncellenirken bir hata oluştu');
    res.redirect(`/admin/threats/${req.params.id}`);
  }
});

// Sistem taraması
router.get('/system/scan', isAdmin, async (req, res) => {
  try {
    // Sistem taraması oluştur (simüle edilmiş)
    const scan = ScanResult.createSimulatedScan('SYSTEM');
    
    // Taramayı kaydet
    await scan.save();
    
    res.locals.addMessage('success', 'Sistem taraması başlatıldı');
    res.redirect(`/scan/${scan.id}`);
  } catch (error) {
    console.error('Sistem taraması hatası:', error);
    res.locals.addMessage('danger', 'Sistem taraması başlatılırken bir hata oluştu');
    res.redirect('/admin');
  }
});

// Log yönetimi
router.get('/logs', isAdmin, async (req, res) => {
  // Log dosyalarını getir
  // (Bu örnek uygulamada log dosyalarını göstermeyi simüle ediyoruz)
  
  const logs = [
    {
      type: 'ERROR',
      message: 'Firebase bağlantı hatası: Invalid API key',
      timestamp: new Date(Date.now() - 3600000)
    },
    {
      type: 'INFO',
      message: 'Kullanıcı giriş yaptı: user@example.com',
      timestamp: new Date(Date.now() - 7200000)
    },
    {
      type: 'WARNING',
      message: 'Tehdit veritabanı güncellemesi gecikti',
      timestamp: new Date(Date.now() - 86400000)
    }
  ];
  
  res.render('admin/logs', {
    title: 'Sistem Logları',
    logs
  });
});

// Ayarlar
router.get('/settings', isAdmin, async (req, res) => {
  try {
    // Sistem ayarlarını getir
    const db = getDb();
    if (!db) throw new Error('Veritabanı bağlantısı bulunamadı');
    
    const settingsCollection = db.collection('settings');
    const settings = await settingsCollection.findOne({ key: 'system_settings' });
    
    res.render('admin/settings', {
      title: 'Sistem Ayarları',
      settings
    });
  } catch (error) {
    console.error('Ayarlar hatası:', error);
    res.locals.addMessage('danger', 'Sistem ayarları yüklenirken bir hata oluştu');
    res.render('admin/settings', {
      title: 'Sistem Ayarları',
      settings: {}
    });
  }
});

// Ayarları kaydet
router.post('/settings', isAdmin, async (req, res) => {
  try {
    const { 
      quickScanPaths, 
      fullScanExcludePaths,
      wifiScanEnabled,
      realTimeProtection,
      threatDetected,
      scanComplete,
      wifiWarning,
      updateAvailable
    } = req.body;
    
    // Sistem ayarlarını güncelle
    const db = getDb();
    if (!db) throw new Error('Veritabanı bağlantısı bulunamadı');
    
    const settingsCollection = db.collection('settings');
    await settingsCollection.updateOne(
      { key: 'system_settings' },
      { 
        $set: {
          scanSettings: {
            quickScanPaths: quickScanPaths ? quickScanPaths.split(',') : [],
            fullScanExcludePaths: fullScanExcludePaths ? fullScanExcludePaths.split(',') : [],
            wifiScanEnabled: wifiScanEnabled === 'on',
            realTimeProtection: realTimeProtection === 'on'
          },
          notificationSettings: {
            threatDetected: threatDetected === 'on',
            scanComplete: scanComplete === 'on',
            wifiWarning: wifiWarning === 'on',
            updateAvailable: updateAvailable === 'on'
          },
          updatedAt: new Date()
        } 
      },
      { upsert: true }
    );
    
    res.locals.addMessage('success', 'Sistem ayarları başarıyla güncellendi');
    res.redirect('/admin/settings');
  } catch (error) {
    console.error('Ayarlar kaydetme hatası:', error);
    res.locals.addMessage('danger', 'Sistem ayarları kaydedilirken bir hata oluştu');
    res.redirect('/admin/settings');
  }
});

module.exports = router;