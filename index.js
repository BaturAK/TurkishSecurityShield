/**
 * AntiVirüs Uygulaması Web Arayüzü
 * Express.js ile hazırlanmış web uygulaması
 */

// Temel paketler
const express = require('express');
const path = require('path');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const expressLayouts = require('express-ejs-layouts');
const dotenv = require('dotenv');

// Routes
const indexRoutes = require('./routes/index');
const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const adminRoutes = require('./routes/admin');
const apiRoutes = require('./routes/api');

// Middlewares
const authMiddleware = require('./middleware/auth');

// Database ve Firebase
const database = require('./config/database');
const firebaseConfig = require('./config/firebase');

// .env dosyasını yükle
dotenv.config();

// Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Uygulama yapılandırması
app.set('view engine', 'ejs');
app.set('layout', 'layout');
app.use(expressLayouts);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Session middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'antivirus-app-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 1 gün
  }
}));

// View middleware - kullanıcı bilgilerini tüm şablonlara ekle
app.use(authMiddleware.injectUserToViews);

// Routes
app.use('/', indexRoutes);
app.use('/auth', authRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/admin', adminRoutes);
app.use('/api', apiRoutes);

// 404 işleyicisi
app.use((req, res, next) => {
  res.status(404).render('error', {
    title: 'Sayfa Bulunamadı',
    error: {
      status: 404,
      message: 'Aradığınız sayfa bulunamadı.'
    }
  });
});

// Hata işleyicisi
app.use((err, req, res, next) => {
  console.error('Uygulama hatası:', err);
  
  res.status(err.status || 500).render('error', {
    title: 'Hata',
    error: {
      status: err.status || 500,
      message: err.message || 'Beklenmeyen bir hata oluştu.'
    }
  });
});

// Sunucuyu başlat
async function startServer() {
  try {
    // MongoDB veritabanına bağlan
    await database.connectToDatabase();
    
    // Sunucuyu başlat
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Sunucu http://localhost:${PORT} adresinde çalışıyor`);
    });
    
    // Firebase bağlantısını test et
    const firebaseConnected = firebaseConfig.testFirebaseConnection();
    console.log(`Firebase bağlantı durumu: ${firebaseConnected ? 'Bağlı' : 'Bağlı değil (Demo mod)'}`);
  } catch (error) {
    console.error('Sunucu başlatılırken hata oluştu:', error);
    process.exit(1);
  }
}

// Sunucuyu başlat
startServer();