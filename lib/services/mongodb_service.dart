import 'dart:async';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

import '../models/threat.dart';
import '../models/scan_result.dart';

class MongoDBService {
  static const String connectionUri = 'mongodb+srv://webdb:Hacked_22@mongodb.sgpezuw.mongodb.net/';
  static const String apiUrl = 'https://data.mongodb-api.com/app/data-api/endpoint/data/v1/action';
  static const String appId = 'antivirusapp-wgqnw';
  static const String dbName = 'antivirusdb';
  static const String threatsCollection = 'threats';
  static const String scanResultsCollection = 'scan_results';

  late String _apiKey;
  bool _isInitialized = false;
  
  // Local cache for offline usage
  List<Threat> _localThreatCache = [];
  List<ScanResult> _localScanResultCache = [];
  
  // Singleton pattern
  static final MongoDBService _instance = MongoDBService._internal();
  
  factory MongoDBService() {
    return _instance;
  }
  
  MongoDBService._internal();
  
  Future<void> initialize() async {
    if (_isInitialized) return;
    
    try {
      await _loadApiKey();
      await _loadLocalCache();
      _isInitialized = true;
      debugPrint('MongoDB service initialized');
    } catch (e) {
      debugPrint('Failed to initialize MongoDB service: $e');
    }
  }
  
  Future<void> _loadApiKey() async {
    // In a real app, you would securely store and retrieve the API key
    // For this example, we're using a fixed API key or loading from shared prefs
    // In production, consider using Flutter Secure Storage
    SharedPreferences prefs = await SharedPreferences.getInstance();
    _apiKey = prefs.getString('mongodb_api_key') ?? 'your-mongodb-api-key';
  }
  
  Future<void> _loadLocalCache() async {
    SharedPreferences prefs = await SharedPreferences.getInstance();
    
    // Load cached threats
    String? threatsJson = prefs.getString('local_threats');
    if (threatsJson != null) {
      try {
        List<dynamic> decoded = jsonDecode(threatsJson);
        _localThreatCache = decoded.map((item) => Threat.fromJson(item)).toList();
      } catch (e) {
        debugPrint('Error parsing cached threats: $e');
      }
    }
    
    // Load cached scan results
    String? resultsJson = prefs.getString('local_scan_results');
    if (resultsJson != null) {
      try {
        List<dynamic> decoded = jsonDecode(resultsJson);
        _localScanResultCache = decoded.map((item) => ScanResult.fromJson(item)).toList();
      } catch (e) {
        debugPrint('Error parsing cached scan results: $e');
      }
    }
  }
  
  Future<void> _saveLocalCache() async {
    SharedPreferences prefs = await SharedPreferences.getInstance();
    
    try {
      // Save threats to local cache
      List<Map<String, dynamic>> threatsJson = _localThreatCache.map((threat) => threat.toJson()).toList();
      await prefs.setString('local_threats', jsonEncode(threatsJson));
      
      // Save scan results to local cache
      List<Map<String, dynamic>> resultsJson = _localScanResultCache.map((result) => result.toJson()).toList();
      await prefs.setString('local_scan_results', jsonEncode(resultsJson));
    } catch (e) {
      debugPrint('Error saving local cache: $e');
    }
  }
  
  // Check if device is online
  Future<bool> isOnline() async {
    try {
      final response = await http.get(Uri.parse('https://www.google.com'))
          .timeout(const Duration(seconds: 5));
      return response.statusCode == 200;
    } catch (e) {
      return false;
    }
  }
  
  // Threats API
  Future<List<Threat>> getThreats() async {
    if (!await isOnline()) {
      debugPrint('Device offline, returning cached threats');
      return _localThreatCache;
    }
    
    try {
      final response = await http.post(
        Uri.parse('$apiUrl/find'),
        headers: _getHeaders(),
        body: jsonEncode({
          'dataSource': 'MongoDB-Atlas',
          'database': dbName,
          'collection': threatsCollection,
          'filter': {},
        }),
      );
      
      if (response.statusCode == 200) {
        final Map<String, dynamic> data = jsonDecode(response.body);
        final List<dynamic> documents = data['documents'];
        _localThreatCache = documents.map((doc) => Threat.fromJson(doc)).toList();
        await _saveLocalCache();
        return _localThreatCache;
      } else {
        debugPrint('Failed to load threats: ${response.body}');
        return _localThreatCache;
      }
    } catch (e) {
      debugPrint('Error getting threats: $e');
      return _localThreatCache;
    }
  }
  
  Future<Threat?> addThreat(Threat threat) async {
    // Always add to local cache immediately for responsiveness
    _localThreatCache.add(threat);
    await _saveLocalCache();
    
    if (!await isOnline()) {
      debugPrint('Device offline, threat cached locally only');
      return threat;
    }
    
    try {
      final response = await http.post(
        Uri.parse('$apiUrl/insertOne'),
        headers: _getHeaders(),
        body: jsonEncode({
          'dataSource': 'MongoDB-Atlas',
          'database': dbName,
          'collection': threatsCollection,
          'document': threat.toJson(),
        }),
      );
      
      if (response.statusCode == 201) {
        final Map<String, dynamic> data = jsonDecode(response.body);
        return threat;
      } else {
        debugPrint('Failed to add threat: ${response.body}');
        return null;
      }
    } catch (e) {
      debugPrint('Error adding threat: $e');
      return null;
    }
  }
  
  Future<bool> updateThreat(Threat threat) async {
    // Update local cache first
    int index = _localThreatCache.indexWhere((t) => t.id == threat.id);
    if (index != -1) {
      _localThreatCache[index] = threat;
      await _saveLocalCache();
    }
    
    if (!await isOnline()) {
      debugPrint('Device offline, threat updated locally only');
      return true;
    }
    
    try {
      final response = await http.post(
        Uri.parse('$apiUrl/updateOne'),
        headers: _getHeaders(),
        body: jsonEncode({
          'dataSource': 'MongoDB-Atlas',
          'database': dbName,
          'collection': threatsCollection,
          'filter': {'_id': threat.id},
          'update': {'\$set': threat.toJson()},
        }),
      );
      
      if (response.statusCode == 200) {
        return true;
      } else {
        debugPrint('Failed to update threat: ${response.body}');
        return false;
      }
    } catch (e) {
      debugPrint('Error updating threat: $e');
      return false;
    }
  }
  
  Future<bool> deleteThreat(String threatId) async {
    // Update local cache first
    _localThreatCache.removeWhere((threat) => threat.id == threatId);
    await _saveLocalCache();
    
    if (!await isOnline()) {
      debugPrint('Device offline, threat deleted locally only');
      return true;
    }
    
    try {
      final response = await http.post(
        Uri.parse('$apiUrl/deleteOne'),
        headers: _getHeaders(),
        body: jsonEncode({
          'dataSource': 'MongoDB-Atlas',
          'database': dbName,
          'collection': threatsCollection,
          'filter': {'_id': threatId},
        }),
      );
      
      if (response.statusCode == 200) {
        return true;
      } else {
        debugPrint('Failed to delete threat: ${response.body}');
        return false;
      }
    } catch (e) {
      debugPrint('Error deleting threat: $e');
      return false;
    }
  }
  
  // Scan Results API
  Future<List<ScanResult>> getScanResults() async {
    if (!await isOnline()) {
      debugPrint('Device offline, returning cached scan results');
      return _localScanResultCache;
    }
    
    try {
      final response = await http.post(
        Uri.parse('$apiUrl/find'),
        headers: _getHeaders(),
        body: jsonEncode({
          'dataSource': 'MongoDB-Atlas',
          'database': dbName,
          'collection': scanResultsCollection,
          'filter': {},
          'sort': {'scanTime': -1},
        }),
      );
      
      if (response.statusCode == 200) {
        final Map<String, dynamic> data = jsonDecode(response.body);
        final List<dynamic> documents = data['documents'];
        _localScanResultCache = documents.map((doc) => ScanResult.fromJson(doc)).toList();
        await _saveLocalCache();
        return _localScanResultCache;
      } else {
        debugPrint('Failed to load scan results: ${response.body}');
        return _localScanResultCache;
      }
    } catch (e) {
      debugPrint('Error getting scan results: $e');
      return _localScanResultCache;
    }
  }
  
  Future<ScanResult?> addScanResult(ScanResult scanResult) async {
    // Always add to local cache immediately for responsiveness
    _localScanResultCache.add(scanResult);
    await _saveLocalCache();
    
    if (!await isOnline()) {
      debugPrint('Device offline, scan result cached locally only');
      return scanResult;
    }
    
    try {
      final response = await http.post(
        Uri.parse('$apiUrl/insertOne'),
        headers: _getHeaders(),
        body: jsonEncode({
          'dataSource': 'MongoDB-Atlas',
          'database': dbName,
          'collection': scanResultsCollection,
          'document': scanResult.toJson(),
        }),
      );
      
      if (response.statusCode == 201) {
        final Map<String, dynamic> data = jsonDecode(response.body);
        return scanResult;
      } else {
        debugPrint('Failed to add scan result: ${response.body}');
        return null;
      }
    } catch (e) {
      debugPrint('Error adding scan result: $e');
      return null;
    }
  }
  
  // Helper methods
  Map<String, String> _getHeaders() {
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'api-key': _apiKey,
    };
  }
  
  // Clear all cached data (useful for logout)
  Future<void> clearCache() async {
    SharedPreferences prefs = await SharedPreferences.getInstance();
    await prefs.remove('local_threats');
    await prefs.remove('local_scan_results');
    _localThreatCache = [];
    _localScanResultCache = [];
  }
}