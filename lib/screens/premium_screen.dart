import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/premium_provider.dart';

class PremiumScreen extends StatefulWidget {
  const PremiumScreen({Key? key}) : super(key: key);

  @override
  State<PremiumScreen> createState() => _PremiumScreenState();
}

class _PremiumScreenState extends State<PremiumScreen> {
  final _premiumCodeController = TextEditingController();
  bool _isVerifying = false;
  String _errorMessage = '';
  
  @override
  void dispose() {
    _premiumCodeController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final premiumProvider = Provider.of<PremiumProvider>(context);
    final isPremium = premiumProvider.isPremium;
    
    return Scaffold(
      appBar: AppBar(
        title: const Text('Premium Özellikleri'),
      ),
      body: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Premium Durum Kartı
              Card(
                elevation: 4,
                child: Container(
                  padding: const EdgeInsets.all(16.0),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(12),
                    gradient: LinearGradient(
                      colors: isPremium 
                          ? [Colors.amber.shade300, Colors.amber.shade700]
                          : [Colors.blue.shade300, Colors.blue.shade700],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                  ),
                  child: Column(
                    children: [
                      Icon(
                        isPremium ? Icons.workspace_premium : Icons.lock,
                        size: 64,
                        color: Colors.white,
                      ),
                      const SizedBox(height: 16),
                      Text(
                        isPremium 
                            ? 'Premium Özellikler Etkin!' 
                            : 'Premium Özellikleri Aktifleştirin',
                        style: const TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        isPremium 
                            ? 'Tüm premium özelliklere erişebilirsiniz' 
                            : 'Premium kodu ile tüm özelliklere erişin',
                        style: const TextStyle(
                          fontSize: 16,
                          color: Colors.white,
                        ),
                        textAlign: TextAlign.center,
                      ),
                    ],
                  ),
                ),
              ),
              
              const SizedBox(height: 24),
              
              // Premium Özellikler Listesi
              const Text(
                'Premium Özellikleri',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
              
              const SizedBox(height: 16),
              
              // Özellik Listesi
              _buildFeatureItem(
                'Gerçek Zamanlı Koruma',
                'Uygulamaları ve dosyaları sürekli kontrol eder, anında tehdit tespiti sağlar',
                Icons.shield,
                isPremium,
              ),
              
              _buildFeatureItem(
                'Gelişmiş Tarama Motoru',
                'Temel motora göre %40 daha fazla tehdit türünü tespit edebilen gelişmiş tarama motoru',
                Icons.security,
                isPremium,
              ),
              
              _buildFeatureItem(
                'Güvenli VPN Hizmeti',
                'İnternet bağlantınızı şifreleyerek güvenli gezinme imkanı sağlar',
                Icons.vpn_key,
                isPremium,
              ),
              
              _buildFeatureItem(
                'Uygulama Kilidi',
                'Önemli uygulamalarınızı yetkisiz erişime karşı PIN, şifre veya parmak izi ile koruyun',
                Icons.app_blocking,
                isPremium,
              ),
              
              _buildFeatureItem(
                'Reklamsız Deneyim',
                'Tüm rahatsız edici reklamlardan kurtulun, kesintisiz kullanım',
                Icons.block,
                isPremium,
              ),
              
              const SizedBox(height: 32),
              
              // Premium doğrulama kodu formu
              if (!isPremium)
                Card(
                  elevation: 2,
                  child: Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        const Text(
                          'Premium Kod Doğrulama',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 16),
                        TextField(
                          controller: _premiumCodeController,
                          decoration: const InputDecoration(
                            labelText: 'Premium Kod',
                            border: OutlineInputBorder(),
                            hintText: 'Premium kodunuzu girin',
                            prefixIcon: Icon(Icons.vpn_key),
                          ),
                          keyboardType: TextInputType.number,
                        ),
                        if (_errorMessage.isNotEmpty)
                          Padding(
                            padding: const EdgeInsets.only(top: 8.0),
                            child: Text(
                              _errorMessage,
                              style: const TextStyle(
                                color: Colors.red,
                              ),
                            ),
                          ),
                        const SizedBox(height: 16),
                        ElevatedButton(
                          onPressed: _isVerifying 
                            ? null 
                            : () => _verifyPremiumCode(context),
                          style: ElevatedButton.styleFrom(
                            padding: const EdgeInsets.symmetric(vertical: 12),
                            backgroundColor: Colors.amber,
                            foregroundColor: Colors.black,
                          ),
                          child: _isVerifying 
                            ? const CircularProgressIndicator() 
                            : const Text('DOĞRULA'),
                        ),
                        const SizedBox(height: 8),
                        const Text(
                          'Premium kod satın almak için web sitemizi ziyaret edin veya uygulama içi satın alma seçeneklerine göz atın',
                          style: TextStyle(
                            fontSize: 12,
                            color: Colors.grey,
                          ),
                          textAlign: TextAlign.center,
                        ),
                      ],
                    ),
                  ),
                ),
                
                // Premium iptal etme (Test için)
                if (isPremium)
                  Padding(
                    padding: const EdgeInsets.only(top: 24.0),
                    child: TextButton(
                      onPressed: () async {
                        await premiumProvider.disablePremium();
                        setState(() {});
                      },
                      child: const Text('Premium\'u İptal Et (Test için)'),
                    ),
                  ),
            ],
          ),
        ),
      ),
    );
  }
  
  Widget _buildFeatureItem(String title, String description, IconData icon, bool isAvailable) {
    return Card(
      margin: const EdgeInsets.symmetric(vertical: 8.0),
      child: ListTile(
        leading: Icon(
          icon,
          color: isAvailable ? Colors.amber : Colors.grey,
          size: 36,
        ),
        title: Text(title),
        subtitle: Text(description),
        trailing: isAvailable 
            ? const Icon(Icons.check_circle, color: Colors.green) 
            : const Icon(Icons.lock, color: Colors.grey),
      ),
    );
  }
  
  Future<void> _verifyPremiumCode(BuildContext context) async {
    final code = _premiumCodeController.text.trim();
    if (code.isEmpty) {
      setState(() {
        _errorMessage = 'Lütfen bir kod girin';
      });
      return;
    }
    
    setState(() {
      _isVerifying = true;
      _errorMessage = '';
    });
    
    // Premium kodu doğrula
    final premiumProvider = Provider.of<PremiumProvider>(context, listen: false);
    final isValid = await premiumProvider.verifyPremiumCode(code);
    
    setState(() {
      _isVerifying = false;
      if (!isValid) {
        _errorMessage = 'Geçersiz premium kod';
      }
    });
    
    if (isValid) {
      // Başarılı giriş bildirimi göster
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Premium özellikler başarıyla etkinleştirildi!'),
            backgroundColor: Colors.green,
          ),
        );
      }
    }
  }
}