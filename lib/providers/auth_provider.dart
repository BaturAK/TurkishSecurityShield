import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../services/firebase_service.dart';
import '../services/api_service.dart';
import '../services/local_storage_service.dart';
import '../utils/constants.dart';

class AuthProvider with ChangeNotifier {
  User? _firebaseUser;
  bool _isLoading = false;
  String? _error;
  final ApiService _apiService = ApiService();
  final LocalStorageService _storage = LocalStorageService();

  // Getters
  bool get isLoggedIn => _firebaseUser != null;
  bool get isLoading => _isLoading;
  String? get error => _error;
  String? get userId => _firebaseUser?.uid;
  String? get userEmail => _firebaseUser?.email;
  String? get displayName => _firebaseUser?.displayName;
  String? get photoURL => _firebaseUser?.photoURL;

  AuthProvider() {
    _init();
  }

  // Başlangıç işlemleri
  Future<void> _init() async {
    try {
      // LocalStorage'dan token kontrolü
      final token = await _storage.getAuthToken();
      if (token != null) {
        _apiService.token = token;
      }

      // Mevcut oturumu kontrol et
      _firebaseUser = FirebaseService.currentUser;
      
      if (_firebaseUser != null) {
        // Kullanıcı oturum açmış, API token'ı al
        await _refreshIdToken();
      }
    } catch (e) {
      print('Auth init hatası: $e');
    }
    
    notifyListeners();
  }

  // E-posta ve şifre ile giriş
  Future<bool> signInWithEmailAndPassword(String email, String password) async {
    try {
      _isLoading = true;
      _error = null;
      notifyListeners();

      // Firebase ile giriş yap
      final UserCredential userCredential =
          await FirebaseService.signInWithEmailAndPassword(email, password);
      
      _firebaseUser = userCredential.user;
      
      // Token al ve API servisine ayarla
      await _refreshIdToken();
      
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _isLoading = false;
      _error = _getFirebaseAuthErrorMessage(e);
      notifyListeners();
      return false;
    }
  }

  // Google ile giriş
  Future<bool> signInWithGoogle() async {
    try {
      _isLoading = true;
      _error = null;
      notifyListeners();

      // Google ile giriş yap
      final UserCredential? userCredential =
          await FirebaseService.signInWithGoogle();
      
      if (userCredential == null) {
        _isLoading = false;
        _error = 'Google ile giriş iptal edildi';
        notifyListeners();
        return false;
      }
      
      _firebaseUser = userCredential.user;
      
      // Token al ve API servisine ayarla
      await _refreshIdToken();
      
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _isLoading = false;
      _error = _getFirebaseAuthErrorMessage(e);
      notifyListeners();
      return false;
    }
  }

  // Misafir olarak giriş
  Future<bool> signInAnonymously() async {
    try {
      _isLoading = true;
      _error = null;
      notifyListeners();

      // Misafir olarak giriş yap
      final UserCredential userCredential =
          await FirebaseService.signInAnonymously();
      
      _firebaseUser = userCredential.user;
      
      // Token al ve API servisine ayarla
      await _refreshIdToken();
      
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _isLoading = false;
      _error = _getFirebaseAuthErrorMessage(e);
      notifyListeners();
      return false;
    }
  }

  // Yeni hesap oluştur
  Future<bool> createUserWithEmailAndPassword(String email, String password, String displayName) async {
    try {
      _isLoading = true;
      _error = null;
      notifyListeners();

      // Firebase ile hesap oluştur
      final UserCredential userCredential =
          await FirebaseService.createUserWithEmailAndPassword(email, password);
      
      _firebaseUser = userCredential.user;
      
      // Görünen adı güncelle
      await FirebaseService.updateDisplayName(displayName);
      
      // Token al ve API servisine ayarla
      await _refreshIdToken();
      
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _isLoading = false;
      _error = _getFirebaseAuthErrorMessage(e);
      notifyListeners();
      return false;
    }
  }

  // Şifre sıfırlama e-postası gönder
  Future<bool> sendPasswordResetEmail(String email) async {
    try {
      _isLoading = true;
      _error = null;
      notifyListeners();

      await FirebaseService.sendPasswordResetEmail(email);
      
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _isLoading = false;
      _error = _getFirebaseAuthErrorMessage(e);
      notifyListeners();
      return false;
    }
  }

  // Çıkış yap
  Future<void> signOut() async {
    try {
      _isLoading = true;
      notifyListeners();

      // Firebase'den çıkış yap
      await FirebaseService.signOut();
      
      // Token ve kullanıcı bilgilerini temizle
      await _storage.deleteAuthToken();
      _apiService.token = null;
      _firebaseUser = null;
      
      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _isLoading = false;
      _error = 'Çıkış yaparken bir hata oluştu: $e';
      notifyListeners();
    }
  }

  // Kullanıcı bilgilerini güncelle
  Future<bool> updateProfile({String? displayName, String? photoURL}) async {
    try {
      _isLoading = true;
      _error = null;
      notifyListeners();

      if (displayName != null) {
        await FirebaseService.updateDisplayName(displayName);
      }
      
      if (photoURL != null) {
        await FirebaseService.updatePhotoURL(photoURL);
      }
      
      // Kullanıcı bilgilerini yenile
      _firebaseUser = FirebaseService.currentUser;
      
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _isLoading = false;
      _error = 'Profil güncellenirken bir hata oluştu: $e';
      notifyListeners();
      return false;
    }
  }

  // Şifre değiştir
  Future<bool> updatePassword(String currentPassword, String newPassword) async {
    try {
      _isLoading = true;
      _error = null;
      notifyListeners();

      // Şifre değiştirmeden önce tekrar giriş yap
      final email = _firebaseUser?.email;
      if (email == null) {
        throw Exception('E-posta adresi bulunamadı');
      }

      // Mevcut şifre ile doğrulama
      await FirebaseService.signInWithEmailAndPassword(email, currentPassword);
      
      // Şifreyi güncelle
      await FirebaseService.updatePassword(newPassword);
      
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _isLoading = false;
      _error = _getFirebaseAuthErrorMessage(e);
      notifyListeners();
      return false;
    }
  }

  // ID Token'ı yenile
  Future<void> _refreshIdToken() async {
    try {
      final user = _firebaseUser;
      if (user == null) return;
      
      // ID token al
      final idToken = await user.getIdToken();
      
      // Token'ı API servisine ve local storage'a kaydet
      _apiService.token = idToken;
      await _storage.saveAuthToken(idToken);
    } catch (e) {
      print('Token yenileme hatası: $e');
    }
  }

  // Firebase Auth hata mesajlarını Türkçe'ye çevir
  String _getFirebaseAuthErrorMessage(dynamic error) {
    if (error is FirebaseAuthException) {
      switch (error.code) {
        case 'user-not-found':
          return 'Bu e-posta adresiyle kayıtlı bir kullanıcı bulunamadı.';
        case 'wrong-password':
          return 'Hatalı şifre girdiniz.';
        case 'email-already-in-use':
          return 'Bu e-posta adresi zaten kullanılıyor.';
        case 'invalid-email':
          return 'Geçersiz e-posta adresi.';
        case 'weak-password':
          return 'Şifre çok zayıf, lütfen daha güçlü bir şifre seçin.';
        case 'operation-not-allowed':
          return 'Bu işlem şu anda kullanılamıyor.';
        case 'account-exists-with-different-credential':
          return 'Bu e-posta adresi farklı bir giriş yöntemiyle zaten kullanılıyor.';
        case 'invalid-credential':
          return 'Geçersiz kimlik bilgileri.';
        case 'user-disabled':
          return 'Bu kullanıcı hesabı devre dışı bırakılmış.';
        case 'too-many-requests':
          return 'Çok fazla istek gönderildi. Lütfen daha sonra tekrar deneyin.';
        case 'network-request-failed':
          return 'Ağ hatası. İnternet bağlantınızı kontrol edin.';
        default:
          return 'Bir hata oluştu: ${error.message}';
      }
    }
    return 'Bir hata oluştu: $error';
  }
}