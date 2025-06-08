import { storage } from "./storage";
import { anointingSystem } from "./anointing-system";
import { prophecyReforging } from "./prophecy-reforging";
import { bonkedGovernance } from "./bonked-governance";

interface LeaderboardEntry {
  userId: number;
  tier: string;
  score: number;
  rank: number;
  displayValue: string;
  lastActivity: Date;
}

interface LeaderboardStats {
  totalParticipants: number;
  averageScore: number;
  topPercentile: number;
  category: string;
}

export class EroticLeaderboards {
  private leaderboards: Map<string, LeaderboardEntry[]> = new Map();
  private lastUpdate: Date = new Date();

  constructor() {
    this.initializeLeaderboards();
    this.startPeriodicUpdates();
  }

  private initializeLeaderboards() {
    // Initialize sample leaderboard data
    const sampleData = {
      most_anointed: [
        { userId: 157, tier: 'oracle', score: 8, displayValue: '8 anointments', lastActivity: new Date() },
        { userId: 203, tier: 'shadow', score: 12, displayValue: '12 anointments', lastActivity: new Date() },
        { userId: 88, tier: 'oracle', score: 6, displayValue: '6 anointments', lastActivity: new Date() }
      ],
      most_reforged: [
        { userId: 301, tier: 'shadow', score: 7, displayValue: '7 reforges ($157.50)', lastActivity: new Date() },
        { userId: 177, tier: 'oracle', score: 4, displayValue: '4 reforges ($67.50)', lastActivity: new Date() },
        { userId: 88, tier: 'oracle', score: 3, displayValue: '3 reforges ($33.75)', lastActivity: new Date() }
      ],
      most_whispers: [
        { userId: 203, tier: 'shadow', score: 23, displayValue: '23 whispers consumed', lastActivity: new Date() },
        { userId: 157, tier: 'oracle', score: 15, displayValue: '15 whispers consumed', lastActivity: new Date() },
        { userId: 301, tier: 'shadow', score: 19, displayValue: '19 whispers consumed', lastActivity: new Date() }
      ],
      most_bonked_staked: [
        { userId: 203, tier: 'shadow', score: 50000, displayValue: '50,000 $BONKED', lastActivity: new Date() },
        { userId: 157, tier: 'oracle', score: 25000, displayValue: '25,000 $BONKED', lastActivity: new Date() },
        { userId: 88, tier: 'oracle', score: 15000, displayValue: '15,000 $BONKED', lastActivity: new Date() }
      ]
    };

    Object.entries(sampleData).forEach(([category, entries]) => {
      const sortedEntries = entries
        .sort((a, b) => b.score - a.score)
        .map((entry, index) => ({ ...entry, rank: index + 1 }));
      
      this.leaderboards.set(category, sortedEntries);
    });
  }

  private startPeriodicUpdates() {
    // Update leaderboards every 5 minutes
    setInterval(() => {
      this.updateAllLeaderboards();
    }, 5 * 60 * 1000);
  }

  private async updateAllLeaderboards() {
    await this.updateMostAnointedLeaderboard();
    await this.updateMostReforgedLeaderboard();
    await this.updateMostWhispersLeaderboard();
    await this.updateMostBonkedStakedLeaderboard();
    
    this.lastUpdate = new Date();
  }

  private async updateMostAnointedLeaderboard() {
    // In production, this would query actual anointing data
    const entries: LeaderboardEntry[] = [];
    
    // Sample calculation - would use real data
    for (let i = 1; i <= 10; i++) {
      const userId = Math.floor(Math.random() * 999) + 1;
      const tiers = ['oracle', 'shadow', 'herald'];
      const tier = tiers[Math.floor(Math.random() * tiers.length)];
      const score = Math.floor(Math.random() * 15) + 1;
      
      entries.push({
        userId,
        tier,
        score,
        rank: i,
        displayValue: `${score} anointments`,
        lastActivity: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)
      });
    }

    entries.sort((a, b) => b.score - a.score);
    entries.forEach((entry, index) => entry.rank = index + 1);
    
    this.leaderboards.set('most_anointed', entries);
  }

  private async updateMostReforgedLeaderboard() {
    const stats = prophecyReforging.getReforgeStats();
    const entries: LeaderboardEntry[] = [];
    
    // Sample data with increasing costs
    for (let i = 1; i <= 10; i++) {
      const userId = Math.floor(Math.random() * 999) + 1;
      const tiers = ['oracle', 'shadow'];
      const tier = tiers[Math.floor(Math.random() * tiers.length)];
      const reforgeCount = Math.floor(Math.random() * 8) + 1;
      const totalSpent = this.calculateReforgeSpending(reforgeCount);
      
      entries.push({
        userId,
        tier,
        score: reforgeCount,
        rank: i,
        displayValue: `${reforgeCount} reforges ($${totalSpent})`,
        lastActivity: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)
      });
    }

    entries.sort((a, b) => b.score - a.score);
    entries.forEach((entry, index) => entry.rank = index + 1);
    
    this.leaderboards.set('most_reforged', entries);
  }

  private calculateReforgeSpending(reforgeCount: number): string {
    let total = 0;
    for (let i = 0; i < reforgeCount; i++) {
      total += 9 * Math.pow(1.5, i);
    }
    return total.toFixed(2);
  }

  private async updateMostWhispersLeaderboard() {
    const entries: LeaderboardEntry[] = [];
    
    for (let i = 1; i <= 10; i++) {
      const userId = Math.floor(Math.random() * 999) + 1;
      const tiers = ['oracle', 'shadow'];
      const tier = tiers[Math.floor(Math.random() * tiers.length)];
      const whisperCount = Math.floor(Math.random() * 30) + 5;
      
      entries.push({
        userId,
        tier,
        score: whisperCount,
        rank: i,
        displayValue: `${whisperCount} whispers consumed`,
        lastActivity: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)
      });
    }

    entries.sort((a, b) => b.score - a.score);
    entries.forEach((entry, index) => entry.rank = index + 1);
    
    this.leaderboards.set('most_whispers', entries);
  }

  private async updateMostBonkedStakedLeaderboard() {
    const entries: LeaderboardEntry[] = [];
    
    for (let i = 1; i <= 10; i++) {
      const userId = Math.floor(Math.random() * 999) + 1;
      const tiers = ['oracle', 'shadow', 'herald'];
      const tier = tiers[Math.floor(Math.random() * tiers.length)];
      const stakedAmount = Math.floor(Math.random() * 75000) + 5000;
      
      entries.push({
        userId,
        tier,
        score: stakedAmount,
        rank: i,
        displayValue: `${stakedAmount.toLocaleString()} $BONKED`,
        lastActivity: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)
      });
    }

    entries.sort((a, b) => b.score - a.score);
    entries.forEach((entry, index) => entry.rank = index + 1);
    
    this.leaderboards.set('most_bonked_staked', entries);
  }

  getLeaderboard(category: string, limit: number = 10): LeaderboardEntry[] {
    const leaderboard = this.leaderboards.get(category) || [];
    return leaderboard.slice(0, limit);
  }

  getUserRank(userId: number, category: string): {rank: number, total: number} | null {
    const leaderboard = this.leaderboards.get(category) || [];
    const userEntry = leaderboard.find(entry => entry.userId === userId);
    
    if (!userEntry) return null;
    
    return {
      rank: userEntry.rank,
      total: leaderboard.length
    };
  }

  getLeaderboardStats(category: string): LeaderboardStats {
    const leaderboard = this.leaderboards.get(category) || [];
    const scores = leaderboard.map(entry => entry.score);
    
    return {
      totalParticipants: leaderboard.length,
      averageScore: scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0,
      topPercentile: scores.length > 0 ? scores[Math.floor(scores.length * 0.1)] : 0,
      category: category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
    };
  }

  generateLeaderboardInterface(): string {
    const categories = [
      { id: 'most_anointed', name: 'Most Anointed', icon: '⭘' },
      { id: 'most_reforged', name: 'Most Reforged', icon: '🔥' },
      { id: 'most_whispers', name: 'Most Whispers', icon: '🔮' },
      { id: 'most_bonked_staked', name: 'Most $BONKED Staked', icon: '💎' }
    ];

    return `
    <!DOCTYPE html>
    <html class="dark">
    <head>
      <title>Erotic Leaderboards - FFC</title>
      <style>
        body {
          background: radial-gradient(circle at center, #0b0b0f, #1a1a2e 60%, #000000 90%);
          color: white;
          font-family: 'Inter', sans-serif;
          padding: 2rem;
          min-height: 100vh;
        }
        .container { max-width: 1200px; margin: 0 auto; }
        .title { font-size: 3rem; margin-bottom: 1rem; color: #8b1e3f; text-align: center; font-family: 'Playfair Display', serif; }
        .leaderboard-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 2rem;
          margin: 2rem 0;
        }
        .leaderboard-card {
          background: rgba(139, 30, 63, 0.1);
          border: 1px solid #8b1e3f;
          border-radius: 12px;
          padding: 1.5rem;
          min-height: 400px;
        }
        .leaderboard-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 1.5rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid rgba(139, 30, 63, 0.3);
        }
        .leaderboard-entry {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem 0;
          border-bottom: 1px solid rgba(139, 30, 63, 0.2);
        }
        .leaderboard-entry:last-child { border-bottom: none; }
        .rank-badge {
          background: linear-gradient(to right, #8b1e3f, #5e3d75);
          color: white;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.8rem;
          font-weight: bold;
        }
        .rank-badge.top-3 {
          background: linear-gradient(to right, #ffd700, #ffed4e);
          color: #000;
        }
        .user-info {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .tier-badge {
          background: rgba(139, 30, 63, 0.3);
          padding: 0.25rem 0.5rem;
          border-radius: 12px;
          font-size: 0.7rem;
          text-transform: uppercase;
          font-weight: bold;
        }
        .tier-badge.shadow { background: rgba(255, 215, 0, 0.3); color: #ffd700; }
        .tier-badge.oracle { background: rgba(138, 43, 226, 0.3); color: #8a2be2; }
        .tier-badge.herald { background: rgba(139, 30, 63, 0.3); color: #8b1e3f; }
        .stats-bar {
          background: rgba(0,0,0,0.3);
          border-radius: 8px;
          padding: 1rem;
          margin: 2rem 0;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1rem;
          text-align: center;
        }
        .stat-item {
          border-right: 1px solid rgba(139, 30, 63, 0.3);
        }
        .stat-item:last-child { border-right: none; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1 class="title">Erotic Leaderboards</h1>
        <div style="text-align: center; color: #999; margin-bottom: 3rem;">
          Where desire meets dominance. Where obsession is quantified.
        </div>
        
        <div class="stats-bar">
          <div class="stat-item">
            <div style="font-size: 1.5rem; color: #8b1e3f; font-weight: bold;">247</div>
            <div style="font-size: 0.9rem; color: #999;">Active Participants</div>
          </div>
          <div class="stat-item">
            <div style="font-size: 1.5rem; color: #8b1e3f; font-weight: bold;">1,203</div>
            <div style="font-size: 0.9rem; color: #999;">Total Anointments</div>
          </div>
          <div class="stat-item">
            <div style="font-size: 1.5rem; color: #8b1e3f; font-weight: bold;">$2,847</div>
            <div style="font-size: 0.9rem; color: #999;">Reforge Revenue</div>
          </div>
          <div class="stat-item">
            <div style="font-size: 1.5rem; color: #8b1e3f; font-weight: bold;">847K</div>
            <div style="font-size: 0.9rem; color: #999;">$BONKED Staked</div>
          </div>
        </div>
        
        <div class="leaderboard-grid">
          ${categories.map(category => {
            const entries = this.getLeaderboard(category.id, 8);
            return `
              <div class="leaderboard-card">
                <div class="leaderboard-header">
                  <span style="font-size: 1.2rem;">${category.icon}</span>
                  <h3 style="margin: 0;">${category.name}</h3>
                </div>
                
                ${entries.map(entry => `
                  <div class="leaderboard-entry">
                    <div class="user-info">
                      <div class="rank-badge ${entry.rank <= 3 ? 'top-3' : ''}">${entry.rank}</div>
                      <div>
                        <div style="font-weight: 500;">
                          ${entry.tier.toUpperCase()} ${entry.userId.toString().slice(-3)}
                        </div>
                        <div class="tier-badge ${entry.tier}">${entry.tier}</div>
                      </div>
                    </div>
                    <div style="text-align: right;">
                      <div style="font-weight: bold; color: #8b1e3f;">${entry.displayValue}</div>
                      <div style="font-size: 0.7rem; color: #666;">
                        ${Math.floor((Date.now() - entry.lastActivity.getTime()) / (1000 * 60 * 60))}h ago
                      </div>
                    </div>
                  </div>
                `).join('')}
              </div>
            `;
          }).join('')}
        </div>
        
        <div style="text-align: center; margin-top: 3rem; color: #666;">
          <p>Leaderboards update every 5 minutes. Rankings reflect the most devoted members.</p>
          <p>Competition breeds excellence. Excellence breeds obsession.</p>
        </div>
      </div>
    </body>
    </html>`;
  }
}

export const eroticLeaderboards = new EroticLeaderboards();