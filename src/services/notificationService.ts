import { NetworkEvent, NotificationSettings } from '../types';

const SETTINGS_STORAGE_KEY = 'inwifi_notification_settings';

class NotificationService {
  private settings: NotificationSettings = {
    newDeviceAlert: true,
    deviceLeftAlert: true,
    highTrafficAlert: true,
    securityAlert: true,
    routerStatusAlert: true,
    soundEnabled: true
  };

  private listeners: Array<(settings: NotificationSettings) => void> = [];

  constructor() {
    this.loadSettings();
  }

  private loadSettings() {
    try {
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
        if (stored) {
          this.settings = { ...this.settings, ...JSON.parse(stored) };
        }
      }
    } catch {
      // fallback
    }
  }

  getSettings(): NotificationSettings {
    return { ...this.settings };
  }

  updateSettings(updates: Partial<NotificationSettings>) {
    this.settings = { ...this.settings, ...updates };
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(this.settings));
      }
    } catch {
      // ignore
    }
    this.listeners.forEach(cb => cb(this.getSettings()));
  }

  subscribe(callback: (settings: NotificationSettings) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  /** Reproduz aviso sonoro sutil gerado via Web Audio API */
  playChime(type: 'info' | 'warning' | 'error' = 'info') {
    if (!this.settings.soundEnabled) return;
    try {
      if (typeof window === 'undefined') return;
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;
      if (type === 'error') {
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(180, now + 0.3);
      } else if (type === 'warning') {
        osc.frequency.setValueAtTime(520, now);
        osc.frequency.setValueAtTime(620, now + 0.1);
      } else {
        osc.frequency.setValueAtTime(587.33, now); // D5
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.15); // A5
      }

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.start(now);
      osc.stop(now + 0.35);
    } catch {
      // AudioContext may be restricted before user interaction
    }
  }

  getPushPermissionStatus(): string {
    try {
      if (typeof window !== 'undefined' && 'Notification' in window && window.Notification) {
        return Notification.permission || 'default';
      }
    } catch {
      // Insecure HTTP origin
    }
    return 'unsupported';
  }

  async requestPushPermission(): Promise<string> {
    try {
      if (typeof window === 'undefined' || !('Notification' in window) || !window.Notification) {
        return 'unsupported';
      }
      return await Notification.requestPermission();
    } catch {
      return 'denied';
    }
  }

  sendBrowserNotification(event: NetworkEvent) {
    try {
      if (typeof window === 'undefined' || !('Notification' in window) || !window.Notification) return;
      if (Notification.permission !== 'granted') return;
      new Notification(event.title, {
        body: event.description,
        icon: '/logo.svg',
        tag: event.id
      });
    } catch {
      // fallback for insecure origin
    }
  }
}

export const notificationService = new NotificationService();
