import 'package:flutter/material.dart';
import '../providers/scan_provider.dart';

class ThreatListItem extends StatelessWidget {
  final Threat threat;
  final VoidCallback onFix;

  const ThreatListItem({
    Key? key,
    required this.threat,
    required this.onFix,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    // Tehdit türüne göre ikon belirleme
    IconData typeIcon;
    Color typeColor;
    
    switch (threat.type) {
      case 'Adware':
        typeIcon = Icons.ads_click;
        typeColor = Colors.orange;
        break;
      case 'Spyware':
        typeIcon = Icons.visibility;
        typeColor = Colors.purple;
        break;
      case 'Trojan':
        typeIcon = Icons.warning;
        typeColor = Colors.red;
        break;
      case 'Malware':
        typeIcon = Icons.bug_report;
        typeColor = Colors.red.shade800;
        break;
      case 'Worm':
        typeIcon = Icons.route;
        typeColor = Colors.pink;
        break;
      case 'Ransomware':
        typeIcon = Icons.lock;
        typeColor = Colors.red.shade900;
        break;
      default:
        typeIcon = Icons.security;
        typeColor = Colors.blueGrey;
    }
    
    // Tehdit seviyesine göre renk
    Color severityColor;
    switch (threat.severity) {
      case 'LOW':
        severityColor = Colors.green;
        break;
      case 'MEDIUM':
        severityColor = Colors.orange;
        break;
      case 'HIGH':
        severityColor = Colors.red;
        break;
      default:
        severityColor = Colors.grey;
    }
    
    return Card(
      margin: const EdgeInsets.symmetric(vertical: 8.0),
      elevation: 2,
      child: Padding(
        padding: const EdgeInsets.all(12.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: typeColor.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Icon(
                    typeIcon,
                    color: typeColor,
                    size: 24,
                  ),
                ),
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
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 8,
                              vertical: 2,
                            ),
                            decoration: BoxDecoration(
                              color: typeColor.withOpacity(0.1),
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: Text(
                              threat.type,
                              style: TextStyle(
                                fontSize: 12,
                                color: typeColor,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ),
                          const SizedBox(width: 8),
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 8,
                              vertical: 2,
                            ),
                            decoration: BoxDecoration(
                              color: severityColor.withOpacity(0.1),
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: Text(
                              threat.severity,
                              style: TextStyle(
                                fontSize: 12,
                                color: severityColor,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                ElevatedButton(
                  onPressed: threat.isFixed ? null : onFix,
                  style: ElevatedButton.styleFrom(
                    foregroundColor: Colors.white,
                    backgroundColor: threat.isFixed ? Colors.grey : Colors.green,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(20),
                    ),
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 8,
                    ),
                  ),
                  child: Text(
                    threat.isFixed ? 'Temizlendi' : 'Temizle',
                    style: const TextStyle(fontSize: 12),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Padding(
              padding: const EdgeInsets.only(left: 8.0),
              child: Text(
                threat.description,
                style: const TextStyle(
                  fontSize: 14,
                  color: Colors.grey,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}