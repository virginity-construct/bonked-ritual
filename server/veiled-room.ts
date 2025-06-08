import { storage } from "./storage";

interface VeiledAccess {
  userId: number;
  tier: string;
  membershipStartDate: Date;
  accessGranted: boolean;
  telegramInviteCode?: string;
  specialChannels: string[];
}

export class VeiledRoom {
  private telegramBotToken: string;
  
  constructor() {
    this.telegramBotToken = process.env.TELEGRAM_BOT_TOKEN || '';
  }

  async checkVeiledAccess(userId: number): Promise<VeiledAccess> {
    const user = await storage.getUser(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const membershipDuration = this.calculateMembershipDuration(user.createdAt);
    const hasRequiredDuration = membershipDuration >= 90; // 3 months
    const hasRequiredTier = ['oracle', 'shadow'].includes(user.tier);

    return {
      userId,
      tier: user.tier,
      membershipStartDate: user.createdAt,
      accessGranted: hasRequiredDuration && hasRequiredTier,
      specialChannels: this.getChannelAccess(user.tier)
    };
  }

  private calculateMembershipDuration(startDate: Date): number {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - startDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // Days
  }

  private getChannelAccess(tier: string): string[] {
    const channels = {
      'shadow': ['shadow-sanctum', 'oracle-whispers', 'herald-chambers', 'initiate-circle'],
      'oracle': ['oracle-whispers', 'herald-chambers', 'initiate-circle'],
      'herald': ['herald-chambers', 'initiate-circle'],
      'initiate': ['initiate-circle']
    };
    
    return channels[tier as keyof typeof channels] || [];
  }

  async generateTelegramInvite(userId: number): Promise<string> {
    const access = await this.checkVeiledAccess(userId);
    
    if (!access.accessGranted) {
      throw new Error('Veiled access requires Oracle+ tier and 3 months membership');
    }

    // Generate unique invite code
    const inviteCode = this.generateSecureCode();
    
    // In production, this would create actual Telegram invite links
    return `https://t.me/+${inviteCode}`;
  }

  private generateSecureCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 22; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  async sendVeiledMessage(userId: number, message: string): Promise<boolean> {
    const access = await this.checkVeiledAccess(userId);
    
    if (!access.accessGranted) {
      return false;
    }

    // Simulate sending intimate message through private channel
    console.log(`Veiled message sent to user ${userId}: ${message}`);
    return true;
  }

  generateVeiledRoomInterface(): string {
    return `
    <!DOCTYPE html>
    <html class="dark">
    <head>
      <title>The Veiled Room - FFC</title>
      <style>
        body {
          background: radial-gradient(circle at center, #0b0b0f, #1a1a2e 60%, #000000 90%);
          color: white;
          font-family: 'Playfair Display', serif;
          padding: 2rem;
          min-height: 100vh;
        }
        .container { max-width: 800px; margin: 0 auto; text-align: center; }
        .title { font-size: 3rem; margin-bottom: 1rem; color: #8b1e3f; }
        .requirement { 
          background: rgba(139, 30, 63, 0.1);
          border: 1px solid #8b1e3f;
          border-radius: 8px;
          padding: 1.5rem;
          margin: 2rem 0;
        }
        .whisper { font-style: italic; color: #999; margin: 1rem 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1 class="title">The Veiled Room</h1>
        <div class="whisper">Where intimacy lives behind the veil</div>
        
        <div class="requirement">
          <h3>Access Requirements</h3>
          <p>• Oracle or Shadow Key tier</p>
          <p>• 3 months of unbroken membership</p>
          <p>• Proven discretion</p>
        </div>
        
        <div class="whisper">
          "Some secrets are too intimate for the open chambers.<br>
          The chosen few gather where words become whispers,<br>
          and whispers become truth."
        </div>
        
        <button id="requestAccess" style="
          background: linear-gradient(to right, #8b1e3f, #5e3d75);
          color: white;
          padding: 1rem 2rem;
          border: none;
          border-radius: 24px;
          font-size: 1.1rem;
          cursor: pointer;
          margin-top: 2rem;
        ">
          Request Veiled Access
        </button>
      </div>
    </body>
    </html>`;
  }
}

export const veiledRoom = new VeiledRoom();