import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';

import '../models/scan_result.dart';
import '../providers/scan_provider.dart';
import '../providers/settings_provider.dart';
import '../services/background_service.dart';
import '../widgets/scan_button.dart';
import '../widgets/status_card.dart';
import '../widgets/threat_list_item.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({Key? key}) : super(key: key);

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  @override
  void initState() {
    super.initState();
    // Arka plan servisini başlatır
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final settingsProvider = Provider.of<SettingsProvider>(context, listen: false);
      if (settingsProvider.automaticScanning) {
        BackgroundService.startService();
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('AntiVirüs'),
        actions: [
          IconButton(
            icon: const Icon(Icons.history),
            onPressed: () => Navigator.pushNamed(context, '/scanResults'),
          ),
          IconButton(
            icon: const Icon(Icons.settings),
            onPressed: () => Navigator.pushNamed(context, '/settings'),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          await Provider.of<ScanProvider>(context, listen: false).refreshInstalledApps();
        },
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildStatusSection(),
              const SizedBox(height: 24),
              _buildScanButtons(),
              const SizedBox(height: 24),
              _buildThreatsSection(),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStatusSection() {
    return Consumer<ScanProvider>(
      builder: (context, scanProvider, child) {
        final lastScan = scanProvider.lastScanResult;
        
        return StatusCard(
          isProtected: lastScan != null && lastScan.threats.isEmpty,
          lastScanDate: lastScan?.scanTime,
          threatCount: lastScan?.threats.length ?? 0,
          isScanning: scanProvider.currentStatus == ScanStatus.inProgress,
          progress: scanProvider.progressPercent,
        );
      },
    );
  }

  Widget _buildScanButtons() {
    return Consumer<ScanProvider>(
      builder: (context, scanProvider, child) {
        final isScanning = scanProvider.currentStatus == ScanStatus.inProgress;
        
        return Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              children: [
                Expanded(
                  child: ScanButton(
                    title: 'Hızlı Tarama',
                    icon: Icons.flash_on,
                    color: Colors.blue,
                    isLoading: isScanning && scanProvider.lastScanResult?.scanType == ScanType.quick,
                    onPressed: isScanning ? null : () => scanProvider.startQuickScan(),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: ScanButton(
                    title: 'Tam Tarama',
                    icon: Icons.security,
                    color: Colors.green,
                    isLoading: isScanning && scanProvider.lastScanResult?.scanType == ScanType.full,
                    onPressed: isScanning ? null : () => scanProvider.startFullScan(),
                  ),
                ),
              ],
            ),
          ],
        );
      },
    );
  }

  Widget _buildThreatsSection() {
    return Consumer<ScanProvider>(
      builder: (context, scanProvider, child) {
        final threats = scanProvider.detectedThreats;
        
        if (threats.isEmpty) {
          return Card(
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                children: [
                  Icon(
                    Icons.security,
                    size: 48,
                    color: Colors.green.shade400,
                  ),
                  const SizedBox(height: 16),
                  const Text(
                    'Herhangi bir tehdit tespit edilmedi',
                    style: TextStyle(fontSize: 16),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Son tarama: ${scanProvider.lastScanResult != null ? DateFormat('dd.MM.yyyy HH:mm').format(scanProvider.lastScanResult!.scanTime) : 'Henüz tarama yapılmadı'}',
                    style: TextStyle(color: Colors.grey.shade600),
                  ),
                ],
              ),
            ),
          );
        }
        
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 8.0),
              child: Row(
                children: [
                  const Icon(Icons.warning_amber, color: Colors.orange),
                  const SizedBox(width: 8),
                  Text(
                    'Tespit Edilen Tehditler (${threats.length})',
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            ),
            ...threats.map((threat) {
              return ThreatListItem(
                threat: threat,
                onRemove: () => scanProvider.removeThreat(threat),
                onIgnore: () => scanProvider.ignoreThreat(threat),
                onQuarantine: () => scanProvider.quarantineThreat(threat),
              );
            }).toList(),
          ],
        );
      },
    );
  }
}
