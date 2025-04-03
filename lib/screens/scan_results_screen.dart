import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/scan_provider.dart';
import '../widgets/threat_list_item.dart';

class ScanResultsScreen extends StatelessWidget {
  const ScanResultsScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final scanProvider = Provider.of<ScanProvider>(context);
    
    return Scaffold(
      appBar: AppBar(
        title: const Text('Tarama Sonuçları'),
      ),
      body: scanProvider.detectedThreats.isEmpty
          ? const Center(
              child: Text(
                'Herhangi bir tehdit tespit edilmedi',
                style: TextStyle(fontSize: 16, color: Colors.grey),
              ),
            )
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Tehdit Sayısı Bilgisi
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.blue.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.info, color: Colors.blue),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Tespit Edilen Toplam Tehdit: ${scanProvider.detectedThreats.length}',
                                style: const TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                'Temizlenmiş: ${scanProvider.detectedThreats.where((t) => t.isFixed).length}',
                                style: const TextStyle(color: Colors.green),
                              ),
                              Text(
                                'Bekleyen: ${scanProvider.detectedThreats.where((t) => !t.isFixed).length}',
                                style: TextStyle(
                                  color: scanProvider.detectedThreats.where((t) => !t.isFixed).isNotEmpty
                                      ? Colors.red
                                      : Colors.grey,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                  
                  const SizedBox(height: 16),
                  
                  // Tehdit Listesi
                  ...scanProvider.detectedThreats.map((threat) => ThreatListItem(
                    threat: threat,
                    onFix: () => scanProvider.fixThreat(threat.id),
                    showDetails: true,
                  )),
                  
                  const SizedBox(height: 16),
                  
                  // Tüm Tehditleri Temizle Butonu
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
    );
  }
}