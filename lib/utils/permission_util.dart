import 'package:flutter/material.dart';
import 'package:permission_handler/permission_handler.dart';

class PermissionUtil {
  // Gerekli izinleri kontrol et ve iste
  static Future<bool> checkAndRequestPermissions(
    BuildContext context, {
    List<Permission>? permissions,
  }) async {
    final requiredPermissions = permissions ??
        [
          Permission.storage,
          Permission.packageQuery,
        ];

    // Tüm izinlerin durumunu kontrol et
    Map<Permission, PermissionStatus> statuses = await requiredPermissions.request();
    
    // Reddedilen izinler
    List<Permission> deniedPermissions = statuses.entries
        .where((entry) => entry.value.isDenied || entry.value.isPermanentlyDenied)
        .map((entry) => entry.key)
        .toList();
    
    if (deniedPermissions.isEmpty) {
      return true;
    }

    // Eğer context yoksa veya geçersizse sadece sonucu döndür
    if (context.mounted) {
      await _showPermissionDialog(context, deniedPermissions);
    }
    
    return deniedPermissions.isEmpty;
  }

  // İzin isteme diyaloğunu göster
  static Future<void> _showPermissionDialog(
    BuildContext context,
    List<Permission> deniedPermissions,
  ) async {
    return showDialog<void>(
      context: context,
      barrierDismissible: false,
      builder: (BuildContext context) {
        return AlertDialog(
          title: const Text('İzinler Gerekli'),
          content: SingleChildScrollView(
            child: ListBody(
              children: <Widget>[
                const Text(
                  'Uygulamanın düzgün çalışması için aşağıdaki izinlere ihtiyaç vardır:',
                ),
                const SizedBox(height: 16),
                ...deniedPermissions.map((permission) {
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 8.0),
                    child: Row(
                      children: [
                        const Icon(Icons.warning, color: Colors.orange, size: 16),
                        const SizedBox(width: 8),
                        Expanded(child: Text(_getPermissionText(permission))),
                      ],
                    ),
                  );
                }).toList(),
              ],
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
              child: const Text('Ayarlar'),
              onPressed: () {
                Navigator.of(context).pop();
                openAppSettings();
              },
            ),
          ],
        );
      },
    );
  }

  // İzin adını insan tarafından okunabilir formata dönüştür
  static String _getPermissionText(Permission permission) {
    switch (permission) {
      case Permission.storage:
        return 'Depolama Erişimi: Uygulamaları taramak için gereklidir.';
      case Permission.packageQuery:
        return 'Paket Sorgulama: Yüklü uygulamaları listelemek için gereklidir.';
      case Permission.phone:
        return 'Telefon Durumu: Cihaz bilgilerini okumak için gereklidir.';
      case Permission.notification:
        return 'Bildirimler: Tehdit uyarıları göndermek için gereklidir.';
      case Permission.ignoreBatteryOptimizations:
        return 'Pil Optimizasyonu Yoksayma: Arka planda çalışmak için gereklidir.';
      default:
        return permission.toString();
    }
  }
}
