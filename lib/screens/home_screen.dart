import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/scan_provider.dart';
import '../providers/premium_provider.dart';
import '../providers/auth_provider.dart';
import '../widgets/app_drawer.dart';
import '../widgets/scan_button.dart';
import '../widgets/security_status_card.dart';
import '../widgets/last_scan_card.dart';
import '../utils/constants.dart';

class HomeScreen extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final scanProvider = Provider.of<ScanProvider>(context);
    final premiumProvider = Provider.of<PremiumProvider>(context);
    final authProvider = Provider.of<AuthProvider>(context);
    final size = MediaQuery.of(context).size;

    return Scaffold(
      appBar: AppBar(
        title: Text(
          AppTexts.appName,
          style: TextStyle(
            color: AppColors.textPrimaryColor,
            fontWeight: FontWeight.bold,
          ),
        ),
        actions: [
          // Premium durumunu gösteren simge
          if (premiumProvider.isPremium)
            Padding(
              padding: const EdgeInsets.only(right: 16),
              child: Icon(
                Icons.verified,
                color: AppColors.secondaryColor,
              ),
            ),
          // Ayarlar simgesi
          IconButton(
            icon: Icon(
              Icons.settings,
              color: AppColors.textPrimaryColor,
            ),
            onPressed: () => Navigator.pushNamed(context, '/settings'),
          ),
        ],
      ),
      drawer: AppDrawer(),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Güvenlik durumu kartı
            SecurityStatusCard(
              isProtected: !scanProvider.detectedThreats.any((threat) => !threat.isCleaned),
            ),
            
            // Tarama butonları
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 24.0),
              child: Wrap(
                spacing: 20,
                runSpacing: 20,
                alignment: WrapAlignment.spaceEvenly,
                children: [
                  // Hızlı tarama butonu
                  ScanButton(
                    title: AppTexts.quickScan,
                    icon: Icons.flash_on,
                    color: AppColors.primaryColor,
                    onTap: () => _startScan(context, ScanTypes.quick),
                  ),
                  
                  // Tam tarama butonu
                  ScanButton(
                    title: AppTexts.fullScan,
                    icon: Icons.security,
                    color: AppColors.accentColor,
                    onTap: () => _startScan(context, ScanTypes.full),
                  ),
                  
                  // Wi-Fi tarama butonu
                  ScanButton(
                    title: AppTexts.wifiScan,
                    icon: Icons.wifi,
                    color: Colors.green,
                    isPremium: true,
                    isLocked: !premiumProvider.isPremium,
                    onTap: () {
                      if (premiumProvider.isPremium) {
                        _startScan(context, ScanTypes.wifi);
                      } else {
                        _showPremiumDialog(context);
                      }
                    },
                  ),
                  
                  // QR kod tarama butonu
                  ScanButton(
                    title: AppTexts.qrScan,
                    icon: Icons.qr_code_scanner,
                    color: Colors.purple,
                    isPremium: true,
                    isLocked: !premiumProvider.isPremium,
                    onTap: () {
                      if (premiumProvider.isPremium) {
                        _startScan(context, ScanTypes.qr);
                      } else {
                        _showPremiumDialog(context);
                      }
                    },
                  ),
                ],
              ),
            ),
            
            // Son tarama sonucu
            if (scanProvider.lastScanResult != null)
              LastScanCard(
                scanResult: scanProvider.lastScanResult!,
                onViewDetails: () => Navigator.pushNamed(
                  context,
                  '/scan_results',
                  arguments: scanProvider.lastScanResult!.id,
                ),
              ),
            
            SizedBox(height: 24),
            
            // Premium butonu
            if (!premiumProvider.isPremium)
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24.0),
                child: ElevatedButton(
                  onPressed: () => Navigator.pushNamed(context, '/premium'),
                  child: Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.star, color: Colors.white),
                        SizedBox(width: 8),
                        Text(
                          AppTexts.goPremium,
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                          ),
                        ),
                      ],
                    ),
                  ),
                  style: ElevatedButton.styleFrom(
                    primary: AppColors.secondaryColor,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                ),
              ),
            
            SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  // Tarama başlatma
  void _startScan(BuildContext context, String scanType) async {
    final scanProvider = Provider.of<ScanProvider>(context, listen: false);
    final authProvider = Provider.of<AuthProvider>(context, listen: false);

    // Eğer zaten bir tarama devam ediyorsa uyarı göster
    if (scanProvider.isScanning) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Zaten bir tarama devam ediyor')),
      );
      return;
    }

    // Taramayı başlat
    final scanResult = await scanProvider.startScan(scanType, authProvider.userId);
    
    if (scanResult != null) {
      // Tarama başarıyla başlatıldı, tarama ilerleme sayfasına git
      Navigator.pushNamed(
        context,
        '/scan_results',
        arguments: scanResult.id,
      );
    } else if (scanProvider.error != null) {
      // Hata oluştu
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(scanProvider.error!)),
      );
    }
  }

  // Premium özellikleri için diyalog gösterimi
  void _showPremiumDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(AppTexts.premiumFeatures),
        content: Text('Bu özellik sadece premium kullanıcılara açıktır. Premium'a geçmek ister misiniz?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text(AppTexts.cancel),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              Navigator.pushNamed(context, '/premium');
            },
            child: Text(AppTexts.goPremium),
            style: ElevatedButton.styleFrom(
              primary: AppColors.secondaryColor,
            ),
          ),
        ],
      ),
    );
  }
}