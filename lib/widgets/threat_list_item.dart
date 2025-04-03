import 'package:flutter/material.dart';
import '../providers/scan_provider.dart';

class ThreatListItem extends StatelessWidget {
  final Threat threat;
  final VoidCallback onFix;
  final bool showDetails;

  const ThreatListItem({
    Key? key,
    required this.threat,
    required this.onFix,
    this.showDetails = false,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(12.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                _getThreatLevelIcon(),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        threat.name,
                        style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 16,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        threat.description,
                        style: TextStyle(
                          fontSize: 14,
                          color: Colors.grey[700],
                        ),
                      ),
                    ],
                  ),
                ),
                if (threat.isFixed)
                  const Chip(
                    label: Text('Temizlendi'),
                    backgroundColor: Colors.green,
                    labelStyle: TextStyle(color: Colors.white, fontSize: 12),
                    padding: EdgeInsets.zero,
                  )
                else
                  ElevatedButton(
                    onPressed: onFix,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.green,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      textStyle: const TextStyle(fontSize: 12),
                    ),
                    child: const Text('Temizle'),
                  ),
              ],
            ),
            
            if (showDetails) ...[
              const SizedBox(height: 16),
              const Divider(height: 1),
              const SizedBox(height: 8),
              
              // Tehdit Detayları
              _buildDetailRow('Konum', threat.location),
              const SizedBox(height: 4),
              _buildDetailRow('Tespit Tarihi', _formatDateTime(threat.detectedAt)),
              const SizedBox(height: 4),
              _buildDetailRow('Tehdit Seviyesi', _getThreatLevelText()),
              const SizedBox(height: 4),
              _buildDetailRow('Durum', threat.isFixed ? 'Temizlendi' : 'Beklemede'),
            ],
          ],
        ),
      ),
    );
  }
  
  Widget _buildDetailRow(String label, String value) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SizedBox(
          width: 120,
          child: Text(
            '$label:',
            style: TextStyle(
              fontSize: 13,
              color: Colors.grey[600],
            ),
          ),
        ),
        Expanded(
          child: Text(
            value,
            style: const TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w500,
            ),
          ),
        ),
      ],
    );
  }
  
  Widget _getThreatLevelIcon() {
    Color color;
    IconData icon;
    
    switch (threat.level) {
      case ThreatLevel.critical:
        color = Colors.red;
        icon = Icons.error;
        break;
      case ThreatLevel.high:
        color = Colors.orange;
        icon = Icons.warning;
        break;
      case ThreatLevel.medium:
        color = Colors.amber;
        icon = Icons.info;
        break;
      case ThreatLevel.low:
        color = Colors.blue;
        icon = Icons.info_outline;
        break;
    }
    
    return Container(
      padding: const EdgeInsets.all(8),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        shape: BoxShape.circle,
      ),
      child: Icon(icon, color: color, size: 24),
    );
  }
  
  String _getThreatLevelText() {
    switch (threat.level) {
      case ThreatLevel.critical:
        return 'Kritik';
      case ThreatLevel.high:
        return 'Yüksek';
      case ThreatLevel.medium:
        return 'Orta';
      case ThreatLevel.low:
        return 'Düşük';
    }
  }
  
  String _formatDateTime(DateTime dateTime) {
    return '${dateTime.day}/${dateTime.month}/${dateTime.year} ${dateTime.hour}:${dateTime.minute.toString().padLeft(2, '0')}';
  }
}