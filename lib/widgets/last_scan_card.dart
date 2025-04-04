import 'package:flutter/material.dart';
import '../models/scan_result.dart';
import '../utils/constants.dart';
import 'package:intl/intl.dart';

class LastScanCard extends StatelessWidget {
  final ScanResult scanResult;
  final VoidCallback onViewDetails;

  const LastScanCard({
    Key? key,
    required this.scanResult,
    required this.onViewDetails,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    // Tarama durumuna göre renk ve ikon
    final isRunning = scanResult.endTime == null;
    final hasThreat = scanResult.threatsFound.isNotEmpty;
    
    final statusIconData = isRunning
        ? Icons.pending
        : hasThreat
            ? Icons.warning
            : Icons.check_circle;
            
    final statusColor = isRunning
        ? AppColors.scanInProgress
        : hasThreat
            ? AppColors.scanWarning
            : AppColors.scanComplete;
    
    // Tarih formatı
    final dateFormat = DateFormat('dd.MM.yyyy HH:mm');
    
    return Container(
      margin: EdgeInsets.symmetric(horizontal: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withOpacity(0.1),
            spreadRadius: 1,
            blurRadius: 5,
            offset: Offset(0, 2),
          ),
        ],
        border: Border.all(
          color: statusColor.withOpacity(0.3),
          width: 1,
        ),
      ),
      child: Material(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(12),
        child: InkWell(
          onTap: onViewDetails,
          borderRadius: BorderRadius.circular(12),
          child: Padding(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Üst başlık satırı
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Son Tarama',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: AppColors.textPrimaryColor,
                      ),
                    ),
                    
                    // Tarama tipi rozetleri
                    _buildScanTypeTag(scanResult.type),
                  ],
                ),
                
                SizedBox(height: 12),
                
                // Tarama bilgileri satırı
                Row(
                  children: [
                    // Durum ikonu
                    Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        color: statusColor.withOpacity(0.1),
                        shape: BoxShape.circle,
                      ),
                      child: Icon(
                        statusIconData,
                        color: statusColor,
                      ),
                    ),
                    SizedBox(width: 12),
                    
                    // Tarama detayları
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Tarama sonucu durumu
                          Text(
                            isRunning
                                ? AppTexts.scanInProgress
                                : hasThreat
                                    ? '${scanResult.threatsFound.length} ${AppTexts.threatsFound}'
                                    : AppTexts.scanCompleted,
                            style: TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.bold,
                              color: statusColor,
                            ),
                          ),
                          SizedBox(height: 4),
                          
                          // Tarama başlangıç zamanı
                          Text(
                            'Tarama zamanı: ${dateFormat.format(scanResult.startTime)}',
                            style: TextStyle(
                              fontSize: 12,
                              color: AppColors.captionColor,
                            ),
                          ),
                        ],
                      ),
                    ),
                    
                    // Detaylar butonu
                    TextButton(
                      onPressed: onViewDetails,
                      child: Text(
                        AppTexts.details,
                        style: TextStyle(
                          color: AppColors.primaryColor,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ],
                ),
                
                // İlerleme çubuğu (eğer tarama devam ediyorsa)
                if (isRunning) ...[
                  SizedBox(height: 12),
                  LinearProgressIndicator(
                    value: scanResult.progress / 100,
                    backgroundColor: Colors.grey.shade200,
                    valueColor: AlwaysStoppedAnimation<Color>(AppColors.primaryColor),
                  ),
                  SizedBox(height: 4),
                  Text(
                    '${scanResult.progress.toInt()}%',
                    style: TextStyle(
                      fontSize: 12,
                      color: AppColors.captionColor,
                    ),
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }
  
  // Tarama tipi etiketi
  Widget _buildScanTypeTag(String scanType) {
    String label;
    Color color;
    
    switch (scanType) {
      case ScanTypes.quick:
        label = 'Hızlı Tarama';
        color = AppColors.primaryColor;
        break;
      case ScanTypes.full:
        label = 'Tam Tarama';
        color = AppColors.accentColor;
        break;
      case ScanTypes.wifi:
        label = 'Wi-Fi';
        color = Colors.green;
        break;
      case ScanTypes.qr:
        label = 'QR Kod';
        color = Colors.purple;
        break;
      case ScanTypes.apk:
        label = 'APK';
        color = Colors.orange;
        break;
      default:
        label = scanType;
        color = Colors.grey;
    }
    
    return Container(
      padding: EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: color.withOpacity(0.3),
          width: 1,
        ),
      ),
      child: Text(
        label,
        style: TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.bold,
          color: color,
        ),
      ),
    );
  }
}