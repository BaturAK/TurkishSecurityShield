/**
 * AntiVirüs Uygulaması JavaScript Dosyası
 */

document.addEventListener('DOMContentLoaded', function() {
  // Aktif menü öğesini işaretle
  markActiveMenuItem();
  
  // Tarama ilerleme kontrolü
  initScanProgress();
  
  // Tehdit temizleme butonları
  initThreatCleanButtons();
});

/**
 * Mevcut sayfanın URL'ine göre ilgili menü öğesini aktif olarak işaretler
 */
function markActiveMenuItem() {
  const currentLocation = window.location.pathname;
  
  // Ana menü öğeleri
  document.querySelectorAll('.navbar-nav .nav-link').forEach(link => {
    const href = link.getAttribute('href');
    
    // Ana sayfa için özel kontrol
    if (href === '/' && currentLocation === '/') {
      link.classList.add('active');
    } 
    // Diğer sayfalar için kontrol
    else if (href !== '/' && currentLocation.startsWith(href)) {
      link.classList.add('active');
    }
  });
  
  // Admin sidebar menü öğeleri
  if (document.querySelector('.admin-sidebar')) {
    document.querySelectorAll('.admin-sidebar .nav-link').forEach(link => {
      const href = link.getAttribute('href');
      
      if (currentLocation === href || 
          (href !== '/admin' && currentLocation.startsWith(href))) {
        link.classList.add('active');
      }
    });
  }
}

/**
 * Tarama ilerleme durumunu kontrol eden ve güncelleyen fonksiyon
 */
function initScanProgress() {
  const scanProgressElement = document.getElementById('scanProgress');
  
  if (!scanProgressElement) {
    return;
  }
  
  const scanId = scanProgressElement.dataset.scanId;
  
  if (!scanId) {
    console.error('Tarama ID\'si bulunamadı');
    return;
  }
  
  // 2 saniyede bir tarama durumunu kontrol et
  const intervalId = setInterval(checkScanStatus, 2000);
  
  // İlk kontrolü hemen yap
  checkScanStatus();
  
  function checkScanStatus() {
    fetch(`/api/scans/${scanId}/status`)
      .then(response => {
        if (!response.ok) {
          throw new Error('Tarama durumu alınamadı');
        }
        return response.json();
      })
      .then(data => {
        if (data.status === 'success') {
          const scanData = data.data;
          const progress = scanData.progress;
          const statusText = scanData.statusText;
          
          // İlerleme çubuğunu ve durum metnini güncelle
          updateScanProgress(progress, statusText);
          
          // Tarama tamamlandıysa, sayfayı sonuç sayfasına yönlendir
          if (scanData.status === 'COMPLETED') {
            clearInterval(intervalId);
            setTimeout(() => {
              window.location.href = `/scan-result/${scanId}`;
            }, 1000);
          }
        } else {
          console.error('Tarama durumu alınamadı:', data.message);
        }
      })
      .catch(error => {
        console.error('Tarama durumu kontrol edilirken hata:', error);
      });
  }
  
  function updateScanProgress(progress, statusText) {
    // İlerleme çubuğunu güncelle
    const progressBar = scanProgressElement.querySelector('.progress-bar');
    if (progressBar) {
      progressBar.style.width = `${progress}%`;
      progressBar.setAttribute('aria-valuenow', progress);
      progressBar.textContent = `${progress}%`;
    }
    
    // Durum metnini güncelle
    const statusElement = scanProgressElement.querySelector('.scan-status');
    if (statusElement && statusText) {
      statusElement.textContent = statusText;
    }
  }
}

/**
 * Tehdit temizleme butonlarını initialize eden fonksiyon
 */
function initThreatCleanButtons() {
  document.querySelectorAll('.clean-threat-btn').forEach(button => {
    button.addEventListener('click', function(e) {
      e.preventDefault();
      
      const threatId = this.dataset.threatId;
      const card = this.closest('.threat-card');
      
      if (!threatId) {
        console.error('Tehdit ID\'si bulunamadı');
        return;
      }
      
      // Buton durumunu güncelle
      this.disabled = true;
      this.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i> Temizleniyor...';
      
      // Tehdit temizleme isteği gönder
      fetch(`/api/threats/${threatId}/clean`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      .then(response => {
        if (!response.ok) {
          throw new Error('Tehdit temizleme işlemi başarısız');
        }
        return response.json();
      })
      .then(data => {
        if (data.status === 'success') {
          // Başarılı ise, kart görünümünü güncelle
          if (card) {
            card.classList.remove('border-danger', 'border-warning');
            card.classList.add('border-success');
            
            // Temizlendi etiketini göster
            const badge = card.querySelector('.threat-status');
            if (badge) {
              badge.textContent = 'Temizlendi';
              badge.classList.remove('bg-danger', 'bg-warning');
              badge.classList.add('bg-success');
            }
            
            // Butonu güncelle
            this.innerHTML = '<i class="fas fa-check me-2"></i> Temizlendi';
            this.classList.remove('btn-danger', 'btn-warning');
            this.classList.add('btn-success');
            this.disabled = true;
            
            // Bildirim göster
            showAlert('success', 'Tehdit başarıyla temizlendi!');
          }
        } else {
          // Hata durumunda
          this.disabled = false;
          this.innerHTML = '<i class="fas fa-broom me-2"></i> Tekrar Dene';
          showAlert('danger', data.message || 'Tehdit temizlenirken bir hata oluştu.');
        }
      })
      .catch(error => {
        console.error('Tehdit temizlenirken hata:', error);
        
        // Buton durumunu eski haline getir
        this.disabled = false;
        this.innerHTML = '<i class="fas fa-broom me-2"></i> Tekrar Dene';
        showAlert('danger', 'Tehdit temizlenirken bir hata oluştu.');
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
  // Daha önce oluşturulmuş bir alert container var mı kontrol et
  let alertContainer = document.getElementById('alertContainer');
  
  // Yoksa oluştur
  if (!alertContainer) {
    alertContainer = document.createElement('div');
    alertContainer.id = 'alertContainer';
    alertContainer.className = 'position-fixed top-0 end-0 p-3';
    alertContainer.style.zIndex = '1050';
    document.body.appendChild(alertContainer);
  }
  
  // Bildirim ID'si
  const alertId = 'alert-' + Date.now();
  
  // Alert HTML'i
  const alertHtml = `
    <div id="${alertId}" class="toast align-items-center text-white bg-${type} border-0" role="alert" aria-live="assertive" aria-atomic="true">
      <div class="d-flex">
        <div class="toast-body">
          ${message}
        </div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Kapat"></button>
      </div>
    </div>
  `;
  
  // Alert'i ekle
  alertContainer.insertAdjacentHTML('beforeend', alertHtml);
  
  // Toast'u başlat
  const toastElement = document.getElementById(alertId);
  const toast = new bootstrap.Toast(toastElement, { delay: 5000 });
  toast.show();
  
  // Otomatik kaldırma
  toastElement.addEventListener('hidden.bs.toast', function() {
    this.remove();
  });
}