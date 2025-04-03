import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../providers/settings_provider.dart';
import '../services/background_service.dart';

class SettingsScreen extends StatelessWidget {
  const SettingsScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Ayarlar'),
        actions: [
          IconButton(
            icon: const Icon(Icons.restore),
            onPressed: () => _showResetConfirmDialog(context),
          ),
        ],
      ),
      body: Consumer<SettingsProvider>(
        builder: (context, settings, child) {
          return ListView(
            padding: const EdgeInsets.symmetric(vertical: 16),
            children: [
              _buildSectionHeader(context, 'Tarama Ayarları'),
              SwitchListTile(
                title: const Text('Otomatik Tarama'),
                subtitle: const Text('Düzenli aralıklarla arka planda tarama yap'),
                value: settings.automaticScanning,
                onChanged: (value) {
                  settings.setAutomaticScanning(value);
                  if (value) {
                    BackgroundService.startService();
                  } else {
                    BackgroundService.stopService();
                  }
                },
              ),
              ListTile(
                title: const Text('Tarama Aralığı'),
                subtitle: Text('${settings.scanInterval} saatte bir tarama yap'),
                enabled: settings.automaticScanning,
                trailing: DropdownButton<int>(
                  value: settings.scanInterval,
                  onChanged: settings.automaticScanning
                      ? (newValue) {
                          if (newValue != null) {
                            settings.setScanInterval(newValue);
                            BackgroundService.updateInterval(Duration(hours: newValue));
                          }
                        }
                      : null,
                  items: [1, 3, 6, 12, 24, 48].map((hours) {
                    return DropdownMenuItem<int>(
                      value: hours,
                      child: Text('$hours saat'),
                    );
                  }).toList(),
                ),
              ),
              SwitchListTile(
                title: const Text('Açılışta Tarama Yap'),
                subtitle: const Text('Cihaz her açıldığında tarama yap'),
                value: settings.scanOnBootComplete,
                onChanged: (value) {
                  settings.setScanOnBootComplete(value);
                },
              ),
              SwitchListTile(
                title: const Text('Yeni Uygulamaları Tara'),
                subtitle: const Text('Yeni kurulmuş uygulamaları otomatik tara'),
                value: settings.scanNewApps,
                onChanged: (value) {
                  settings.setScanNewApps(value);
                },
              ),
              const Divider(),
              _buildSectionHeader(context, 'Bildirim Ayarları'),
              SwitchListTile(
                title: const Text('Bildirimler'),
                subtitle: const Text('Tehdit ve tarama bildirimleri al'),
                value: settings.notificationsEnabled,
                onChanged: (value) {
                  settings.setNotificationsEnabled(value);
                },
              ),
              const Divider(),
              _buildSectionHeader(context, 'Görünüm Ayarları'),
              ListTile(
                title: const Text('Tema'),
                subtitle: Text(_getThemeModeText(settings.themeMode)),
                trailing: DropdownButton<ThemeMode>(
                  value: settings.themeMode,
                  onChanged: (ThemeMode? newValue) {
                    if (newValue != null) {
                      settings.setThemeMode(newValue);
                    }
                  },
                  items: ThemeMode.values.map((ThemeMode mode) {
                    return DropdownMenuItem<ThemeMode>(
                      value: mode,
                      child: Text(_getThemeModeText(mode)),
                    );
                  }).toList(),
                ),
              ),
              const Divider(),
              _buildSectionHeader(context, 'Uygulama Hakkında'),
              ListTile(
                title: const Text('Uygulama Sürümü'),
                subtitle: const Text('1.0.0'),
                leading: const Icon(Icons.info_outline),
              ),
              ListTile(
                title: const Text('Gizlilik Politikası'),
                leading: const Icon(Icons.privacy_tip_outlined),
                onTap: () {
                  // TODO: Gizlilik politikası sayfasını aç
                },
              ),
              ListTile(
                title: const Text('Lisans Bilgileri'),
                leading: const Icon(Icons.description_outlined),
                onTap: () {
                  // TODO: Lisans bilgileri sayfasını aç
                },
              ),
            ],
          );
        },
      ),
    );
  }

  Widget _buildSectionHeader(BuildContext context, String title) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Text(
        title,
        style: TextStyle(
          fontSize: 14,
          fontWeight: FontWeight.bold,
          color: Theme.of(context).colorScheme.primary,
        ),
      ),
    );
  }

  String _getThemeModeText(ThemeMode themeMode) {
    switch (themeMode) {
      case ThemeMode.system:
        return 'Sistem Teması';
      case ThemeMode.light:
        return 'Açık Tema';
      case ThemeMode.dark:
        return 'Koyu Tema';
    }
  }

  Future<void> _showResetConfirmDialog(BuildContext context) async {
    return showDialog<void>(
      context: context,
      barrierDismissible: false,
      builder: (BuildContext context) {
        return AlertDialog(
          title: const Text('Ayarları Sıfırla'),
          content: const SingleChildScrollView(
            child: Text(
              'Tüm ayarlar varsayılan değerlerine sıfırlanacak. Bu işlem geri alınamaz. Devam etmek istiyor musunuz?',
            ),
          ),
          actions: <Widget>[
            TextButton(
              child: const Text('İptal'),
              onPressed: () {
                Navigator.of(context).pop();
              },
            ),
            TextButton(
              child: const Text('Sıfırla'),
              onPressed: () {
                final settingsProvider = Provider.of<SettingsProvider>(
                  context,
                  listen: false,
                );
                settingsProvider.resetSettings();
                Navigator.of(context).pop();
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('Ayarlar sıfırlandı'),
                  ),
                );
              },
            ),
          ],
        );
      },
    );
  }
}
