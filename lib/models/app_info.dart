class AppInfo {
  final String packageName;
  final String appName;
  final String versionName;
  final int versionCode;
  final String installDate;
  final String updateDate;
  final String appSize;
  final bool isSystemApp;
  final String permissions;
  final String appIcon;
  final bool isRunning;

  AppInfo({
    required this.packageName,
    required this.appName,
    required this.versionName,
    required this.versionCode,
    required this.installDate,
    required this.updateDate,
    required this.appSize,
    required this.isSystemApp,
    required this.permissions,
    required this.appIcon,
    required this.isRunning,
  });

  factory AppInfo.fromJson(Map<String, dynamic> json) {
    return AppInfo(
      packageName: json['packageName'] ?? '',
      appName: json['appName'] ?? '',
      versionName: json['versionName'] ?? '',
      versionCode: json['versionCode'] ?? 0,
      installDate: json['installDate'] ?? '',
      updateDate: json['updateDate'] ?? '',
      appSize: json['appSize'] ?? '',
      isSystemApp: json['isSystemApp'] ?? false,
      permissions: json['permissions'] ?? '',
      appIcon: json['appIcon'] ?? '',
      isRunning: json['isRunning'] ?? false,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'packageName': packageName,
      'appName': appName,
      'versionName': versionName,
      'versionCode': versionCode,
      'installDate': installDate,
      'updateDate': updateDate,
      'appSize': appSize,
      'isSystemApp': isSystemApp,
      'permissions': permissions,
      'appIcon': appIcon,
      'isRunning': isRunning,
    };
  }
}