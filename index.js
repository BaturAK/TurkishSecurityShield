/**
 * AntiVirüs Uygulaması Ana Sunucu Dosyası
 * Express.js web sunucusu
 */
require('dotenv').config();
const express = require('express');
const path = require('path');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const { connectToDatabase } = require('./config/database');
const { testFirebaseConnection } = require('./config/firebase');
const expressLayouts = require('express-ejs-layouts');

// Express uygulamasını oluştur
const app = express();
const PORT = process.env.PORT || 5000;

// View engine ayarları
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('layout', 'layout');
app.use(expressLayouts);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Oturum ayarları
app.use(session({
  secret: process.env.SESSION_SECRET || 'antivirus-app-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // HTTPS için
    maxAge: 24 * 60 * 60 * 1000 // 1 gün
  }
}));

// Express Middleware - istek bilgilerini logla
app.use((req, res, next) => {
  console.log(`${new Date().toLocaleTimeString()} - ${req.method} ${req.path}`);
  next();
});

// Veritabanı bağlantısını başlat
connectToDatabase()
  .then(() => {
    console.log('Veritabanı başarıyla bağlandı ve hazır.');
  })
  .catch(err => {
    console.error('Veritabanı bağlantı hatası:', err);
  });

// Firebase bağlantısını test et
testFirebaseConnection();

// Rotalar
const indexRoutes = require('./routes/index');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');

app.use('/', indexRoutes);
app.use('/auth', authRoutes);
app.use('/admin', adminRoutes);

// 404 - Sayfa Bulunamadı
app.use((req, res, next) => {
  res.status(404).render('error', { 
    title: 'Sayfa Bulunamadı',
    message: 'Aradığınız sayfa bulunamadı.',
    user: req.session?.user,
    isLoggedIn: !!req.session?.user
  });
});

// 500 - Sunucu Hatası
app.use((err, req, res, next) => {
  console.error('Sunucu hatası:', err);
  res.status(500).render('error', { 
    title: 'Sunucu Hatası',
    message: 'Bir sunucu hatası oluştu. Lütfen daha sonra tekrar deneyin.',
    user: req.session?.user,
    isLoggedIn: !!req.session?.user
  });
});

// Sunucuyu başlat
app.listen(PORT, '0.0.0.0', () => {
  console.log(`AntiVirüs Uygulaması sunucusu şu adreste çalışıyor: http://localhost:${PORT}`);
});