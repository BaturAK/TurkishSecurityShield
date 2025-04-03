/**
 * Kimlik Doğrulama Rotaları
 * Kullanıcı girişi, kaydı ve çıkışı için router
 */

const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');

// Models
const User = require('../models/user');

// Middleware
const authMiddleware = require('../middleware/auth');

// Firebase
const firebaseConfig = require('../config/firebase');

/**
 * Giriş Sayfası
 */
router.get('/login', authMiddleware.isNotAuthenticated, (req, res) => {
  res.render('auth/login', { 
    title: 'Giriş Yap',
    error: req.query.error
  });
});

/**
 * Giriş İşlemi
 */
router.post('/login', authMiddleware.isNotAuthenticated, async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Basit doğrulama kontrolleri
    if (!email || !password) {
      return res.render('auth/login', {
        title: 'Giriş Yap',
        error: 'E-posta ve şifre girilmelidir.'
      });
    }
    
    // Demo amaçlı basit bir giriş mantığı
    // Gerçek bir uygulamada Firebase Auth veya başka bir kimlik doğrulama kullanılmalı
    const user = await User.findByEmail(email);
    
    if (!user) {
      return res.render('auth/login', {
        title: 'Giriş Yap',
        error: 'Kullanıcı bulunamadı.'
      });
    }
    
    // Demo amaçlı admin için basit bir şifre kontrolü
    // NOT: Gerçek bir uygulamada şifreler plain text olarak saklanmaz!
    if (email === 'admin@example.com' && password === 'password') {
      // Admin girişi
      req.session.user = user.toJSON();
      
      // Kullanıcının son giriş tarihini güncelle
      user.lastLogin = new Date();
      await user.save();
      
      // Geri dönüş URL'i varsa oraya, yoksa dashboard'a yönlendir
      const returnTo = req.session.returnTo || '/admin';
      delete req.session.returnTo;
      return res.redirect(returnTo);
    } else {
      // Demo amaçlı normal kullanıcılar için basit bir şifre kontrolü
      // NOT: Gerçek bir uygulamada şifreler plain text olarak saklanmaz!
      if (password === 'password') {
        req.session.user = user.toJSON();
        
        // Kullanıcının son giriş tarihini güncelle
        user.lastLogin = new Date();
        await user.save();
        
        // Geri dönüş URL'i varsa oraya, yoksa dashboard'a yönlendir
        const returnTo = req.session.returnTo || '/dashboard';
        delete req.session.returnTo;
        return res.redirect(returnTo);
      } else {
        return res.render('auth/login', {
          title: 'Giriş Yap',
          error: 'Geçersiz şifre.'
        });
      }
    }
  } catch (error) {
    console.error('Giriş işlemi sırasında hata:', error);
    res.render('auth/login', {
      title: 'Giriş Yap',
      error: 'Giriş yapılırken bir hata oluştu. Lütfen tekrar deneyin.'
    });
  }
});

/**
 * Kayıt Sayfası
 */
router.get('/register', authMiddleware.isNotAuthenticated, (req, res) => {
  res.render('auth/register', { 
    title: 'Kayıt Ol',
    error: req.query.error
  });
});

/**
 * Kayıt İşlemi
 */
router.post('/register', authMiddleware.isNotAuthenticated, async (req, res) => {
  try {
    const { email, password, confirmPassword, displayName } = req.body;
    
    // Basit doğrulama kontrolleri
    if (!email || !password || !confirmPassword) {
      return res.render('auth/register', {
        title: 'Kayıt Ol',
        error: 'Tüm gerekli alanlar doldurulmalıdır.'
      });
    }
    
    if (password !== confirmPassword) {
      return res.render('auth/register', {
        title: 'Kayıt Ol',
        error: 'Şifreler eşleşmiyor.'
      });
    }
    
    // E-posta kullanılıyor mu kontrol et
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.render('auth/register', {
        title: 'Kayıt Ol',
        error: 'Bu e-posta adresi zaten kullanılıyor.'
      });
    }
    
    // Demo amaçlı kullanıcı oluşturma
    // Gerçek bir uygulamada Firebase Auth veya başka bir kimlik doğrulama kullanılmalı
    const newUser = new User(
      uuidv4(),
      email,
      displayName || email.split('@')[0],
      null,
      false
    );
    
    await newUser.save();
    
    // Kullanıcıyı oturum aç ve dashboard'a yönlendir
    req.session.user = newUser.toJSON();
    res.redirect('/dashboard');
  } catch (error) {
    console.error('Kayıt işlemi sırasında hata:', error);
    res.render('auth/register', {
      title: 'Kayıt Ol',
      error: 'Kayıt olurken bir hata oluştu. Lütfen tekrar deneyin.'
    });
  }
});

/**
 * Şifremi Unuttum Sayfası
 */
router.get('/forgot-password', authMiddleware.isNotAuthenticated, (req, res) => {
  res.render('auth/forgot-password', { 
    title: 'Şifremi Unuttum',
    error: req.query.error,
    success: req.query.success
  });
});

/**
 * Şifremi Unuttum İşlemi
 */
router.post('/forgot-password', authMiddleware.isNotAuthenticated, async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.render('auth/forgot-password', {
        title: 'Şifremi Unuttum',
        error: 'E-posta adresi girilmelidir.'
      });
    }
    
    // Kullanıcı var mı kontrol et
    const user = await User.findByEmail(email);
    
    if (!user) {
      // Güvenlik nedeniyle kullanıcı bulunamadı hatası vermiyoruz
      // Kullanıcının var olup olmadığını ifşa etmemek için başarılı mesajı gösteriyoruz
      return res.render('auth/forgot-password', {
        title: 'Şifremi Unuttum',
        success: 'Şifre sıfırlama bağlantısı e-posta adresinize gönderildi. Lütfen e-postanızı kontrol edin.'
      });
    }
    
    // Gerçek bir uygulamada şifre sıfırlama e-postası gönderilir
    res.render('auth/forgot-password', {
      title: 'Şifremi Unuttum',
      success: 'Şifre sıfırlama bağlantısı e-posta adresinize gönderildi. Lütfen e-postanızı kontrol edin.'
    });
  } catch (error) {
    console.error('Şifre sıfırlama işlemi sırasında hata:', error);
    res.render('auth/forgot-password', {
      title: 'Şifremi Unuttum',
      error: 'Şifre sıfırlama işlemi sırasında bir hata oluştu. Lütfen tekrar deneyin.'
    });
  }
});

/**
 * Çıkış İşlemi
 */
router.get('/logout', (req, res) => {
  // Oturumu sonlandır
  req.session.destroy(err => {
    if (err) {
      console.error('Oturum sonlandırılırken hata:', err);
    }
    res.redirect('/auth/login');
  });
});

module.exports = router;