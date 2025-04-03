import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

class PremiumProvider with ChangeNotifier {
  bool _isPremium = false;
  late SharedPreferences _prefs;
  
  // Premium aktivasyon kodu
  final String _premiumCode = "7426270308";
  
  bool get isPremium => _isPremium;
  
  PremiumProvider() {
    _loadPremiumStatus();
  }
  
  // Premium durumunu yükle
  Future<void> _loadPremiumStatus() async {
    _prefs = await SharedPreferences.getInstance();
    _isPremium = _prefs.getBool('isPremium') ?? false;
    notifyListeners();
  }
  
  // Premium kodu doğrula
  Future<bool> verifyPremiumCode(String code) async {
    if (code == _premiumCode) {
      _isPremium = true;
      await _prefs.setBool('isPremium', true);
      notifyListeners();
      return true;
    }
    return false;
  }
  
  // Premium özelliği devre dışı bırak (test amaçlı)
  Future<void> disablePremium() async {
    _isPremium = false;
    await _prefs.setBool('isPremium', false);
    notifyListeners();
  }
}