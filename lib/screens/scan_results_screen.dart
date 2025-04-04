import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../providers/scan_provider.dart';
import '../models/scan_result.dart';
import '../models/threat.dart';
import '../utils/constants.dart';
import '../widgets/threat_item.dart';

class ScanResultsScreen extends StatefulWidget {
  @override
  _ScanResultsScreenState createState() => _ScanResultsScreenState();
}

class _ScanResultsScreenState extends State<ScanResultsScreen> with SingleTickerProviderStateMixin {
  late AnimationController _animationController;
  late Animation<double> _animation;
  String? scanId;
  bool _isInitialized = false;
  
  @override
  void initState() {
    super.initState();
    
    // İlerleme animasyonu için controller
    _animationController = AnimationController(
      vsync: this,
      duration: Duration(seconds: 2),
    )..repeat();
    
    _animation = Tween<double>(begin: 0, end: 1).animate(
      CurvedAnimation(
        parent: _animationController,
        curve: Curves.easeInOut,
      ),
    );
  }
  
  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    
    if (!_isInitialized) {
      // Argümanları al
      final args = ModalRoute.of(context)?.settings.arguments;
      
      if (args is String) {
        scanId = args;
        _loadScanResult();
      }
      
      _isInitialized = true;
    }
  }
  
  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  // Tarama sonucunu yükle
  Future<void> _loadScanResult() async {
    if (scanId != null) {
      final scanProvider = Provider.of<ScanProvider>(context, listen: false);
      await scanProvider.getScanResult(scanId!);
    }
  }

  @override
  Widget build(BuildContext context) {
    final scanProvider = Provider.of<ScanProvider>(context);
    final isScanning = scanProvider.isScanning;
    final isLoading = scanProvider.isLoading;
    
    // Mevcut tarama ya da belirli bir tarama sonucunu al
    final ScanResult? scanResult = scanId != null
        ? (scanProvider.currentScan?.id == scanId
            ? scanProvider.currentScan
            : scanProvider.lastScanResult)
        : scanProvider.currentScan;
    
    if (isLoading) {
      return Scaffold(
        appBar: AppBar(
          title: Text(
            'Yükleniyor...',
            style: TextStyle(
              color: AppColors.textPrimaryColor,
              fontWeight: FontWeight.bold,
            ),
          ),
        ),
        body: Center(
          child: CircularProgressIndicator(),
        ),
      );
    }
    
    if (scanResult == null) {
      return Scaffold(
        appBar: AppBar(
          title: Text(
            'Tarama Sonucu Bulunamadı',
            style: TextStyle(
              color: AppColors.textPrimaryColor,
              fontWeight: FontWeight.bold,
            ),
          ),
        ),
        body: Center(
          child: Text('Tarama sonucu bulunamadı veya henüz bir tarama yapılmadı.'),
        ),
      );
    }
    
    // Tarama devam ediyor mu?
    final isRunning = isScanning && scanResult.endTime == null;
    
    // Bulunan tehdit sayısı
    final threatCount = scanResult.threatsFound.length;
    
    // Temizlenmeyen tehdit sayısı
    final activeThreats = scanResult.threatsFound.where((threat) => !threat.isCleaned).toList();
    
    return Scaffold(
      appBar: AppBar(
        title: Text(
          isRunning ? 'Tarama Devam Ediyor' : 'Tarama Sonucu',
          style: TextStyle(
            color: AppColors.textPrimaryColor,
            fontWeight: FontWeight.bold,
          ),
        ),
        actions: [
          // Eğer tarama devam ediyorsa iptal butonu göster
          if (isRunning)
            IconButton(
              icon: Icon(
                Icons.cancel,
                color: AppColors.errorColor,
              ),
              onPressed: () {
                _showCancelDialog(context);
              },
            ),
        ],
      ),
      body: Column(
        children: [
          // Tarama durum kartı
          _buildStatusCard(context, scanResult, isRunning),
          
          // Divider
          Divider(height: 1),
          
          // Tehdit listesi başlığı
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Bulunan Tehditler (${scanResult.threatsFound.length})',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: AppColors.textPrimaryColor,
                  ),
                ),
                // Tehdit varsa "Tümünü Temizle" butonu göster
                if (threatCount > 0 && activeThreats.isNotEmpty)
                  TextButton(
                    onPressed: () => _cleanAllThreats(context),
                    child: Text(
                      AppTexts.cleanAll,
                      style: TextStyle(
                        color: AppColors.primaryColor,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
              ],
            ),
          ),
          
          // Tehdit listesi
          Expanded(
            child: threatCount > 0
                ? ListView.separated(
                    padding: EdgeInsets.symmetric(horizontal: 16),
                    itemCount: scanResult.threatsFound.length,
                    separatorBuilder: (context, index) => Divider(height: 1),
                    itemBuilder: (context, index) {
                      final threat = scanResult.threatsFound[index];
                      return ThreatItem(
                        threat: threat,
                        onClean: () => _cleanThreat(context, threat.id),
                      );
                    },
                  )
                : Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.check_circle,
                          size: 64,
                          color: AppColors.successColor,
                        ),
                        SizedBox(height: 16),
                        Text(
                          isRunning
                              ? 'Henüz tehdit bulunamadı...'
                              : 'Tehdit bulunamadı',
                          style: TextStyle(
                            fontSize: 18,
                            color: AppColors.textPrimaryColor,
                          ),
                        ),
                      ],
                    ),
                  ),
          ),
        ],
      ),
    );
  }

  // Tarama durum kartı
  Widget _buildStatusCard(BuildContext context, ScanResult scanResult, bool isRunning) {
    final titleText = isRunning
        ? AppTexts.scanInProgress
        : scanResult.threatsFound.isEmpty
            ? AppTexts.scanCompleted
            : '${scanResult.threatsFound.length} ${AppTexts.threatsFound}';
            
    final titleColor = isRunning
        ? AppColors.scanInProgress
        : scanResult.threatsFound.isEmpty
            ? AppColors.scanComplete
            : AppColors.scanWarning;
            
    final iconData = isRunning
        ? Icons.pending
        : scanResult.threatsFound.isEmpty
            ? Icons.check_circle
            : Icons.warning;
    
    // Tarih ve saat formatı
    final dateFormat = DateFormat('dd.MM.yyyy HH:mm');
    
    return Container(
      padding: EdgeInsets.all(16),
      color: Colors.grey.shade100,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Başlık ve ikon
          Row(
            children: [
              Icon(
                iconData,
                color: titleColor,
                size: 24,
              ),
              SizedBox(width: 8),
              Text(
                titleText,
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: titleColor,
                ),
              ),
            ],
          ),
          SizedBox(height: 16),
          
          // Tarama bilgileri
          Row(
            children: [
              // Tarama tipi ve tarihi
              Expanded(
                flex: 3,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Tarama Tipi',
                      style: TextStyle(
                        fontSize: 14,
                        color: AppColors.captionColor,
                      ),
                    ),
                    SizedBox(height: 4),
                    Text(
                      _getScanTypeName(scanResult.type),
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    SizedBox(height: 12),
                    Text(
                      AppTexts.scanDate,
                      style: TextStyle(
                        fontSize: 14,
                        color: AppColors.captionColor,
                      ),
                    ),
                    SizedBox(height: 4),
                    Text(
                      dateFormat.format(scanResult.startTime),
                      style: TextStyle(
                        fontSize: 16,
                      ),
                    ),
                  ],
                ),
              ),
              
              // Süre ve taranan öğe sayısı
              Expanded(
                flex: 3,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      AppTexts.duration,
                      style: TextStyle(
                        fontSize: 14,
                        color: AppColors.captionColor,
                      ),
                    ),
                    SizedBox(height: 4),
                    Text(
                      _formatDuration(scanResult.duration),
                      style: TextStyle(
                        fontSize: 16,
                      ),
                    ),
                    SizedBox(height: 12),
                    Text(
                      AppTexts.totalScanned,
                      style: TextStyle(
                        fontSize: 14,
                        color: AppColors.captionColor,
                      ),
                    ),
                    SizedBox(height: 4),
                    Text(
                      '${scanResult.totalScanned} öğe',
                      style: TextStyle(
                        fontSize: 16,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          
          // İlerleme çubuğu (eğer tarama devam ediyorsa)
          if (isRunning) ...[
            SizedBox(height: 20),
            AnimatedBuilder(
              animation: _animationController,
              builder: (context, child) {
                return LinearProgressIndicator(
                  value: scanResult.progress / 100,
                  backgroundColor: Colors.grey.shade300,
                  valueColor: AlwaysStoppedAnimation<Color>(AppColors.primaryColor),
                );
              },
            ),
            SizedBox(height: 8),
            Text(
              'Tarama devam ediyor... %${scanResult.progress.toInt()}',
              style: TextStyle(
                fontSize: 14,
                color: AppColors.captionColor,
              ),
            ),
          ],
        ],
      ),
    );
  }
  
  // Süreyi formatla
  String _formatDuration(int seconds) {
    if (seconds < 60) {
      return '$seconds saniye';
    } else if (seconds < 3600) {
      final minutes = seconds ~/ 60;
      final remainingSeconds = seconds % 60;
      return '$minutes dk ${remainingSeconds > 0 ? '$remainingSeconds sn' : ''}';
    } else {
      final hours = seconds ~/ 3600;
      final minutes = (seconds % 3600) ~/ 60;
      return '$hours sa ${minutes > 0 ? '$minutes dk' : ''}';
    }
  }
  
  // Tarama tipini Türkçe olarak al
  String _getScanTypeName(String scanType) {
    switch (scanType) {
      case ScanTypes.quick:
        return 'Hızlı Tarama';
      case ScanTypes.full:
        return 'Tam Tarama';
      case ScanTypes.wifi:
        return 'Wi-Fi Taraması';
      case ScanTypes.qr:
        return 'QR Kod Taraması';
      case ScanTypes.apk:
        return 'APK Taraması';
      case ScanTypes.custom:
        return 'Özel Tarama';
      default:
        return scanType;
    }
  }
  
  // Taramayı iptal et
  void _showCancelDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Taramayı İptal Et'),
        content: Text('Devam eden taramayı iptal etmek istediğinize emin misiniz?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text(AppTexts.cancel),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              final scanProvider = Provider.of<ScanProvider>(context, listen: false);
              scanProvider.cancelScan();
              Navigator.pop(context); // Ekrandan da çık
            },
            child: Text('İptal Et'),
            style: ElevatedButton.styleFrom(
              primary: AppColors.errorColor,
            ),
          ),
        ],
      ),
    );
  }
  
  // Tehdidi temizle
  Future<void> _cleanThreat(BuildContext context, String threatId) async {
    final scanProvider = Provider.of<ScanProvider>(context, listen: false);
    final success = await scanProvider.cleanThreat(threatId);
    
    if (success) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Tehdit başarıyla temizlendi'),
          backgroundColor: AppColors.successColor,
        ),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Tehdit temizlenirken bir hata oluştu'),
          backgroundColor: AppColors.errorColor,
        ),
      );
    }
  }
  
  // Tüm tehditleri temizle
  Future<void> _cleanAllThreats(BuildContext context) async {
    final scanProvider = Provider.of<ScanProvider>(context, listen: false);
    final success = await scanProvider.cleanAllThreats();
    
    if (success) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Tüm tehditler başarıyla temizlendi'),
          backgroundColor: AppColors.successColor,
        ),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Tehditler temizlenirken bir hata oluştu'),
          backgroundColor: AppColors.errorColor,
        ),
      );
    }
  }
}