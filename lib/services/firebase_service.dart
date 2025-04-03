import 'package:firebase_auth/firebase_auth.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:shared_preferences/shared_preferences.dart';

class FirebaseService {
  final FirebaseAuth _auth = FirebaseAuth.instance;
  final GoogleSignIn _googleSignIn = GoogleSignIn();

  // Singleton pattern
  static final FirebaseService _instance = FirebaseService._internal();
  factory FirebaseService() => _instance;
  FirebaseService._internal();

  // Giriş yapmış kullanıcıyı al
  User? get currentUser => _auth.currentUser;
  
  // Giriş durumunu dinle
  Stream<User?> get authStateChanges => _auth.authStateChanges();
  
  // E-posta/şifre ile kayıt ol
  Future<UserCredential> signUpWithEmailAndPassword(String email, String password) async {
    try {
      return await _auth.createUserWithEmailAndPassword(
        email: email,
        password: password,
      );
    } catch (e) {
      throw Exception('Kayıt olma başarısız: $e');
    }
  }
  
  // E-posta/şifre ile giriş yap
  Future<UserCredential> signInWithEmailAndPassword(String email, String password) async {
    try {
      return await _auth.signInWithEmailAndPassword(
        email: email,
        password: password,
      );
    } catch (e) {
      throw Exception('Giriş yapma başarısız: $e');
    }
  }
  
  // Google ile giriş yap
  Future<UserCredential> signInWithGoogle() async {
    try {
      final GoogleSignInAccount? googleUser = await _googleSignIn.signIn();
      
      if (googleUser == null) {
        throw Exception('Google girişi iptal edildi');
      }
      
      final GoogleSignInAuthentication googleAuth = await googleUser.authentication;
      
      final credential = GoogleAuthProvider.credential(
        accessToken: googleAuth.accessToken,
        idToken: googleAuth.idToken,
      );
      
      return await _auth.signInWithCredential(credential);
    } catch (e) {
      throw Exception('Google ile giriş yapma başarısız: $e');
    }
  }
  
  // Şifremi unuttum
  Future<void> sendPasswordResetEmail(String email) async {
    try {
      await _auth.sendPasswordResetEmail(email: email);
    } catch (e) {
      throw Exception('Şifre sıfırlama e-postası gönderme başarısız: $e');
    }
  }
  
  // Çıkış yap
  Future<void> signOut() async {
    try {
      // Tercihlerden premium durumunu silme
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove('isPremium');
      
      // Google oturumunu kapat
      await _googleSignIn.signOut();
      
      // Firebase oturumunu kapat
      await _auth.signOut();
    } catch (e) {
      throw Exception('Çıkış yapma başarısız: $e');
    }
  }
  
  // Kullanıcı profilini güncelle
  Future<void> updateUserProfile({String? displayName, String? photoURL}) async {
    try {
      await _auth.currentUser?.updateDisplayName(displayName);
      await _auth.currentUser?.updatePhotoURL(photoURL);
    } catch (e) {
      throw Exception('Profil güncelleme başarısız: $e');
    }
  }
  
  // Kullanıcı e-postasını güncelle
  Future<void> updateEmail(String newEmail) async {
    try {
      await _auth.currentUser?.updateEmail(newEmail);
    } catch (e) {
      throw Exception('E-posta güncelleme başarısız: $e');
    }
  }
  
  // Kullanıcı şifresini güncelle
  Future<void> updatePassword(String newPassword) async {
    try {
      await _auth.currentUser?.updatePassword(newPassword);
    } catch (e) {
      throw Exception('Şifre güncelleme başarısız: $e');
    }
  }
  
  // E-posta doğrulama gönder
  Future<void> sendEmailVerification() async {
    try {
      await _auth.currentUser?.sendEmailVerification();
    } catch (e) {
      throw Exception('E-posta doğrulama gönderme başarısız: $e');
    }
  }
  
  // E-posta doğrulanmış mı kontrol et
  bool isEmailVerified() {
    return _auth.currentUser?.emailVerified ?? false;
  }
}