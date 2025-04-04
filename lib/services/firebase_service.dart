import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:google_sign_in/google_sign_in.dart';

class FirebaseService {
  static FirebaseAuth? _auth;
  static GoogleSignIn? _googleSignIn;

  // Firebase servisini başlat
  static Future<void> init() async {
    await Firebase.initializeApp();
    _auth = FirebaseAuth.instance;
    _googleSignIn = GoogleSignIn();
  }

  // Firebase Auth nesnesini döndür
  static FirebaseAuth get auth {
    if (_auth == null) {
      throw Exception('Firebase Auth is not initialized. Call init() first.');
    }
    return _auth!;
  }

  // Google Sign In nesnesini döndür
  static GoogleSignIn get googleSignIn {
    if (_googleSignIn == null) {
      throw Exception('Google Sign In is not initialized. Call init() first.');
    }
    return _googleSignIn!;
  }

  // Şu anki kullanıcıyı döndür
  static User? get currentUser => _auth?.currentUser;

  // Kullanıcı ID'sini döndür
  static String? get userId => _auth?.currentUser?.uid;

  // Kullanıcı e-posta adresini döndür
  static String? get userEmail => _auth?.currentUser?.email;

  // Kullanıcı görünen adını döndür
  static String? get displayName => _auth?.currentUser?.displayName;

  // Kullanıcı profil fotoğrafını döndür
  static String? get photoUrl => _auth?.currentUser?.photoURL;

  // E-posta ve şifre ile giriş yap
  static Future<UserCredential> signInWithEmailAndPassword(
    String email,
    String password,
  ) async {
    return await auth.signInWithEmailAndPassword(
      email: email,
      password: password,
    );
  }

  // E-posta ve şifre ile kayıt ol
  static Future<UserCredential> createUserWithEmailAndPassword(
    String email,
    String password,
  ) async {
    return await auth.createUserWithEmailAndPassword(
      email: email,
      password: password,
    );
  }

  // Google ile giriş yap
  static Future<UserCredential?> signInWithGoogle() async {
    try {
      final GoogleSignInAccount? googleUser = await googleSignIn.signIn();
      if (googleUser == null) {
        // Kullanıcı işlemi iptal etti
        return null;
      }

      final GoogleSignInAuthentication googleAuth = await googleUser.authentication;
      final credential = GoogleAuthProvider.credential(
        accessToken: googleAuth.accessToken,
        idToken: googleAuth.idToken,
      );

      return await auth.signInWithCredential(credential);
    } catch (e) {
      print('Google Sign In error: $e');
      rethrow;
    }
  }

  // Misafir olarak giriş yap
  static Future<UserCredential> signInAnonymously() async {
    return await auth.signInAnonymously();
  }

  // Çıkış yap
  static Future<void> signOut() async {
    await googleSignIn.signOut();
    await auth.signOut();
  }

  // Şifre sıfırlama e-postası gönder
  static Future<void> sendPasswordResetEmail(String email) async {
    await auth.sendPasswordResetEmail(email: email);
  }

  // Kullanıcı bilgilerini güncelle
  static Future<void> updateDisplayName(String displayName) async {
    await auth.currentUser?.updateDisplayName(displayName);
  }

  // Kullanıcı profil fotoğrafını güncelle
  static Future<void> updatePhotoURL(String photoURL) async {
    await auth.currentUser?.updatePhotoURL(photoURL);
  }

  // E-posta adresini güncelle
  static Future<void> updateEmail(String email) async {
    await auth.currentUser?.updateEmail(email);
  }

  // Şifreyi değiştir
  static Future<void> updatePassword(String password) async {
    await auth.currentUser?.updatePassword(password);
  }

  // Kullanıcıyı sil
  static Future<void> deleteUser() async {
    await auth.currentUser?.delete();
  }
}