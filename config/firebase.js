/**
 * Firebase Configuration
 * Firebase bağlantı ayarları
 */

const { initializeApp } = require('firebase/app');
const { getAuth } = require('firebase/auth');

// Firebase yapılandırma bilgileri
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: `${process.env.FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: `${process.env.FIREBASE_PROJECT_ID}.appspot.com`,
  appId: process.env.FIREBASE_APP_ID
};

// Firebase uygulamasını başlat
let firebaseApp;
let auth;

try {
  firebaseApp = initializeApp(firebaseConfig);
  auth = getAuth(firebaseApp);
  console.log('Firebase başarıyla yapılandırıldı.');
} catch (error) {
  console.error('Firebase yapılandırma hatası:', error);
}

/**
 * Firebase bağlantısını test eder
 * @returns {boolean} Bağlantı başarılı ise true, değilse false
 */
function testFirebaseConnection() {
  try {
    if (firebaseApp) {
      console.log('Firebase bağlantısı aktif.');
      return true;
    } else {
      console.warn('Firebase bağlantısı kurulamadı.');
      return false;
    }
  } catch (error) {
    console.error('Firebase bağlantı testi hatası:', error);
    return false;
  }
}

module.exports = {
  firebaseApp,
  auth,
  testFirebaseConnection
};