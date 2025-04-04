/**
 * Kimlik Doğrulama Rotaları
 * Kullanıcı girişi, kaydı ve çıkışı için router
 */

const express = require('express');
const router = express.Router();
const User = require('../models/user');
const { isNotAuthenticated } = require('../middleware/auth');
const firebaseConfig = require('../config/firebase');

/**
 * Giriş Sayfası
 */
router.get('/login', isNotAuthenticated, (req, res) => {
  const redirect = req.query.redirect || '/dashboard';
  
  res.render('auth/login', {
    title: 'Giriş Yap',
    redirect
  });
});

/**
 * Giriş İşlemi
 */
router.post('/login', isNotAuthenticated, async (req, res) => {
  try {
    const { email, password } = req.body;
    const redirect = req.body.redirect || '/dashboard';
    
    if (!email || !password) {
      return res.render('auth/login', {
        title: 'Giriş Yap',
        error: 'E-posta ve şifre gereklidir.',
        redirect
      });
    }
    
    // Demo admin hesabı kontrolü
    if (email === 'admin@example.com' && password === 'password') {
      const user = await User.findByEmail(email);
      
      if (user) {
        // Kullanıcıyı oturuma ekle
        req.session.user = user.toJSON();
        return res.redirect(redirect);
      } else {
        // Admin kullanıcısı oluştur
        const newUser = new User('admin123', email, 'Admin', null, true);
        await newUser.save();
        
        // Kullanıcıyı oturuma ekle
        req.session.user = newUser.toJSON();
        return res.redirect(redirect);
      }
    }
    
    // Firebase Auth ile kimlik doğrulama
    const auth = firebaseConfig.getAuth();
    
    if (auth) {
      try {
        // Firebase ile giriş
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        const firebaseUser = userCredential.user;
        
        // Veritabanında kullanıcı kontrolü
        let user = await User.findByEmail(email);
        
        if (!user) {
          // Kullanıcı yoksa oluştur
          user = new User(
            firebaseUser.uid,
            email,
            firebaseUser.displayName,
            firebaseUser.photoURL
          );
          await user.save();
        }
        
        // Kullanıcıyı oturuma ekle
        req.session.user = user.toJSON();
        return res.redirect(redirect);
      } catch (firebaseError) {
        console.error('Firebase giriş hatası:', firebaseError);
        return res.render('auth/login', {
          title: 'Giriş Yap',
          error: 'Geçersiz e-posta veya şifre.',
          redirect
        });
      }
    } else {
      // Demo mod - sadece demo kullanıcılar için
      if (email.endsWith('@demo.com') && password === 'demo123') {
        let user = await User.findByEmail(email);
        
        if (!user) {
          // Demo kullanıcı oluştur
          user = new User(
            `demo_${Date.now()}`,
            email,
            email.split('@')[0],
            null
          );
          await user.save();
        }
        
        // Kullanıcıyı oturuma ekle
        req.session.user = user.toJSON();
        return res.redirect(redirect);
      } else {
        return res.render('auth/login', {
          title: 'Giriş Yap',
          error: 'Geçersiz e-posta veya şifre.',
          redirect
        });
      }
    }
  } catch (error) {
    console.error('Giriş sırasında hata:', error);
    res.render('auth/login', {
      title: 'Giriş Yap',
      error: 'Giriş sırasında bir hata oluştu.'
    });
  }
});

/**
 * Kayıt Sayfası
 */
router.get('/register', isNotAuthenticated, (req, res) => {
  res.render('auth/register', {
    title: 'Kayıt Ol'
  });
});

/**
 * Kayıt İşlemi
 */
router.post('/register', isNotAuthenticated, async (req, res) => {
  try {
    const { email, password, displayName } = req.body;
    
    if (!email || !password) {
      return res.render('auth/register', {
        title: 'Kayıt Ol',
        error: 'E-posta ve şifre gereklidir.',
        user: { email, displayName }
      });
    }
    
    // E-posta formatı kontrolü
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.render('auth/register', {
        title: 'Kayıt Ol',
        error: 'Geçerli bir e-posta adresi giriniz.',
        user: { email, displayName }
      });
    }
    
    // Şifre uzunluğu kontrolü
    if (password.length < 6) {
      return res.render('auth/register', {
        title: 'Kayıt Ol',
        error: 'Şifre en az 6 karakter olmalıdır.',
        user: { email, displayName }
      });
    }
    
    // Kullanıcı zaten var mı?
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.render('auth/register', {
        title: 'Kayıt Ol',
        error: 'Bu e-posta adresi zaten kullanılmaktadır.',
        user: { email, displayName }
      });
    }
    
    // Firebase Auth ile kayıt
    const auth = firebaseConfig.getAuth();
    
    if (auth) {
      try {
        // Firebase ile kayıt
        const userCredential = await auth.createUser({
          email: email,
          password: password,
          displayName: displayName || email.split('@')[0]
        });
        
        const firebaseUser = userCredential;
        
        // Kullanıcı oluştur
        const user = new User(
          firebaseUser.uid,
          email,
          displayName || email.split('@')[0]
        );
        await user.save();
        
        // Otomatik giriş yap
        req.session.user = user.toJSON();
        
        return res.redirect('/dashboard');
      } catch (firebaseError) {
        console.error('Firebase kayıt hatası:', firebaseError);
        return res.render('auth/register', {
          title: 'Kayıt Ol',
          error: 'Kayıt sırasında bir hata oluştu.',
          user: { email, displayName }
        });
      }
    } else {
      // Demo mod - Firebase olmadan kayıt
      const user = new User(
        `user_${Date.now()}`,
        email,
        displayName || email.split('@')[0]
      );
      await user.save();
      
      // Otomatik giriş yap
      req.session.user = user.toJSON();
      
      return res.redirect('/dashboard');
    }
  } catch (error) {
    console.error('Kayıt sırasında hata:', error);
    res.render('auth/register', {
      title: 'Kayıt Ol',
      error: 'Kayıt sırasında bir hata oluştu.',
      user: req.body
    });
  }
});

/**
 * Şifremi Unuttum Sayfası
 */
router.get('/forgot-password', isNotAuthenticated, (req, res) => {
  res.render('auth/forgot-password', {
    title: 'Şifremi Unuttum'
  });
});

/**
 * Şifremi Unuttum İşlemi
 */
router.post('/forgot-password', isNotAuthenticated, async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.render('auth/forgot-password', {
        title: 'Şifremi Unuttum',
        error: 'E-posta adresi gereklidir.'
      });
    }
    
    // Firebase Auth ile şifre sıfırlama
    const auth = firebaseConfig.getAuth();
    
    if (auth) {
      try {
        await auth.generatePasswordResetLink(email);
        return res.render('auth/forgot-password', {
          title: 'Şifremi Unuttum',
          success: 'Şifre sıfırlama bağlantısı e-posta adresinize gönderildi.'
        });
      } catch (firebaseError) {
        console.error('Firebase şifre sıfırlama hatası:', firebaseError);
        return res.render('auth/forgot-password', {
          title: 'Şifremi Unuttum',
          error: 'Şifre sıfırlama bağlantısı gönderilemedi.'
        });
      }
    } else {
      // Demo mod mesajı
      return res.render('auth/forgot-password', {
        title: 'Şifremi Unuttum',
        success: 'Demo modunda şifre sıfırlama işlemi simüle edildi. Gerçek bir e-posta gönderilmedi.'
      });
    }
  } catch (error) {
    console.error('Şifre sıfırlama sırasında hata:', error);
    res.render('auth/forgot-password', {
      title: 'Şifremi Unuttum',
      error: 'Şifre sıfırlama sırasında bir hata oluştu.'
    });
  }
});

/**
 * Çıkış İşlemi
 */
router.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

module.exports = router;