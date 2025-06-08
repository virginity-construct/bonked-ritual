import { storage } from "./storage";

interface AnointmentRecord {
  id: string;
  anointerId: number;
  recipientId: number;
  anointerTier: string;
  recipientTier: string;
  sigilType: 'favor' | 'wisdom' | 'power';
  benefits: AnointmentBenefits;
  publicMessage?: string;
  createdAt: Date;
  expiresAt: Date;
  active: boolean;
}

interface AnointmentBenefits {
  temporaryTierBoost?: string;
  freeProphecies: number;
  voiceWhispersUnlocked: boolean;
  governanceVotingPower: number;
  encounterPriority: boolean;
}

interface AnointerStatus {
  userId: number;
  tier: string;
  anointmentsRemaining: number;
  lastAnointment?: Date;
  totalAnointed: number;
  reputation: number;
}

export class AnointingSystem {
  private anointments: Map<string, AnointmentRecord> = new Map();
  private anointerStatus: Map<number, AnointerStatus> = new Map();
  private monthlyLimits = {
    'oracle': 1,
    'shadow': 3
  };

  constructor() {
    this.initializeAnointingSystem();
  }

  private initializeAnointingSystem() {
    // Initialize sample anointers
    this.anointerStatus.set(1, {
      userId: 1,
      tier: 'oracle',
      anointmentsRemaining: 1,
      totalAnointed: 5,
      reputation: 4.8
    });

    this.anointerStatus.set(2, {
      userId: 2,
      tier: 'shadow',
      anointmentsRemaining: 2,
      totalAnointed: 12,
      reputation: 4.9
    });
  }

  async checkAnointingEligibility(anointerId: number): Promise<{eligible: boolean, reason?: string, remaining?: number}> {
    const anointer = await storage.getUser(anointerId);
    if (!anointer || !['oracle', 'shadow'].includes(anointer.tier)) {
      return { eligible: false, reason: 'Anointing requires Oracle+ tier' };
    }

    const status = this.anointerStatus.get(anointerId);
    if (!status) {
      // Initialize new anointer
      const monthlyLimit = this.monthlyLimits[anointer.tier as keyof typeof this.monthlyLimits] || 0;
      this.anointerStatus.set(anointerId, {
        userId: anointerId,
        tier: anointer.tier,
        anointmentsRemaining: monthlyLimit,
        totalAnointed: 0,
        reputation: 5.0
      });
      return { eligible: true, remaining: monthlyLimit };
    }

    if (status.anointmentsRemaining <= 0) {
      return { 
        eligible: false, 
        reason: 'Monthly anointing limit reached. Resets on the 1st.',
        remaining: 0 
      };
    }

    return { eligible: true, remaining: status.anointmentsRemaining };
  }

  async anointUser(anointerId: number, recipientId: number, sigilType: 'favor' | 'wisdom' | 'power', publicMessage?: string): Promise<AnointmentRecord> {
    if (anointerId === recipientId) {
      throw new Error('Cannot anoint yourself');
    }

    const eligibility = await this.checkAnointingEligibility(anointerId);
    if (!eligibility.eligible) {
      throw new Error(eligibility.reason);
    }

    const anointer = await storage.getUser(anointerId);
    const recipient = await storage.getUser(recipientId);
    
    if (!anointer || !recipient) {
      throw new Error('User not found');
    }

    // Check for recent anointment between these users (prevents spam)
    const recentAnointment = Array.from(this.anointments.values()).find(a => 
      a.anointerId === anointerId && 
      a.recipientId === recipientId && 
      a.createdAt > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
    );

    if (recentAnointment) {
      throw new Error('Can only anoint the same user once per week');
    }

    const benefits = this.calculateAnointmentBenefits(anointer.tier, recipient.tier, sigilType);
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    const anointmentId = `ANOINT_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const anointment: AnointmentRecord = {
      id: anointmentId,
      anointerId,
      recipientId,
      anointerTier: anointer.tier,
      recipientTier: recipient.tier,
      sigilType,
      benefits,
      publicMessage,
      createdAt: new Date(),
      expiresAt,
      active: true
    };

    this.anointments.set(anointmentId, anointment);

    // Update anointer status
    const status = this.anointerStatus.get(anointerId)!;
    status.anointmentsRemaining--;
    status.lastAnointment = new Date();
    status.totalAnointed++;

    // Broadcast the anointing
    this.broadcastAnointing(anointment, anointer, recipient);

    return anointment;
  }

  private calculateAnointmentBenefits(anointerTier: string, recipientTier: string, sigilType: string): AnointmentBenefits {
    const baseBenefits: AnointmentBenefits = {
      freeProphecies: 1,
      voiceWhispersUnlocked: false,
      governanceVotingPower: 1.1,
      encounterPriority: false
    };

    // Oracle anointers provide stronger benefits
    if (anointerTier === 'shadow') {
      baseBenefits.freeProphecies = 2;
      baseBenefits.voiceWhispersUnlocked = true;
      baseBenefits.governanceVotingPower = 1.5;
      baseBenefits.encounterPriority = true;

      // Shadow Key can grant temporary tier access
      if (recipientTier === 'initiate') {
        baseBenefits.temporaryTierBoost = 'herald';
      } else if (recipientTier === 'herald') {
        baseBenefits.temporaryTierBoost = 'oracle';
      }
    }

    // Sigil type modifies benefits
    switch (sigilType) {
      case 'favor':
        baseBenefits.freeProphecies += 1;
        break;
      case 'wisdom':
        baseBenefits.voiceWhispersUnlocked = true;
        break;
      case 'power':
        baseBenefits.governanceVotingPower *= 1.5;
        break;
    }

    return baseBenefits;
  }

  private broadcastAnointing(anointment: AnointmentRecord, anointer: any, recipient: any): void {
    const anointerDisplay = `${anointment.anointerTier.toUpperCase()} ${anointment.anointerId.toString().slice(-3)}`;
    const recipientDisplay = `${anointment.recipientTier.toUpperCase()} ${anointment.recipientId.toString().slice(-3)}`;
    
    const message = anointment.publicMessage || 'deemed worthy of favor';
    const announcement = `${anointerDisplay} blessed ${recipientDisplay} with Sigil of ${anointment.sigilType}: "${message}"`;
    
    console.log(`ANOINTING: ${announcement}`);
    
    // This creates visible hierarchy and social proof
  }

  async getUserAnointments(userId: number): Promise<{received: AnointmentRecord[], given: AnointmentRecord[]}> {
    const now = new Date();
    const allAnointments = Array.from(this.anointments.values());

    const received = allAnointments.filter(a => 
      a.recipientId === userId && 
      a.active && 
      a.expiresAt > now
    );

    const given = allAnointments.filter(a => 
      a.anointerId === userId
    ).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return { received, given };
  }

  async applyAnointmentBenefits(userId: number): Promise<AnointmentBenefits> {
    const { received } = await this.getUserAnointments(userId);
    
    const combinedBenefits: AnointmentBenefits = {
      freeProphecies: 0,
      voiceWhispersUnlocked: false,
      governanceVotingPower: 1.0,
      encounterPriority: false
    };

    received.forEach(anointment => {
      combinedBenefits.freeProphecies += anointment.benefits.freeProphecies;
      combinedBenefits.voiceWhispersUnlocked = combinedBenefits.voiceWhispersUnlocked || anointment.benefits.voiceWhispersUnlocked;
      combinedBenefits.governanceVotingPower *= anointment.benefits.governanceVotingPower;
      combinedBenefits.encounterPriority = combinedBenefits.encounterPriority || anointment.benefits.encounterPriority;
      
      // Apply highest tier boost
      if (anointment.benefits.temporaryTierBoost) {
        combinedBenefits.temporaryTierBoost = anointment.benefits.temporaryTierBoost;
      }
    });

    return combinedBenefits;
  }

  getRecentAnointings(limit: number = 10): AnointmentRecord[] {
    return Array.from(this.anointments.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  getTopAnointers(): AnointerStatus[] {
    return Array.from(this.anointerStatus.values())
      .sort((a, b) => b.totalAnointed - a.totalAnointed)
      .slice(0, 10);
  }

  resetMonthlyLimits(): void {
    // Call this on the 1st of each month
    this.anointerStatus.forEach(status => {
      const monthlyLimit = this.monthlyLimits[status.tier as keyof typeof this.monthlyLimits] || 0;
      status.anointmentsRemaining = monthlyLimit;
    });
  }

  generateAnointingInterface(): string {
    const recentAnointings = this.getRecentAnointings(5);
    const topAnointers = this.getTopAnointers().slice(0, 3);

    return `
    <!DOCTYPE html>
    <html class="dark">
    <head>
      <title>Anointing Chamber - FFC</title>
      <style>
        body {
          background: radial-gradient(circle at center, #0b0b0f, #1a1a2e 60%, #000000 90%);
          color: white;
          font-family: 'Playfair Display', serif;
          padding: 2rem;
          min-height: 100vh;
        }
        .container { max-width: 1000px; margin: 0 auto; }
        .title { font-size: 3rem; margin-bottom: 1rem; color: #8b1e3f; text-align: center; }
        .anointing-card {
          background: rgba(139, 30, 63, 0.1);
          border: 1px solid #8b1e3f;
          border-radius: 12px;
          padding: 2rem;
          margin: 1rem 0;
        }
        .sigil-selector {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
          margin: 1rem 0;
        }
        .sigil-option {
          background: rgba(0,0,0,0.3);
          border: 1px solid #666;
          border-radius: 8px;
          padding: 1rem;
          cursor: pointer;
          text-align: center;
          transition: all 0.3s ease;
        }
        .sigil-option:hover, .sigil-option.selected {
          border-color: #8b1e3f;
          background: rgba(139, 30, 63, 0.2);
        }
        .anointing-feed {
          background: rgba(0,0,0,0.3);
          border-radius: 8px;
          padding: 1.5rem;
          margin: 2rem 0;
        }
        .anointing-item {
          border-bottom: 1px solid rgba(139, 30, 63, 0.3);
          padding: 1rem 0;
        }
        .anointing-item:last-child { border-bottom: none; }
        .priest-badge {
          background: linear-gradient(to right, #8b1e3f, #5e3d75);
          padding: 0.25rem 0.75rem;
          border-radius: 16px;
          font-size: 0.8rem;
          display: inline-block;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1 class="title">The Anointing Chamber</h1>
        <div style="text-align: center; color: #999; margin-bottom: 3rem;">
          Where Oracle+ members become priests. Where favor flows horizontally.
        </div>
        
        <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 2rem;">
          <div class="anointing-card">
            <h3>Anoint Another Member</h3>
            <p style="color: #999; margin-bottom: 1.5rem;">
              Grant temporary power to those you deem worthy. Oracle+ only. 1-3 anointments per month.
            </p>
            
            <div style="margin: 1rem 0;">
              <label style="display: block; margin-bottom: 0.5rem;">Recipient User ID</label>
              <input type="number" placeholder="Enter user ID" style="
                width: 100%;
                background: rgba(0,0,0,0.3);
                border: 1px solid #666;
                border-radius: 4px;
                padding: 0.5rem;
                color: white;
              ">
            </div>
            
            <div style="margin: 1rem 0;">
              <label style="display: block; margin-bottom: 0.5rem;">Choose Sigil Type</label>
              <div class="sigil-selector">
                <div class="sigil-option selected">
                  <div style="font-size: 1.5rem; margin-bottom: 0.5rem;">⭘</div>
                  <div><strong>Favor</strong></div>
                  <div style="font-size: 0.8rem; color: #999;">+1 Free Prophecy</div>
                </div>
                <div class="sigil-option">
                  <div style="font-size: 1.5rem; margin-bottom: 0.5rem;">◉</div>
                  <div><strong>Wisdom</strong></div>
                  <div style="font-size: 0.8rem; color: #999;">Voice Whispers</div>
                </div>
                <div class="sigil-option">
                  <div style="font-size: 1.5rem; margin-bottom: 0.5rem;">𓂀</div>
                  <div><strong>Power</strong></div>
                  <div style="font-size: 0.8rem; color: #999;">+50% Vote Weight</div>
                </div>
              </div>
            </div>
            
            <div style="margin: 1rem 0;">
              <label style="display: block; margin-bottom: 0.5rem;">Public Message (Optional)</label>
              <textarea placeholder="Why you chose to anoint them..." style="
                width: 100%;
                background: rgba(0,0,0,0.3);
                border: 1px solid #666;
                border-radius: 4px;
                padding: 0.5rem;
                color: white;
                min-height: 60px;
                resize: vertical;
              "></textarea>
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
              Bestow Anointing (1/1 remaining)
            </button>
          </div>
          
          <div>
            <div class="anointing-card">
              <h4>High Priests</h4>
              ${topAnointers.map(priest => `
                <div style="display: flex; justify-content: space-between; align-items: center; margin: 0.5rem 0;">
                  <div>
                    <span class="priest-badge">${priest.tier.toUpperCase()} ${priest.userId.toString().slice(-3)}</span>
                  </div>
                  <div style="text-align: right;">
                    <div style="font-size: 0.9rem;">${priest.totalAnointed} anointed</div>
                    <div style="font-size: 0.8rem; color: #8b1e3f;">★ ${priest.reputation}</div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
        
        <div class="anointing-feed">
          <h3 style="margin-bottom: 1rem;">Recent Anointings</h3>
          ${recentAnointings.map(anointment => {
            const anointerDisplay = `${anointment.anointerTier.toUpperCase()} ${anointment.anointerId.toString().slice(-3)}`;
            const recipientDisplay = `${anointment.recipientTier.toUpperCase()} ${anointment.recipientId.toString().slice(-3)}`;
            const timeAgo = Math.floor((Date.now() - anointment.createdAt.getTime()) / (1000 * 60 * 60));
            
            return `
              <div class="anointing-item">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <div>
                    <strong>${anointerDisplay}</strong> blessed <strong>${recipientDisplay}</strong> 
                    with Sigil of ${anointment.sigilType}
                    ${anointment.publicMessage ? `<br><em style="color: #999; font-size: 0.9rem;">"${anointment.publicMessage}"</em>` : ''}
                  </div>
                  <div style="color: #666; font-size: 0.8rem;">
                    ${timeAgo}h ago
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
        
        <div style="text-align: center; margin-top: 3rem; color: #666;">
          <p>Anointments grant temporary benefits for 30 days. Choose wisely.</p>
          <p>Your reputation as a priest grows with each meaningful anointing.</p>
        </div>
      </div>
    </body>
    </html>`;
  }
}

export const anointingSystem = new AnointingSystem();