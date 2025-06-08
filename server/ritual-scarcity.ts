import { storage } from "./storage";

interface ScarcityProposal {
  id: string;
  type: 'oracle_exclusive' | 'whisper_quorum' | 'shadow_only';
  title: string;
  description: string;
  stakingWindow: number; // hours
  minimumQuorum: number;
  timeDecay: boolean;
  eligibleVoters: number[];
  whisperTrigger?: number;
  status: 'active' | 'quorum_failed' | 'passed' | 'expired';
  createdAt: Date;
  expiresAt: Date;
}

interface StakingActivity {
  userId: number;
  amount: number;
  timestamp: Date;
  tier: string;
}

export class RitualScarcity {
  private recentStaking: StakingActivity[] = [];
  private scarcityProposals: Map<string, ScarcityProposal> = new Map();

  constructor() {
    this.initializeScarcityMechanics();
  }

  private initializeScarcityMechanics() {
    // Create ritual scarcity proposals
    this.createScarcityProposal({
      type: 'oracle_exclusive',
      title: 'Exclusive Dominant Energy Oracle Session',
      description: 'Only Oracle+ members who staked in the last 168 hours may participate. Whispers will be particularly intimate.',
      stakingWindow: 168, // 7 days
      minimumQuorum: 5,
      timeDecay: true,
      whisperTrigger: 7
    });

    this.createScarcityProposal({
      type: 'whisper_quorum', 
      title: 'Sacred Voice Whisper Recording',
      description: 'Voice whispers are only recorded if 9 or more Oracle+ members vote in favor. Each whisper costs 1 vote.',
      stakingWindow: 72, // 3 days
      minimumQuorum: 9,
      timeDecay: false,
      whisperTrigger: 9
    });
  }

  async recordStakingActivity(userId: number, amount: number): Promise<void> {
    const user = await storage.getUser(userId);
    if (!user) return;

    const activity: StakingActivity = {
      userId,
      amount,
      timestamp: new Date(),
      tier: user.tier
    };

    this.recentStaking.push(activity);
    
    // Clean old activities (keep only last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    this.recentStaking = this.recentStaking.filter(a => a.timestamp > thirtyDaysAgo);
  }

  private createScarcityProposal(proposal: Omit<ScarcityProposal, 'id' | 'eligibleVoters' | 'status' | 'createdAt' | 'expiresAt'>): string {
    const id = `SCARCITY_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const createdAt = new Date();
    const expiresAt = new Date(createdAt.getTime() + proposal.stakingWindow * 60 * 60 * 1000);

    const scarcityProposal: ScarcityProposal = {
      ...proposal,
      id,
      eligibleVoters: [],
      status: 'active',
      createdAt,
      expiresAt
    };

    this.scarcityProposals.set(id, scarcityProposal);
    return id;
  }

  async checkVotingEligibility(proposalId: string, userId: number): Promise<{eligible: boolean, reason?: string}> {
    const proposal = this.scarcityProposals.get(proposalId);
    if (!proposal) {
      return { eligible: false, reason: 'Proposal not found' };
    }

    if (proposal.status !== 'active' || new Date() > proposal.expiresAt) {
      return { eligible: false, reason: 'Voting window has expired' };
    }

    const user = await storage.getUser(userId);
    if (!user || !['oracle', 'shadow'].includes(user.tier)) {
      return { eligible: false, reason: 'Oracle+ tier required for ritual voting' };
    }

    // Check if user staked within the window
    const windowStart = new Date(Date.now() - proposal.stakingWindow * 60 * 60 * 1000);
    const hasRecentStaking = this.recentStaking.some(activity => 
      activity.userId === userId && 
      activity.timestamp > windowStart &&
      ['oracle', 'shadow'].includes(activity.tier)
    );

    if (!hasRecentStaking) {
      const hoursRemaining = Math.ceil(proposal.stakingWindow / 24);
      return { 
        eligible: false, 
        reason: `Must stake within last ${hoursRemaining} days to participate in ritual voting` 
      };
    }

    return { eligible: true };
  }

  async voteOnScarcityProposal(proposalId: string, userId: number): Promise<{success: boolean, quorumStatus: string}> {
    const eligibility = await this.checkVotingEligibility(proposalId, userId);
    if (!eligibility.eligible) {
      throw new Error(eligibility.reason);
    }

    const proposal = this.scarcityProposals.get(proposalId);
    if (!proposal) throw new Error('Proposal not found');

    if (!proposal.eligibleVoters.includes(userId)) {
      proposal.eligibleVoters.push(userId);
    }

    const currentVotes = proposal.eligibleVoters.length;
    let quorumStatus = '';

    if (currentVotes >= proposal.minimumQuorum) {
      proposal.status = 'passed';
      quorumStatus = `Quorum reached! ${currentVotes}/${proposal.minimumQuorum} ritual votes secured.`;
      
      if (proposal.whisperTrigger && currentVotes >= proposal.whisperTrigger) {
        await this.triggerRitualWhisper(proposal);
      }
    } else {
      const needed = proposal.minimumQuorum - currentVotes;
      quorumStatus = `${currentVotes}/${proposal.minimumQuorum} votes. ${needed} more needed for ritual activation.`;
    }

    return { success: true, quorumStatus };
  }

  private async triggerRitualWhisper(proposal: ScarcityProposal): Promise<void> {
    // Award exclusive ritual whisper to all participants
    for (const userId of proposal.eligibleVoters) {
      console.log(`Ritual whisper triggered for user ${userId} via proposal ${proposal.id}`);
      // In production, this would generate exclusive content
    }
  }

  getActiveScarcityProposals(): ScarcityProposal[] {
    const now = new Date();
    return Array.from(this.scarcityProposals.values())
      .filter(p => p.status === 'active' && p.expiresAt > now);
  }

  generateScarcityInterface(): string {
    const activeProposals = this.getActiveScarcityProposals();
    
    return `
    <!DOCTYPE html>
    <html class="dark">
    <head>
      <title>Ritual Scarcity - FFC</title>
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
        .ritual-card {
          background: rgba(139, 30, 63, 0.1);
          border: 1px solid #8b1e3f;
          border-radius: 12px;
          padding: 2rem;
          margin: 1rem 0;
          position: relative;
        }
        .scarcity-badge {
          position: absolute;
          top: 1rem;
          right: 1rem;
          background: linear-gradient(to right, #8b1e3f, #5e3d75);
          padding: 0.25rem 0.75rem;
          border-radius: 16px;
          font-size: 0.8rem;
        }
        .quorum-progress {
          background: rgba(0,0,0,0.3);
          border-radius: 8px;
          height: 8px;
          margin: 1rem 0;
          overflow: hidden;
        }
        .quorum-fill {
          background: linear-gradient(to right, #8b1e3f, #5e3d75);
          height: 100%;
          transition: width 0.3s ease;
        }
        .time-decay {
          color: #ff6b6b;
          font-size: 0.9rem;
          font-style: italic;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1 class="title">Ritual Scarcity</h1>
        <div style="text-align: center; color: #999; margin-bottom: 3rem;">
          Where exclusivity meets desire. Only the chosen may participate.
        </div>
        
        ${activeProposals.map(proposal => `
          <div class="ritual-card">
            <div class="scarcity-badge">${proposal.type.replace('_', ' ').toUpperCase()}</div>
            <h3>${proposal.title}</h3>
            <p>${proposal.description}</p>
            
            <div class="quorum-progress">
              <div class="quorum-fill" style="width: ${(proposal.eligibleVoters.length / proposal.minimumQuorum) * 100}%"></div>
            </div>
            
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 1rem;">
              <span>${proposal.eligibleVoters.length}/${proposal.minimumQuorum} ritual votes</span>
              ${proposal.timeDecay ? '<span class="time-decay">Time decay active</span>' : ''}
            </div>
            
            <button style="
              background: linear-gradient(to right, #8b1e3f, #5e3d75);
              color: white;
              padding: 0.75rem 1.5rem;
              border: none;
              border-radius: 8px;
              cursor: pointer;
              margin-top: 1rem;
              width: 100%;
            ">
              Cast Ritual Vote
            </button>
          </div>
        `).join('')}
        
        <div style="text-align: center; margin-top: 3rem; color: #666;">
          <p>Ritual voting requires recent staking activity and Oracle+ tier.</p>
          <p>Some whispers only emerge when the collective will is strong enough.</p>
        </div>
      </div>
    </body>
    </html>`;
  }
}

export const ritualScarcity = new RitualScarcity();