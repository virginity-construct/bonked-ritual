import { storage } from "./storage";

interface EncounterProvider {
  id: string;
  name: string;
  location: string;
  tier: string;
  verified: boolean;
  rating: number;
  specialties: string[];
  availability: 'available' | 'busy' | 'exclusive';
  price: number;
  currency: 'USD' | 'BONKED';
}

interface EncounterRequest {
  userId: number;
  providerId: string;
  requestType: 'consultation' | 'encounter' | 'extended';
  preferredDate: Date;
  location: string;
  specialRequests?: string;
  status: 'pending' | 'approved' | 'declined' | 'completed';
  verificationCode?: string;
}

export class VeiledEncounters {
  private providers: Map<string, EncounterProvider> = new Map();
  private requests: Map<string, EncounterRequest> = new Map();

  constructor() {
    this.initializeProviderNetwork();
  }

  private initializeProviderNetwork() {
    // Initialize verified provider network
    const providers: EncounterProvider[] = [
      {
        id: 'VE_001',
        name: 'Luna Mystique',
        location: 'Manhattan, NYC',
        tier: 'shadow',
        verified: true,
        rating: 4.9,
        specialties: ['spiritual guidance', 'energy work', 'intimate conversation'],
        availability: 'exclusive',
        price: 500,
        currency: 'USD'
      },
      {
        id: 'VE_002', 
        name: 'Serena Noir',
        location: 'Beverly Hills, LA',
        tier: 'oracle',
        verified: true,
        rating: 4.8,
        specialties: ['lifestyle coaching', 'social dynamics', 'aesthetic consultation'],
        availability: 'available',
        price: 2500,
        currency: 'BONKED'
      }
    ];

    providers.forEach(provider => {
      this.providers.set(provider.id, provider);
    });
  }

  async checkEncounterEligibility(userId: number): Promise<{eligible: boolean, tier: string, reason?: string}> {
    const user = await storage.getUser(userId);
    if (!user) {
      return { eligible: false, tier: '', reason: 'User not found' };
    }

    // Veiled Encounters requires Oracle+ tier and 3+ months membership
    if (!['oracle', 'shadow'].includes(user.tier)) {
      return { 
        eligible: false, 
        tier: user.tier, 
        reason: 'Veiled Encounters requires Oracle+ tier minimum' 
      };
    }

    const membershipStart = user.createdAt || new Date();
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    if (membershipStart > threeMonthsAgo) {
      return { 
        eligible: false, 
        tier: user.tier, 
        reason: '3 months minimum membership required for Veiled Encounters' 
      };
    }

    return { eligible: true, tier: user.tier };
  }

  getAvailableProviders(userTier: string): EncounterProvider[] {
    const tierHierarchy = ['initiate', 'herald', 'oracle', 'shadow'];
    const userTierIndex = tierHierarchy.indexOf(userTier);
    
    return Array.from(this.providers.values()).filter(provider => {
      const providerTierIndex = tierHierarchy.indexOf(provider.tier);
      return userTierIndex >= providerTierIndex;
    });
  }

  async requestEncounter(userId: number, providerId: string, details: Omit<EncounterRequest, 'userId' | 'providerId' | 'status'>): Promise<string> {
    const eligibility = await this.checkEncounterEligibility(userId);
    if (!eligibility.eligible) {
      throw new Error(eligibility.reason);
    }

    const provider = this.providers.get(providerId);
    if (!provider) {
      throw new Error('Provider not found');
    }

    const requestId = `REQ_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const verificationCode = this.generateVerificationCode();

    const request: EncounterRequest = {
      ...details,
      userId,
      providerId,
      status: 'pending',
      verificationCode
    };

    this.requests.set(requestId, request);

    // In production, this would trigger notification to provider
    console.log(`Encounter request ${requestId} submitted for provider ${provider.name}`);

    return requestId;
  }

  private generateVerificationCode(): string {
    return Math.random().toString(36).substr(2, 8).toUpperCase();
  }

  async approveRequest(requestId: string, providerNotes?: string): Promise<boolean> {
    const request = this.requests.get(requestId);
    if (!request) return false;

    request.status = 'approved';
    
    // Send encrypted meeting details to both parties
    await this.sendEncounterDetails(request);

    return true;
  }

  private async sendEncounterDetails(request: EncounterRequest): Promise<void> {
    const provider = this.providers.get(request.providerId);
    const user = await storage.getUser(request.userId);

    if (!provider || !user) return;

    // In production, send encrypted details via secure channel
    console.log(`Encounter details sent for request ${request.verificationCode}`);
  }

  generateEncounterInterface(): string {
    return `
    <!DOCTYPE html>
    <html class="dark">
    <head>
      <title>Veiled Encounters - FFC</title>
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
        .subtitle { text-align: center; color: #999; margin-bottom: 3rem; }
        .provider-card {
          background: rgba(139, 30, 63, 0.1);
          border: 1px solid #8b1e3f;
          border-radius: 12px;
          padding: 2rem;
          margin: 1rem 0;
          transition: all 0.3s ease;
        }
        .provider-card:hover {
          box-shadow: 0 0 20px rgba(139, 30, 63, 0.3);
          transform: translateY(-2px);
        }
        .tier-badge {
          background: linear-gradient(to right, #8b1e3f, #5e3d75);
          padding: 0.25rem 0.75rem;
          border-radius: 16px;
          font-size: 0.8rem;
          display: inline-block;
          margin-bottom: 1rem;
        }
        .warning {
          background: rgba(255, 165, 0, 0.1);
          border: 1px solid orange;
          border-radius: 8px;
          padding: 1rem;
          margin: 2rem 0;
          text-align: center;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1 class="title">Veiled Encounters</h1>
        <div class="subtitle">Where digital connection becomes tangible reality</div>
        
        <div class="warning">
          <strong>Oracle+ Tier Required</strong><br>
          Veiled Encounters is available exclusively to verified Oracle and Shadow Key members with 3+ months membership.
          All interactions are consensual, professional, and conducted through our secure verification system.
        </div>

        <div class="provider-card">
          <div class="tier-badge">Shadow Tier Exclusive</div>
          <h3>Luna Mystique</h3>
          <p><strong>Location:</strong> Manhattan, NYC</p>
          <p><strong>Specialties:</strong> Spiritual guidance, energy work, intimate conversation</p>
          <p><strong>Availability:</strong> By invitation only</p>
          <p><strong>Investment:</strong> $500 consultation</p>
          <button style="background: linear-gradient(to right, #8b1e3f, #5e3d75); color: white; padding: 0.75rem 1.5rem; border: none; border-radius: 8px; cursor: pointer; margin-top: 1rem;">
            Request Consultation
          </button>
        </div>

        <div class="provider-card">
          <div class="tier-badge">Oracle+ Access</div>
          <h3>Serena Noir</h3>
          <p><strong>Location:</strong> Beverly Hills, LA</p>
          <p><strong>Specialties:</strong> Lifestyle coaching, social dynamics, aesthetic consultation</p>
          <p><strong>Availability:</strong> Available</p>
          <p><strong>Investment:</strong> 2,500 $BONKED tokens</p>
          <button style="background: linear-gradient(to right, #8b1e3f, #5e3d75); color: white; padding: 0.75rem 1.5rem; border: none; border-radius: 8px; cursor: pointer; margin-top: 1rem;">
            Request Consultation
          </button>
        </div>

        <div style="text-align: center; margin-top: 3rem; color: #666;">
          <p>All encounters are professionally facilitated and subject to verification.</p>
          <p>Discretion guaranteed. Trust verified. Experience elevated.</p>
        </div>
      </div>
    </body>
    </html>`;
  }

  getRequestStatus(requestId: string): EncounterRequest | null {
    return this.requests.get(requestId) || null;
  }

  async completeEncounter(requestId: string, feedback: string): Promise<boolean> {
    const request = this.requests.get(requestId);
    if (!request || request.status !== 'approved') return false;

    request.status = 'completed';
    
    // Award completion bonus in $BONKED tokens
    await this.awardCompletionBonus(request.userId);

    return true;
  }

  private async awardCompletionBonus(userId: number): Promise<void> {
    // Award 1000 $BONKED tokens for completed encounter
    console.log(`Awarded 1000 $BONKED completion bonus to user ${userId}`);
  }
}

export const veiledEncounters = new VeiledEncounters();