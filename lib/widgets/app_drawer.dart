import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../providers/premium_provider.dart';
import '../utils/constants.dart';

class AppDrawer extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);
    final premiumProvider = Provider.of<PremiumProvider>(context);
    
    return Drawer(
      child: Column(
        children: [
          // Başlık
          Container(
            padding: EdgeInsets.only(top: 40, bottom: 20),
            color: AppColors.primaryColor,
            width: double.infinity,
            child: Column(
              children: [
                // Kullanıcı avatarı
                Container(
                  width: 80,
                  height: 80,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: Colors.white,
                    image: authProvider.photoURL != null
                        ? DecorationImage(
                            image: NetworkImage(authProvider.photoURL!),
                            fit: BoxFit.cover,
                          )
                        : null,
                  ),
                  child: authProvider.photoURL == null
                      ? Icon(
                          Icons.person,
                          size: 40,
                          color: AppColors.primaryColor,
                        )
                      : null,
                ),
                SizedBox(height: 12),
                
                // Kullanıcı adı
                Text(
                  authProvider.displayName ?? 'Misafir Kullanıcı',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
                SizedBox(height: 4),
                
                // Kullanıcı e-posta
                if (authProvider.userEmail != null)
                  Text(
                    authProvider.userEmail!,
                    style: TextStyle(
                      fontSize: 14,
                      color: Colors.white70,
                    ),
                  ),
                
                // Premium rozeti
                if (premiumProvider.isPremium)
                  Container(
                    margin: EdgeInsets.only(top: 8),
                    padding: EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                    decoration: BoxDecoration(
                      color: AppColors.secondaryColor,
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          Icons.verified,
                          size: 14,
                          color: Colors.white,
                        ),
                        SizedBox(width: 4),
                        Text(
                          'Premium',
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                          ),
                        ),
                      ],
                    ),
                  ),
              ],
            ),
          ),
          
          // Menü öğeleri
          ListTile(
            leading: Icon(Icons.home),
            title: Text('Ana Sayfa'),
            onTap: () {
              Navigator.pop(context);
              Navigator.pushReplacementNamed(context, '/home');
            },
          ),
          
          ListTile(
            leading: Icon(Icons.security),
            title: Text('Tarama Sonuçları'),
            onTap: () {
              Navigator.pop(context);
              Navigator.pushNamed(context, '/scan_results');
            },
          ),
          
          // Premium kullanıcı değilse premium menüsü göster
          if (!premiumProvider.isPremium)
            ListTile(
              leading: Icon(
                Icons.star,
                color: AppColors.secondaryColor,
              ),
              title: Text(
                AppTexts.goPremium,
                style: TextStyle(
                  color: AppColors.secondaryColor,
                  fontWeight: FontWeight.bold,
                ),
              ),
              onTap: () {
                Navigator.pop(context);
                Navigator.pushNamed(context, '/premium');
              },
            ),
          
          ListTile(
            leading: Icon(Icons.settings),
            title: Text(AppTexts.settings),
            onTap: () {
              Navigator.pop(context);
              Navigator.pushNamed(context, '/settings');
            },
          ),
          
          Divider(),
          
          ListTile(
            leading: Icon(Icons.help),
            title: Text(AppTexts.help),
            onTap: () {
              Navigator.pop(context);
              // Yardım sayfasına git
            },
          ),
          
          ListTile(
            leading: Icon(Icons.info),
            title: Text(AppTexts.about),
            onTap: () {
              Navigator.pop(context);
              // Hakkında sayfasına git
            },
          ),
          
          Spacer(),
          
          // Çıkış yap
          if (authProvider.isLoggedIn)
            ListTile(
              leading: Icon(
                Icons.exit_to_app,
                color: AppColors.errorColor,
              ),
              title: Text(
                AppTexts.logout,
                style: TextStyle(
                  color: AppColors.errorColor,
                ),
              ),
              onTap: () => _showLogoutDialog(context),
            ),
          
          // Sürüm bilgisi
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: Text(
              'v1.0.0',
              style: TextStyle(
                fontSize: 12,
                color: Colors.grey,
              ),
            ),
          ),
        ],
      ),
    );
  }
  
  // Çıkış diyaloğu
  void _showLogoutDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Çıkış Yap'),
        content: Text('Oturumunuzu kapatmak istediğinize emin misiniz?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text(AppTexts.cancel),
          ),
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(context);
              final authProvider = Provider.of<AuthProvider>(context, listen: false);
              await authProvider.signOut();
              Navigator.pushReplacementNamed(context, '/login');
            },
            child: Text(AppTexts.logout),
            style: ElevatedButton.styleFrom(
              primary: AppColors.errorColor,
            ),
          ),
        ],
      ),
    );
  }
}