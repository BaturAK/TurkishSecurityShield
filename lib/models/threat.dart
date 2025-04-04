import 'dart:convert';

class Threat {
  final String id;
  final String name;
  final String type;
  final String description;
  final String severity;
  final String? filePath;
  bool isCleaned;
  final DateTime detectionDate;

  Threat({
    required this.id,
    required this.name,
    required this.type,
    required this.description,
    this.severity = 'MEDIUM',
    this.filePath,
    this.isCleaned = false,
    DateTime? detectionDate,
  }) : this.detectionDate = detectionDate ?? DateTime.now();

  // JSON'dan nesne oluşturma
  factory Threat.fromJson(Map<String, dynamic> json) {
    return Threat(
      id: json['_id'] ?? json['id'],
      name: json['name'],
      type: json['type'],
      description: json['description'] ?? '',
      severity: json['severity'] ?? 'MEDIUM',
      filePath: json['filePath'],
      isCleaned: json['isCleaned'] ?? false,
      detectionDate: json['detectionDate'] != null
          ? DateTime.parse(json['detectionDate'])
          : DateTime.now(),
    );
  }

  // JSON'a dönüştürme
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'type': type,
      'description': description,
      'severity': severity,
      'filePath': filePath,
      'isCleaned': isCleaned,
      'detectionDate': detectionDate.toIso8601String(),
    };
  }

  // Tehdidi temizle
  void clean() {
    isCleaned = true;
  }

  // Rastgele test tehditleri oluşturma
  static List<Threat> generateRandomThreats(int count) {
    final threats = [
      {
        'name': 'Trojan.AndroidOS.Agent',
        'type': 'TROJAN',
        'description': 'Cihazın sistem yetkilerini ele geçirebilen ve kişisel verileri çalabilecek bir Truva atı tehdidir.',
        'severity': 'HIGH',
      },
      {
        'name': 'Adware.AndroidOS.Ewind',
        'type': 'ADWARE',
        'description': 'Rahatsız edici reklamlar gösteren ve kullanıcı davranışlarını takip eden bir reklam yazılımıdır.',
        'severity': 'MEDIUM',
      },
      {
        'name': 'Spyware.AndroidOS.Agent',
        'type': 'SPYWARE',
        'description': 'Kullanıcı bilgilerini gizlice toplayan ve uzak sunuculara gönderen bir casus yazılımdır.',
        'severity': 'HIGH',
      },
      {
        'name': 'RiskTool.AndroidOS.SMSreg',
        'type': 'MALWARE',
        'description': 'Ücretli SMS hizmetlerine izinsiz abone olabilen ve faturalandırma yapan bir risk aracıdır.',
        'severity': 'MEDIUM',
      },
      {
        'name': 'Virus.AndroidOS.Dvmap',
        'type': 'VIRUS',
        'description': 'Sistem dosyalarını değiştirerek cihazın normal çalışmasını engelleyebilen bir virüstür.',
        'severity': 'HIGH',
      },
      {
        'name': 'RiskTool.AndroidOS.Wapron',
        'type': 'TROJAN',
        'description': 'Premium WAP hizmetlerine izinsiz abone olarak kullanıcıyı ücretlendirebilen bir Truva atıdır.',
        'severity': 'MEDIUM',
      },
      {
        'name': 'Trojan.AndroidOS.Boogr',
        'type': 'TROJAN',
        'description': 'Kullanıcı verileri ve banka bilgilerini çalmak için tasarlanmış zararlı bir yazılımdır.',
        'severity': 'HIGH',
      },
      {
        'name': 'Adware.AndroidOS.Mobby',
        'type': 'ADWARE',
        'description': 'Kullanıcıları sahte reklamlara yönlendiren ve istenmeyen uygulamaları indirmeye teşvik eden bir yazılımdır.',
        'severity': 'LOW',
      },
    ];

    // Rastgele tehditler seç
    final result = <Threat>[];
    final now = DateTime.now();
    
    for (int i = 0; i < count; i++) {
      final index = DateTime.now().millisecondsSinceEpoch % threats.length;
      final threat = threats[index];
      
      result.add(Threat(
        id: 'threat_${now.millisecondsSinceEpoch}_$i',
        name: threat['name']!,
        type: threat['type']!,
        description: threat['description']!,
        severity: threat['severity']!,
        filePath: '/data/app/com.example.suspicious.app-${i + 1}/base.apk',
        isCleaned: false,
        detectionDate: now.subtract(Duration(minutes: i * 5)),
      ));
    }
    
    return result;
  }
}