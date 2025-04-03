import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/scan_provider.dart';
import '../widgets/threat_list_item.dart';

class ScanResultsScreen extends StatelessWidget {
  const ScanResultsScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final scanProvider = Provider.of<ScanProvider>(context);
    final scanHistory = scanProvider.scanHistory;
    
    return Scaffold(
      appBar: AppBar(
        title: const Text('Tarama Sonuçları'),
      ),
      body: scanHistory.isEmpty 
        ? _buildEmptyState() 
        : _buildResultsList(context, scanProvider),
    );
  }
  
  Widget _buildEmptyState() {
    return const Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.search_off,
            size: 64,
            color: Colors.grey,
          ),
          SizedBox(height: 16),
          Text(
            'Henüz bir tarama yapmadınız',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
          SizedBox(height: 8),
          Text(
            'Cihazınızı taramak için ana sayfaya dönün',
            style: TextStyle(
              color: Colors.grey,
            ),
          ),
        ],
      ),
    );
  }
  
  Widget _buildResultsList(BuildContext context, ScanProvider scanProvider) {
    final scanHistory = scanProvider.scanHistory;
    final detectedThreats = scanProvider.detectedThreats;
    
    return SingleChildScrollView(
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Özet Bilgiler Kartı
            Card(
              elevation: 2,
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Özet Bilgiler',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 16),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        _buildStatItem(
                          Icons.security_update_good,
                          'Toplam Tarama',
                          scanHistory.length.toString(),
                          Colors.blue,
                        ),
                        _buildStatItem(
                          Icons.bug_report,
                          'Tehditler',
                          detectedThreats.length.toString(),
                          Colors.red,
                        ),
                        _buildStatItem(
                          Icons.check_circle,
                          'Temizlenenler',
                          detectedThreats.where((t) => t.isFixed).length.toString(),
                          Colors.green,
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
            
            const SizedBox(height: 24),
            
            // Tarama Geçmişi
            const Text(
              'Tarama Geçmişi',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            
            // Tarama Listesi
            ...scanHistory.map((scan) => _buildScanHistoryItem(context, scan)).toList(),
            
            const SizedBox(height: 24),
            
            // Tespit Edilen Tehditler
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Tespit Edilen Tehditler',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                TextButton.icon(
                  onPressed: detectedThreats.any((t) => !t.isFixed) 
                      ? scanProvider.fixAllThreats 
                      : null,
                  icon: const Icon(Icons.cleaning_services),
                  label: const Text('Hepsini Temizle'),
                ),
              ],
            ),
            const SizedBox(height: 8),
            
            // Tehdit Listesi veya Boş Mesaj
            detectedThreats.isEmpty
                ? const Padding(
                    padding: EdgeInsets.symmetric(vertical: 32.0),
                    child: Center(
                      child: Text(
                        'Hiç tehdit tespit edilmedi',
                        style: TextStyle(color: Colors.grey),
                      ),
                    ),
                  )
                : Column(
                    children: [
                      ...detectedThreats.map(
                        (threat) => ThreatListItem(
                          threat: threat,
                          onFix: () => scanProvider.fixThreat(threat.id),
                        ),
                      ),
                    ],
                  ),
          ],
        ),
      ),
    );
  }
  
  Widget _buildStatItem(IconData icon, String title, String value, Color color) {
    return Column(
      children: [
        Icon(icon, color: color, size: 32),
        const SizedBox(height: 8),
        Text(
          title,
          style: const TextStyle(
            fontSize: 12,
            color: Colors.grey,
          ),
        ),
        Text(
          value,
          style: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.bold,
            color: color,
          ),
        ),
      ],
    );
  }
  
  Widget _buildScanHistoryItem(BuildContext context, Scan scan) {
    final scanTypeText = _getScanTypeText(scan.type);
    final scanResult = scan.threatsFound > 0 ? 'Risk Bulundu' : 'Temiz';
    final scanResultColor = scan.threatsFound > 0 ? Colors.red : Colors.green;
    final scanDate = _formatDate(scan.endTime ?? DateTime.now());
    final scanDuration = _formatDuration(scan.duration);
    
    return Card(
      margin: const EdgeInsets.symmetric(vertical: 8.0),
      child: ListTile(
        leading: Icon(
          scan.threatsFound > 0 ? Icons.warning : Icons.check_circle,
          color: scanResultColor,
          size: 32,
        ),
        title: Text('$scanTypeText Taraması'),
        subtitle: Text('$scanDate, $scanDuration'),
        trailing: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Text(
              scanResult,
              style: TextStyle(
                color: scanResultColor,
                fontWeight: FontWeight.bold,
              ),
            ),
            Text(
              scan.threatsFound > 0 ? '${scan.threatsFound} tehdit' : '',
              style: const TextStyle(fontSize: 12),
            ),
          ],
        ),
        onTap: () {
          // Tarama detaylarını göster
        },
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
  
  String _formatDuration(Duration duration) {
    if (duration.inHours > 0) {
      return '${duration.inHours} saat ${duration.inMinutes.remainder(60)} dk';
    } else if (duration.inMinutes > 0) {
      return '${duration.inMinutes} dk ${duration.inSeconds.remainder(60)} sn';
    } else {
      return '${duration.inSeconds} saniye';
    }
  }
}