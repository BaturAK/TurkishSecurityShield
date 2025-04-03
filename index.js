const express = require('express');
const path = require('path');
const app = express();
const port = 5000;

// Flutter web uygulamasını build/web klasöründen sunmak
app.use(express.static(path.join(__dirname, 'build/web')));

// Basit bir API endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Flutter web uygulaması olmadığı için, basit bir HTML sayfası oluşturup gösterelim
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Antivirüs Uygulaması</title>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 20px;
          background-color: #f0f0f0;
          color: #333;
        }
        .container {
          max-width: 900px;
          margin: 0 auto;
          background-color: white;
          padding: 20px;
          border-radius: 10px;
          box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }
        header {
          text-align: center;
          padding-bottom: 20px;
          border-bottom: 1px solid #eee;
        }
        h1 {
          color: #0066cc;
        }
        .card {
          background-color: white;
          border-radius: 8px;
          box-shadow: 0 2px 5px rgba(0,0,0,0.1);
          padding: 15px;
          margin-bottom: 20px;
        }
        .card-header {
          display: flex;
          align-items: center;
          margin-bottom: 10px;
        }
        .card-icon {
          width: 40px;
          height: 40px;
          background-color: #edf6ff;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 15px;
        }
        .card-icon i {
          color: #0066cc;
          font-size: 20px;
        }
        .card-title {
          font-weight: bold;
          font-size: 18px;
        }
        .scan-button {
          background-color: #0066cc;
          color: white;
          border: none;
          border-radius: 5px;
          padding: 10px 15px;
          cursor: pointer;
          font-size: 16px;
          margin-top: 10px;
        }
        .scan-button:hover {
          background-color: #0055aa;
        }
        .status {
          display: flex;
          justify-content: space-between;
          margin: 20px 0;
        }
        .status-card {
          width: 48%;
          background-color: #f8f8f8;
          padding: 15px;
          border-radius: 8px;
          border-left: 4px solid #0066cc;
        }
        .threat-list {
          margin-top: 20px;
        }
        .threat-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px;
          border-bottom: 1px solid #eee;
        }
        .threat-info {
          display: flex;
          align-items: center;
        }
        .threat-icon {
          color: #ff3333;
          margin-right: 10px;
        }
        .threat-actions button {
          background-color: #4caf50;
          color: white;
          border: none;
          border-radius: 4px;
          padding: 5px 10px;
          cursor: pointer;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <header>
          <h1>Antivirüs Uygulaması</h1>
          <p>Cihazınızı güvende tutmak için gelişmiş koruma çözümü</p>
        </header>
        
        <section class="status">
          <div class="status-card">
            <div class="card-header">
              <div class="card-icon">
                <i>🛡️</i>
              </div>
              <div>
                <div class="card-title">Güvenlik Durumu</div>
                <div style="color: green;">Güvenli</div>
              </div>
            </div>
          </div>
          <div class="status-card">
            <div class="card-header">
              <div class="card-icon">
                <i>🕒</i>
              </div>
              <div>
                <div class="card-title">Son Tarama</div>
                <div>3/4/2025</div>
              </div>
            </div>
          </div>
        </section>
        
        <h2>Tarama İşlemleri</h2>
        <div style="display: flex; justify-content: space-between;">
          <div class="card" style="width: 48%;">
            <div class="card-header">
              <div class="card-icon">
                <i>⚡</i>
              </div>
              <div class="card-title">Hızlı Tarama</div>
            </div>
            <p>Kritik sistem alanlarını hızlıca tarar</p>
            <button class="scan-button">Tara</button>
          </div>
          <div class="card" style="width: 48%;">
            <div class="card-header">
              <div class="card-icon">
                <i>🛡️</i>
              </div>
              <div class="card-title">Tam Tarama</div>
            </div>
            <p>Tüm sistemi detaylı tarar</p>
            <button class="scan-button">Tara</button>
          </div>
        </div>
        
        <div style="display: flex; justify-content: space-between; margin-top: 20px;">
          <div class="card" style="width: 48%;">
            <div class="card-header">
              <div class="card-icon">
                <i>📶</i>
              </div>
              <div class="card-title">WiFi Taraması</div>
            </div>
            <p>Ağ güvenliğini kontrol eder</p>
            <button class="scan-button">Tara</button>
          </div>
          <div class="card" style="width: 48%;">
            <div class="card-header">
              <div class="card-icon">
                <i>📱</i>
              </div>
              <div class="card-title">QR Taraması</div>
            </div>
            <p>Güvenli QR kod kontrolü yapar</p>
            <button class="scan-button">Tara</button>
          </div>
        </div>
        
        <h2>Tespit Edilen Tehditler</h2>
        <div class="threat-list">
          <div class="threat-item">
            <div class="threat-info">
              <div class="threat-icon">⚠️</div>
              <div>
                <div style="font-weight: bold;">Adware.AndroidOS.Agent</div>
                <div style="color: #666; font-size: 14px;">Reklam gösterimi yapan potansiyel istenmeyen uygulama</div>
              </div>
            </div>
            <div class="threat-actions">
              <button>Temizle</button>
            </div>
          </div>
          <div class="threat-item">
            <div class="threat-info">
              <div class="threat-icon">⚠️</div>
              <div>
                <div style="font-weight: bold;">Trojan.AndroidOS.Boogr</div>
                <div style="color: #666; font-size: 14px;">Sistem izinlerini kötüye kullanan Truva atı</div>
              </div>
            </div>
            <div class="threat-actions">
              <button>Temizle</button>
            </div>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 20px;">
          <button class="scan-button" style="background-color: #4caf50;">Tüm Tehditleri Temizle</button>
        </div>
      </div>
      
      <script>
        // Basit interaktif davranış
        document.querySelectorAll('.scan-button').forEach(button => {
          button.addEventListener('click', function() {
            alert('Tarama başlatılıyor...');
            // Gerçek uygulamada tarama işlemi başlatılır
          });
        });
        
        document.querySelectorAll('.threat-actions button').forEach(button => {
          button.addEventListener('click', function() {
            const threatItem = this.closest('.threat-item');
            alert('Tehdit temizleniyor...');
            setTimeout(() => {
              threatItem.style.backgroundColor = '#e8f5e9';
              this.textContent = 'Temizlendi';
              this.disabled = true;
              this.style.backgroundColor = '#aaa';
            }, 1000);
          });
        });
      </script>
    </body>
    </html>
  `);
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Antivirüs uygulaması ${port} numaralı port üzerinde çalışıyor`);
});