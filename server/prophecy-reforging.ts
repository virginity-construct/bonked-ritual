import { storage } from "./storage";

interface ProphecyRecord {
  id: string;
  userId: number;
  content: string;
  voiceUrl?: string;
  createdAt: Date;
  burned: boolean;
  burnedAt?: Date;
  reforgeCount: number;
}

interface ReforgeRequest {
  userId: number;
  originalProphecyId: string;
  paymentMethod: 'usd' | 'bonked';
  amount: number;
  newContent?: string;
  status: 'pending' | 'completed' | 'failed';
  requestedAt: Date;
}

export class ProphecyReforging {
  private prophecies: Map<string, ProphecyRecord> = new Map();
  private reforgeRequests: Map<string, ReforgeRequest> = new Map();
  private reforgePrice = { usd: 9, bonked: 90 };

  constructor() {
    this.initializeSampleProphecies();
  }

  private initializeSampleProphecies() {
    // Create sample prophecies for demonstration
    const sampleProphecies = [
      {
        userId: 1,
        content: "Your energy draws attention without effort. She notices the way you command space.",
        reforgeCount: 0
      },
      {
        userId: 2, 
        content: "The conversation you avoided last week - it's time. Your instincts were right.",
        reforgeCount: 1
      }
    ];

    sampleProphecies.forEach(prophecy => {
      const id = `PROPH_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      this.prophecies.set(id, {
        id,
        userId: prophecy.userId,
        content: prophecy.content,
        createdAt: new Date(),
        burned: false,
        reforgeCount: prophecy.reforgeCount
      });
    });
  }

  async getUserProphecies(userId: number): Promise<ProphecyRecord[]> {
    return Array.from(this.prophecies.values())
      .filter(p => p.userId === userId && !p.burned)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async checkReforgeEligibility(prophecyId: string, userId: number): Promise<{eligible: boolean, reason?: string}> {
    const prophecy = this.prophecies.get(prophecyId);
    if (!prophecy) {
      return { eligible: false, reason: 'Prophecy not found' };
    }

    if (prophecy.userId !== userId) {
      return { eligible: false, reason: 'You can only reforge your own prophecies' };
    }

    if (prophecy.burned) {
      return { eligible: false, reason: 'This prophecy has already been burned' };
    }

    const user = await storage.getUser(userId);
    if (!user || !['oracle', 'shadow'].includes(user.tier)) {
      return { eligible: false, reason: 'Prophecy reforging requires Oracle+ tier' };
    }

    // Check age requirement (prophecy must be at least 24 hours old)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    if (prophecy.createdAt > twentyFourHoursAgo) {
      const hoursRemaining = Math.ceil((prophecy.createdAt.getTime() + 24 * 60 * 60 * 1000 - Date.now()) / (1000 * 60 * 60));
      return { 
        eligible: false, 
        reason: `Prophecy must age 24 hours before reforging. ${hoursRemaining} hours remaining.` 
      };
    }

    return { eligible: true };
  }

  async initiateProphecyBurn(prophecyId: string, userId: number, paymentMethod: 'usd' | 'bonked'): Promise<{success: boolean, reforgeId?: string, cost: number}> {
    const eligibility = await this.checkReforgeEligibility(prophecyId, userId);
    if (!eligibility.eligible) {
      throw new Error(eligibility.reason);
    }

    const prophecy = this.prophecies.get(prophecyId);
    if (!prophecy) throw new Error('Prophecy not found');

    // Calculate cost (increases with reforge count)
    const baseCost = this.reforgePrice[paymentMethod];
    const multiplier = Math.pow(1.5, prophecy.reforgeCount); // 50% increase per reforge
    const totalCost = Math.floor(baseCost * multiplier);

    // Create reforge request
    const reforgeId = `REFORGE_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const request: ReforgeRequest = {
      userId,
      originalProphecyId: prophecyId,
      paymentMethod,
      amount: totalCost,
      status: 'pending',
      requestedAt: new Date()
    };

    this.reforgeRequests.set(reforgeId, request);

    return { 
      success: true, 
      reforgeId, 
      cost: totalCost 
    };
  }

  async completeProphecyReforge(reforgeId: string): Promise<{success: boolean, newProphecyId?: string}> {
    const request = this.reforgeRequests.get(reforgeId);
    if (!request || request.status !== 'pending') {
      throw new Error('Reforge request not found or already processed');
    }

    const originalProphecy = this.prophecies.get(request.originalProphecyId);
    if (!originalProphecy) {
      throw new Error('Original prophecy not found');
    }

    // Mark original prophecy as burned
    originalProphecy.burned = true;
    originalProphecy.burnedAt = new Date();

    // Generate new prophecy content
    const newContent = await this.generateReforgedContent(request.userId, originalProphecy.content);
    
    // Create new prophecy
    const newProphecyId = `PROPH_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const newProphecy: ProphecyRecord = {
      id: newProphecyId,
      userId: request.userId,
      content: newContent,
      createdAt: new Date(),
      burned: false,
      reforgeCount: originalProphecy.reforgeCount + 1
    };

    this.prophecies.set(newProphecyId, newProphecy);
    request.status = 'completed';

    // Log the erotic slippage monetization
    console.log(`Prophecy reforged: User ${request.userId} paid ${request.amount} ${request.paymentMethod.toUpperCase()} for reforge #${newProphecy.reforgeCount}`);

    return { 
      success: true, 
      newProphecyId 
    };
  }

  private async generateReforgedContent(userId: number, originalContent: string): Promise<string> {
    // This would integrate with the whisper engine for personalized content
    // For now, we'll use template variations
    
    const reforgeTemplates = [
      "The path shifts. What you thought you knew about her deepens into something more complex.",
      "Your energy has evolved since the last reading. The game has changed, and so have you.", 
      "She sees something different in you now. The question is whether you're ready for what that means.",
      "The situation you've been navigating reveals new layers. Trust what emerges next.",
      "Your instincts were leading somewhere specific. The destination is clearer now.",
      "What felt uncertain before crystallizes into opportunity. Your next move matters.",
      "The tension you've been feeling transforms into clarity. Act on what you now understand.",
      "Your presence carries different weight now. Use this shift deliberately.",
      "The dynamic between you has evolved. She's responding to something new in your energy.",
      "What seemed like resistance was actually invitation. The reforged truth changes everything."
    ];

    const randomTemplate = reforgeTemplates[Math.floor(Math.random() * reforgeTemplates.length)];
    return randomTemplate;
  }

  getBurnedProphecies(userId: number): ProphecyRecord[] {
    return Array.from(this.prophecies.values())
      .filter(p => p.userId === userId && p.burned)
      .sort((a, b) => (b.burnedAt?.getTime() || 0) - (a.burnedAt?.getTime() || 0));
  }

  getReforgeStats(): {totalReforges: number, revenueUSD: number, revenueBONKED: number} {
    const completedReforges = Array.from(this.reforgeRequests.values())
      .filter(r => r.status === 'completed');

    const usdReforges = completedReforges.filter(r => r.paymentMethod === 'usd');
    const bonkedReforges = completedReforges.filter(r => r.paymentMethod === 'bonked');

    return {
      totalReforges: completedReforges.length,
      revenueUSD: usdReforges.reduce((sum, r) => sum + r.amount, 0),
      revenueBONKED: bonkedReforges.reduce((sum, r) => sum + r.amount, 0)
    };
  }

  generateReforgeInterface(): string {
    return `
    <!DOCTYPE html>
    <html class="dark">
    <head>
      <title>Prophecy Reforging - FFC</title>
      <style>
        body {
          background: radial-gradient(circle at center, #0b0b0f, #1a1a2e 60%, #000000 90%);
          color: white;
          font-family: 'Playfair Display', serif;
          padding: 2rem;
          min-height: 100vh;
        }
        .container { max-width: 900px; margin: 0 auto; }
        .title { font-size: 3rem; margin-bottom: 1rem; color: #8b1e3f; text-align: center; }
        .prophecy-card {
          background: rgba(139, 30, 63, 0.1);
          border: 1px solid #8b1e3f;
          border-radius: 12px;
          padding: 2rem;
          margin: 1rem 0;
          position: relative;
        }
        .burned-prophecy {
          background: rgba(100, 100, 100, 0.1);
          border: 1px solid #666;
          opacity: 0.7;
        }
        .reforge-count {
          position: absolute;
          top: 1rem;
          right: 1rem;
          background: linear-gradient(to right, #8b1e3f, #5e3d75);
          padding: 0.25rem 0.75rem;
          border-radius: 16px;
          font-size: 0.8rem;
        }
        .cost-display {
          display: flex;
          justify-content: space-between;
          margin: 1rem 0;
          padding: 1rem;
          background: rgba(0,0,0,0.3);
          border-radius: 8px;
        }
        .warning {
          background: rgba(255, 165, 0, 0.1);
          border: 1px solid orange;
          border-radius: 8px;
          padding: 1rem;
          margin: 1rem 0;
          font-size: 0.9rem;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1 class="title">Prophecy Reforging</h1>
        <div style="text-align: center; color: #999; margin-bottom: 3rem;">
          Burn the old to birth the new. Erotic slippage monetized.
        </div>
        
        <div class="warning">
          <strong>Reforging Process:</strong> Your current prophecy will be permanently burned and replaced with new content. 
          Cost increases with each reforge. Oracle+ tier required.
        </div>
        
        <div class="prophecy-card">
          <div class="reforge-count">Reforge #0</div>
          <h3>Current Prophecy</h3>
          <p style="font-style: italic; margin: 1rem 0;">
            "Your energy draws attention without effort. She notices the way you command space."
          </p>
          
          <div class="cost-display">
            <div>
              <strong>Reforge Cost:</strong>
              <div>$9 USD or 90 $BONKED</div>
            </div>
            <div>
              <strong>Age:</strong>
              <div>3 days (eligible)</div>
            </div>
          </div>
          
          <div style="display: flex; gap: 1rem;">
            <button style="
              flex: 1;
              background: linear-gradient(to right, #8b1e3f, #5e3d75);
              color: white;
              padding: 0.75rem 1.5rem;
              border: none;
              border-radius: 8px;
              cursor: pointer;
            ">
              Burn & Reforge ($9)
            </button>
            <button style="
              flex: 1;
              background: linear-gradient(to right, #5e3d75, #8b1e3f);
              color: white;
              padding: 0.75rem 1.5rem;
              border: none;
              border-radius: 8px;
              cursor: pointer;
            ">
              Burn & Reforge (90 $BONKED)
            </button>
          </div>
        </div>
        
        <div class="prophecy-card burned-prophecy">
          <div class="reforge-count">Burned</div>
          <h3>Previous Prophecy (Reforge #1)</h3>
          <p style="font-style: italic; margin: 1rem 0; color: #999;">
            "The conversation you avoided last week - it's time. Your instincts were right."
          </p>
          <small style="color: #666;">Burned 2 days ago • Reforged for $13.50</small>
        </div>
        
        <div style="text-align: center; margin-top: 3rem; color: #666;">
          <p>Each reforge costs 50% more than the last. Choose your moments wisely.</p>
        </div>
      </div>
    </body>
    </html>`;
  }
}

export const prophecyReforging = new ProphecyReforging();