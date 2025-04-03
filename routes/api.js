/**
 * API Rotaları
 * Mobil uygulama için API endpointleri
 */

const express = require('express');
const router = express.Router();
const User = require('../models/user');
const ScanResult = require('../models/scanResult');
const Threat = require('../models/threat');
const { getDb } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

// API Auth Middleware
const apiAuth = async (req, res, next) => {
  // API key veya token kontrolü
  const apiKey = req.headers['x-api-key'] || req.query.api_key;
  
  if (!apiKey) {
    return res.status(401).json({
      success: false,
      message: 'API anahtarı gerekli'
    });
  }
  
  // Basit API key kontrolü 
  // Gerçek uygulamada daha güvenli bir doğrulama kullanılmalı
  if (apiKey !== process.env.API_KEY && apiKey !== 'test-api-key') {
    return res.status(401).json({
      success: false,
      message: 'Geçersiz API anahtarı'
    });
  }
  
  next();
};

// Kullanıcı kimlik doğrulama
router.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'E-posta ve şifre gerekli'
      });
    }
    
    // Bu örnekte Firebase auth doğrulaması gerçek uygulamaya bırakılmıştır
    // Burada mock bir kullanıcı dönüyoruz
    
    // MongoDB'de kullanıcı kontrolü
    let user = await User.findByEmail(email);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Kullanıcı bulunamadı'
      });
    }
    
    // Token oluştur
    const token = uuidv4();
    
    // Kullanıcı son giriş zamanını güncelle
    user.lastLoginAt = new Date();
    await user.save();
    
    res.json({
      success: true,
      message: 'Giriş başarılı',
      data: {
        user: {
          id: user.id,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL
        },
        token
      }
    });
  } catch (error) {
    console.error('API login hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Bir hata oluştu'
    });
  }
});

// Kullanıcı kaydı
router.post('/auth/register', async (req, res) => {
  try {
    const { email, password, displayName } = req.body;
    
    if (!email || !password || !displayName) {
      return res.status(400).json({
        success: false,
        message: 'E-posta, şifre ve ad soyad gerekli'
      });
    }
    
    // E-posta formatı kontrolü
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Geçersiz e-posta formatı'
      });
    }
    
    // Şifre uzunluğu kontrolü
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Şifre en az 6 karakter olmalıdır'
      });
    }
    
    // MongoDB'de kullanıcı kontrolü
    const existingUser = await User.findByEmail(email);
    
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Bu e-posta adresi zaten kullanılıyor'
      });
    }
    
    // Bu örnekte Firebase auth gerçek uygulamaya bırakılmıştır
    // Burada mock bir kullanıcı oluşturuyoruz
    const userId = uuidv4();
    
    // MongoDB'ye kullanıcı kaydet
    const user = new User(
      userId,
      email,
      displayName,
      null, // photoURL
      false // isAdmin
    );
    
    await user.save();
    
    // Token oluştur
    const token = uuidv4();
    
    res.status(201).json({
      success: true,
      message: 'Kayıt başarılı',
      data: {
        user: {
          id: user.id,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL
        },
        token
      }
    });
  } catch (error) {
    console.error('API register hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Bir hata oluştu'
    });
  }
});

// API route - Durum kontrolü
router.get('/status', apiAuth, (req, res) => {
  res.json({
    success: true,
    message: 'API çalışıyor',
    timestamp: new Date()
  });
});

// Kullanıcı profili
router.get('/user/profile', apiAuth, async (req, res) => {
  try {
    const userId = req.query.userId || req.headers['user-id'];
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "Kullanıcı ID'si gerekli"
      });
    }
    
    // Kullanıcıyı getir
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Kullanıcı bulunamadı'
      });
    }
    
    // Kullanıcı istatistiklerini getir
    const scanCount = await ScanResult.count({ userId });
    const threatCount = await Threat.count({ userId });
    const cleanedCount = await Threat.count({ userId, isCleaned: true });
    
    // Son taramalar
    const recentScans = await ScanResult.findByUserId(userId, 5);
    
    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          createdAt: user.createdAt
        },
        stats: {
          scanCount,
          threatCount,
          cleanedCount
        },
        recentScans: recentScans.map(scan => ({
          id: scan.id,
          type: scan.type,
          startTime: scan.startTime,
          endTime: scan.endTime,
          totalScanned: scan.totalScanned,
          threatCount: scan.threatsFound.length,
          status: scan.getStatus()
        }))
      }
    });
  } catch (error) {
    console.error('API profil hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Bir hata oluştu'
    });
  }
});

// Kullanıcı profili güncelleme
router.post('/user/profile', apiAuth, async (req, res) => {
  try {
    const userId = req.body.userId || req.headers['user-id'];
    const { displayName, photoURL } = req.body;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "Kullanıcı ID'si gerekli"
      });
    }
    
    // Kullanıcıyı getir
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Kullanıcı bulunamadı'
      });
    }
    
    // Kullanıcı bilgilerini güncelle
    if (displayName) user.displayName = displayName;
    if (photoURL) user.photoURL = photoURL;
    
    // Kullanıcıyı kaydet
    await user.save();
    
    res.json({
      success: true,
      message: 'Profil başarıyla güncellendi',
      data: {
        user: {
          id: user.id,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL
        }
      }
    });
  } catch (error) {
    console.error('API profil güncelleme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Bir hata oluştu'
    });
  }
});

// Tarama Başlat
router.post('/scan/start', apiAuth, async (req, res) => {
  try {
    const { userId, type } = req.body;
    
    if (!userId || !type) {
      return res.status(400).json({
        success: false,
        message: 'Kullanıcı ID ve tarama tipi gerekli'
      });
    }
    
    // Kullanıcıyı kontrol et
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Kullanıcı bulunamadı'
      });
    }
    
    // Geçerli tarama tipleri
    const validTypes = ['QUICK', 'FULL', 'WIFI', 'QR', 'APP'];
    
    if (!validTypes.includes(type.toUpperCase())) {
      return res.status(400).json({
        success: false,
        message: 'Geçersiz tarama tipi'
      });
    }
    
    // Taramayı oluştur
    const scan = new ScanResult(
      null,
      type.toUpperCase(),
      new Date(),
      null,
      0,
      [],
      userId
    );
    
    // Taramayı kaydet
    await scan.save();
    
    res.status(201).json({
      success: true,
      message: 'Tarama başlatıldı',
      data: {
        scan: {
          id: scan.id,
          type: scan.type,
          startTime: scan.startTime,
          status: 'RUNNING'
        }
      }
    });
  } catch (error) {
    console.error('API tarama başlatma hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Bir hata oluştu'
    });
  }
});

// Tarama Durumu
router.get('/scan/:id', apiAuth, async (req, res) => {
  try {
    const scanId = req.params.id;
    
    if (!scanId) {
      return res.status(400).json({
        success: false,
        message: 'Tarama ID gerekli'
      });
    }
    
    // Taramayı getir
    const scan = await ScanResult.findById(scanId);
    
    if (!scan) {
      return res.status(404).json({
        success: false,
        message: 'Tarama bulunamadı'
      });
    }
    
    // Devam eden taramayı simüle et
    let progress = scan.getStatus() === 'COMPLETED' ? 100 : Math.floor(Math.random() * 30) + 70;
    
    // Tarama tamamlanma yüzdesi
    if (scan.getStatus() === 'RUNNING') {
      // Tarama süresi 20 saniyeyi geçtiyse tamamlanmış olarak işaretle
      const elapsedTime = (new Date() - new Date(scan.startTime)) / 1000;
      
      if (elapsedTime > 20) {
        // Taramayı tamamla
        const threatCount = Math.floor(Math.random() * 3); // 0-2 tehdit
        const threats = [];
        
        // Rasgele tehdit oluştur
        if (threatCount > 0) {
          const randomThreats = Threat.getRandomThreats(threatCount);
          
          for (const threat of randomThreats) {
            threat.userId = scan.userId;
            await threat.save();
            threats.push(threat.toJSON());
          }
        }
        
        scan.complete(Math.floor(Math.random() * 500) + 1000, threats);
        await scan.save();
        progress = 100;
      }
    }
    
    res.json({
      success: true,
      data: {
        scan: {
          id: scan.id,
          type: scan.type,
          startTime: scan.startTime,
          endTime: scan.endTime,
          totalScanned: scan.totalScanned,
          threatsFound: scan.threatsFound,
          status: scan.getStatus(),
          progress
        }
      }
    });
  } catch (error) {
    console.error('API tarama durumu hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Bir hata oluştu'
    });
  }
});

// Kullanıcı taramaları
router.get('/user/:userId/scans', apiAuth, async (req, res) => {
  try {
    const userId = req.params.userId;
    const limit = parseInt(req.query.limit) || 10;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "Kullanıcı ID'si gerekli"
      });
    }
    
    // Kullanıcıyı kontrol et
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Kullanıcı bulunamadı'
      });
    }
    
    // Kullanıcı taramalarını getir
    const scans = await ScanResult.findByUserId(userId, limit);
    
    res.json({
      success: true,
      data: {
        scans: scans.map(scan => ({
          id: scan.id,
          type: scan.type,
          startTime: scan.startTime,
          endTime: scan.endTime,
          totalScanned: scan.totalScanned,
          threatCount: scan.threatsFound.length,
          status: scan.getStatus()
        }))
      }
    });
  } catch (error) {
    console.error('API kullanıcı taramaları hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Bir hata oluştu'
    });
  }
});

// Kullanıcı tehditleri
router.get('/user/:userId/threats', apiAuth, async (req, res) => {
  try {
    const userId = req.params.userId;
    const limit = parseInt(req.query.limit) || 50;
    const status = req.query.status; // 'active', 'cleaned', 'all'
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "Kullanıcı ID'si gerekli"
      });
    }
    
    // Kullanıcıyı kontrol et
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Kullanıcı bulunamadı'
      });
    }
    
    // Filtreleme
    const filter = { userId };
    
    if (status === 'active') {
      filter.isCleaned = false;
    } else if (status === 'cleaned') {
      filter.isCleaned = true;
    }
    
    // Kullanıcı tehditlerini getir
    const threats = await Threat.findAll(filter);
    
    // Tehdit sayısını sınırla
    const limitedThreats = threats.slice(0, limit);
    
    res.json({
      success: true,
      data: {
        threats: limitedThreats.map(threat => ({
          id: threat.id,
          name: threat.name,
          type: threat.type,
          description: threat.description,
          severity: threat.severity,
          filePath: threat.filePath,
          isCleaned: threat.isCleaned,
          detectionDate: threat.detectionDate
        })),
        total: threats.length
      }
    });
  } catch (error) {
    console.error('API kullanıcı tehditleri hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Bir hata oluştu'
    });
  }
});

// Tehdit temizleme
router.post('/threat/:id/clean', apiAuth, async (req, res) => {
  try {
    const threatId = req.params.id;
    const userId = req.body.userId || req.headers['user-id'];
    
    if (!threatId) {
      return res.status(400).json({
        success: false,
        message: 'Tehdit ID gerekli'
      });
    }
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "Kullanıcı ID'si gerekli"
      });
    }
    
    // Tehdidi getir
    const threat = await Threat.findById(threatId);
    
    if (!threat) {
      return res.status(404).json({
        success: false,
        message: 'Tehdit bulunamadı'
      });
    }
    
    // Tehdidin bu kullanıcıya ait olup olmadığını kontrol et
    if (threat.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Bu tehdit üzerinde işlem yapma yetkiniz yok'
      });
    }
    
    // Tehdit zaten temizlenmişse
    if (threat.isCleaned) {
      return res.json({
        success: true,
        message: 'Tehdit zaten temizlenmiş',
        data: {
          threat: {
            id: threat.id,
            name: threat.name,
            isCleaned: true
          }
        }
      });
    }
    
    // Tehdidi temizle
    threat.clean();
    await threat.save();
    
    res.json({
      success: true,
      message: 'Tehdit başarıyla temizlendi',
      data: {
        threat: {
          id: threat.id,
          name: threat.name,
          isCleaned: true
        }
      }
    });
  } catch (error) {
    console.error('API tehdit temizleme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Bir hata oluştu'
    });
  }
});

// Sistem durumu
router.get('/system/status', apiAuth, async (req, res) => {
  try {
    // Sistem istatistiklerini getir
    const userCount = await User.count();
    const scanCount = await ScanResult.count();
    const threatCount = await Threat.count();
    
    // Veritabanı bağlantısı kontrolü
    const db = getDb();
    const dbStatus = !!db;
    
    // Son güncellemeler
    const lastUpdated = new Date(Date.now() - 3600000 * 24); // 1 gün önce
    
    // Sunucu durumu
    const serverStatus = {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      timestamp: new Date()
    };
    
    res.json({
      success: true,
      data: {
        services: {
          database: dbStatus ? 'online' : 'offline',
          api: 'online',
          firebase: 'online'
        },
        stats: {
          userCount,
          scanCount,
          threatCount,
          cleanedCount: await Threat.count({ isCleaned: true })
        },
        updates: {
          threatDatabase: {
            lastUpdated,
            version: '2023.10.1'
          },
          application: {
            lastUpdated,
            version: '1.0.0',
            hasUpdate: false
          }
        },
        server: serverStatus
      }
    });
  } catch (error) {
    console.error('API sistem durumu hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Bir hata oluştu'
    });
  }
});

module.exports = router;