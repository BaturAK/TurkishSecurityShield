/**
 * Kimlik Doğrulama Rotaları
 * Kullanıcı girişi, kaydı ve çıkışı için router
 */

const express = require('express');
const router = express.Router();
const { isNotAuthenticated, isAuthenticated } = require('../middleware/auth');
const User = require('../models/user');

// Giriş Sayfası
router.get('/login', isNotAuthenticated, (req, res) => {
  res.render('auth/login', { 
    title: 'Giriş Yap',
    activeLink: 'login'
  });
});

// Giriş İşlemi (POST)
router.post('/login', isNotAuthenticated, async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // E-posta doğrulama
    if (!email || !email.includes('@')) {
      return res.render('auth/login', {
        title: 'Giriş Yap',
        activeLink: 'login',
        error: 'Geçerli bir e-posta adresi giriniz.',
        email
      });
    }
    
    // Şifre doğrulama
    if (!password || password.length < 6) {
      return res.render('auth/login', {
        title: 'Giriş Yap',
        activeLink: 'login',
        error: 'Şifre en az 6 karakter olmalıdır.',
        email
      });
    }
    
    // Demo amaçlı basitleştirilmiş giriş (gerçek uygulamada Firebase Authentication kullanılacak)
    // Gerçek uygulamada ASLA şifre doğrudan karşılaştırılmaz!
    // Bu demo versiyonunda 'test@example.com' / 'password123' kullanıcısı ile giriş yapılabilir
    
    if (email === 'test@example.com' && password === 'password123') {
      // Kullanıcıyı bul veya oluştur
      let user = await User.findByEmail(email);
      
      if (!user) {
        // Yeni kullanıcı oluştur
        user = new User(
          null, // otomatik ID
          email,
          'Test Kullanıcı',
          'https://ui-avatars.com/api/?name=Test+Kullanıcı&background=0D8ABC&color=fff',
          false // admin değil
        );
        
        await User.saveUserToDb(user);
      }
      
      // Oturum oluştur
      req.session.user = user;
      
      // Yönlendirme
      const returnTo = req.session.returnTo || '/dashboard';
      delete req.session.returnTo;
      
      return res.redirect(returnTo);
    }
    
    // Admin demo hesabı
    if (email === 'admin@example.com' && password === 'admin123') {
      // Kullanıcıyı bul veya oluştur
      let user = await User.findByEmail(email);
      
      if (!user) {
        // Yeni admin kullanıcı oluştur
        user = new User(
          null, // otomatik ID
          email,
          'Admin Kullanıcı',
          'https://ui-avatars.com/api/?name=Admin+Kullanıcı&background=DC3545&color=fff',
          true // admin
        );
        
        await User.saveUserToDb(user);
      }
      
      // Oturum oluştur
      req.session.user = user;
      
      // Yönlendirme
      const returnTo = req.session.returnTo || '/admin/dashboard';
      delete req.session.returnTo;
      
      return res.redirect(returnTo);
    }
    
    // Geçersiz kimlik bilgileri
    res.render('auth/login', {
      title: 'Giriş Yap',
      activeLink: 'login',
      error: 'E-posta veya şifre hatalı.',
      email
    });
  } catch (error) {
    console.error('Giriş hatası:', error);
    res.render('auth/login', {
      title: 'Giriş Yap',
      activeLink: 'login',
      error: 'Giriş sırasında bir hata oluştu.',
      email: req.body.email
    });
  }
});

// Kayıt Sayfası
router.get('/register', isNotAuthenticated, (req, res) => {
  res.render('auth/register', { 
    title: 'Kayıt Ol',
    activeLink: 'register'
  });
});

// Kayıt İşlemi (POST)
router.post('/register', isNotAuthenticated, async (req, res) => {
  try {
    const { name, email, password, passwordConfirm } = req.body;
    
    // Form doğrulama
    if (!name || !email || !password || !passwordConfirm) {
      return res.render('auth/register', {
        title: 'Kayıt Ol',
        activeLink: 'register',
        error: 'Tüm alanları doldurunuz.',
        name,
        email
      });
    }
    
    // E-posta doğrulama
    if (!email.includes('@')) {
      return res.render('auth/register', {
        title: 'Kayıt Ol',
        activeLink: 'register',
        error: 'Geçerli bir e-posta adresi giriniz.',
        name,
        email
      });
    }
    
    // Şifre doğrulama
    if (password.length < 6) {
      return res.render('auth/register', {
        title: 'Kayıt Ol',
        activeLink: 'register',
        error: 'Şifre en az 6 karakter olmalıdır.',
        name,
        email
      });
    }
    
    // Şifre eşleşme kontrolü
    if (password !== passwordConfirm) {
      return res.render('auth/register', {
        title: 'Kayıt Ol',
        activeLink: 'register',
        error: 'Şifreler eşleşmiyor.',
        name,
        email
      });
    }
    
    // E-posta kullanımda mı kontrolü
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.render('auth/register', {
        title: 'Kayıt Ol',
        activeLink: 'register',
        error: 'Bu e-posta adresi zaten kullanımda.',
        name,
        email
      });
    }
    
    // Demo amaçlı basitleştirilmiş kayıt (gerçek uygulamada Firebase Authentication kullanılacak)
    // Gerçek uygulamada şifre ASLA düz metin olarak saklanmaz!
    
    // Yeni kullanıcı oluştur
    const user = new User(
      null, // otomatik ID 
      email,
      name,
      `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0D8ABC&color=fff`,
      false // admin değil
    );
    
    // Kullanıcıyı veritabanına kaydet
    await User.saveUserToDb(user);
    
    // Otomatik giriş yap
    req.session.user = user;
    
    // Başarı sayfasına yönlendir
    res.redirect('/dashboard?welcome=true');
  } catch (error) {
    console.error('Kayıt hatası:', error);
    res.render('auth/register', {
      title: 'Kayıt Ol',
      activeLink: 'register',
      error: 'Kayıt sırasında bir hata oluştu.',
      name: req.body.name,
      email: req.body.email
    });
  }
});

// Google ile Giriş
router.get('/google', (req, res) => {
  // Gerçek uygulamada Firebase Authentication kullanılacak
  // Demo için standart giriş sayfasına yönlendir
  res.redirect('/auth/login');
});

// Çıkış Yap
router.get('/logout', isAuthenticated, (req, res) => {
  // Oturumu sonlandır
  req.session.destroy(() => {
    res.redirect('/');
  });
});

module.exports = router;