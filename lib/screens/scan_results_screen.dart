import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';

import '../models/scan_result.dart';
import '../providers/scan_provider.dart';
import '../models/threat.dart';

class ScanResultsScreen extends StatelessWidget {
  const ScanResultsScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Tarama Geçmişi'),
      ),
      body: Consumer<ScanProvider>(
        builder: (context, scanProvider, child) {
          final scanHistory = scanProvider.scanHistory;
          
          if (scanHistory.isEmpty) {
            return const Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.history,
                    size: 64,
                    color: Colors.grey,
                  ),
                  SizedBox(height: 16),
                  Text(
                    'Henüz tarama yapılmadı',
                    style: TextStyle(fontSize: 16),
                  ),
                ],
              ),
            );
          }
          
          return ListView.builder(
            itemCount: scanHistory.length,
            itemBuilder: (context, index) {
              final scanResult = scanHistory[index];
              return _buildScanResultItem(context, scanResult);
            },
          );
        },
      ),
    );
  }

  Widget _buildScanResultItem(BuildContext context, ScanResult scanResult) {
    final dateFormat = DateFormat('dd.MM.yyyy HH:mm');
    final duration = _formatDuration(scanResult.duration);
    
    IconData statusIcon;
    Color statusColor;
    
    switch (scanResult.status) {
      case ScanStatus.completed:
        if (scanResult.hasThreats) {
          statusIcon = Icons.warning;
          statusColor = Colors.orange;
        } else {
          statusIcon = Icons.check_circle;
          statusColor = Colors.green;
        }
        break;
      case ScanStatus.failed:
        statusIcon = Icons.error;
        statusColor = Colors.red;
        break;
      default:
        statusIcon = Icons.access_time;
        statusColor = Colors.blue;
    }
    
    String scanTypeText;
    switch (scanResult.scanType) {
      case ScanType.quick:
        scanTypeText = 'Hızlı Tarama';
        break;
      case ScanType.full:
        scanTypeText = 'Tam Tarama';
        break;
      case ScanType.background:
        scanTypeText = 'Arka Plan Taraması';
        break;
      case ScanType.app:
        scanTypeText = 'Uygulama Taraması';
        break;
    }
    
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: ExpansionTile(
        leading: Icon(statusIcon, color: statusColor, size: 28),
        title: Text(
          scanTypeText,
          style: const TextStyle(
            fontWeight: FontWeight.bold,
          ),
        ),
        subtitle: Text(
          '${dateFormat.format(scanResult.scanTime)} • Süre: $duration',
        ),
        children: [
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildInfoRow('Taranan Öğeler', '${scanResult.scannedItems}'),
                _buildInfoRow('Tehdit Sayısı', '${scanResult.threats.length}'),
                _buildInfoRow('Durum', _getScanStatusText(scanResult.status)),
                
                if (scanResult.errorMessage != null)
                  _buildInfoRow('Hata', scanResult.errorMessage!),
                
                if (scanResult.hasThreats) ...[
                  const Divider(),
                  const Padding(
                    padding: EdgeInsets.symmetric(vertical: 8.0),
                    child: Text(
                      'Tespit Edilen Tehditler',
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                      ),
                    ),
                  ),
                  ...scanResult.threats.map((threat) => _buildThreatItem(threat)),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
  
  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4.0),
      child: Row(
        children: [
          Text(
            '$label: ',
            style: const TextStyle(
              fontWeight: FontWeight.bold,
            ),
          ),
          Text(value),
        ],
      ),
    );
  }
  
  Widget _buildThreatItem(Threat threat) {
    Color severityColor;
    switch (threat.severity) {
      case ThreatSeverity.critical:
        severityColor = Colors.red.shade800;
        break;
      case ThreatSeverity.high:
        severityColor = Colors.red;
        break;
      case ThreatSeverity.medium:
        severityColor = Colors.orange;
        break;
      case ThreatSeverity.low:
        severityColor = Colors.yellow.shade800;
        break;
    }
    
    String statusText;
    Color statusColor;
    switch (threat.status) {
      case ThreatStatus.detected:
        statusText = 'Tespit Edildi';
        statusColor = Colors.red;
        break;
      case ThreatStatus.quarantined:
        statusText = 'Karantinada';
        statusColor = Colors.orange;
        break;
      case ThreatStatus.removed:
        statusText = 'Kaldırıldı';
        statusColor = Colors.green;
        break;
      case ThreatStatus.ignored:
        statusText = 'Yok Sayıldı';
        statusColor = Colors.grey;
        break;
    }
    
    return Card(
      margin: const EdgeInsets.symmetric(vertical: 4.0),
      color: Colors.grey.shade100,
      child: Padding(
        padding: const EdgeInsets.all(12.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(Icons.warning, color: severityColor, size: 16),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    threat.appName,
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                  decoration: BoxDecoration(
                    color: statusColor.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    statusText,
                    style: TextStyle(
                      color: statusColor,
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 4),
            Text(
              threat.description,
              style: const TextStyle(fontSize: 13),
            ),
            Text(
              'Paket: ${threat.packageName}',
              style: TextStyle(
                fontSize: 12,
                color: Colors.grey.shade700,
              ),
            ),
          ],
        ),
      ),
    );
  }
  
  String _formatDuration(Duration duration) {
    if (duration.inSeconds < 60) {
      return '${duration.inSeconds} saniye';
    } else if (duration.inMinutes < 60) {
      return '${duration.inMinutes} dakika ${duration.inSeconds % 60} saniye';
    } else {
      return '${duration.inHours} saat ${duration.inMinutes % 60} dakika';
    }
  }
  
  String _getScanStatusText(ScanStatus status) {
    switch (status) {
      case ScanStatus.notStarted:
        return 'Başlatılmadı';
      case ScanStatus.inProgress:
        return 'Devam Ediyor';
      case ScanStatus.completed:
        return 'Tamamlandı';
      case ScanStatus.failed:
        return 'Başarısız';
    }
  }
}
