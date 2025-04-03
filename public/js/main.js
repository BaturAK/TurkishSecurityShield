/**
 * AntiVirüs Uygulaması JavaScript Dosyası
 */

document.addEventListener('DOMContentLoaded', function() {
  // Aktif menü öğesini işaretle
  markActiveMenuItem();
  
  // Tarama ilerleme durumunu kontrol et (varsa)
  initScanProgress();
  
  // Tehdit temizleme butonlarını initialize et
  initThreatCleanButtons();
});

/**
 * Mevcut sayfanın URL'ine göre ilgili menü öğesini aktif olarak işaretler
 */
function markActiveMenuItem() {
  const currentPath = window.location.pathname;
  const navLinks = document.querySelectorAll('.navbar-nav .nav-link');
  
  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPath || 
        (href !== '/' && currentPath.startsWith(href))) {
      link.classList.add('active');
    }
  });
}

/**
 * Tarama ilerleme durumunu kontrol eden ve güncelleyen fonksiyon
 */
function initScanProgress() {
  const scanProgressContainer = document.getElementById('scan-progress-container');
  if (!scanProgressContainer) return;
  
  const scanId = scanProgressContainer.dataset.scanId;
  if (!scanId) return;
  
  const progressElement = document.getElementById('scan-progress');
  const progressTextElement = document.getElementById('scan-progress-text');
  const statusTextElement = document.getElementById('scan-status-text');
  
  // İlk durumu kontrol et
  checkScanStatus();
  
  // Her 2 saniyede bir durumu güncelle
  const intervalId = setInterval(() => {
    checkScanStatus();
  }, 2000);
  
  function checkScanStatus() {
    fetch(`/api/scans/${scanId}/status`)
      .then(response => response.json())
      .then(data => {
        if (data.status === 'COMPLETED' || data.status === 'FAILED') {
          clearInterval(intervalId);
          
          if (data.status === 'COMPLETED') {
            updateScanProgress(100, 'Tarama tamamlandı');
            
            // Sayfayı 3 saniye sonra sonuçlara yönlendir
            setTimeout(() => {
              window.location.href = `/scans/${scanId}/results`;
            }, 3000);
          } else {
            updateScanProgress(data.progress, 'Tarama başarısız oldu');
          }
        } else {
          updateScanProgress(data.progress, 'Taranıyor...');
        }
      })
      .catch(error => {
        console.error('Tarama durumu alınamadı:', error);
        clearInterval(intervalId);
        updateScanProgress(0, 'Bağlantı hatası');
      });
  }
  
  function updateScanProgress(progress, statusText) {
    if (progressElement) {
      progressElement.style.width = `${progress}%`;
      progressElement.setAttribute('aria-valuenow', progress);
    }
    
    if (progressTextElement) {
      progressTextElement.textContent = `${Math.round(progress)}%`;
    }
    
    if (statusTextElement) {
      statusTextElement.textContent = statusText;
    }
    
    // Dairesel ilerleme için
    const circleProgress = document.querySelector('.progress-circle');
    if (circleProgress) {
      circleProgress.style.background = `conic-gradient(var(--primary-color) ${progress}%, var(--light-color) 0%)`;
    }
  }
}

/**
 * Tehdit temizleme butonlarını initialize eden fonksiyon
 */
function initThreatCleanButtons() {
  const cleanButtons = document.querySelectorAll('.clean-threat-btn');
  
  cleanButtons.forEach(button => {
    button.addEventListener('click', function() {
      const threatId = this.dataset.threatId;
      const threatCard = document.getElementById(`threat-${threatId}`);
      
      if (!threatId || !threatCard) return;
      
      // Buton durumunu güncelle
      this.disabled = true;
      this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Temizleniyor...';
      
      // API'ye temizleme isteği gönder
      fetch(`/api/threats/${threatId}/clean`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          // Başarılı temizleme
          threatCard.classList.add('bg-light');
          threatCard.querySelector('.threat-status').innerHTML = 
            '<span class="badge bg-success"><i class="fas fa-check me-1"></i> Temizlendi</span>';
          
          this.innerHTML = '<i class="fas fa-check me-1"></i> Temizlendi';
          this.classList.remove('btn-danger');
          this.classList.add('btn-success');
          this.disabled = true;
          
          // Bildirim göster
          showAlert('success', `"${data.threat.name}" tehdidi başarıyla temizlendi.`);
        } else {
          // Temizleme hatası
          this.innerHTML = '<i class="fas fa-exclamation-triangle me-1"></i> Temizleme Başarısız';
          this.disabled = false;
          
          // Hata bildirim
          showAlert('danger', `Tehdit temizlenirken bir hata oluştu: ${data.error}`);
        }
      })
      .catch(error => {
        console.error('Tehdit temizleme hatası:', error);
        this.innerHTML = '<i class="fas fa-exclamation-triangle me-1"></i> Bağlantı Hatası';
        this.disabled = false;
        
        // Bağlantı hatası bildirimi
        showAlert('danger', 'Sunucu ile bağlantı kurulamadı. Lütfen daha sonra tekrar deneyin.');
      });
    });
  });
}

/**
 * Kullanıcıya bildirim gösteren fonksiyon
 * @param {string} type - Bildirim tipi (success, danger, warning, info)
 * @param {string} message - Gösterilecek mesaj
 */
function showAlert(type, message) {
  const alertContainer = document.createElement('div');
  alertContainer.className = `alert alert-${type} alert-dismissible fade show`;
  alertContainer.setAttribute('role', 'alert');
  
  // İkona karar ver
  let icon = 'info-circle';
  if (type === 'success') icon = 'check-circle';
  if (type === 'danger') icon = 'exclamation-circle';
  if (type === 'warning') icon = 'exclamation-triangle';
  
  alertContainer.innerHTML = `
    <i class="fas fa-${icon} me-2"></i> ${message}
    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
  `;
  
  // Bildirim alanı varsa oraya ekle, yoksa body'nin en üstüne ekle
  const alertArea = document.querySelector('.alert-area') || document.body;
  if (alertArea === document.body) {
    alertContainer.style.position = 'fixed';
    alertContainer.style.top = '20px';
    alertContainer.style.right = '20px';
    alertContainer.style.zIndex = '9999';
    alertContainer.style.maxWidth = '400px';
  }
  
  alertArea.appendChild(alertContainer);
  
  // 5 saniye sonra otomatik kapat
  setTimeout(() => {
    alertContainer.classList.remove('show');
    setTimeout(() => alertContainer.remove(), 300);
  }, 5000);
}