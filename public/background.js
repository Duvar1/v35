// public/background.js
addEventListener('checkPrayerTimes', async () => {
  console.log('🕐 Namaz vakitleri kontrol ediliyor...');
  
  try {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    // Namaz vakitlerini localStorage'dan al
    const storedTimes = localStorage.getItem('prayerTimes');
    if (storedTimes) {
      const prayerTimes = JSON.parse(storedTimes);
      
      // Her namaz için kontrol et
      prayerTimes.forEach(prayer => {
        const [hours, minutes] = prayer.time.split(':').map(Number);
        const prayerTime = hours * 60 + minutes;
        
        // 5 dakika kala kontrol
        if (Math.abs(prayerTime - currentTime) <= 5) {
          console.log(`⏰ ${prayer.name} vakti yaklaşıyor!`);
          
          // Bildirim gönder
          self.registration.showNotification(`⏰ ${prayer.name} Vakti`, {
            body: `${prayer.name} vakti yaklaşıyor (${prayer.time})`,
            icon: '/icons/icon-192x192.png',
            badge: '/icons/icon-72x72.png',
            vibrate: [200, 100, 200],
            tag: 'prayer-reminder'
          });
        }
      });
    }
  } catch (error) {
    console.error('Background task error:', error);
  }
});