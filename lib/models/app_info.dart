class AppInfo {
  final String packageName;
  final String appName;
  final String versionName;
  final int versionCode;
  final String apkPath;
  final String? appIcon;
  final bool isSystemApp;
  final String installTime;
  final String lastUpdateTime;
  final String? hash;
  final List<String> permissions;
  
  AppInfo({
    required this.packageName,
    required this.appName,
    required this.versionName,
    required this.versionCode,
    required this.apkPath,
    this.appIcon,
    required this.isSystemApp,
    required this.installTime,
    required this.lastUpdateTime,
    this.hash,
    required this.permissions,
  });
  
  factory AppInfo.fromJson(Map<String, dynamic> json) {
    return AppInfo(
      packageName: json['packageName'] as String,
      appName: json['appName'] as String,
      versionName: json['versionName'] as String,
      versionCode: json['versionCode'] as int,
      apkPath: json['apkPath'] as String,
      appIcon: json['appIcon'] as String?,
      isSystemApp: json['isSystemApp'] as bool,
      installTime: json['installTime'] as String,
      lastUpdateTime: json['lastUpdateTime'] as String,
      hash: json['hash'] as String?,
      permissions: List<String>.from(json['permissions'] as List),
    );
  }
  
  Map<String, dynamic> toJson() {
    return {
      'packageName': packageName,
      'appName': appName,
      'versionName': versionName,
      'versionCode': versionCode,
      'apkPath': apkPath,
      'appIcon': appIcon,
      'isSystemApp': isSystemApp,
      'installTime': installTime,
      'lastUpdateTime': lastUpdateTime,
      'hash': hash,
      'permissions': permissions,
    };
  }
}
