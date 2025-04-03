/**
 * Admin Rotaları
 * Admin paneli için router
 */

const express = require('express');
const router = express.Router();
const { isAuthenticated, isAdmin } = require('../middleware/auth');
const User = require('../models/user');
const Threat = require('../models/threat');
const ScanResult = require('../models/scanResult');

// Admin paneline erişim için önce kimlik doğrulama ve admin yetkisi kontrolü
router.use(isAuthenticated);
router.use(isAdmin);

// Admin Ana Sayfası
router.get('/dashboard', async (req, res) => {
  try {
    // İstatistikleri getir
    const userCount = await User.findAll().then(users => users.length);
    const threatCount = await Threat.count();
    const scanCount = await ScanResult.count();
    const activeThreatsCount = await Threat.count({ isCleaned: false });
    
    // Son 5 taramayı getir
    const recentScans = await ScanResult.findRecent(5);
    
    res.render('admin/dashboard', { 
      title: 'Admin Panel',
      activeLink: 'admin',
      stats: {
        userCount,
        threatCount,
        scanCount,
        activeThreatsCount
      },
      recentScans
    });
  } catch (error) {
    console.error('Admin dashboard hatası:', error);
    res.status(500).render('error', { 
      title: 'Hata',
      message: 'Admin dashboard yüklenirken bir hata oluştu.'
    });
  }
});

// Kullanıcı Listesi
router.get('/users', async (req, res) => {
  try {
    const users = await User.findAll();
    
    res.render('admin/users', { 
      title: 'Kullanıcı Yönetimi',
      activeLink: 'admin',
      users
    });
  } catch (error) {
    console.error('Kullanıcı listesi hatası:', error);
    res.status(500).render('error', { 
      title: 'Hata',
      message: 'Kullanıcı listesi yüklenirken bir hata oluştu.'
    });
  }
});

// Tehdit Listesi
router.get('/threats', async (req, res) => {
  try {
    const threats = await Threat.findAll();
    
    res.render('admin/threats', { 
      title: 'Tehdit Yönetimi',
      activeLink: 'admin',
      threats
    });
  } catch (error) {
    console.error('Tehdit listesi hatası:', error);
    res.status(500).render('error', { 
      title: 'Hata',
      message: 'Tehdit listesi yüklenirken bir hata oluştu.'
    });
  }
});

// Tarama Sonuçları Listesi
router.get('/scans', async (req, res) => {
  try {
    const scans = await ScanResult.findRecent(20);
    
    res.render('admin/scans', { 
      title: 'Tarama Sonuçları',
      activeLink: 'admin',
      scans
    });
  } catch (error) {
    console.error('Tarama listesi hatası:', error);
    res.status(500).render('error', { 
      title: 'Hata',
      message: 'Tarama listesi yüklenirken bir hata oluştu.'
    });
  }
});

// Kullanıcı Admin Yetkisi Değiştir (POST)
router.post('/users/:id/toggle-admin', async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Kendisinin admin yetkisini değiştirmesini engelle
    if (userId === req.session.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Kendi admin yetkinizi değiştiremezsiniz.'
      });
    }
    
    // Kullanıcıyı bul
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Kullanıcı bulunamadı.'
      });
    }
    
    // Admin yetkisini tersine çevir
    user.isAdmin = !user.isAdmin;
    
    // Veritabanına kaydet
    await User.saveUserToDb(user);
    
    res.json({
      success: true,
      message: `${user.displayName} kullanıcısının admin yetkisi ${user.isAdmin ? 'verildi' : 'alındı'}.`,
      isAdmin: user.isAdmin
    });
  } catch (error) {
    console.error('Admin yetkisi değiştirme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Kullanıcı yetkisi değiştirilirken bir hata oluştu.'
    });
  }
});

// Tehdit Temizle (POST)
router.post('/threats/:id/clean', async (req, res) => {
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
    
    // Zaten temizlenmiş mi kontrolü
    if (threat.isCleaned) {
      return res.status(400).json({
        success: false,
        message: 'Bu tehdit zaten temizlenmiş.'
      });
    }
    
    // Tehdidi temizle
    threat.clean();
    
    // Veritabanına kaydet
    await threat.save();
    
    res.json({
      success: true,
      message: `"${threat.name}" tehdidi başarıyla temizlendi.`
    });
  } catch (error) {
    console.error('Tehdit temizleme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Tehdit temizlenirken bir hata oluştu.'
    });
  }
});

// Test Verileri Oluştur (POST) - Sadece geliştirme amaçlı
router.post('/generate-test-data', async (req, res) => {
  try {
    // Test kullanıcıları
    const testUsers = [
      new User(null, 'user1@example.com', 'Test User 1', 'https://ui-avatars.com/api/?name=Test+User+1&background=0D8ABC&color=fff', false),
      new User(null, 'user2@example.com', 'Test User 2', 'https://ui-avatars.com/api/?name=Test+User+2&background=0D8ABC&color=fff', false),
      new User(null, 'user3@example.com', 'Test User 3', 'https://ui-avatars.com/api/?name=Test+User+3&background=0D8ABC&color=fff', false)
    ];
    
    // Kullanıcıları kaydet
    for (const user of testUsers) {
      await User.saveUserToDb(user);
    }
    
    // Test tehditleri
    const testThreats = Threat.getRandomThreats(10);
    
    // Tehditleri kaydet
    for (const threat of testThreats) {
      await threat.save();
    }
    
    // Test taramaları
    const scanTypes = ['QUICK', 'FULL', 'WIFI', 'QR', 'APP'];
    const testScans = [];
    
    // Her kullanıcı için 2 tarama oluştur
    for (const user of testUsers) {
      for (let i = 0; i < 2; i++) {
        const scanType = scanTypes[Math.floor(Math.random() * scanTypes.length)];
        const scan = ScanResult.createSimulatedScan(scanType, user.id);
        testScans.push(scan);
      }
    }
    
    // Sistem taramaları
    for (let i = 0; i < 3; i++) {
      const scanType = scanTypes[Math.floor(Math.random() * scanTypes.length)];
      const scan = ScanResult.createSimulatedScan(scanType, null);
      testScans.push(scan);
    }
    
    // Taramaları kaydet
    for (const scan of testScans) {
      await scan.save();
    }
    
    res.json({
      success: true,
      message: 'Test verileri başarıyla oluşturuldu.',
      counts: {
        users: testUsers.length,
        threats: testThreats.length,
        scans: testScans.length
      }
    });
  } catch (error) {
    console.error('Test veri oluşturma hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Test verileri oluşturulurken bir hata oluştu.'
    });
  }
});

// Test Verilerini Temizle (POST) - Sadece geliştirme amaçlı
router.post('/clear-test-data', async (req, res) => {
  try {
    const db = require('../config/database').getDb();
    
    // Test e-posta adresine sahip kullanıcıları sil
    await db.collection('users').deleteMany({
      email: { $in: ['user1@example.com', 'user2@example.com', 'user3@example.com'] }
    });
    
    res.json({
      success: true,
      message: 'Test verileri başarıyla temizlendi.'
    });
  } catch (error) {
    console.error('Test veri temizleme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Test verileri temizlenirken bir hata oluştu.'
    });
  }
});

module.exports = router;