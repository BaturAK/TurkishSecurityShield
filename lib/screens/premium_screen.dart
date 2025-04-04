import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../providers/premium_provider.dart';
import '../providers/auth_provider.dart';
import '../utils/constants.dart';

class PremiumScreen extends StatefulWidget {
  @override
  _PremiumScreenState createState() => _PremiumScreenState();
}

class _PremiumScreenState extends State<PremiumScreen> {
  final _codeController = TextEditingController();
  bool _isActivating = false;
  String? _errorMessage;

  @override
  void dispose() {
    _codeController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final premiumProvider = Provider.of<PremiumProvider>(context);
    final authProvider = Provider.of<AuthProvider>(context);
    final isPremium = premiumProvider.isPremium;
    final expiryDate = premiumProvider.premiumExpiry;
    
    return Scaffold(
      appBar: AppBar(
        title: Text(
          AppTexts.premiumTitle,
          style: TextStyle(
            color: AppColors.textPrimaryColor,
            fontWeight: FontWeight.bold,
          ),
        ),
        iconTheme: IconThemeData(
          color: AppColors.textPrimaryColor,
        ),
      ),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Premium durumu
            Container(
              color: AppColors.secondaryColor,
              padding: const EdgeInsets.all(24.0),
              child: Column(
                children: [
                  Icon(
                    isPremium ? Icons.verified : Icons.star,
                    size: 80,
                    color: Colors.white,
                  ),
                  SizedBox(height: 16),
                  Text(
                    isPremium
                        ? AppTexts.alreadyPremium
                        : AppTexts.premiumTitle,
                    style: TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                  SizedBox(height: 8),
                  Text(
                    isPremium && expiryDate != null
                        ? 'Premium süreniz ${DateFormat('dd.MM.yyyy').format(expiryDate)} tarihine kadar geçerlidir.'
                        : AppTexts.premiumDescription,
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 16,
                      color: Colors.white,
                    ),
                  ),
                ],
              ),
            ),

            // Premium özellikleri
            Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Premium Özellikleri',
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      color: AppColors.textPrimaryColor,
                    ),
                  ),
                  SizedBox(height: 16),
                  _buildFeatureItem(
                    Icons.security,
                    AppTexts.premiumFeatureTitle1,
                    AppTexts.premiumFeatureDesc1,
                  ),
                  _buildFeatureItem(
                    Icons.vpn_lock,
                    AppTexts.premiumFeatureTitle2,
                    AppTexts.premiumFeatureDesc2,
                  ),
                  _buildFeatureItem(
                    Icons.lock,
                    AppTexts.premiumFeatureTitle3,
                    AppTexts.premiumFeatureDesc3,
                  ),
                  _buildFeatureItem(
                    Icons.block,
                    AppTexts.premiumFeatureTitle4,
                    AppTexts.premiumFeatureDesc4,
                  ),
                ],
              ),
            ),
            
            // Premium kod aktivasyon formu
            if (!isPremium)
              Padding(
                padding: const EdgeInsets.all(16.0),
                child: Card(
                  elevation: 4,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Text(
                          AppTexts.enterPremiumCode,
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        SizedBox(height: 16),
                        TextField(
                          controller: _codeController,
                          decoration: InputDecoration(
                            labelText: 'Premium Kodu',
                            border: OutlineInputBorder(),
                            errorText: _errorMessage,
                          ),
                          keyboardType: TextInputType.text,
                          enabled: !_isActivating,
                        ),
                        SizedBox(height: 16),
                        _isActivating
                            ? Center(child: CircularProgressIndicator())
                            : ElevatedButton(
                                onPressed: () => _activatePremium(context),
                                child: Padding(
                                  padding: const EdgeInsets.all(12.0),
                                  child: Text(
                                    AppTexts.activate,
                                    style: TextStyle(
                                      fontSize: 16,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ),
                                style: ElevatedButton.styleFrom(
                                  primary: AppColors.primaryColor,
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(30),
                                  ),
                                ),
                              ),
                      ],
                    ),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  // Özellik listesi öğesi
  Widget _buildFeatureItem(IconData icon, String title, String description) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16.0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: AppColors.secondaryColor.withOpacity(0.2),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(
              icon,
              color: AppColors.secondaryColor,
              size: 24,
            ),
          ),
          SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: AppColors.textPrimaryColor,
                  ),
                ),
                SizedBox(height: 4),
                Text(
                  description,
                  style: TextStyle(
                    fontSize: 14,
                    color: AppColors.textSecondaryColor,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // Premium aktivasyon
  Future<void> _activatePremium(BuildContext context) async {
    final code = _codeController.text.trim();
    if (code.isEmpty) {
      setState(() {
        _errorMessage = 'Lütfen bir kod girin';
      });
      return;
    }

    setState(() {
      _isActivating = true;
      _errorMessage = null;
    });

    try {
      final premiumProvider = Provider.of<PremiumProvider>(context, listen: false);
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      
      final success = await premiumProvider.activatePremiumCode(
        authProvider.userId ?? 'anonymous',
        code,
      );
      
      setState(() {
        _isActivating = false;
      });
      
      if (success) {
        // Aktivasyon başarılı
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(AppTexts.activationSuccess),
            backgroundColor: AppColors.successColor,
          ),
        );
        
        // Formu temizle
        _codeController.clear();
      } else {
        // Aktivasyon başarısız
        setState(() {
          _errorMessage = AppTexts.invalidCode;
        });
      }
    } catch (e) {
      setState(() {
        _isActivating = false;
        _errorMessage = AppTexts.activationFailed;
      });
    }
  }
}