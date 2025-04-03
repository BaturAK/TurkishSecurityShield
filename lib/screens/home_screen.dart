import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/scan_provider.dart';
import '../widgets/scan_button.dart';
import '../widgets/status_card.dart';
import '../widgets/threat_list_item.dart';
import 'scan_results_screen.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final scanProvider = Provider.of<ScanProvider>(context);
    
    return Scaffold(
      appBar: AppBar(
        title: const Text('Güvenlik Kontrolü'),
        elevation: 0,
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          // Herhangi bir yenileme işlemi gerekirse
        },
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 8),
              
              // Durum Kartları
              Row(
                children: [
                  Expanded(
                    child: StatusCard(
                      title: 'Güvenlik Durumu',
                      value: scanProvider.detectedThreats.where((t) => !t.isFixed).isEmpty 
                          ? 'Güvenli' 
                          : 'Risk Altında',
                      icon: Icons.security,
                      color: scanProvider.detectedThreats.where((t) => !t.isFixed).isEmpty 
                          ? Colors.green 
                          : Colors.red,
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: StatusCard(
                      title: 'Son Tarama',
                      value: scanProvider.scanHistory.isNotEmpty
                          ? '${_formatDate(scanProvider.scanHistory.last.endTime ?? DateTime.now())}'
                          : 'Hiç Tarama Yok',
                      icon: Icons.history,
                      color: Colors.blue,
                    ),
                  ),
                ],
              ),
              
              const SizedBox(height: 16),
              
              // Tarama Butonları
              Text(
                'Tarama İşlemleri',
                style: Theme.of(context).textTheme.titleLarge,
              ),
              const SizedBox(height: 16),
              
              if (scanProvider.isScanning)
                _buildScanningIndicator(context, scanProvider)
              else
                _buildScanButtons(context),
                
              const SizedBox(height: 24),
              
              // Tehdit Listesi Başlığı
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Tespit Edilen Tehditler',
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                  if (scanProvider.detectedThreats.isNotEmpty)
                    TextButton(
                      onPressed: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (context) => const ScanResultsScreen(),
                          ),
                        );
                      },
                      child: const Text('Tümünü Gör'),
                    ),
                ],
              ),
              const SizedBox(height: 8),
              
              // Tehdit Listesi veya Boş Mesaj
              scanProvider.detectedThreats.isEmpty
                  ? const Center(
                      child: Padding(
                        padding: EdgeInsets.all(24.0),
                        child: Text(
                          'Herhangi bir tehdit tespit edilmedi. Cihazınız güvenli görünüyor.',
                          textAlign: TextAlign.center,
                          style: TextStyle(color: Colors.grey),
                        ),
                      ),
                    )
                  : Column(
                      children: [
                        for (var i = 0; i < scanProvider.detectedThreats.length; i++)
                          if (i < 3) // Sadece ilk 3 tehdidi göster
                            ThreatListItem(
                              threat: scanProvider.detectedThreats[i],
                              onFix: () => scanProvider.fixThreat(scanProvider.detectedThreats[i].id),
                            ),
                      ],
                    ),
              
              const SizedBox(height: 16),
              
              // Hepsini Temizle Butonu
              if (scanProvider.detectedThreats.where((t) => !t.isFixed).isNotEmpty)
                Center(
                  child: ElevatedButton.icon(
                    onPressed: scanProvider.fixAllThreats,
                    icon: const Icon(Icons.cleaning_services),
                    label: const Text('Tüm Tehditleri Temizle'),
                    style: ElevatedButton.styleFrom(
                      foregroundColor: Colors.white,
                      backgroundColor: Colors.green,
                      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                    ),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
  
  Widget _buildScanningIndicator(BuildContext context, ScanProvider provider) {
    final scanTypeText = _getScanTypeText(provider.currentScan!.type);
    
    return Card(
      elevation: 4,
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            const CircularProgressIndicator(),
            const SizedBox(height: 16),
            Text(
              '$scanTypeText Taraması Yapılıyor...',
              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            TextButton(
              onPressed: provider.cancelScan,
              child: const Text('İptal Et'),
            ),
          ],
        ),
      ),
    );
  }
  
  Widget _buildScanButtons(BuildContext context) {
    final scanProvider = Provider.of<ScanProvider>(context, listen: false);
    
    return Column(
      children: [
        Row(
          children: [
            Expanded(
              child: ScanButton(
                title: 'Hızlı Tarama',
                description: 'Kritik sistem alanlarını hızlıca tarar',
                icon: Icons.flash_on,
                color: Colors.orange,
                onPressed: () => scanProvider.startScan(ScanType.quick),
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: ScanButton(
                title: 'Tam Tarama',
                description: 'Tüm sistemi detaylı tarar',
                icon: Icons.shield,
                color: Colors.blue,
                onPressed: () => scanProvider.startScan(ScanType.full),
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),
        Row(
          children: [
            Expanded(
              child: ScanButton(
                title: 'WiFi Taraması',
                description: 'Ağ güvenliğini kontrol eder',
                icon: Icons.wifi,
                color: Colors.green,
                onPressed: () => _showWifiScanDialog(context),
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: ScanButton(
                title: 'QR Taraması',
                description: 'Güvenli QR kod kontrolü yapar',
                icon: Icons.qr_code_scanner,
                color: Colors.purple,
                onPressed: () => _showQrScanDialog(context),
              ),
            ),
          ],
        ),
      ],
    );
  }
  
  void _showWifiScanDialog(BuildContext context) {
    final scanProvider = Provider.of<ScanProvider>(context, listen: false);
    
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('WiFi Taraması'),
        content: const Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.wifi, size: 48, color: Colors.blue),
            SizedBox(height: 16),
            Text('Bağlı olduğunuz WiFi ağının güvenliğini kontrol etmek istiyor musunuz?'),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('İptal'),
          ),
          TextButton(
            onPressed: () {
              scanProvider.startScan(ScanType.wifi);
              Navigator.pop(context);
            },
            child: const Text('Tara'),
          ),
        ],
      ),
    );
  }
  
  void _showQrScanDialog(BuildContext context) {
    final scanProvider = Provider.of<ScanProvider>(context, listen: false);
    
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('QR Kod Taraması'),
        content: const Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.qr_code_scanner, size: 48, color: Colors.purple),
            SizedBox(height: 16),
            Text('QR kod taramak için kamera erişimine izin vermeniz gerekiyor. Devam etmek istiyor musunuz?'),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('İptal'),
          ),
          TextButton(
            onPressed: () {
              scanProvider.startScan(ScanType.qrCode);
              Navigator.pop(context);
            },
            child: const Text('İzin Ver ve Tara'),
          ),
        ],
      ),
    );
  }
  
  String _getScanTypeText(ScanType type) {
    switch (type) {
      case ScanType.quick:
        return 'Hızlı';
      case ScanType.full:
        return 'Tam';
      case ScanType.custom:
        return 'Özel';
      case ScanType.app:
        return 'Uygulama';
      case ScanType.wifi:
        return 'WiFi';
      case ScanType.qrCode:
        return 'QR Kod';
      default:
        return '';
    }
  }
  
  String _formatDate(DateTime date) {
    return '${date.day}/${date.month}/${date.year}';
  }
}