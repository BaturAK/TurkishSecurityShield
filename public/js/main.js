/**
 * AntiVirüs Uygulaması Ana JavaScript Dosyası
 */

// Sayfa yüklendikten sonra çalışacak kodlar
document.addEventListener('DOMContentLoaded', function() {
  console.log('AntiVirüs Uygulaması yüklendi!');
  
  // Bootstrap tooltips'i aktifleştir
  const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
  tooltipTriggerList.map(function (tooltipTriggerEl) {
    return new bootstrap.Tooltip(tooltipTriggerEl);
  });
  
  // Aktif menü öğesini işaretle
  markActiveMenuItem();
  
  // Tarama durumu kontrolünü başlat (eğer sayfada varsa)
  initScanProgress();
  
  // Tehdit temizleme butonlarını başlat (eğer sayfada varsa)
  initThreatCleanButtons();
});

/**
 * Mevcut sayfanın URL'ine göre ilgili menü öğesini aktif olarak işaretler
 */
function markActiveMenuItem() {
  // Şu anki URL yolunu al
  const currentPath = window.location.pathname;
  
  // Tüm menü bağlantılarını döngüye al
  const navLinks = document.querySelectorAll('.navbar-nav .nav-link');
  
  // Her bağlantıyı kontrol et
  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    
    // Ana sayfa kontrolü
    if (href === '/' && currentPath === '/') {
      link.classList.add('active');
      return;
    }
    
    // Diğer sayfalar için, URL yolunun bağlantı hedefiyle başlaması durumunda aktif işaretle
    // Ancak ana sayfa için "/" ile başlayan tüm URL'leri işaretlememek için özel kontrol ekle
    if (href !== '/' && currentPath.startsWith(href)) {
      link.classList.add('active');
    }
  });
}

/**
 * Tarama ilerleme durumunu kontrol eden ve güncelleyen fonksiyon
 */
function initScanProgress() {
  const scanProgressBar = document.getElementById('scanProgressBar');
  const scanStatusText = document.getElementById('scanStatusText');
  
  if (!scanProgressBar || !scanStatusText) return; // Sayfada bu elementler yoksa çık
  
  // Sunucudan tarama durumunu kontrol eden fonksiyon
  function checkScanStatus() {
    // Demo amaçlı rastgele ilerleme - gerçek uygulamada AJAX isteği ile sunucudan alınacak
    const currentProgress = parseInt(scanProgressBar.getAttribute('aria-valuenow'));
    
    if (currentProgress < 100) {
      // Tarama devam ediyor, ilerlemeyi artır
      const newProgress = Math.min(currentProgress + Math.floor(Math.random() * 10), 100);
      updateScanProgress(newProgress, 'Tarama devam ediyor...');
      
      // Tarama tamamlandıysa bitir mesajını göster
      if (newProgress === 100) {
        setTimeout(() => {
          updateScanProgress(100, 'Tarama tamamlandı!');
          document.getElementById('scanComplete').classList.remove('d-none');
        }, 1000);
      } else {
        // Devam ediyorsa, tekrar kontrol et
        setTimeout(checkScanStatus, 500);
      }
    }
  }
  
  // Tarama ilerleme çubuğunu güncelle
  function updateScanProgress(progress, statusText) {
    scanProgressBar.style.width = progress + '%';
    scanProgressBar.setAttribute('aria-valuenow', progress);
    scanStatusText.textContent = statusText;
  }
  
  // Başlangıç değerleri
  updateScanProgress(0, 'Tarama başlatılıyor...');
  setTimeout(checkScanStatus, 1000);
}

/**
 * Tehdit temizleme butonlarını initialize eden fonksiyon
 */
function initThreatCleanButtons() {
  const cleanButtons = document.querySelectorAll('.clean-threat-btn');
  
  if (cleanButtons.length === 0) return; // Sayfada bu butonlar yoksa çık
  
  cleanButtons.forEach(button => {
    button.addEventListener('click', function() {
      const threatId = this.getAttribute('data-threat-id');
      const threatItem = document.getElementById('threat-' + threatId);
      
      // Temizleme işlemi başladığında butonu devre dışı bırak
      this.disabled = true;
      this.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Temizleniyor...';
      
      // Demo amaçlı gecikme - gerçek uygulamada AJAX isteği ile sunucuya gönderilecek
      setTimeout(() => {
        // AJAX isteği ile tehdidi temizle
        fetch('/threat/clean/' + threatId, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        })
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            // Temizleme başarılı, tehdidi listeden kaldır
            threatItem.classList.add('bg-success', 'bg-opacity-10');
            this.innerHTML = '<i class="fas fa-check me-1"></i>Temizlendi';
            
            // Animasyon ile listeden kaldır
            setTimeout(() => {
              threatItem.style.height = threatItem.offsetHeight + 'px';
              threatItem.style.overflow = 'hidden';
              threatItem.style.transition = 'all 0.5s ease';
              
              setTimeout(() => {
                threatItem.style.height = '0';
                threatItem.style.padding = '0';
                threatItem.style.margin = '0';
                
                setTimeout(() => {
                  threatItem.remove();
                  
                  // Tehdit listesi boşaldıysa, temiz mesajını göster
                  const threatsList = document.getElementById('threatsList');
                  if (threatsList && threatsList.children.length === 0) {
                    threatsList.innerHTML = `
                      <div class="text-center py-5">
                        <i class="fas fa-shield-alt fa-4x text-success mb-3"></i>
                        <h5>Hiçbir tehdit bulunamadı</h5>
                        <p class="text-muted">Cihazınız şu anda güvende görünüyor.</p>
                      </div>
                    `;
                  }
                }, 500);
              }, 50);
            }, 1000);
          } else {
            // Temizleme başarısız
            this.innerHTML = '<i class="fas fa-exclamation-circle me-1"></i>Hata';
            this.classList.remove('btn-success');
            this.classList.add('btn-danger');
          }
        })
        .catch(error => {
          console.error('Tehdit temizleme hatası:', error);
          this.innerHTML = '<i class="fas fa-exclamation-circle me-1"></i>Hata';
          this.classList.remove('btn-success');
          this.classList.add('btn-danger');
          this.disabled = false;
        });
      }, 1500);
    });
  });
}