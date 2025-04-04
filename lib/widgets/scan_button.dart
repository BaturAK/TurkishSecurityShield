import 'package:flutter/material.dart';
import '../utils/constants.dart';

class ScanButton extends StatelessWidget {
  final String title;
  final IconData icon;
  final Color color;
  final VoidCallback onTap;
  final bool isPremium;
  final bool isLocked;

  const ScanButton({
    Key? key,
    required this.title,
    required this.icon,
    required this.color,
    required this.onTap,
    this.isPremium = false,
    this.isLocked = false,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        width: 160,
        padding: EdgeInsets.symmetric(vertical: 16, horizontal: 12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          boxShadow: [
            BoxShadow(
              color: Colors.grey.withOpacity(0.1),
              spreadRadius: 2,
              blurRadius: 5,
              offset: Offset(0, 2),
            ),
          ],
          border: Border.all(
            color: color.withOpacity(0.2),
            width: 1,
          ),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Stack(
              alignment: Alignment.center,
              children: [
                // İkon arka planı
                Container(
                  width: 64,
                  height: 64,
                  decoration: BoxDecoration(
                    color: color.withOpacity(0.1),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(
                    icon,
                    size: 32,
                    color: color,
                  ),
                ),
                
                // Eğer kilitliyse kilit ikonu göster
                if (isLocked)
                  Container(
                    width: 64,
                    height: 64,
                    decoration: BoxDecoration(
                      color: Colors.black.withOpacity(0.5),
                      shape: BoxShape.circle,
                    ),
                    child: Icon(
                      Icons.lock,
                      size: 32,
                      color: Colors.white,
                    ),
                  ),
              ],
            ),
            SizedBox(height: 12),
            
            // Başlık
            Text(
              title,
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
                color: isLocked ? Colors.grey : AppColors.textPrimaryColor,
              ),
            ),
            
            // Premium rozeti
            if (isPremium)
              Container(
                margin: EdgeInsets.only(top: 8),
                padding: EdgeInsets.symmetric(
                  horizontal: 8,
                  vertical: 2,
                ),
                decoration: BoxDecoration(
                  color: AppColors.secondaryColor,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      Icons.star,
                      size: 12,
                      color: Colors.white,
                    ),
                    SizedBox(width: 2),
                    Text(
                      'Premium',
                      style: TextStyle(
                        fontSize: 10,
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
    );
  }
}