export class NotificationsService {
  private static instance: NotificationsService;
  
  static getInstance(): NotificationsService {
    if (!this.instance) {
      this.instance = new NotificationsService();
    }
    return this.instance;
  }
  
  // Check if notifications are supported
  isSupported(): boolean {
    return 'Notification' in window && 'serviceWorker' in navigator;
  }
  
  // Get current permission status
  getPermission(): NotificationPermission {
    if (!this.isSupported()) return 'denied';
    return Notification.permission;
  }
  
  // Request notification permission
  async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported()) {
      throw new Error('Notifications are not supported');
    }
    
    const permission = await Notification.requestPermission();
    return permission;
  }
  
  // Show a simple notification
  showNotification(title: string, options?: NotificationOptions): void {
    if (!this.isSupported() || Notification.permission !== 'granted') {
      console.warn('Cannot show notification: permission not granted');
      return;
    }
    
    const notification = new Notification(title, {
      icon: '/favicon.svg',
      badge: '/favicon.svg',
      ...options
    });
    
    // Auto close after 5 seconds
    setTimeout(() => {
      notification.close();
    }, 5000);
  }
  
  // TODO: Schedule prayer time notifications
  async schedulePrayerNotification(prayerName: string, time: string): Promise<void> {
    console.log(`Schedule notification for ${prayerName} at ${time} - TODO: Implement with service worker`);
    
    // This would require service worker implementation for background scheduling
    // For now, just log the intent
  }
  
  // TODO: Cancel scheduled notification
  async cancelPrayerNotification(prayerName: string): Promise<void> {
    console.log(`Cancel notification for ${prayerName} - TODO: Implement with service worker`);
  }
  
  // TODO: Firebase Cloud Messaging integration
  async initializeFCM(): Promise<void> {
    console.log('Initialize FCM - TODO: Add Firebase Cloud Messaging');
    
    // This would require Firebase SDK and service worker setup
    // Placeholder for FCM token registration
  }
  
  // Show prayer time notification
  showPrayerNotification(prayerName: string, isReminder: boolean = false): void {
    const title = isReminder 
      ? `${prayerName} vaktine 15 dakika kaldı`
      : `${prayerName} vakti girdi`;
    
    const body = isReminder
      ? 'Namaza hazırlanabilirsiniz'
      : 'Namaz vakti geldi';
    
    this.showNotification(title, {
      body,
      tag: `prayer-${prayerName}`,
      requireInteraction: true,
      actions: [
        {
          action: 'dismiss',
          title: 'Tamam'
        }
      ]
    });
  }
  
  // Show daily verse notification
  showDailyVerseNotification(verse: string, source: string): void {
    this.showNotification('Günün Ayeti', {
      body: verse,
      tag: 'daily-verse',
      icon: '/favicon.svg'
    });
  }
}