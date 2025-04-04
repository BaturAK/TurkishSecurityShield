/**
 * Admin Rotaları
 * Admin paneli için router
 */

const express = require('express');
const router = express.Router();
const { isAuthenticated, isAdmin } = require('../middleware/auth');
const User = require('../models/user');
const ScanResult = require('../models/scanResult');
const Threat = require('../models/threat');
const { v4: uuidv4 } = require('uuid');

/**
 * Middleware zincirleri
 * Tüm admin sayfaları için oturum açmış ve admin yetkisine sahip olma kontrolü
 */
router.use(isAuthenticated, isAdmin);

/**
 * Admin Dashboard
 * GET /admin
 */
router.get('/', async (req, res) => {
  try {
    // Son kullanıcılar, taramalar ve tehditler
    const recentUsers = await User.findRecent(5);
    const recentScans = await ScanResult.findRecent(5);
    const activeThreats = await Threat.findAll({ isCleaned: false });
    
    // İstatistikler
    const totalUsers = await User.count();
    const totalScans = await ScanResult.count();
    const totalThreats = await Threat.count();
    const activeThreatsCount = await Threat.count({ isCleaned: false });
    
    res.render('admin/index', {
      title: 'Admin Paneli',
      recentUsers,
      recentScans,
      activeThreats,
      stats: {
        totalUsers,
        totalScans,
        totalThreats,
        activeThreats: activeThreatsCount
      }
    });
  } catch (error) {
    console.error('Admin paneli yüklenirken hata:', error);
    res.status(500).render('error', {
      title: 'Hata',
      error: {
        status: 500,
        message: 'Admin paneli yüklenirken bir hata oluştu.'
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
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;
    
    // Veritabanı bağlantısı
    const db = require('../config/database').getDb();
    const usersCollection = db.collection('users');
    
    // Toplam kullanıcı sayısı
    const totalUsers = await usersCollection.countDocuments();
    const totalPages = Math.ceil(totalUsers / limit);
    
    // Kullanıcıları getir
    const userData = await usersCollection.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();
    
    const users = userData.map(user => new User(
      user._id,
      user.email,
      user.displayName,
      user.photoURL,
      user.isAdmin
    ));
    
    res.render('admin/users', {
      title: 'Kullanıcı Yönetimi',
      users,
      pagination: {
        page,
        totalPages,
        totalItems: totalUsers,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Kullanıcı yönetimi sayfası yüklenirken hata:', error);
    res.status(500).render('error', {
      title: 'Hata',
      error: {
        status: 500,
        message: 'Kullanıcı yönetimi sayfası yüklenirken bir hata oluştu.'
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
    const { userId } = req.params;
    
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
    
    // Kullanıcıya ait son taramalar
    const recentScans = await ScanResult.findByUserId(userId, 5);
    
    // İstatistikler
    const totalScans = await ScanResult.count({ userId });
    
    // Kullanıcı ayarları
    const db = require('../config/database').getDb();
    const usersCollection = db.collection('users');
    const userDetails = await usersCollection.findOne(
      { _id: userId },
      { 
        projection: { 
          settings: 1, 
          isPremium: 1, 
          premiumValidUntil: 1, 
          premiumCode: 1 
        } 
      }
    );
    
    const settings = userDetails?.settings || {
      autoScan: true,
      scanFrequency: 'weekly',
      notifications: true,
      darkMode: false,
      language: 'tr'
    };
    
    const isPremium = userDetails?.isPremium || false;
    const premiumValidUntil = userDetails?.premiumValidUntil || null;
    const premiumCode = userDetails?.premiumCode || null;
    
    res.render('admin/user-detail', {
      title: `Kullanıcı: ${user.displayName}`,
      user,
      recentScans,
      totalScans,
      settings,
      isPremium,
      premiumValidUntil,
      premiumCode
    });
  } catch (error) {
    console.error('Kullanıcı detay sayfası yüklenirken hata:', error);
    res.status(500).render('error', {
      title: 'Hata',
      error: {
        status: 500,
        message: 'Kullanıcı detay sayfası yüklenirken bir hata oluştu.'
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
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;
    
    // Veritabanı bağlantısı
    const db = require('../config/database').getDb();
    const scanResults = db.collection('scanResults');
    
    // Toplam tarama sayısı
    const totalScans = await scanResults.countDocuments();
    const totalPages = Math.ceil(totalScans / limit);
    
    // Taramaları getir
    const scanDataList = await scanResults.find()
      .sort({ startTime: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();
    
    // Kullanıcı bilgilerini getir
    const users = db.collection('users');
    const scans = [];
    
    for (const scanData of scanDataList) {
      let userName = 'Sistem';
      
      if (scanData.userId) {
        const userData = await users.findOne({ _id: scanData.userId });
        if (userData) {
          userName = userData.displayName || userData.email;
        }
      }
      
      scans.push({
        id: scanData._id,
        type: scanData.type,
        startTime: scanData.startTime,
        endTime: scanData.endTime,
        totalScanned: scanData.totalScanned,
        threatCount: scanData.threatsFound.length,
        status: scanData.endTime ? 'COMPLETED' : 'RUNNING',
        userId: scanData.userId,
        userName
      });
    }
    
    res.render('admin/scans', {
      title: 'Tarama Yönetimi',
      scans,
      pagination: {
        page,
        totalPages,
        totalItems: totalScans,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Tarama yönetimi sayfası yüklenirken hata:', error);
    res.status(500).render('error', {
      title: 'Hata',
      error: {
        status: 500,
        message: 'Tarama yönetimi sayfası yüklenirken bir hata oluştu.'
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
    const { scanId } = req.params;
    
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
    
    // Taramayı yapan kullanıcı bilgisi
    let user = null;
    
    if (scanResult.userId) {
      user = await User.findById(scanResult.userId);
    }
    
    res.render('admin/scan-detail', {
      title: `Tarama Detayı: ${scanId}`,
      scanResult,
      user
    });
  } catch (error) {
    console.error('Tarama detay sayfası yüklenirken hata:', error);
    res.status(500).render('error', {
      title: 'Hata',
      error: {
        status: 500,
        message: 'Tarama detay sayfası yüklenirken bir hata oluştu.'
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
    const db = require('../config/database').getDb();
    
    // Toplam kullanıcı, tarama ve tehdit sayıları
    const totalUsers = await User.count();
    const totalScans = await ScanResult.count();
    const totalThreats = await Threat.count();
    const activeThreats = await Threat.count({ isCleaned: false });
    
    // Son 7 günün tarama sayıları
    const scanResults = db.collection('scanResults');
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const dailyScans = await scanResults.aggregate([
      { 
        $match: { 
          startTime: { $gte: sevenDaysAgo } 
        } 
      },
      {
        $group: {
          _id: { 
            $dateToString: { 
              format: '%Y-%m-%d', 
              date: '$startTime' 
            } 
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]).toArray();
    
    // Tehdit tipleri dağılımı
    const threats = db.collection('threats');
    const threatTypes = await threats.aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]).toArray();
    
    // Premium kullanıcı sayısı
    const users = db.collection('users');
    const premiumUsers = await users.countDocuments({ isPremium: true });
    
    res.render('admin/stats', {
      title: 'İstatistikler',
      stats: {
        totalUsers,
        totalScans,
        totalThreats,
        activeThreats,
        premiumUsers,
        premiumPercentage: totalUsers > 0 ? Math.round((premiumUsers / totalUsers) * 100) : 0
      },
      dailyScans,
      threatTypes
    });
  } catch (error) {
    console.error('İstatistikler sayfası yüklenirken hata:', error);
    res.status(500).render('error', {
      title: 'Hata',
      error: {
        status: 500,
        message: 'İstatistikler sayfası yüklenirken bir hata oluştu.'
      }
    });
  }
});

/**
 * Premium Kod Yönetimi Sayfası
 * GET /admin/premium
 */
router.get('/premium', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;
    
    // Veritabanı bağlantısı
    const db = require('../config/database').getDb();
    const premium = db.collection('premium');
    
    // Toplam kod sayısı
    const totalCodes = await premium.countDocuments();
    const totalPages = Math.ceil(totalCodes / limit);
    
    // Kodları getir
    const premiumCodes = await premium.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();
    
    // Kullanıcı bilgilerini ekle
    const users = db.collection('users');
    const codes = [];
    
    for (const code of premiumCodes) {
      let userName = '';
      
      if (code.usedBy) {
        const userData = await users.findOne({ _id: code.usedBy });
        if (userData) {
          userName = userData.displayName || userData.email;
        }
      }
      
      codes.push({
        ...code,
        userName
      });
    }
    
    res.render('admin/premium', {
      title: 'Premium Kod Yönetimi',
      codes,
      pagination: {
        page,
        totalPages,
        totalItems: totalCodes,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Premium kod yönetimi sayfası yüklenirken hata:', error);
    res.status(500).render('error', {
      title: 'Hata',
      error: {
        status: 500,
        message: 'Premium kod yönetimi sayfası yüklenirken bir hata oluştu.'
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
      return res.status(400).json({
        success: false,
        message: 'E-posta adresi gereklidir.'
      });
    }
    
    // E-posta formatı kontrolü
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Geçerli bir e-posta adresi giriniz.'
      });
    }
    
    // Kullanıcı zaten var mı?
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Bu e-posta adresi zaten kullanılmaktadır.'
      });
    }
    
    // Yeni kullanıcı oluştur
    const user = new User(
      `user_${uuidv4().substring(0, 8)}`,
      email,
      displayName || email.split('@')[0],
      null,
      isAdmin === 'true'
    );
    
    await user.save();
    
    res.json({
      success: true,
      message: 'Kullanıcı başarıyla eklendi.',
      user: user.toJSON()
    });
  } catch (error) {
    console.error('Kullanıcı eklenirken hata:', error);
    res.status(500).json({
      success: false,
      message: 'Kullanıcı eklenirken bir hata oluştu.'
    });
  }
});

/**
 * Kullanıcı Güncelleme (POST işlemi)
 * POST /admin/users/update
 */
router.post('/users/update', async (req, res) => {
  try {
    const { userId, displayName, isAdmin, isPremium, validDays } = req.body;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'Kullanıcı ID gereklidir.'
      });
    }
    
    // Kullanıcıyı getir
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Kullanıcı bulunamadı.'
      });
    }
    
    // Kullanıcı bilgilerini güncelle
    if (displayName) user.displayName = displayName;
    if (isAdmin !== undefined) user.isAdmin = isAdmin === 'true';
    
    await user.save();
    
    // Premium durumu güncelleme
    if (isPremium !== undefined) {
      const db = require('../config/database').getDb();
      const usersCollection = db.collection('users');
      
      const updateData = {
        isPremium: isPremium === 'true'
      };
      
      // Premium geçerlilik süresi
      if (isPremium === 'true' && validDays) {
        updateData.premiumValidUntil = new Date(Date.now() + (parseInt(validDays) * 24 * 60 * 60 * 1000));
      }
      
      await usersCollection.updateOne(
        { _id: userId },
        { $set: updateData }
      );
    }
    
    res.json({
      success: true,
      message: 'Kullanıcı başarıyla güncellendi.',
      user: {
        ...user.toJSON(),
        isPremium: isPremium === 'true'
      }
    });
  } catch (error) {
    console.error('Kullanıcı güncellenirken hata:', error);
    res.status(500).json({
      success: false,
      message: 'Kullanıcı güncellenirken bir hata oluştu.'
    });
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
      return res.status(400).json({
        success: false,
        message: 'Kullanıcı ID gereklidir.'
      });
    }
    
    // Kendini silmeye çalışıyor mu?
    if (userId === req.session.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Kendi hesabınızı silemezsiniz.'
      });
    }
    
    // Kullanıcıyı getir
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Kullanıcı bulunamadı.'
      });
    }
    
    // Kullanıcıyı sil
    const db = require('../config/database').getDb();
    const usersCollection = db.collection('users');
    
    await usersCollection.deleteOne({ _id: userId });
    
    res.json({
      success: true,
      message: 'Kullanıcı başarıyla silindi.'
    });
  } catch (error) {
    console.error('Kullanıcı silinirken hata:', error);
    res.status(500).json({
      success: false,
      message: 'Kullanıcı silinirken bir hata oluştu.'
    });
  }
});

/**
 * Premium Kod Oluşturma (POST işlemi)
 * POST /admin/premium/generate
 */
router.post('/premium/generate', async (req, res) => {
  try {
    const { count, validDays } = req.body;
    
    const codeCount = parseInt(count) || 1;
    const days = parseInt(validDays) || 365;
    
    if (codeCount <= 0 || codeCount > 100) {
      return res.status(400).json({
        success: false,
        message: 'Kod sayısı 1 ile 100 arasında olmalıdır.'
      });
    }
    
    if (days <= 0 || days > 3650) {
      return res.status(400).json({
        success: false,
        message: 'Geçerlilik süresi 1 ile 3650 gün arasında olmalıdır.'
      });
    }
    
    // Kodları oluştur
    const db = require('../config/database').getDb();
    const premium = db.collection('premium');
    
    const codes = [];
    
    for (let i = 0; i < codeCount; i++) {
      // 10 haneli kod oluştur
      const code = Math.floor(1000000000 + Math.random() * 9000000000).toString();
      
      const premiumCode = {
        _id: `premium_${uuidv4().substring(0, 8)}`,
        code,
        isUsed: false,
        validDays: days,
        createdAt: new Date(),
        createdBy: req.session.user.id
      };
      
      await premium.insertOne(premiumCode);
      codes.push(premiumCode);
    }
    
    res.json({
      success: true,
      message: `${codeCount} adet premium kod başarıyla oluşturuldu.`,
      codes
    });
  } catch (error) {
    console.error('Premium kod oluşturulurken hata:', error);
    res.status(500).json({
      success: false,
      message: 'Premium kod oluşturulurken bir hata oluştu.'
    });
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
      return res.status(400).json({
        success: false,
        message: 'Tarama ID gereklidir.'
      });
    }
    
    // Taramayı getir
    const scanResult = await ScanResult.findById(scanId);
    
    if (!scanResult) {
      return res.status(404).json({
        success: false,
        message: 'Tarama bulunamadı.'
      });
    }
    
    // Taramayı sil
    const db = require('../config/database').getDb();
    const scanResults = db.collection('scanResults');
    
    await scanResults.deleteOne({ _id: scanId });
    
    res.json({
      success: true,
      message: 'Tarama başarıyla silindi.'
    });
  } catch (error) {
    console.error('Tarama silinirken hata:', error);
    res.status(500).json({
      success: false,
      message: 'Tarama silinirken bir hata oluştu.'
    });
  }
});

module.exports = router;