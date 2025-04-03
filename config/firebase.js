/**
 * Firebase Yapılandırması
 * Firebase Auth ve Firestore yapılandırma ayarları
 */

const admin = require('firebase-admin');
require('dotenv').config();

// Firebase yapılandırması
const firebaseConfig = {
  projectId: process.env.FIREBASE_PROJECT_ID || 'demo-project',
  apiKey: process.env.FIREBASE_API_KEY || 'demo-api-key',
  appId: process.env.FIREBASE_APP_ID || 'demo-app-id'
};

// Firebase admin uygulama örneği
let firebaseApp;

// Firebase başlatma
try {
  // Firebase admin başlatma
  firebaseApp = admin.initializeApp({
    projectId: firebaseConfig.projectId,
    credential: admin.credential.applicationDefault()
  });
  
  console.log('Firebase Admin başarıyla başlatıldı.');
} catch (error) {
  // Hata varsa, demo modu kullanılacak
  console.warn('Firebase Admin başlatılamadı. Demo modu kullanılacak:', error.message);
  firebaseApp = null;
}

/**
 * Firebase bağlantısını test eder
 * @returns {boolean} Bağlantı başarılı ise true, değilse false
 */
function testFirebaseConnection() {
  return !!firebaseApp;
}

/**
 * Firebase kimlik doğrulama nesnesini döndürür
 * @returns {object|null} Firebase auth nesnesi, bağlantı yoksa null
 */
function getAuth() {
  if (!firebaseApp) return null;
  return admin.auth();
}

/**
 * Firebase firestore nesnesini döndürür
 * @returns {object|null} Firebase firestore nesnesi, bağlantı yoksa null
 */
function getFirestore() {
  if (!firebaseApp) return null;
  return admin.firestore();
}

/**
 * Google oturum açma sağlayıcısını döndürür
 * @returns {object|null} Google oturum açma sağlayıcısı, bağlantı yoksa null
 */
function getGoogleAuthProvider() {
  if (!firebaseApp) return null;
  
  try {
    // Client-side oauth sağlayıcıyı döndür
    return new admin.auth.GoogleAuthProvider();
  } catch (error) {
    console.error('Google auth provider oluşturulamadı:', error);
    return null;
  }
}

module.exports = {
  firebaseConfig,
  testFirebaseConnection,
  getAuth,
  getFirestore,
  getGoogleAuthProvider
};