/**
 * Firebase Configuration
 * Firebase bağlantı ayarları
 * 
 * NOT: Bu dosya gerçek bir Firebase bağlantısı yerine bir mock implementasyon sağlar.
 * Gerçek uygulamada Firebase veya Firebase Admin SDK kullanılabilir.
 */

// Firebase uygulamasını simüle et
let firebaseApp = { name: 'mock-firebase-app' };
let firebaseAuth = {
  // Basit bir mock auth nesnesi
  currentUser: null,
  signInWithEmailAndPassword: async (email, password) => {
    // Basit doğrulama (gerçek uygulamada Firebase ile yapılır)
    if (email === 'admin@example.com' && password === 'password') {
      return { 
        user: { 
          uid: 'admin-user-uid',
          email: 'admin@example.com',
          displayName: 'Admin User',
          photoURL: null
        } 
      };
    }
    throw new Error('auth/user-not-found');
  },
  createUserWithEmailAndPassword: async (email, password) => {
    return { 
      user: { 
        uid: 'user-' + Math.random().toString(36).substring(2, 15),
        email: email,
        displayName: null,
        photoURL: null,
        updateProfile: async (profile) => {
          return true;
        }
      } 
    };
  },
  signOut: async () => {
    return true;
  },
  sendPasswordResetEmail: async (email) => {
    console.log(`[MOCK] Password reset email sent to ${email}`);
    return true;
  }
};

console.log('Mock Firebase bağlantısı başarılı');

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
  return firebaseAuth;
}

/**
 * Firebase firestore nesnesini döndürür
 * @returns {object|null} Firebase firestore nesnesi, bağlantı yoksa null
 */
function getFirestore() {
  return null; // Firestore bu aşamada kullanılmıyor
}

/**
 * Google oturum açma sağlayıcısını döndürür
 * @returns {object|null} Google oturum açma sağlayıcısı, bağlantı yoksa null
 */
function getGoogleAuthProvider() {
  return null; // Google Auth Provider doğrudan kullanılamıyor, admin SDK'da farklı
}

module.exports = {
  testFirebaseConnection,
  getAuth,
  getFirestore,
  getGoogleAuthProvider
};