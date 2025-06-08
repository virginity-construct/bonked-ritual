import { storage } from "./storage";

interface GovernanceProposal {
  id: string;
  type: 'prophecy_prompt' | 'merch_design' | 'girl_announcement' | 'feature_request';
  title: string;
  description: string;
  proposer: number;
  stakingRequirement: number;
  votingPower: Record<string, number>;
  status: 'active' | 'passed' | 'rejected' | 'executed';
  votes: Record<number, {power: number, choice: 'yes' | 'no'}>;
  createdAt: Date;
  executionDate?: Date;
}

interface StakingPosition {
  userId: number;
  stakedAmount: number;
  tier: string;
  stakingDate: Date;
  votingPower: number;
  rewardsEarned: number;
}

export class BonkedGovernance {
  private proposals: Map<string, GovernanceProposal> = new Map();
  private stakingPositions: Map<number, StakingPosition> = new Map();

  constructor() {
    this.initializeGovernanceSystem();
  }

  private initializeGovernanceSystem() {
    // Initialize with sample governance proposals
    this.createProposal({
      type: 'prophecy_prompt',
      title: 'Erotic Oracle: Dominant Energy Themes',
      description: 'Should the Oracle focus more on dominant masculine energy readings for Q2?',
      proposer: 1,
      stakingRequirement: 10000
    });

    this.createProposal({
      type: 'girl_announcement',
      title: 'New Content Creator: Luna Mystique',
      description: 'Exclusive early access to Luna\'s private content for Shadow Key holders?',
      proposer: 2,
      stakingRequirement: 25000
    });
  }

  async stake(userId: number, amount: number): Promise<StakingPosition> {
    const user = await storage.getUser(userId);
    if (!user) throw new Error('User not found');

    const votingPower = this.calculateVotingPower(amount, user.tier);
    const position: StakingPosition = {
      userId,
      stakedAmount: amount,
      tier: user.tier,
      stakingDate: new Date(),
      votingPower,
      rewardsEarned: 0
    };

    this.stakingPositions.set(userId, position);
    return position;
  }

  private calculateVotingPower(stakedAmount: number, tier: string): number {
    const tierMultipliers = {
      'shadow': 2.0,    // Shadow Key holders get 2x voting power
      'oracle': 1.5,    // Oracle holders get 1.5x
      'herald': 1.2,    // Herald holders get 1.2x
      'initiate': 1.0   // Base voting power
    };

    const multiplier = tierMultipliers[tier as keyof typeof tierMultipliers] || 1.0;
    return Math.floor(stakedAmount * multiplier);
  }

  createProposal(proposal: Omit<GovernanceProposal, 'id' | 'votes' | 'createdAt' | 'status'>): string {
    const id = `PROP_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    
    const newProposal: GovernanceProposal = {
      ...proposal,
      id,
      status: 'active',
      votes: {},
      votingPower: {
        'shadow': 2.0,
        'oracle': 1.5,
        'herald': 1.2,
        'initiate': 1.0
      },
      createdAt: new Date()
    };

    this.proposals.set(id, newProposal);
    return id;
  }

  async vote(proposalId: string, userId: number, choice: 'yes' | 'no'): Promise<boolean> {
    const proposal = this.proposals.get(proposalId);
    if (!proposal || proposal.status !== 'active') {
      throw new Error('Proposal not found or voting closed');
    }

    const stakingPosition = this.stakingPositions.get(userId);
    if (!stakingPosition) {
      throw new Error('Must stake $BONKED tokens to vote');
    }

    if (stakingPosition.stakedAmount < proposal.stakingRequirement) {
      throw new Error(`Minimum ${proposal.stakingRequirement} $BONKED required to vote on this proposal`);
    }

    proposal.votes[userId] = {
      power: stakingPosition.votingPower,
      choice
    };

    // Award governance participation rewards
    this.awardGovernanceRewards(userId, 100);

    return true;
  }

  private awardGovernanceRewards(userId: number, amount: number) {
    const position = this.stakingPositions.get(userId);
    if (position) {
      position.rewardsEarned += amount;
    }
  }

  getActiveProposals(): GovernanceProposal[] {
    return Array.from(this.proposals.values()).filter(p => p.status === 'active');
  }

  getProposalResults(proposalId: string): {yes: number, no: number, total: number} {
    const proposal = this.proposals.get(proposalId);
    if (!proposal) throw new Error('Proposal not found');

    let yesVotes = 0;
    let noVotes = 0;

    Object.values(proposal.votes).forEach(vote => {
      if (vote.choice === 'yes') {
        yesVotes += vote.power;
      } else {
        noVotes += vote.power;
      }
    });

    return {
      yes: yesVotes,
      no: noVotes,
      total: yesVotes + noVotes
    };
  }

  executeProposal(proposalId: string): {executed: boolean, result: string} {
    const proposal = this.proposals.get(proposalId);
    if (!proposal) throw new Error('Proposal not found');

    const results = this.getProposalResults(proposalId);
    const passed = results.yes > results.no && results.total > 0;

    proposal.status = passed ? 'passed' : 'rejected';
    proposal.executionDate = new Date();

    let result = '';
    if (passed) {
      switch (proposal.type) {
        case 'prophecy_prompt':
          result = 'Oracle prophecy themes updated. New content will reflect community preferences.';
          break;
        case 'girl_announcement':
          result = 'Early access granted to Shadow Key holders. Notifications sent.';
          break;
        case 'merch_design':
          result = 'Merch design approved. Production scheduled for next quarter.';
          break;
        case 'feature_request':
          result = 'Feature approved for development roadmap.';
          break;
      }
    } else {
      result = 'Proposal rejected by community vote.';
    }

    return { executed: passed, result };
  }

  getStakingRewards(userId: number): {apy: number, earned: number, claimable: number} {
    const position = this.stakingPositions.get(userId);
    if (!position) return { apy: 0, earned: 0, claimable: 0 };

    const user = this.stakingPositions.get(userId);
    if (!user) return { apy: 0, earned: 0, claimable: 0 };

    const tierAPYs = {
      'shadow': 15,
      'oracle': 12,
      'herald': 8,
      'initiate': 5
    };

    const apy = tierAPYs[position.tier as keyof typeof tierAPYs] || 5;
    const stakingDays = Math.floor((Date.now() - position.stakingDate.getTime()) / (1000 * 60 * 60 * 24));
    const dailyRate = apy / 365 / 100;
    const earned = Math.floor(position.stakedAmount * dailyRate * stakingDays);

    return {
      apy,
      earned: position.rewardsEarned,
      claimable: earned
    };
  }
}

export const bonkedGovernance = new BonkedGovernance();