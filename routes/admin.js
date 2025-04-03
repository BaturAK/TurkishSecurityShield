/**
 * Admin Rotaları
 * Admin paneli için router
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

/**
 * Middleware zincirleri
 * Tüm admin sayfaları için oturum açmış ve admin yetkisine sahip olma kontrolü
 */
router.use(authMiddleware.isAuthenticated);
router.use(authMiddleware.isAdmin);

/**
 * Admin Dashboard
 * GET /admin
 */
router.get('/', async (req, res) => {
  try {
    // İstatistikleri getir
    const userCount = await User.count();
    const threatCount = await Threat.count();
    const scanCount = await ScanResult.count();
    const activeThreats = await Threat.count({ isCleaned: false });
    
    // Son kullanıcıları getir
    const recentUsers = await User.findRecent(5);
    
    // Son taramaları getir
    const recentScans = await ScanResult.findRecent(5);
    
    res.render('admin/dashboard', {
      title: 'Admin Panel',
      totalUsers: userCount,
      totalThreats: threatCount,
      totalScans: scanCount,
      activeThreats: activeThreats,
      recentUsers,
      recentScans
    });
  } catch (error) {
    console.error('Admin dashboard yüklenirken hata:', error);
    res.status(500).render('error', {
      title: 'Hata',
      error: {
        status: 500,
        message: 'Admin dashboard yüklenirken bir hata oluştu.'
      }
    });
  }
});

/**
 * Admin Kullanıcı Yönetimi Sayfası
 * GET /admin/users
 */
router.get('/users', async (req, res) => {
  try {
    // Tüm kullanıcıları getir
    const users = await User.findAll();
    
    // Toplam kullanıcı sayısını al
    const totalUsers = await User.count();
    
    // Aylık ve haftalık kullanıcı sayılarını hesapla (örnek değerler)
    const monthlyUsers = Math.floor(totalUsers * 0.7); // Toplam kullanıcıların %70'i
    const weeklyUsers = Math.floor(totalUsers * 0.3); // Toplam kullanıcıların %30'u
    
    res.render('admin/users', {
      title: 'Admin - Kullanıcı Yönetimi',
      users,
      totalUsers,
      monthlyUsers,
      weeklyUsers,
      success: req.query.success,
      error: req.query.error
    });
  } catch (error) {
    console.error('Kullanıcı yönetimi sayfası yüklenirken hata:', error);
    res.status(500).render('error', {
      title: 'Hata',
      error: {
        status: 500,
        message: 'Kullanıcı listesi yüklenirken bir hata oluştu.'
      }
    });
  }
});

/**
 * Admin Kullanıcı Detay Sayfası
 * GET /admin/users/:userId
 */
router.get('/users/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    
    // Kullanıcıyı getir
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).render('error', {
        title: 'Hata',
        error: {
          status: 404,
          message: 'Kullanıcı bulunamadı.'
        }
      });
    }
    
    // Kullanıcının taramalarını getir
    const scans = await ScanResult.findByUserId(userId, 10);
    
    res.render('admin/user-detail', {
      title: 'Admin - Kullanıcı Detayı',
      user,
      scans,
      success: req.query.success,
      error: req.query.error
    });
  } catch (error) {
    console.error('Kullanıcı detay sayfası yüklenirken hata:', error);
    res.status(500).render('error', {
      title: 'Hata',
      error: {
        status: 500,
        message: 'Kullanıcı detayları yüklenirken bir hata oluştu.'
      }
    });
  }
});

/**
 * Admin Tarama Yönetimi Sayfası
 * GET /admin/scans
 */
router.get('/scans', async (req, res) => {
  try {
    // Tüm taramaları getir (son 100)
    const scans = await ScanResult.findRecent(100);
    
    // Toplam tarama sayısını al
    const totalScans = await ScanResult.count();
    
    res.render('admin/scans', {
      title: 'Admin - Tarama Yönetimi',
      scans,
      totalScans,
      success: req.query.success,
      error: req.query.error
    });
  } catch (error) {
    console.error('Tarama yönetimi sayfası yüklenirken hata:', error);
    res.status(500).render('error', {
      title: 'Hata',
      error: {
        status: 500,
        message: 'Tarama listesi yüklenirken bir hata oluştu.'
      }
    });
  }
});

/**
 * Admin Tarama Detay Sayfası
 * GET /admin/scans/:scanId
 */
router.get('/scans/:scanId', async (req, res) => {
  try {
    const scanId = req.params.scanId;
    
    // Taramayı getir
    const scan = await ScanResult.findById(scanId);
    
    if (!scan) {
      return res.status(404).render('error', {
        title: 'Hata',
        error: {
          status: 404,
          message: 'Tarama bulunamadı.'
        }
      });
    }
    
    // Kullanıcıyı getir (eğer tarama bir kullanıcıya aitse)
    let user = null;
    if (scan.userId) {
      user = await User.findById(scan.userId);
    }
    
    res.render('admin/scan-detail', {
      title: 'Admin - Tarama Detayı',
      scan,
      user,
      success: req.query.success,
      error: req.query.error
    });
  } catch (error) {
    console.error('Tarama detay sayfası yüklenirken hata:', error);
    res.status(500).render('error', {
      title: 'Hata',
      error: {
        status: 500,
        message: 'Tarama detayları yüklenirken bir hata oluştu.'
      }
    });
  }
});

/**
 * Admin İstatistikler Sayfası
 * GET /admin/stats
 */
router.get('/stats', async (req, res) => {
  try {
    // İstatistikleri getir
    const userCount = await User.count();
    const threatCount = await Threat.count();
    const scanCount = await ScanResult.count();
    const activeThreats = await Threat.count({ isCleaned: false });
    const cleanedThreats = await Threat.count({ isCleaned: true });
    
    // Threat type dağılımı
    const threats = await Threat.findAll();
    
    // Tarama tipi dağılımı
    const scans = await ScanResult.findRecent(500);
    
    // Tiplerin dağılımını hesapla
    const threatTypeDistribution = {};
    threats.forEach(threat => {
      if (!threatTypeDistribution[threat.type]) {
        threatTypeDistribution[threat.type] = 0;
      }
      threatTypeDistribution[threat.type]++;
    });
    
    const scanTypeDistribution = {};
    scans.forEach(scan => {
      if (!scanTypeDistribution[scan.type]) {
        scanTypeDistribution[scan.type] = 0;
      }
      scanTypeDistribution[scan.type]++;
    });
    
    res.render('admin/stats', {
      title: 'Admin - İstatistikler',
      stats: {
        userCount,
        threatCount,
        scanCount,
        activeThreats,
        cleanedThreats,
        threatTypeDistribution,
        scanTypeDistribution
      }
    });
  } catch (error) {
    console.error('İstatistikler sayfası yüklenirken hata:', error);
    res.status(500).render('error', {
      title: 'Hata',
      error: {
        status: 500,
        message: 'İstatistikler yüklenirken bir hata oluştu.'
      }
    });
  }
});

/**
 * Kullanıcı Ekleme (POST işlemi)
 * POST /admin/users/add
 */
router.post('/users/add', async (req, res) => {
  try {
    const { email, displayName, isAdmin } = req.body;
    
    if (!email) {
      return res.redirect('/admin/users?error=E-posta adresi gereklidir');
    }
    
    // Kullanıcı var mı kontrol et
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.redirect('/admin/users?error=Bu e-posta adresi zaten kullanılıyor');
    }
    
    // Yeni kullanıcı oluştur
    const user = new User(
      uuidv4(),
      email,
      displayName || email.split('@')[0],
      null,
      isAdmin === 'true'
    );
    
    await user.save();
    
    res.redirect('/admin/users?success=Kullanıcı başarıyla eklendi');
  } catch (error) {
    console.error('Kullanıcı eklenirken hata:', error);
    res.redirect('/admin/users?error=Kullanıcı eklenirken bir hata oluştu');
  }
});

/**
 * Kullanıcı Güncelleme (POST işlemi)
 * POST /admin/users/update
 */
router.post('/users/update', async (req, res) => {
  try {
    const { userId, email, displayName, isAdmin } = req.body;
    
    if (!userId) {
      return res.redirect('/admin/users?error=Kullanıcı ID gereklidir');
    }
    
    // Kullanıcıyı getir
    const user = await User.findById(userId);
    
    if (!user) {
      return res.redirect('/admin/users?error=Kullanıcı bulunamadı');
    }
    
    // E-posta değiştiyse, daha önce kullanılıyor mu kontrol et
    if (email && email !== user.email) {
      const existingUser = await User.findByEmail(email);
      if (existingUser && existingUser.id !== userId) {
        return res.redirect(`/admin/users/${userId}?error=Bu e-posta adresi zaten kullanılıyor`);
      }
      user.email = email;
    }
    
    // Kullanıcı bilgilerini güncelle
    if (displayName) user.displayName = displayName;
    if (isAdmin !== undefined) user.isAdmin = isAdmin === 'true';
    
    await user.save();
    
    res.redirect(`/admin/users/${userId}?success=Kullanıcı başarıyla güncellendi`);
  } catch (error) {
    console.error('Kullanıcı güncellenirken hata:', error);
    res.redirect('/admin/users?error=Kullanıcı güncellenirken bir hata oluştu');
  }
});

/**
 * Kullanıcı Silme (POST işlemi)
 * POST /admin/users/delete
 */
router.post('/users/delete', async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.redirect('/admin/users?error=Kullanıcı ID gereklidir');
    }
    
    // Admin kullanıcısı silinemez kontrolü
    if (userId === 'admin') {
      return res.redirect('/admin/users?error=Admin kullanıcısı silinemez');
    }
    
    // Kullanıcıyı getir
    const user = await User.findById(userId);
    
    if (!user) {
      return res.redirect('/admin/users?error=Kullanıcı bulunamadı');
    }
    
    // Kullanıcıyı sil
    // Bu bir demo, gerçek bir uygulama için veritabanında silme işlemi yapılmalı
    const db = require('../config/database').getDb();
    await db.collection('users').deleteOne({ id: userId });
    
    res.redirect('/admin/users?success=Kullanıcı başarıyla silindi');
  } catch (error) {
    console.error('Kullanıcı silinirken hata:', error);
    res.redirect('/admin/users?error=Kullanıcı silinirken bir hata oluştu');
  }
});

/**
 * Tarama Silme (POST işlemi)
 * POST /admin/scans/delete
 */
router.post('/scans/delete', async (req, res) => {
  try {
    const { scanId } = req.body;
    
    if (!scanId) {
      return res.redirect('/admin/scans?error=Tarama ID gereklidir');
    }
    
    // Taramayı getir
    const scan = await ScanResult.findById(scanId);
    
    if (!scan) {
      return res.redirect('/admin/scans?error=Tarama bulunamadı');
    }
    
    // Taramayı sil
    // Bu bir demo, gerçek bir uygulama için veritabanında silme işlemi yapılmalı
    const db = require('../config/database').getDb();
    await db.collection('scan_results').deleteOne({ id: scanId });
    
    res.redirect('/admin/scans?success=Tarama başarıyla silindi');
  } catch (error) {
    console.error('Tarama silinirken hata:', error);
    res.redirect('/admin/scans?error=Tarama silinirken bir hata oluştu');
  }
});

module.exports = router;