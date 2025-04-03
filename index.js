/**
 * AntiVirüs Uygulaması Ana Dosya
 * Express web sunucusu ve API
 */

// Ortam değişkenlerini yükle
require('dotenv').config();

// Modül Bağımlılıkları
const express = require('express');
const path = require('path');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const expressLayouts = require('express-ejs-layouts');
const { v4: uuidv4 } = require('uuid');

// Veritabanı ve Bağlantı
const database = require('./config/database');

// Middleware
const authMiddleware = require('./middleware/auth');

// Rota Yöneticileri
const indexRoutes = require('./routes/index');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const apiRoutes = require('./routes/api');

// Uygulama Yapılandırması
const app = express();
const PORT = process.env.PORT || 5000;

// EJS Görünüm Motoru Ayarları
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('layout', 'layout');
app.use(expressLayouts);

// Temel Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Oturum Yapılandırması
app.use(session({
  secret: process.env.SESSION_SECRET || 'antivirus-app-session-secret',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: process.env.NODE_ENV === 'production' }
}));

// Kullanıcı Bilgilerini Görünümlere Aktar
app.use(authMiddleware.injectUserToViews);

// Rotalar
app.use('/', indexRoutes);
app.use('/auth', authRoutes);
app.use('/admin', adminRoutes);
app.use('/api', apiRoutes);

// 404 Rotası
app.use((req, res) => {
  res.status(404).render('404', { title: 'Sayfa Bulunamadı' });
});

// Hata İşleyici
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error', {
    title: 'Hata Oluştu',
    error: process.env.NODE_ENV === 'development' ? err : { message: 'Sunucu hatası, lütfen daha sonra tekrar deneyin.' }
  });
});

// Sunucuyu Başlat
async function startServer() {
  try {
    // Veritabanına bağlan
    await database.connectToDatabase();
    
    // Sunucuyu dinle
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`AntiVirüs Uygulaması ${PORT} portunda çalışıyor...`);
      console.log(`http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Sunucu başlatılırken hata oluştu:', error);
    process.exit(1);
  }
}

// Eğer doğrudan çalıştırılıyorsa sunucuyu başlat
if (require.main === module) {
  startServer();
}

module.exports = app;