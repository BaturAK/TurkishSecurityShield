import 'package:flutter/material.dart';
import '../models/threat.dart';
import '../utils/constants.dart';

class ThreatItem extends StatelessWidget {
  final Threat threat;
  final VoidCallback onClean;

  const ThreatItem({
    Key? key,
    required this.threat,
    required this.onClean,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    // Tehdit tipine bağlı olarak ikon ve renk seç
    IconData iconData;
    Color iconColor;

    switch (threat.type) {
      case 'VIRUS':
        iconData = Icons.bug_report;
        iconColor = Colors.red;
        break;
      case 'ADWARE':
        iconData = Icons.ads_click;
        iconColor = Colors.orange;
        break;
      case 'SPYWARE':
        iconData = Icons.visibility;
        iconColor = Colors.purple;
        break;
      case 'TROJAN':
        iconData = Icons.warning;
        iconColor = Colors.red.shade800;
        break;
      case 'RANSOMWARE':
        iconData = Icons.lock;
        iconColor = Colors.red.shade900;
        break;
      default:
        iconData = Icons.warning_amber;
        iconColor = AppColors.warningColor;
    }

    // Tehlike seviyesine bağlı olarak renk seç
    Color severityColor;
    switch (threat.severity) {
      case 'LOW':
        severityColor = Colors.green;
        break;
      case 'MEDIUM':
        severityColor = AppColors.warningColor;
        break;
      case 'HIGH':
        severityColor = AppColors.errorColor;
        break;
      default:
        severityColor = AppColors.warningColor;
    }

    return Card(
      elevation: 0,
      margin: EdgeInsets.symmetric(vertical: 4),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(8),
        side: BorderSide(
          color: Colors.grey.withOpacity(0.2),
          width: 1,
        ),
      ),
      child: Padding(
        padding: const EdgeInsets.all(12.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Üst satır: İkon, isim ve tehlike seviyesi
            Row(
              children: [
                // Tehdit ikonu
                Container(
                  padding: EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: iconColor.withOpacity(0.1),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(
                    iconData,
                    color: iconColor,
                    size: 24,
                  ),
                ),
                SizedBox(width: 12),

                // Tehdit bilgileri
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Tehdit adı
                      Text(
                        threat.name,
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: AppColors.textPrimaryColor,
                        ),
                      ),
                      SizedBox(height: 4),

                      // Tehdit tipi
                      Row(
                        children: [
                          Text(
                            _getThreatTypeName(threat.type),
                            style: TextStyle(
                              fontSize: 12,
                              color: AppColors.textSecondaryColor,
                            ),
                          ),
                          SizedBox(width: 8),

                          // Tehlike seviyesi
                          Container(
                            padding: EdgeInsets.symmetric(
                              horizontal: 6,
                              vertical: 2,
                            ),
                            decoration: BoxDecoration(
                              color: severityColor.withOpacity(0.1),
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: Text(
                              _getSeverityName(threat.severity),
                              style: TextStyle(
                                fontSize: 10,
                                fontWeight: FontWeight.bold,
                                color: severityColor,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),

                // Temizlendi işareti veya temizle butonu
                threat.isCleaned
                    ? Container(
                        padding: EdgeInsets.all(4),
                        decoration: BoxDecoration(
                          color: AppColors.successColor.withOpacity(0.1),
                          shape: BoxShape.circle,
                        ),
                        child: Icon(
                          Icons.check_circle,
                          color: AppColors.successColor,
                          size: 20,
                        ),
                      )
                    : ElevatedButton(
                        onPressed: onClean,
                        child: Text(
                          AppTexts.clean,
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        style: ElevatedButton.styleFrom(
                          primary: AppColors.primaryColor,
                          padding: EdgeInsets.symmetric(
                            horizontal: 12,
                            vertical: 6,
                          ),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(30),
                          ),
                        ),
                      ),
              ],
            ),
            
            // Tehdit açıklaması
            if (threat.description.isNotEmpty) ...[
              SizedBox(height: 8),
              Text(
                threat.description,
                style: TextStyle(
                  fontSize: 13,
                  color: AppColors.textSecondaryColor,
                ),
              ),
            ],
            
            // Dosya yolu
            if (threat.filePath != null && threat.filePath!.isNotEmpty) ...[
              SizedBox(height: 8),
              Row(
                children: [
                  Icon(
                    Icons.folder,
                    size: 14,
                    color: AppColors.captionColor,
                  ),
                  SizedBox(width: 4),
                  Expanded(
                    child: Text(
                      threat.filePath!,
                      style: TextStyle(
                        fontSize: 12,
                        color: AppColors.captionColor,
                        fontFamily: 'monospace',
                      ),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }

  // Tehdit tipini Türkçe olarak döndür
  String _getThreatTypeName(String type) {
    switch (type) {
      case 'VIRUS':
        return 'Virüs';
      case 'TROJAN':
        return 'Truva Atı';
      case 'ADWARE':
        return 'Reklam Yazılımı';
      case 'SPYWARE':
        return 'Casus Yazılım';
      case 'RANSOMWARE':
        return 'Fidye Yazılımı';
      case 'ROOTKIT':
        return 'Rootkit';
      case 'WORM':
        return 'Solucan';
      case 'MALWARE':
        return 'Kötü Amaçlı Yazılım';
      default:
        return type;
    }
  }

  // Tehlike seviyesini Türkçe olarak döndür
  String _getSeverityName(String severity) {
    switch (severity) {
      case 'LOW':
        return 'Düşük';
      case 'MEDIUM':
        return 'Orta';
      case 'HIGH':
        return 'Yüksek';
      default:
        return severity;
    }
  }
}