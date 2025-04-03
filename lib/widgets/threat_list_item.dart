import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../models/threat.dart';

class ThreatListItem extends StatelessWidget {
  final Threat threat;
  final VoidCallback? onRemove;
  final VoidCallback? onIgnore;
  final VoidCallback? onQuarantine;
  
  const ThreatListItem({
    Key? key,
    required this.threat,
    this.onRemove,
    this.onIgnore,
    this.onQuarantine,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    Color severityColor;
    String severityText;
    
    switch (threat.severity) {
      case ThreatSeverity.critical:
        severityColor = Colors.red.shade800;
        severityText = 'Kritik';
        break;
      case ThreatSeverity.high:
        severityColor = Colors.red.shade600;
        severityText = 'Yüksek';
        break;
      case ThreatSeverity.medium:
        severityColor = Colors.orange;
        severityText = 'Orta';
        break;
      case ThreatSeverity.low:
        severityColor = Colors.amber;
        severityText = 'Düşük';
        break;
    }
    
    bool isResolved = threat.status == ThreatStatus.removed || 
                      threat.status == ThreatStatus.ignored;
    
    return Card(
      margin: const EdgeInsets.symmetric(vertical: 6),
      child: Column(
        children: [
          ListTile(
            leading: Icon(
              isResolved ? Icons.check_circle : Icons.warning,
              color: isResolved ? Colors.green : severityColor,
              size: 28,
            ),
            title: Text(
              threat.appName,
              style: const TextStyle(
                fontWeight: FontWeight.bold,
              ),
            ),
            subtitle: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  threat.packageName,
                  style: const TextStyle(fontSize: 12),
                ),
                const SizedBox(height: 4),
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: severityColor.withOpacity(0.2),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        severityText,
                        style: TextStyle(
                          color: severityColor,
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      DateFormat('dd.MM.yyyy HH:mm').format(threat.detectionTime),
                      style: TextStyle(
                        fontSize: 10,
                        color: Colors.grey.shade600,
                      ),
                    ),
                  ],
                ),
              ],
            ),
            trailing: isResolved
                ? _buildStatusChip(context, threat.status)
                : IconButton(
                    icon: const Icon(Icons.more_vert),
                    onPressed: () => _showActionSheet(context),
                  ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  threat.description,
                  style: const TextStyle(fontSize: 14),
                ),
                if (!isResolved) ...[
                  const SizedBox(height: 12),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.end,
                    children: [
                      if (onQuarantine != null)
                        TextButton.icon(
                          icon: const Icon(Icons.pause_circle_outline, size: 18),
                          label: const Text('Karantina'),
                          onPressed: onQuarantine,
                          style: TextButton.styleFrom(
                            foregroundColor: Colors.orange,
                          ),
                        ),
                      if (onIgnore != null)
                        TextButton.icon(
                          icon: const Icon(Icons.visibility_off, size: 18),
                          label: const Text('Yok Say'),
                          onPressed: onIgnore,
                          style: TextButton.styleFrom(
                            foregroundColor: Colors.grey,
                          ),
                        ),
                      if (onRemove != null)
                        TextButton.icon(
                          icon: const Icon(Icons.delete_outline, size: 18),
                          label: const Text('Kaldır'),
                          onPressed: onRemove,
                          style: TextButton.styleFrom(
                            foregroundColor: Colors.red,
                          ),
                        ),
                    ],
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
  
  Widget _buildStatusChip(BuildContext context, ThreatStatus status) {
    String text;
    Color color;
    
    switch (status) {
      case ThreatStatus.removed:
        text = 'Kaldırıldı';
        color = Colors.green;
        break;
      case ThreatStatus.quarantined:
        text = 'Karantinada';
        color = Colors.orange;
        break;
      case ThreatStatus.ignored:
        text = 'Yok Sayıldı';
        color = Colors.grey;
        break;
      default:
        text = 'Aktif';
        color = Colors.red;
    }
    
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.2),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(
        text,
        style: TextStyle(
          color: color,
          fontSize: 12,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }
  
  void _showActionSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      builder: (BuildContext context) {
        return SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              ListTile(
                leading: const Icon(Icons.delete_outline, color: Colors.red),
                title: const Text('Tehditi Kaldır'),
                subtitle: const Text('Uygulamayı cihazdan sil'),
                onTap: () {
                  Navigator.pop(context);
                  if (onRemove != null) onRemove!();
                },
              ),
              ListTile(
                leading: const Icon(Icons.pause_circle_outline, color: Colors.orange),
                title: const Text('Karantinaya Al'),
                subtitle: const Text('Uygulamayı devre dışı bırak'),
                onTap: () {
                  Navigator.pop(context);
                  if (onQuarantine != null) onQuarantine!();
                },
              ),
              ListTile(
                leading: const Icon(Icons.visibility_off, color: Colors.grey),
                title: const Text('Yok Say'),
                subtitle: const Text('Bu tehditi görmezden gel'),
                onTap: () {
                  Navigator.pop(context);
                  if (onIgnore != null) onIgnore!();
                },
              ),
              ListTile(
                leading: const Icon(Icons.info_outline),
                title: const Text('Detayları Görüntüle'),
                onTap: () {
                  Navigator.pop(context);
                  // TODO: Detay ekranını göster
                },
              ),
            ],
          ),
        );
      },
    );
  }
}
