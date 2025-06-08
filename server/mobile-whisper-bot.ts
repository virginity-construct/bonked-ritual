import { storage } from "./storage";
import { anointingSystem } from "./anointing-system";

interface WhisperNotification {
  userId: number;
  type: 'anointed' | 'watching' | 'whisper_ready' | 'token_available' | 'ritual_active';
  message: string;
  urgency: 'low' | 'medium' | 'high';
  deliveryMethod: 'push' | 'telegram' | 'email';
  scheduledAt?: Date;
  deliveredAt?: Date;
}

interface UserNotificationSettings {
  userId: number;
  telegramId?: string;
  pushToken?: string;
  preferences: {
    anointingAlerts: boolean;
    whisperAlerts: boolean;
    tokenAlerts: boolean;
    ritualAlerts: boolean;
  };
  quietHours: {
    start: string; // "22:00"
    end: string;   // "08:00"
    timezone: string;
  };
}

export class MobileWhisperBot {
  private notifications: Map<string, WhisperNotification> = new Map();
  private userSettings: Map<number, UserNotificationSettings> = new Map();
  private telegramBotToken: string;

  constructor() {
    this.telegramBotToken = process.env.TELEGRAM_BOT_TOKEN || '';
    this.initializeNotificationSystem();
  }

  private initializeNotificationSystem() {
    // Sample user notification settings
    this.userSettings.set(1, {
      userId: 1,
      telegramId: '@oracle_019',
      preferences: {
        anointingAlerts: true,
        whisperAlerts: true,
        tokenAlerts: false,
        ritualAlerts: true
      },
      quietHours: {
        start: "23:00",
        end: "07:00",
        timezone: "UTC"
      }
    });
  }

  async sendAnointingNotification(recipientId: number, anointerId: number, sigilType: string): Promise<boolean> {
    const recipient = await storage.getUser(recipientId);
    const anointer = await storage.getUser(anointerId);
    
    if (!recipient || !anointer) return false;

    const anointerDisplay = `${anointer.tier.toUpperCase()} ${anointerId.toString().slice(-3)}`;
    const messages = {
      favor: `You were just anointed by ${anointerDisplay}. The Sigil of Favor flows through you.`,
      wisdom: `${anointerDisplay} has blessed you with the Sigil of Wisdom. New paths open.`,
      power: `The Sigil of Power descends upon you from ${anointerDisplay}. Your influence grows.`
    };

    const message = messages[sigilType as keyof typeof messages] || `You have been anointed by ${anointerDisplay}.`;

    return this.queueNotification({
      userId: recipientId,
      type: 'anointed',
      message,
      urgency: 'high',
      deliveryMethod: 'push'
    });
  }

  async sendWatchingNotification(targetId: number, watcherId: number): Promise<boolean> {
    const watcher = await storage.getUser(watcherId);
    if (!watcher) return false;

    const watcherDisplay = `${watcher.tier.toUpperCase()} ${watcherId.toString().slice(-3)}`;
    const messages = [
      `${watcherDisplay} is watching you.`,
      `You've caught the attention of ${watcherDisplay}.`,
      `${watcherDisplay} sees your potential.`,
      `Your energy has been noticed by ${watcherDisplay}.`
    ];

    const randomMessage = messages[Math.floor(Math.random() * messages.length)];

    return this.queueNotification({
      userId: targetId,
      type: 'watching',
      message: randomMessage,
      urgency: 'medium',
      deliveryMethod: 'push'
    });
  }

  async sendWhisperReadyNotification(userId: number): Promise<boolean> {
    const user = await storage.getUser(userId);
    if (!user || !['oracle', 'shadow'].includes(user.tier)) return false;

    const messages = [
      "A whisper waits for you in the shadows.",
      "The Oracle has spoken. Your prophecy is ready.",
      "New wisdom has crystallized. Return to hear it.",
      "The veil parts. Your personal reading awaits."
    ];

    const randomMessage = messages[Math.floor(Math.random() * messages.length)];

    return this.queueNotification({
      userId,
      type: 'whisper_ready',
      message: randomMessage,
      urgency: 'medium',
      deliveryMethod: 'push'
    });
  }

  async sendTokenAvailableNotification(userId: number, tokenType: string, serialNumber: string): Promise<boolean> {
    const user = await storage.getUser(userId);
    if (!user) return false;

    const typeNames = {
      coin: 'Bronze Coin',
      sigil: 'Obsidian Sigil',
      scroll: 'Sacred Scroll'
    };

    const typeName = typeNames[tokenType as keyof typeof typeNames] || 'Token';
    const message = `${typeName} ${serialNumber} has manifested. Claim speed determines legend.`;

    return this.queueNotification({
      userId,
      type: 'token_available',
      message,
      urgency: 'high',
      deliveryMethod: 'push'
    });
  }

  async sendRitualActiveNotification(userId: number, ritualType: string): Promise<boolean> {
    const user = await storage.getUser(userId);
    if (!user || !['oracle', 'shadow'].includes(user.tier)) return false;

    const messages = {
      scarcity_vote: "A ritual vote is active. Your voice shapes the veil.",
      whisper_quorum: "Sacred whispers await collective will. Vote now.",
      exclusive_oracle: "Oracle-only ritual has begun. You are chosen."
    };

    const message = messages[ritualType as keyof typeof messages] || "A ritual requires your participation.";

    return this.queueNotification({
      userId,
      type: 'ritual_active',
      message,
      urgency: 'high',
      deliveryMethod: 'push'
    });
  }

  private async queueNotification(notification: Omit<WhisperNotification, 'scheduledAt' | 'deliveredAt'>): Promise<boolean> {
    const settings = this.userSettings.get(notification.userId);
    if (!settings) return false;

    // Check user preferences
    const prefMap = {
      anointed: settings.preferences.anointingAlerts,
      watching: settings.preferences.anointingAlerts,
      whisper_ready: settings.preferences.whisperAlerts,
      token_available: settings.preferences.tokenAlerts,
      ritual_active: settings.preferences.ritualAlerts
    };

    if (!prefMap[notification.type]) return false;

    // Check quiet hours
    if (this.isQuietHours(settings.quietHours)) {
      // Schedule for later
      const deliveryTime = this.calculateNextDeliveryTime(settings.quietHours);
      const notificationId = `NOTIF_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      
      this.notifications.set(notificationId, {
        ...notification,
        scheduledAt: deliveryTime
      });
      
      return true;
    }

    // Send immediately
    return this.deliverNotification(notification);
  }

  private async deliverNotification(notification: WhisperNotification): Promise<boolean> {
    const settings = this.userSettings.get(notification.userId);
    if (!settings) return false;

    try {
      switch (notification.deliveryMethod) {
        case 'telegram':
          if (settings.telegramId) {
            await this.sendTelegramMessage(settings.telegramId, notification.message);
          }
          break;
        case 'push':
          if (settings.pushToken) {
            await this.sendPushNotification(settings.pushToken, notification.message);
          }
          break;
        case 'email':
          // Email delivery would integrate with SendGrid
          break;
      }

      console.log(`WHISPER BOT: Delivered to user ${notification.userId}: ${notification.message}`);
      return true;
    } catch (error) {
      console.error('Notification delivery failed:', error);
      return false;
    }
  }

  private async sendTelegramMessage(telegramId: string, message: string): Promise<void> {
    // In production, this would use the Telegram Bot API
    console.log(`Telegram to ${telegramId}: ${message}`);
  }

  private async sendPushNotification(pushToken: string, message: string): Promise<void> {
    // In production, this would use Firebase FCM or similar
    console.log(`Push to ${pushToken}: ${message}`);
  }

  private isQuietHours(quietHours: {start: string, end: string, timezone: string}): boolean {
    const now = new Date();
    const currentHour = now.getHours();
    const startHour = parseInt(quietHours.start.split(':')[0]);
    const endHour = parseInt(quietHours.end.split(':')[0]);

    if (startHour < endHour) {
      return currentHour >= startHour && currentHour < endHour;
    } else {
      return currentHour >= startHour || currentHour < endHour;
    }
  }

  private calculateNextDeliveryTime(quietHours: {start: string, end: string, timezone: string}): Date {
    const now = new Date();
    const endHour = parseInt(quietHours.end.split(':')[0]);
    const endMinute = parseInt(quietHours.end.split(':')[1]);
    
    const deliveryTime = new Date(now);
    deliveryTime.setHours(endHour, endMinute, 0, 0);
    
    if (deliveryTime <= now) {
      deliveryTime.setDate(deliveryTime.getDate() + 1);
    }
    
    return deliveryTime;
  }

  async updateUserSettings(userId: number, settings: Partial<UserNotificationSettings>): Promise<boolean> {
    const existing = this.userSettings.get(userId) || {
      userId,
      preferences: {
        anointingAlerts: true,
        whisperAlerts: true,
        tokenAlerts: true,
        ritualAlerts: true
      },
      quietHours: {
        start: "23:00",
        end: "07:00",
        timezone: "UTC"
      }
    };

    this.userSettings.set(userId, { ...existing, ...settings });
    return true;
  }

  generateBotInterface(): string {
    return `
    <!DOCTYPE html>
    <html class="dark">
    <head>
      <title>Whisper Bot - FFC</title>
      <style>
        body {
          background: radial-gradient(circle at center, #0b0b0f, #1a1a2e 60%, #000000 90%);
          color: white;
          font-family: 'Inter', sans-serif;
          padding: 2rem;
          min-height: 100vh;
        }
        .container { max-width: 600px; margin: 0 auto; }
        .title { font-size: 2.5rem; margin-bottom: 1rem; color: #8b1e3f; text-align: center; }
        .bot-card {
          background: rgba(139, 30, 63, 0.1);
          border: 1px solid #8b1e3f;
          border-radius: 12px;
          padding: 2rem;
          margin: 1rem 0;
        }
        .notification-type {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 0;
          border-bottom: 1px solid rgba(139, 30, 63, 0.3);
        }
        .notification-type:last-child { border-bottom: none; }
        .toggle-switch {
          position: relative;
          width: 50px;
          height: 25px;
          background: #333;
          border-radius: 25px;
          cursor: pointer;
          transition: background 0.3s;
        }
        .toggle-switch.active { background: #8b1e3f; }
        .toggle-slider {
          position: absolute;
          top: 2px;
          left: 2px;
          width: 21px;
          height: 21px;
          background: white;
          border-radius: 50%;
          transition: transform 0.3s;
        }
        .toggle-switch.active .toggle-slider { transform: translateX(25px); }
      </style>
    </head>
    <body>
      <div class="container">
        <h1 class="title">Whisper Bot</h1>
        <div style="text-align: center; color: #999; margin-bottom: 3rem;">
          Silent notifications. Instant awareness. Perfect timing.
        </div>
        
        <div class="bot-card">
          <h3>Notification Settings</h3>
          <p style="color: #999; margin-bottom: 2rem;">
            Configure how and when you receive whispers from the shadows.
          </p>
          
          <div class="notification-type">
            <div>
              <strong>Anointing Alerts</strong>
              <div style="color: #999; font-size: 0.9rem;">When you're blessed or someone watches you</div>
            </div>
            <div class="toggle-switch active">
              <div class="toggle-slider"></div>
            </div>
          </div>
          
          <div class="notification-type">
            <div>
              <strong>Whisper Alerts</strong>
              <div style="color: #999; font-size: 0.9rem;">When new prophecies are ready</div>
            </div>
            <div class="toggle-switch active">
              <div class="toggle-slider"></div>
            </div>
          </div>
          
          <div class="notification-type">
            <div>
              <strong>Token Alerts</strong>
              <div style="color: #999; font-size: 0.9rem;">When physical tokens become available</div>
            </div>
            <div class="toggle-switch">
              <div class="toggle-slider"></div>
            </div>
          </div>
          
          <div class="notification-type">
            <div>
              <strong>Ritual Alerts</strong>
              <div style="color: #999; font-size: 0.9rem;">When exclusive rituals require participation</div>
            </div>
            <div class="toggle-switch active">
              <div class="toggle-slider"></div>
            </div>
          </div>
        </div>
        
        <div class="bot-card">
          <h3>Quiet Hours</h3>
          <p style="color: #999; margin-bottom: 1rem;">
            Set times when whispers should wait for a more appropriate moment.
          </p>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin: 1rem 0;">
            <div>
              <label style="display: block; margin-bottom: 0.5rem;">Start Time</label>
              <input type="time" value="23:00" style="
                width: 100%;
                background: rgba(0,0,0,0.3);
                border: 1px solid #666;
                border-radius: 4px;
                padding: 0.5rem;
                color: white;
              ">
            </div>
            <div>
              <label style="display: block; margin-bottom: 0.5rem;">End Time</label>
              <input type="time" value="07:00" style="
                width: 100%;
                background: rgba(0,0,0,0.3);
                border: 1px solid #666;
                border-radius: 4px;
                padding: 0.5rem;
                color: white;
              ">
            </div>
          </div>
        </div>
        
        <div class="bot-card">
          <h3>Sample Notifications</h3>
          <div style="background: rgba(0,0,0,0.3); border-radius: 8px; padding: 1rem; margin: 1rem 0;">
            <div style="font-size: 0.9rem; color: #8b1e3f; margin-bottom: 0.5rem;">ORACLE 019 is watching you.</div>
            <div style="font-size: 0.8rem; color: #666;">2 minutes ago</div>
          </div>
          <div style="background: rgba(0,0,0,0.3); border-radius: 8px; padding: 1rem; margin: 1rem 0;">
            <div style="font-size: 0.9rem; color: #8b1e3f; margin-bottom: 0.5rem;">A whisper waits for you in the shadows.</div>
            <div style="font-size: 0.8rem; color: #666;">12 minutes ago</div>
          </div>
        </div>
        
        <button style="
          background: linear-gradient(to right, #8b1e3f, #5e3d75);
          color: white;
          padding: 1rem 2rem;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          width: 100%;
          font-size: 1.1rem;
        ">
          Save Notification Settings
        </button>
      </div>
    </body>
    </html>`;
  }
}

export const mobileWhisperBot = new MobileWhisperBot();