enum ThreatType {
  virus,
  malware,
  spyware,
  adware,
  rootkit,
  trojan,
  ransomware,
}

enum ThreatSeverity {
  high,
  medium,
  low,
}

enum ThreatStatus {
  detected,
  quarantined,
  removed,
  ignored,
}

class Threat {
  final String id;
  final String appName;
  final String packageName;
  final String description;
  final ThreatType type;
  final ThreatSeverity severity;
  final String filePath;
  final int fileSize;
  final DateTime detectedTime;
  ThreatStatus status;

  Threat({
    required this.id,
    required this.appName,
    required this.packageName,
    required this.description,
    required this.type,
    required this.severity,
    required this.filePath,
    required this.fileSize,
    required this.detectedTime,
    this.status = ThreatStatus.detected,
  });

  factory Threat.fromJson(Map<String, dynamic> json) {
    return Threat(
      id: json['_id'] ?? '',
      appName: json['appName'] ?? '',
      packageName: json['packageName'] ?? '',
      description: json['description'] ?? '',
      type: _parseThreatType(json['type']),
      severity: _parseThreatSeverity(json['severity']),
      filePath: json['filePath'] ?? '',
      fileSize: json['fileSize'] ?? 0,
      detectedTime: json['detectedTime'] != null 
          ? DateTime.parse(json['detectedTime']) 
          : DateTime.now(),
      status: _parseThreatStatus(json['status']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'appName': appName,
      'packageName': packageName,
      'description': description,
      'type': type.toString().split('.').last,
      'severity': severity.toString().split('.').last,
      'filePath': filePath,
      'fileSize': fileSize,
      'detectedTime': detectedTime.toIso8601String(),
      'status': status.toString().split('.').last,
    };
  }

  static ThreatType _parseThreatType(String? type) {
    if (type == null) return ThreatType.malware;

    switch (type.toLowerCase()) {
      case 'virus':
        return ThreatType.virus;
      case 'spyware':
        return ThreatType.spyware;
      case 'adware':
        return ThreatType.adware;
      case 'rootkit':
        return ThreatType.rootkit;
      case 'trojan':
        return ThreatType.trojan;
      case 'ransomware':
        return ThreatType.ransomware;
      default:
        return ThreatType.malware;
    }
  }

  static ThreatSeverity _parseThreatSeverity(String? severity) {
    if (severity == null) return ThreatSeverity.medium;

    switch (severity.toLowerCase()) {
      case 'high':
        return ThreatSeverity.high;
      case 'medium':
        return ThreatSeverity.medium;
      case 'low':
        return ThreatSeverity.low;
      default:
        return ThreatSeverity.medium;
    }
  }

  static ThreatStatus _parseThreatStatus(String? status) {
    if (status == null) return ThreatStatus.detected;

    switch (status.toLowerCase()) {
      case 'quarantined':
        return ThreatStatus.quarantined;
      case 'removed':
        return ThreatStatus.removed;
      case 'ignored':
        return ThreatStatus.ignored;
      default:
        return ThreatStatus.detected;
    }
  }
}