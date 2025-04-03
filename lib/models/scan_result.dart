import 'threat.dart';

enum ScanType {
  quick,
  full,
  app,
  background,
}

enum ScanStatus {
  notStarted,
  inProgress,
  completed,
  failed,
}

class ScanResult {
  final String id;
  final ScanType scanType;
  final DateTime scanTime;
  final Duration duration;
  final int scannedItems;
  final List<Threat> threats;
  final ScanStatus status;
  final String? errorMessage;

  ScanResult({
    required this.id,
    required this.scanType,
    required this.scanTime,
    required this.duration,
    required this.scannedItems,
    required this.threats,
    required this.status,
    this.errorMessage,
  });

  factory ScanResult.fromJson(Map<String, dynamic> json) {
    List<Threat> threatsList = [];
    if (json['threats'] != null) {
      threatsList = (json['threats'] as List)
          .map((threatJson) => Threat.fromJson(threatJson))
          .toList();
    }

    return ScanResult(
      id: json['_id'] ?? '',
      scanType: _parseScanType(json['scanType']),
      scanTime: json['scanTime'] != null
          ? DateTime.parse(json['scanTime'])
          : DateTime.now(),
      duration: Duration(milliseconds: json['durationMs'] ?? 0),
      scannedItems: json['scannedItems'] ?? 0,
      threats: threatsList,
      status: _parseScanStatus(json['status']),
      errorMessage: json['errorMessage'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'scanType': scanType.toString().split('.').last,
      'scanTime': scanTime.toIso8601String(),
      'durationMs': duration.inMilliseconds,
      'scannedItems': scannedItems,
      'threats': threats.map((threat) => threat.toJson()).toList(),
      'status': status.toString().split('.').last,
      'errorMessage': errorMessage,
    };
  }

  static ScanType _parseScanType(String? type) {
    if (type == null) return ScanType.quick;

    switch (type.toLowerCase()) {
      case 'full':
        return ScanType.full;
      case 'app':
        return ScanType.app;
      case 'background':
        return ScanType.background;
      default:
        return ScanType.quick;
    }
  }

  static ScanStatus _parseScanStatus(String? status) {
    if (status == null) return ScanStatus.completed;

    switch (status.toLowerCase()) {
      case 'notstarted':
        return ScanStatus.notStarted;
      case 'inprogress':
        return ScanStatus.inProgress;
      case 'failed':
        return ScanStatus.failed;
      default:
        return ScanStatus.completed;
    }
  }
}