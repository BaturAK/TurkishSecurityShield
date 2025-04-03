/**
 * Kimlik Doğrulama Rotaları
 * Kullanıcı girişi, kaydı ve çıkışı için router
 */

const express = require('express');
const router = express.Router();
const { isAuthenticated, isNotAuthenticated } = require('../middleware/auth');
const User = require('../models/user');
const firebase = require('../config/firebase');
const { getAuth } = require('../config/firebase');

// Giriş sayfası
router.get('/login', isNotAuthenticated, (req, res) => {
  const returnUrl = req.query.returnUrl || '/dashboard';
  
  res.render('auth/login', {
    title: 'Giriş Yap',
    returnUrl,
    styles: []
  });
});

// Giriş işlemi
router.post('/login', isNotAuthenticated, async (req, res) => {
  try {
    const { email, password, rememberMe } = req.body;
    const returnUrl = req.query.returnUrl || '/dashboard';
    
    if (!email || !password) {
      res.locals.addMessage('warning', 'E-posta ve şifre gereklidir');
      return res.render('auth/login', {
        title: 'Giriş Yap',
        returnUrl,
        styles: []
      });
    }
    
    // Firebase Auth kullan
    const auth = getAuth();
    
    if (!auth) {
      throw new Error('Firebase kimlik doğrulama servisi kullanılamıyor');
    }
    
    // Firebase ile giriş
    try {
      const userCredential = await auth.signInWithEmailAndPassword(email, password);
      const firebaseUser = userCredential.user;
      
      if (!firebaseUser) {
        throw new Error('Kullanıcı bilgileri alınamadı');
      }
      
      // MongoDB'de kullanıcı kontrolü
      let user = await User.findByEmail(email);
      
      if (!user) {
        // Kullanıcı MongoDB'de yoksa oluştur
        user = new User(
          firebaseUser.uid,
          email,
          firebaseUser.displayName,
          firebaseUser.photoURL
        );
        
        await user.save();
      } else {
        // Kullanıcı son giriş zamanını güncelle
        user.lastLoginAt = new Date();
        await user.save();
      }
      
      // Oturum bilgilerini kaydet
      req.session.user = user.toJSON();
      
      // Remember Me özelliği için oturum süresini ayarla
      if (rememberMe) {
        req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 gün
      }
      
      res.locals.addMessage('success', 'Başarıyla giriş yaptınız');
      res.redirect(returnUrl);
    } catch (firebaseError) {
      console.error('Firebase giriş hatası:', firebaseError);
      
      // Hata mesajını kullanıcıya göster
      let errorMessage = 'Giriş yapılırken bir hata oluştu';
      
      if (firebaseError.code === 'auth/user-not-found' || firebaseError.code === 'auth/wrong-password') {
        errorMessage = 'E-posta veya şifre hatalı';
      } else if (firebaseError.code === 'auth/too-many-requests') {
        errorMessage = 'Çok fazla başarısız giriş denemesi. Lütfen daha sonra tekrar deneyin';
      } else if (firebaseError.code === 'auth/user-disabled') {
        errorMessage = 'Bu hesap devre dışı bırakılmış';
      }
      
      res.locals.addMessage('danger', errorMessage);
      res.render('auth/login', {
        title: 'Giriş Yap',
        returnUrl,
        email,
        styles: []
      });
    }
  } catch (error) {
    console.error('Giriş hatası:', error);
    res.locals.addMessage('danger', 'Bir hata oluştu. Lütfen daha sonra tekrar deneyin');
    res.render('auth/login', {
      title: 'Giriş Yap',
      returnUrl: req.query.returnUrl || '/dashboard',
      styles: []
    });
  }
});

// Kayıt sayfası
router.get('/register', isNotAuthenticated, (req, res) => {
  res.render('auth/register', {
    title: 'Kayıt Ol',
    styles: []
  });
});

// Kayıt işlemi
router.post('/register', isNotAuthenticated, async (req, res) => {
  try {
    const { email, password, confirmPassword, displayName, termsAgreed } = req.body;
    
    // Zorunlu alanlar
    if (!email || !password || !confirmPassword || !displayName) {
      res.locals.addMessage('warning', 'Tüm alanları doldurmanız gerekiyor');
      return res.render('auth/register', {
        title: 'Kayıt Ol',
        email,
        displayName,
        styles: []
      });
    }
    
    // Şifre kontrolü
    if (password !== confirmPassword) {
      res.locals.addMessage('warning', 'Şifreler eşleşmiyor');
      return res.render('auth/register', {
        title: 'Kayıt Ol',
        email,
        displayName,
        styles: []
      });
    }
    
    // Kullanım şartları
    if (!termsAgreed) {
      res.locals.addMessage('warning', 'Kullanım şartlarını kabul etmeniz gerekiyor');
      return res.render('auth/register', {
        title: 'Kayıt Ol',
        email,
        displayName,
        styles: []
      });
    }
    
    // Firebase Auth kullan
    const auth = getAuth();
    
    if (!auth) {
      throw new Error('Firebase kimlik doğrulama servisi kullanılamıyor');
    }
    
    // MongoDB'de kullanıcı kontrolü
    const existingUser = await User.findByEmail(email);
    
    if (existingUser) {
      res.locals.addMessage('warning', 'Bu e-posta adresi zaten kullanılıyor');
      return res.render('auth/register', {
        title: 'Kayıt Ol',
        displayName,
        styles: []
      });
    }
    
    // Firebase ile kayıt
    try {
      const userCredential = await auth.createUserWithEmailAndPassword(email, password);
      const firebaseUser = userCredential.user;
      
      if (!firebaseUser) {
        throw new Error('Kullanıcı oluşturulamadı');
      }
      
      // Displayname güncelle
      await firebaseUser.updateProfile({
        displayName: displayName
      });
      
      // MongoDB'ye kullanıcı kaydet
      const user = new User(
        firebaseUser.uid,
        email,
        displayName,
        null, // photoURL
        false // isAdmin
      );
      
      await user.save();
      
      // Oturum bilgilerini kaydet
      req.session.user = user.toJSON();
      
      res.locals.addMessage('success', 'Hesabınız başarıyla oluşturuldu');
      res.redirect('/dashboard');
    } catch (firebaseError) {
      console.error('Firebase kayıt hatası:', firebaseError);
      
      // Hata mesajını kullanıcıya göster
      let errorMessage = 'Kayıt yapılırken bir hata oluştu';
      
      if (firebaseError.code === 'auth/email-already-in-use') {
        errorMessage = 'Bu e-posta adresi zaten kullanılıyor';
      } else if (firebaseError.code === 'auth/weak-password') {
        errorMessage = 'Şifre çok zayıf. En az 6 karakter kullanın';
      } else if (firebaseError.code === 'auth/invalid-email') {
        errorMessage = 'Geçersiz e-posta adresi';
      }
      
      res.locals.addMessage('danger', errorMessage);
      res.render('auth/register', {
        title: 'Kayıt Ol',
        displayName,
        styles: []
      });
    }
  } catch (error) {
    console.error('Kayıt hatası:', error);
    res.locals.addMessage('danger', 'Bir hata oluştu. Lütfen daha sonra tekrar deneyin');
    res.render('auth/register', {
      title: 'Kayıt Ol',
      styles: []
    });
  }
});

// Google ile giriş
router.get('/google', isNotAuthenticated, (req, res) => {
  const auth = getAuth();
  const provider = firebase.getGoogleAuthProvider();
  
  if (!auth || !provider) {
    res.locals.addMessage('danger', 'Google ile giriş şu anda kullanılamıyor');
    return res.redirect('/auth/login');
  }
  
  // OAuth 2.0 state parametresi
  const state = Math.random().toString(36).substring(2, 15);
  req.session.oauthState = state;
  
  // Google ile giriş URL'ini oluştur
  const authUrl = `https://accounts.google.com/o/oauth2/auth?client_id=${process.env.FIREBASE_API_KEY}&redirect_uri=${encodeURIComponent(`${req.protocol}://${req.get('host')}/auth/google/callback`)}&response_type=code&scope=email%20profile&state=${state}`;
  
  res.redirect(authUrl);
});

// Google callback
router.get('/google/callback', isNotAuthenticated, async (req, res) => {
  try {
    const { state, code } = req.query;
    
    // State parametresi kontrolü
    if (!state || state !== req.session.oauthState) {
      throw new Error('Güvenlik doğrulaması başarısız');
    }
    
    // Kod kontrolü
    if (!code) {
      throw new Error('Doğrulama kodu eksik');
    }
    
    // TODO: Google token'ı al ve Firebase ile doğrula
    // Bu kısım Firebase Authentication için gerçek bir implementasyon gerektirir
    
    // Mock user (gerçek uygulamada burada Firebase'den gelen kullanıcı bilgilerini kullanın)
    const mockFirebaseUser = {
      uid: 'google-' + Math.random().toString(36).substring(2, 15),
      email: 'user@example.com',
      displayName: 'Google User',
      photoURL: 'https://via.placeholder.com/150'
    };
    
    // MongoDB'de kullanıcı kontrolü
    let user = await User.findByEmail(mockFirebaseUser.email);
    
    if (!user) {
      // Kullanıcı MongoDB'de yoksa oluştur
      user = new User(
        mockFirebaseUser.uid,
        mockFirebaseUser.email,
        mockFirebaseUser.displayName,
        mockFirebaseUser.photoURL
      );
      
      await user.save();
    } else {
      // Kullanıcı bilgilerini güncelle
      user.displayName = mockFirebaseUser.displayName;
      user.photoURL = mockFirebaseUser.photoURL;
      user.lastLoginAt = new Date();
      await user.save();
    }
    
    // Oturum bilgilerini kaydet
    req.session.user = user.toJSON();
    
    res.locals.addMessage('success', 'Google hesabınızla başarıyla giriş yaptınız');
    res.redirect('/dashboard');
  } catch (error) {
    console.error('Google giriş hatası:', error);
    res.locals.addMessage('danger', 'Google ile giriş yapılırken bir hata oluştu');
    res.redirect('/auth/login');
  }
});

// Çıkış yap
router.get('/logout', isAuthenticated, (req, res) => {
  // Firebase çıkışı
  const auth = getAuth();
  if (auth) {
    auth.signOut().catch(error => {
      console.error('Firebase çıkış hatası:', error);
    });
  }
  
  // Oturum bilgilerini temizle
  req.session.destroy(err => {
    if (err) {
      console.error('Oturum sonlandırma hatası:', err);
    }
    
    res.redirect('/');
  });
});

// Şifremi unuttum sayfası
router.get('/forgot-password', isNotAuthenticated, (req, res) => {
  res.render('auth/forgot-password', {
    title: 'Şifremi Unuttum',
    styles: []
  });
});

// Şifremi unuttum işlemi
router.post('/forgot-password', isNotAuthenticated, async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      res.locals.addMessage('warning', 'E-posta adresinizi girmelisiniz');
      return res.render('auth/forgot-password', {
        title: 'Şifremi Unuttum',
        styles: []
      });
    }
    
    // Firebase Auth kullan
    const auth = getAuth();
    
    if (!auth) {
      throw new Error('Firebase kimlik doğrulama servisi kullanılamıyor');
    }
    
    // Şifre sıfırlama e-postası gönder
    await auth.sendPasswordResetEmail(email);
    
    res.locals.addMessage('success', 'Şifre sıfırlama bağlantısı e-posta adresinize gönderildi');
    res.redirect('/auth/login');
  } catch (error) {
    console.error('Şifre sıfırlama hatası:', error);
    
    let errorMessage = 'Şifre sıfırlama işlemi sırasında bir hata oluştu';
    
    if (error.code === 'auth/user-not-found') {
      errorMessage = 'Bu e-posta adresine kayıtlı bir hesap bulunamadı';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Geçersiz e-posta adresi';
    }
    
    res.locals.addMessage('danger', errorMessage);
    res.render('auth/forgot-password', {
      title: 'Şifremi Unuttum',
      styles: []
    });
  }
});

module.exports = router;