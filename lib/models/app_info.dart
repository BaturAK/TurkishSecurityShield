class AppInfo {
  final String packageName;
  final String appName;
  final String versionName;
  final int versionCode;
  final String apkPath;
  final bool isSystemApp;
  final String installTime;
  final String lastUpdateTime;
  final List<String> permissions;
  final String hash;

  AppInfo({
    required this.packageName,
    required this.appName,
    required this.versionName,
    required this.versionCode,
    required this.apkPath,
    required this.isSystemApp,
    required this.installTime,
    required this.lastUpdateTime,
    required this.permissions,
    required this.hash,
  });

  Map<String, dynamic> toJson() {
    return {
      'packageName': packageName,
      'appName': appName,
      'versionName': versionName,
      'versionCode': versionCode,
      'apkPath': apkPath,
      'isSystemApp': isSystemApp,
      'installTime': installTime,
      'lastUpdateTime': lastUpdateTime,
      'permissions': permissions,
      'hash': hash,
    };
  }

  factory AppInfo.fromJson(Map<String, dynamic> json) {
    return AppInfo(
      packageName: json['packageName'] as String,
      appName: json['appName'] as String,
      versionName: json['versionName'] as String,
      versionCode: json['versionCode'] as int,
      apkPath: json['apkPath'] as String,
      isSystemApp: json['isSystemApp'] as bool,
      installTime: json['installTime'] as String,
      lastUpdateTime: json['lastUpdateTime'] as String,
      permissions: List<String>.from(json['permissions']),
      hash: json['hash'] as String,
    );
  }
}