import 'threat.dart';

enum ScanStatus {
  notStarted,
  inProgress,
  completed,
  failed,
}

enum ScanType {
  quick,
  full,
  background,
  app,
}

class ScanResult {
  final String id;
  final DateTime scanTime;
  final ScanType scanType;
  final ScanStatus status;
  final List<Threat> threats;
  final int scannedItems;
  final Duration duration;
  final String? errorMessage;
  
  ScanResult({
    required this.id,
    required this.scanTime,
    required this.scanType,
    required this.status,
    required this.threats,
    required this.scannedItems,
    required this.duration,
    this.errorMessage,
  });
  
  bool get hasThreats => threats.isNotEmpty;
  
  factory ScanResult.fromJson(Map<String, dynamic> json) {
    return ScanResult(
      id: json['id'] as String,
      scanTime: DateTime.parse(json['scanTime'] as String),
      scanType: ScanType.values.firstWhere(
        (e) => e.toString() == 'ScanType.${json['scanType']}',
      ),
      status: ScanStatus.values.firstWhere(
        (e) => e.toString() == 'ScanStatus.${json['status']}',
      ),
      threats: (json['threats'] as List)
          .map((e) => Threat.fromJson(e as Map<String, dynamic>))
          .toList(),
      scannedItems: json['scannedItems'] as int,
      duration: Duration(milliseconds: json['durationMs'] as int),
      errorMessage: json['errorMessage'] as String?,
    );
  }
  
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'scanTime': scanTime.toIso8601String(),
      'scanType': scanType.toString().split('.').last,
      'status': status.toString().split('.').last,
      'threats': threats.map((e) => e.toJson()).toList(),
      'scannedItems': scannedItems,
      'durationMs': duration.inMilliseconds,
      'errorMessage': errorMessage,
    };
  }
  
  ScanResult copyWith({
    String? id,
    DateTime? scanTime,
    ScanType? scanType,
    ScanStatus? status,
    List<Threat>? threats,
    int? scannedItems,
    Duration? duration,
    String? errorMessage,
  }) {
    return ScanResult(
      id: id ?? this.id,
      scanTime: scanTime ?? this.scanTime,
      scanType: scanType ?? this.scanType,
      status: status ?? this.status,
      threats: threats ?? this.threats,
      scannedItems: scannedItems ?? this.scannedItems,
      duration: duration ?? this.duration,
      errorMessage: errorMessage ?? this.errorMessage,
    );
  }
}
