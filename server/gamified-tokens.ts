import { storage } from "./storage";

interface TokenDrop {
  id: string;
  tokenType: 'coin' | 'sigil' | 'scroll';
  serialNumber: string;
  tier: string;
  claimedBy?: number;
  claimedAt?: Date;
  claimTime?: number; // seconds to claim
  status: 'available' | 'claimed' | 'shipped';
  createdAt: Date;
}

interface ClaimEvent {
  userId: number;
  tokenId: string;
  claimTime: number;
  tier: string;
  timestamp: Date;
}

export class GamifiedTokens {
  private tokenDrops: Map<string, TokenDrop> = new Map();
  private claimEvents: ClaimEvent[] = [];
  private dropCounter: Map<string, number> = new Map();

  constructor() {
    this.initializeTokenDrops();
    this.dropCounter.set('coin', 0);
    this.dropCounter.set('sigil', 0);
    this.dropCounter.set('scroll', 0);
  }

  private initializeTokenDrops() {
    // Create initial token drops for demonstration
    this.createTokenDrop('shadow', 'scroll');
    this.createTokenDrop('oracle', 'sigil');
    this.createTokenDrop('herald', 'coin');
  }

  private createTokenDrop(tier: string, tokenType: 'coin' | 'sigil' | 'scroll'): string {
    const currentCount = this.dropCounter.get(tokenType) || 0;
    const newCount = currentCount + 1;
    this.dropCounter.set(tokenType, newCount);

    const serialNumber = this.generateSerialNumber(tokenType, newCount);
    const id = `DROP_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

    const drop: TokenDrop = {
      id,
      tokenType,
      serialNumber,
      tier,
      status: 'available',
      createdAt: new Date()
    };

    this.tokenDrops.set(id, drop);
    
    // Broadcast the drop announcement
    this.broadcastTokenDrop(drop);
    
    return id;
  }

  private generateSerialNumber(tokenType: string, count: number): string {
    const prefixes = {
      'coin': 'HC', // Herald Coin
      'sigil': 'OS', // Oracle Sigil  
      'scroll': 'SK'  // Shadow Key scroll
    };
    
    const prefix = prefixes[tokenType] || 'FFC';
    return `${prefix}${count.toString().padStart(3, '0')}`;
  }

  private broadcastTokenDrop(drop: TokenDrop): void {
    const announcement = this.generateDropAnnouncement(drop);
    console.log(`TOKEN DROP: ${announcement}`);
    
    // In production, this would send notifications to eligible users
  }

  private generateDropAnnouncement(drop: TokenDrop): string {
    const typeNames = {
      'coin': 'Bronze Coin',
      'sigil': 'Obsidian Sigil',
      'scroll': 'Sacred Scroll'
    };

    const typeName = typeNames[drop.tokenType] || 'Token';
    return `${typeName} ${drop.serialNumber} has manifested. Only ${drop.tier} tier may claim.`;
  }

  async attemptClaim(tokenId: string, userId: number): Promise<{success: boolean, message: string, claimTime?: number}> {
    const drop = this.tokenDrops.get(tokenId);
    if (!drop || drop.status !== 'available') {
      return { success: false, message: 'Token no longer available' };
    }

    const user = await storage.getUser(userId);
    if (!user) {
      return { success: false, message: 'User not found' };
    }

    // Check tier eligibility
    const tierHierarchy = ['initiate', 'herald', 'oracle', 'shadow'];
    const userTierIndex = tierHierarchy.indexOf(user.tier);
    const requiredTierIndex = tierHierarchy.indexOf(drop.tier);

    if (userTierIndex < requiredTierIndex) {
      return { 
        success: false, 
        message: `${drop.tier} tier or higher required to claim this token` 
      };
    }

    // Calculate claim time
    const claimTime = Math.floor((Date.now() - drop.createdAt.getTime()) / 1000);
    
    // Update drop status
    drop.claimedBy = userId;
    drop.claimedAt = new Date();
    drop.claimTime = claimTime;
    drop.status = 'claimed';

    // Record the claim event
    const claimEvent: ClaimEvent = {
      userId,
      tokenId,
      claimTime,
      tier: user.tier,
      timestamp: new Date()
    };
    
    this.claimEvents.push(claimEvent);

    // Broadcast the successful claim
    this.broadcastSuccessfulClaim(drop, claimEvent);

    return { 
      success: true, 
      message: `${drop.serialNumber} claimed successfully!`,
      claimTime 
    };
  }

  private broadcastSuccessfulClaim(drop: TokenDrop, claim: ClaimEvent): void {
    const typeNames = {
      'coin': 'Bronze Coin',
      'sigil': 'Obsidian Sigil', 
      'scroll': 'Sacred Scroll'
    };

    const typeName = typeNames[drop.tokenType] || 'Token';
    const timeDisplay = claim.claimTime < 60 ? 
      `${claim.claimTime}sec` : 
      `${Math.floor(claim.claimTime / 60)}min`;

    const announcement = `${drop.tier.toUpperCase()} ${claim.userId.toString().slice(-3)} claimed ${typeName} ${drop.serialNumber} in ${timeDisplay}`;
    
    console.log(`CLAIM SUCCESS: ${announcement}`);
    
    // This creates the visible proof-of-desire loop
  }

  getRecentClaims(limit: number = 10): ClaimEvent[] {
    return this.claimEvents
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  getAvailableTokens(userTier: string): TokenDrop[] {
    const tierHierarchy = ['initiate', 'herald', 'oracle', 'shadow'];
    const userTierIndex = tierHierarchy.indexOf(userTier);

    return Array.from(this.tokenDrops.values())
      .filter(drop => {
        const requiredTierIndex = tierHierarchy.indexOf(drop.tier);
        return drop.status === 'available' && userTierIndex >= requiredTierIndex;
      });
  }

  scheduleRandomDrop(): void {
    // Random tier selection weighted by exclusivity
    const tiers = ['herald', 'oracle', 'shadow'];
    const weights = [0.5, 0.3, 0.2]; // Herald 50%, Oracle 30%, Shadow 20%
    
    const random = Math.random();
    let selectedTier = 'herald';
    let weightSum = 0;
    
    for (let i = 0; i < tiers.length; i++) {
      weightSum += weights[i];
      if (random <= weightSum) {
        selectedTier = tiers[i];
        break;
      }
    }

    const tokenTypes: ('coin' | 'sigil' | 'scroll')[] = ['coin', 'sigil', 'scroll'];
    const randomType = tokenTypes[Math.floor(Math.random() * tokenTypes.length)];
    
    this.createTokenDrop(selectedTier, randomType);
  }

  generateClaimInterface(): string {
    const recentClaims = this.getRecentClaims(5);
    
    return `
    <!DOCTYPE html>
    <html class="dark">
    <head>
      <title>Token Claims - FFC</title>
      <style>
        body {
          background: radial-gradient(circle at center, #0b0b0f, #1a1a2e 60%, #000000 90%);
          color: white;
          font-family: 'Playfair Display', serif;
          padding: 2rem;
          min-height: 100vh;
        }
        .container { max-width: 800px; margin: 0 auto; }
        .title { font-size: 3rem; margin-bottom: 1rem; color: #8b1e3f; text-align: center; }
        .claim-feed {
          background: rgba(139, 30, 63, 0.1);
          border: 1px solid #8b1e3f;
          border-radius: 12px;
          padding: 2rem;
          margin: 2rem 0;
        }
        .claim-item {
          border-bottom: 1px solid rgba(139, 30, 63, 0.3);
          padding: 1rem 0;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .claim-item:last-child { border-bottom: none; }
        .claim-time {
          color: #8b1e3f;
          font-weight: bold;
        }
        .token-available {
          background: rgba(0, 255, 0, 0.1);
          border: 1px solid green;
          border-radius: 8px;
          padding: 1rem;
          margin: 1rem 0;
          text-align: center;
        }
        .pulse {
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.7; }
          100% { opacity: 1; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1 class="title">Physical Token Claims</h1>
        <div style="text-align: center; color: #999; margin-bottom: 3rem;">
          Proof of desire made manifest. Speed determines legend.
        </div>
        
        <div class="claim-feed">
          <h3 style="margin-bottom: 1rem;">Recent Claims</h3>
          ${recentClaims.map(claim => {
            const timeDisplay = claim.claimTime < 60 ? 
              `${claim.claimTime}sec` : 
              `${Math.floor(claim.claimTime / 60)}min`;
            return `
              <div class="claim-item">
                <span>${claim.tier.toUpperCase()} ${claim.userId.toString().slice(-3)} claimed token</span>
                <span class="claim-time">${timeDisplay}</span>
              </div>
            `;
          }).join('')}
        </div>
        
        <div class="token-available pulse">
          <h4>Oracle Sigil OS009 Available</h4>
          <p>Obsidian pendant etched with personal oracle symbol</p>
          <button style="
            background: linear-gradient(to right, #8b1e3f, #5e3d75);
            color: white;
            padding: 1rem 2rem;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 1.1rem;
            margin-top: 1rem;
          ">
            Claim Now
          </button>
        </div>
        
        <div style="text-align: center; margin-top: 3rem; color: #666;">
          <p>Tokens appear randomly. Claim speed becomes part of your legend.</p>
        </div>
      </div>
    </body>
    </html>`;
  }
}

export const gamifiedTokens = new GamifiedTokens();