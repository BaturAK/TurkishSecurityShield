import 'package:flutter/foundation.dart';
import '../services/api_service.dart';
import '../services/local_storage_service.dart';
import '../utils/constants.dart';

class PremiumProvider with ChangeNotifier {
  bool _isPremium = false;
  DateTime? _premiumExpiry;
  bool _isLoading = false;
  String? _error;
  final ApiService _apiService = ApiService();
  final LocalStorageService _storage = LocalStorageService();

  // Getters
  bool get isPremium => _isPremium;
  DateTime? get premiumExpiry => _premiumExpiry;
  bool get isLoading => _isLoading;
  String? get error => _error;

  PremiumProvider() {
    _init();
  }

  // Başlangıç işlemleri
  Future<void> _init() async {
    try {
      // LocalStorage'dan premium durumunu kontrol et
      final premiumStatus = await _storage.getPremiumStatus();
      final premiumExpiryStr = await _storage.getPremiumExpiry();

      if (premiumStatus == true) {
        _isPremium = true;

        if (premiumExpiryStr != null) {
          _premiumExpiry = DateTime.parse(premiumExpiryStr);
          
          // Süre dolmuş mu kontrol et
          if (_premiumExpiry!.isBefore(DateTime.now())) {
            // Premium süresi dolmuş
            _isPremium = false;
            _premiumExpiry = null;
            await _storage.savePremiumStatus(false);
            await _storage.deletePremiumExpiry();
          }
        }
      }
      
      notifyListeners();
    } catch (e) {
      print('Premium init hatası: $e');
    }
  }

  // Premium durumunu kontrol et
  Future<void> checkPremiumStatus(String userId) async {
    try {
      _isLoading = true;
      _error = null;
      notifyListeners();

      try {
        // API'den premium durumunu kontrol et
        final response = await _apiService.get(
          '${ApiEndpoints.checkPremium}/$userId',
        );
        
        final premiumData = response['data'];
        _isPremium = premiumData['isPremium'] ?? false;
        
        if (premiumData['expiryDate'] != null) {
          _premiumExpiry = DateTime.parse(premiumData['expiryDate']);
          
          // Süre dolmuş mu kontrol et
          if (_premiumExpiry!.isBefore(DateTime.now())) {
            _isPremium = false;
            _premiumExpiry = null;
          }
        }
        
        // LocalStorage'a kaydet
        await _storage.savePremiumStatus(_isPremium);
        if (_premiumExpiry != null) {
          await _storage.savePremiumExpiry(_premiumExpiry!.toIso8601String());
        } else {
          await _storage.deletePremiumExpiry();
        }
      } catch (e) {
        print('Premium durumu kontrol edilirken API hatası: $e');
        // Yerel verileri kullan (zaten init metodunda yüklendi)
      }

      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _isLoading = false;
      _error = 'Premium durumu kontrol edilirken bir hata oluştu: $e';
      notifyListeners();
    }
  }

  // Premium kodu etkinleştir
  Future<bool> activatePremiumCode(String userId, String code) async {
    try {
      _isLoading = true;
      _error = null;
      notifyListeners();

      // API'den premium durumunu etkinleştir
      try {
        final response = await _apiService.post(
          ApiEndpoints.activatePremium,
          data: {
            'userId': userId,
            'activationCode': code,
          },
        );
        
        final activationResult = response['data'];
        _isPremium = activationResult['success'] ?? false;
        
        if (_isPremium && activationResult['expiryDate'] != null) {
          _premiumExpiry = DateTime.parse(activationResult['expiryDate']);
        }
      } catch (e) {
        print('Premium aktivasyonu yapılırken API hatası, yerel işlem yapılıyor: $e');
        
        // Yerel aktivasyon kodu kontrolü yap (demo amaçlı)
        if (code == AppConfig.premiumCode) {
          _isPremium = true;
          // 1 yıllık premium süresi
          _premiumExpiry = DateTime.now().add(Duration(days: 365));
        } else {
          _isLoading = false;
          _error = 'Geçersiz aktivasyon kodu';
          notifyListeners();
          return false;
        }
      }

      // Premium durumunu kaydet
      if (_isPremium) {
        await _storage.savePremiumStatus(true);
        if (_premiumExpiry != null) {
          await _storage.savePremiumExpiry(_premiumExpiry!.toIso8601String());
        }
      }
      
      _isLoading = false;
      notifyListeners();
      return _isPremium;
    } catch (e) {
      _isLoading = false;
      _error = 'Premium aktivasyonu sırasında bir hata oluştu: $e';
      notifyListeners();
      return false;
    }
  }

  // Premium'u iptal et (test amaçlı)
  Future<void> cancelPremium() async {
    _isPremium = false;
    _premiumExpiry = null;
    await _storage.savePremiumStatus(false);
    await _storage.deletePremiumExpiry();
    notifyListeners();
  }
}