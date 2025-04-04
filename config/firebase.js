/**
 * Firebase Yapılandırması
 * Firebase Auth ve Firestore yapılandırma ayarları
 */

const admin = require('firebase-admin');
const dotenv = require('dotenv');

// .env değişkenlerini yükle
dotenv.config();

let firebaseInitialized = false;
let auth = null;
let firestore = null;

// Firebase yapılandırma bilgileri
const firebaseConfig = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  apiKey: process.env.FIREBASE_API_KEY,
  appId: process.env.FIREBASE_APP_ID
};

// Firebase'i başlat
try {
  if (firebaseConfig.projectId) {
    // ServiceAccount bilgileri varsa Firebase Admin SDK ile başlat
    admin.initializeApp({
      projectId: firebaseConfig.projectId
    });
    
    auth = admin.auth();
    firestore = admin.firestore();
    firebaseInitialized = true;
    
    console.log('Firebase başarıyla başlatıldı');
  } else {
    console.log('Firebase yapılandırma bilgileri eksik, demo mod etkinleştiriliyor');
  }
} catch (error) {
  console.error('Firebase başlatılırken hata:', error);
  console.log('Demo mod etkinleştiriliyor');
  firebaseInitialized = false;
}

/**
 * Firebase bağlantısını test eder
 * @returns {boolean} Bağlantı başarılı ise true, değilse false
 */
function testFirebaseConnection() {
  return firebaseInitialized;
}

/**
 * Firebase kimlik doğrulama nesnesini döndürür
 * @returns {object|null} Firebase auth nesnesi, bağlantı yoksa null
 */
function getAuth() {
  return auth;
}

/**
 * Firebase firestore nesnesini döndürür
 * @returns {object|null} Firebase firestore nesnesi, bağlantı yoksa null
 */
function getFirestore() {
  return firestore;
}

/**
 * Google oturum açma sağlayıcısını döndürür
 * @returns {object|null} Google oturum açma sağlayıcısı, bağlantı yoksa null
 */
function getGoogleAuthProvider() {
  return firebaseInitialized ? new admin.auth.GoogleAuthProvider() : null;
}

module.exports = {
  testFirebaseConnection,
  getAuth,
  getFirestore,
  getGoogleAuthProvider
};