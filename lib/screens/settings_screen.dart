import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/premium_provider.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({Key? key}) : super(key: key);

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  bool _autoScanEnabled = true;
  bool _darkModeEnabled = false;
  bool _notificationsEnabled = true;
  bool _realTimeProtectionEnabled = false;

  @override
  Widget build(BuildContext context) {
    final premiumProvider = Provider.of<PremiumProvider>(context);
    final isPremium = premiumProvider.isPremium;
    
    return Scaffold(
      appBar: AppBar(
        title: const Text('Ayarlar'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Genel Ayarlar',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            
            const SizedBox(height: 8),
            
            Card(
              child: Column(
                children: [
                  SwitchListTile(
                    title: const Text('Otomatik Tarama'),
                    subtitle: const Text('Düzenli olarak cihazı tara'),
                    value: _autoScanEnabled,
                    onChanged: (value) {
                      setState(() {
                        _autoScanEnabled = value;
                      });
                    },
                  ),
                  const Divider(height: 1),
                  SwitchListTile(
                    title: const Text('Karanlık Mod'),
                    subtitle: const Text('Koyu renkli tema kullan'),
                    value: _darkModeEnabled,
                    onChanged: (value) {
                      setState(() {
                        _darkModeEnabled = value;
                      });
                    },
                  ),
                  const Divider(height: 1),
                  SwitchListTile(
                    title: const Text('Bildirimler'),
                    subtitle: const Text('Tarama ve güvenlik bildirimleri al'),
                    value: _notificationsEnabled,
                    onChanged: (value) {
                      setState(() {
                        _notificationsEnabled = value;
                      });
                    },
                  ),
                ],
              ),
            ),
            
            const SizedBox(height: 24),
            
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Premium Özellikler',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                if (!isPremium)
                  TextButton(
                    onPressed: () {
                      Navigator.pop(context);
                      Navigator.pushNamed(context, '/premium');
                    },
                    child: const Text('Yükselt'),
                  ),
              ],
            ),
            
            const SizedBox(height: 8),
            
            Card(
              child: Column(
                children: [
                  SwitchListTile(
                    title: const Text('Gerçek Zamanlı Koruma'),
                    subtitle: const Text('Uygulamaları ve dosyaları sürekli kontrol et'),
                    value: _realTimeProtectionEnabled,
                    onChanged: isPremium 
                      ? (value) {
                          setState(() {
                            _realTimeProtectionEnabled = value;
                          });
                        }
                      : null,
                    secondary: isPremium 
                      ? const Icon(Icons.shield) 
                      : const Icon(Icons.lock, color: Colors.grey),
                  ),
                  const Divider(height: 1),
                  ListTile(
                    leading: const Icon(Icons.security),
                    title: const Text('Tehdit Tarama Motoru'),
                    subtitle: Text(isPremium 
                      ? 'Gelişmiş motor (Premium)' 
                      : 'Temel motor'),
                    trailing: isPremium 
                      ? const Icon(Icons.check_circle, color: Colors.green) 
                      : const Icon(Icons.lock, color: Colors.grey),
                  ),
                  const Divider(height: 1),
                  ListTile(
                    leading: const Icon(Icons.vpn_key),
                    title: const Text('VPN Hizmeti'),
                    subtitle: Text(isPremium 
                      ? 'Aktif (Premium)' 
                      : 'Pasif (Premium\'a yükseltin)'),
                    trailing: isPremium 
                      ? const Icon(Icons.check_circle, color: Colors.green) 
                      : const Icon(Icons.lock, color: Colors.grey),
                  ),
                  const Divider(height: 1),
                  ListTile(
                    leading: const Icon(Icons.app_blocking),
                    title: const Text('Uygulama Kilidi'),
                    subtitle: Text(isPremium 
                      ? 'Aktif (Premium)' 
                      : 'Pasif (Premium\'a yükseltin)'),
                    trailing: isPremium
                      ? const Icon(Icons.check_circle, color: Colors.green) 
                      : const Icon(Icons.lock, color: Colors.grey),
                  ),
                ],
              ),
            ),
            
            const SizedBox(height: 24),
            
            const Text(
              'Veri ve Gizlilik',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            
            const SizedBox(height: 8),
            
            Card(
              child: Column(
                children: [
                  ListTile(
                    title: const Text('Uygulama Verilerini Temizle'),
                    subtitle: const Text('Tarama geçmişi ve önbellek'),
                    leading: const Icon(Icons.cleaning_services),
                    onTap: () {
                      _showClearDataDialog();
                    },
                  ),
                  const Divider(height: 1),
                  ListTile(
                    title: const Text('Gizlilik Politikası'),
                    leading: const Icon(Icons.privacy_tip),
                    onTap: () {
                      // Gizlilik politikası sayfasına yönlendir
                    },
                  ),
                  const Divider(height: 1),
                  ListTile(
                    title: const Text('Kullanım Koşulları'),
                    leading: const Icon(Icons.description),
                    onTap: () {
                      // Kullanım koşulları sayfasına yönlendir
                    },
                  ),
                ],
              ),
            ),
            
            const SizedBox(height: 24),
            
            const Text(
              'Uygulama Hakkında',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            
            const SizedBox(height: 8),
            
            const Card(
              child: Column(
                children: [
                  ListTile(
                    title: Text('Sürüm'),
                    subtitle: Text('1.0.0'),
                    leading: Icon(Icons.info_outline),
                  ),
                  Divider(height: 1),
                  ListTile(
                    title: Text('Geliştirici'),
                    subtitle: Text('Antivirüs Uygulaması Ekibi'),
                    leading: Icon(Icons.code),
                  ),
                ],
              ),
            ),
            
            const SizedBox(height: 32),
            
            Center(
              child: OutlinedButton(
                onPressed: () {
                  _showResetAppDialog();
                },
                style: OutlinedButton.styleFrom(
                  foregroundColor: Colors.red,
                ),
                child: const Text('Uygulamayı Sıfırla'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showClearDataDialog() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Verileri Temizle'),
        content: const Text(
          'Tüm tarama geçmişi ve önbellek verileri silinecek. Bu işlem geri alınamaz. Devam etmek istiyor musunuz?'
        ),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.of(ctx).pop();
            },
            child: const Text('İptal'),
          ),
          TextButton(
            onPressed: () {
              // Veri temizleme işlemini yap
              Navigator.of(ctx).pop();
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Veriler temizlendi'),
                ),
              );
            },
            style: TextButton.styleFrom(
              foregroundColor: Colors.red,
            ),
            child: const Text('Temizle'),
          ),
        ],
      ),
    );
  }

  void _showResetAppDialog() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Uygulamayı Sıfırla'),
        content: const Text(
          'Tüm ayarlar varsayılana döndürülecek ve verilerin tamamı silinecek. Bu işlem geri alınamaz. Devam etmek istiyor musunuz?'
        ),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.of(ctx).pop();
            },
            child: const Text('İptal'),
          ),
          TextButton(
            onPressed: () {
              // Uygulama sıfırlama işlemini yap
              Navigator.of(ctx).pop();
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Uygulama başarıyla sıfırlandı'),
                ),
              );
            },
            style: TextButton.styleFrom(
              foregroundColor: Colors.red,
            ),
            child: const Text('Sıfırla'),
          ),
        ],
      ),
    );
  }
}