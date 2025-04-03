enum ThreatSeverity {
  low,
  medium,
  high,
  critical,
}

enum ThreatType {
  malware,
  adware,
  spyware,
  trojan,
  ransomware,
  riskware,
  suspiciousPermission,
  suspiciousNetwork,
  other,
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
  final String? hash;
  final ThreatType type;
  final ThreatSeverity severity;
  final ThreatStatus status;
  final DateTime detectionTime;
  final String description;
  final Map<String, dynamic>? details;
  
  Threat({
    required this.id,
    required this.appName,
    required this.packageName,
    this.hash,
    required this.type,
    required this.severity,
    required this.status,
    required this.detectionTime,
    required this.description,
    this.details,
  });
  
  factory Threat.fromJson(Map<String, dynamic> json) {
    return Threat(
      id: json['id'] as String,
      appName: json['appName'] as String,
      packageName: json['packageName'] as String,
      hash: json['hash'] as String?,
      type: ThreatType.values.firstWhere(
        (e) => e.toString() == 'ThreatType.${json['type']}',
      ),
      severity: ThreatSeverity.values.firstWhere(
        (e) => e.toString() == 'ThreatSeverity.${json['severity']}',
      ),
      status: ThreatStatus.values.firstWhere(
        (e) => e.toString() == 'ThreatStatus.${json['status']}',
      ),
      detectionTime: DateTime.parse(json['detectionTime'] as String),
      description: json['description'] as String,
      details: json['details'] as Map<String, dynamic>?,
    );
  }
  
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'appName': appName,
      'packageName': packageName,
      'hash': hash,
      'type': type.toString().split('.').last,
      'severity': severity.toString().split('.').last,
      'status': status.toString().split('.').last,
      'detectionTime': detectionTime.toIso8601String(),
      'description': description,
      'details': details,
    };
  }
  
  Threat copyWith({
    String? id,
    String? appName,
    String? packageName,
    String? hash,
    ThreatType? type,
    ThreatSeverity? severity,
    ThreatStatus? status,
    DateTime? detectionTime,
    String? description,
    Map<String, dynamic>? details,
  }) {
    return Threat(
      id: id ?? this.id,
      appName: appName ?? this.appName,
      packageName: packageName ?? this.packageName,
      hash: hash ?? this.hash,
      type: type ?? this.type,
      severity: severity ?? this.severity,
      status: status ?? this.status,
      detectionTime: detectionTime ?? this.detectionTime,
      description: description ?? this.description,
      details: details ?? this.details,
    );
  }
}
