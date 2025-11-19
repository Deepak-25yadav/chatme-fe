import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private unreadCountSubject = new BehaviorSubject<number>(0);
  public unreadCount$ = this.unreadCountSubject.asObservable();
  
  private notificationPermission: NotificationPermission = 'default';
  private notificationSound: HTMLAudioElement;

  constructor() {
    // Check notification permission
    if ('Notification' in window) {
      this.notificationPermission = Notification.permission;
    }

    // Create notification sound
    this.notificationSound = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIGWi77eefTRAMUKfj8LZjHAY4ktfyzHksBSR3x/DdkEAKFF606+uoVRQKRp/g8r5sIQUrgs7y2Yk2CBlou+3nn00QDFCn4/C2YxwGOJLX8sx5LAUkd8fw3ZBAC');
  }

  // Request notification permission
  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return false;
    }

    if (this.notificationPermission === 'granted') {
      return true;
    }

    const permission = await Notification.requestPermission();
    this.notificationPermission = permission;
    return permission === 'granted';
  }

  // Show browser notification
  showNotification(title: string, options?: NotificationOptions): void {
    if (this.notificationPermission !== 'granted') {
      return;
    }

    // Don't show notification if window is focused
    if (document.hasFocus()) {
      return;
    }

    const notification = new Notification(title, {
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      ...options
    });

    // Auto-close after 5 seconds
    setTimeout(() => notification.close(), 5000);

    // Focus window when notification is clicked
    notification.onclick = () => {
      window.focus();
      notification.close();
    };
  }

  // Play notification sound
  playSound(): void {
    try {
      this.notificationSound.currentTime = 0;
      this.notificationSound.play().catch(err => {
        console.log('Could not play notification sound:', err);
      });
    } catch (error) {
      console.log('Error playing sound:', error);
    }
  }

  // Show message notification
  showMessageNotification(senderName: string, message: string, avatar?: string): void {
    this.showNotification(`New message from ${senderName}`, {
      body: message.length > 100 ? message.substring(0, 100) + '...' : message,
      icon: avatar || '/favicon.ico',
      tag: 'message-notification'
    });
    this.playSound();
  }

  // Update unread count
  setUnreadCount(count: number): void {
    this.unreadCountSubject.next(count);
    this.updateDocumentTitle(count);
  }

  // Increment unread count
  incrementUnreadCount(): void {
    const currentCount = this.unreadCountSubject.value;
    this.setUnreadCount(currentCount + 1);
  }

  // Decrement unread count
  decrementUnreadCount(): void {
    const currentCount = this.unreadCountSubject.value;
    if (currentCount > 0) {
      this.setUnreadCount(currentCount - 1);
    }
  }

  // Reset unread count
  resetUnreadCount(): void {
    this.setUnreadCount(0);
  }

  // Update document title with unread count
  private updateDocumentTitle(count: number): void {
    if (count > 0) {
      document.title = `(${count}) ChatMe`;
    } else {
      document.title = 'ChatMe';
    }
  }

  // Get current unread count
  get unreadCount(): number {
    return this.unreadCountSubject.value;
  }
}
