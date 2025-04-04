import 'package:flutter/material.dart';
import 'dart:math' as math;
import '../utils/constants.dart';

class SecurityStatusCard extends StatefulWidget {
  final bool isProtected;

  const SecurityStatusCard({
    Key? key,
    required this.isProtected,
  }) : super(key: key);

  @override
  _SecurityStatusCardState createState() => _SecurityStatusCardState();
}

class _SecurityStatusCardState extends State<SecurityStatusCard>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _animation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(seconds: 2),
      vsync: this,
    )..repeat(reverse: true);
    
    _animation = Tween<double>(begin: 0.9, end: 1.0).animate(
      CurvedAnimation(
        parent: _controller,
        curve: Curves.easeInOut,
      ),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isProtected = widget.isProtected;
    
    final statusText = isProtected
        ? AppTexts.deviceProtected
        : AppTexts.deviceVulnerable;
        
    final statusColor = isProtected
        ? AppColors.successColor
        : AppColors.warningColor;
        
    final iconData = isProtected
        ? Icons.security
        : Icons.warning;
    
    return AnimatedBuilder(
      animation: _animation,
      builder: (context, child) {
        return Container(
          width: double.infinity,
          margin: EdgeInsets.all(16),
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [
                statusColor,
                statusColor.withOpacity(0.8),
              ],
            ),
            borderRadius: BorderRadius.circular(16),
            boxShadow: [
              BoxShadow(
                color: statusColor.withOpacity(0.3),
                spreadRadius: 2 * _animation.value,
                blurRadius: 10 * _animation.value,
                offset: Offset(0, 3),
              ),
            ],
          ),
          child: child,
        );
      },
      child: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Başlık ve ikon
            Row(
              children: [
                // Dönen şifreli ikon
                AnimatedBuilder(
                  animation: _controller,
                  builder: (context, child) {
                    return Transform.rotate(
                      angle: !isProtected ? 0 : _controller.value * 2 * math.pi / 10,
                      child: Container(
                        width: 48,
                        height: 48,
                        decoration: BoxDecoration(
                          color: Colors.white,
                          shape: BoxShape.circle,
                        ),
                        child: Icon(
                          iconData,
                          size: 28,
                          color: statusColor,
                        ),
                      ),
                    );
                  },
                ),
                SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        AppTexts.securityStatus,
                        style: TextStyle(
                          fontSize: 14,
                          color: Colors.white.withOpacity(0.8),
                        ),
                      ),
                      SizedBox(height: 4),
                      Text(
                        statusText,
                        style: TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            SizedBox(height: 16),
            
            // Bilgi metni
            Text(
              isProtected
                  ? 'Cihazınız şu anda korunuyor. Son taramada tehdit bulunamadı.'
                  : 'Cihazınızda bazı tehditler tespit edildi. Temizlemek için tarama yapın.',
              style: TextStyle(
                fontSize: 14,
                color: Colors.white.withOpacity(0.9),
              ),
            ),
            SizedBox(height: 16),
            
            // Tarama butonu
            Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                ElevatedButton(
                  onPressed: () {
                    // Ana sayfada tarama başlat butonuna tıklanması
                  },
                  child: Padding(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 12,
                    ),
                    child: Text(
                      isProtected ? AppTexts.scanNow : AppTexts.cleanAll,
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                        color: statusColor,
                      ),
                    ),
                  ),
                  style: ElevatedButton.styleFrom(
                    primary: Colors.white,
                    elevation: 0,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(30),
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}