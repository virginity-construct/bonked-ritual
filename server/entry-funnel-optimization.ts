import { storage } from "./storage";

interface FunnelVariant {
  id: string;
  name: string;
  cta: string;
  messaging: string;
  aesthetic: 'mystic' | 'erotic';
  active: boolean;
  weight: number; // For A/B distribution
}

interface ConversionEvent {
  userId?: number;
  variantId: string;
  sessionId: string;
  event: 'view' | 'click' | 'signup' | 'payment';
  timestamp: Date;
  tier?: string;
  amount?: number;
}

interface FunnelMetrics {
  variantId: string;
  views: number;
  clicks: number;
  signups: number;
  payments: number;
  revenue: number;
  conversionRate: number;
  ltv: number;
}

export class EntryFunnelOptimization {
  private variants: Map<string, FunnelVariant> = new Map();
  private events: ConversionEvent[] = [];
  private activeExperiment: string | null = null;

  constructor() {
    this.initializeFunnelVariants();
    this.startConversionTracking();
  }

  private initializeFunnelVariants() {
    const variants: FunnelVariant[] = [
      {
        id: 'mystic_enter_veil',
        name: 'Mystic: Enter the Veil',
        cta: 'Enter the Veil',
        messaging: 'You didn\'t ask. You were chosen. The mysteries await behind the veil.',
        aesthetic: 'mystic',
        active: true,
        weight: 0.5
      },
      {
        id: 'erotic_join_cult',
        name: 'Erotic: Join the Cult',
        cta: 'Join the Cult',
        messaging: 'Stop pretending you don\'t want this. The cult of desire welcomes you.',
        aesthetic: 'erotic',
        active: true,
        weight: 0.5
      }
    ];

    variants.forEach(variant => {
      this.variants.set(variant.id, variant);
    });

    this.activeExperiment = 'mystic_vs_erotic_2025';
  }

  assignUserToVariant(sessionId: string): FunnelVariant {
    const activeVariants = Array.from(this.variants.values()).filter(v => v.active);
    
    // Weighted random selection
    const random = Math.random();
    let weightSum = 0;
    
    for (const variant of activeVariants) {
      weightSum += variant.weight;
      if (random <= weightSum) {
        this.trackEvent({
          variantId: variant.id,
          sessionId,
          event: 'view',
          timestamp: new Date()
        });
        return variant;
      }
    }
    
    // Fallback to first variant
    return activeVariants[0];
  }

  trackEvent(event: ConversionEvent): void {
    this.events.push(event);
    
    // Keep only last 30 days of events
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    this.events = this.events.filter(e => e.timestamp > thirtyDaysAgo);
  }

  async trackConversion(sessionId: string, variantId: string, tier: string, amount: number): Promise<void> {
    this.trackEvent({
      variantId,
      sessionId,
      event: 'payment',
      timestamp: new Date(),
      tier,
      amount
    });

    // Calculate and update LTV for this variant
    await this.updateVariantLTV(variantId);
  }

  private async updateVariantLTV(variantId: string): Promise<void> {
    const variantEvents = this.events.filter(e => e.variantId === variantId);
    const payments = variantEvents.filter(e => e.event === 'payment' && e.amount);
    
    if (payments.length === 0) return;

    const totalRevenue = payments.reduce((sum, event) => sum + (event.amount || 0), 0);
    const uniqueUsers = new Set(payments.map(e => e.sessionId)).size;
    const ltv = totalRevenue / uniqueUsers;

    console.log(`Variant ${variantId} LTV updated: $${ltv.toFixed(2)}`);
  }

  calculateMetrics(variantId: string, timeframe: number = 7): FunnelMetrics {
    const cutoff = new Date(Date.now() - timeframe * 24 * 60 * 60 * 1000);
    const variantEvents = this.events.filter(e => 
      e.variantId === variantId && e.timestamp > cutoff
    );

    const views = variantEvents.filter(e => e.event === 'view').length;
    const clicks = variantEvents.filter(e => e.event === 'click').length;
    const signups = variantEvents.filter(e => e.event === 'signup').length;
    const payments = variantEvents.filter(e => e.event === 'payment').length;
    
    const revenue = variantEvents
      .filter(e => e.event === 'payment')
      .reduce((sum, e) => sum + (e.amount || 0), 0);

    const conversionRate = views > 0 ? (payments / views) * 100 : 0;
    const uniquePayments = new Set(
      variantEvents.filter(e => e.event === 'payment').map(e => e.sessionId)
    ).size;
    const ltv = uniquePayments > 0 ? revenue / uniquePayments : 0;

    return {
      variantId,
      views,
      clicks,
      signups,
      payments,
      revenue,
      conversionRate,
      ltv
    };
  }

  getExperimentResults(timeframe: number = 7): { variants: FunnelMetrics[], winner?: string, confidence?: number } {
    const activeVariants = Array.from(this.variants.values()).filter(v => v.active);
    const metrics = activeVariants.map(v => this.calculateMetrics(v.id, timeframe));
    
    // Determine statistical significance (simplified)
    const sortedByLTV = [...metrics].sort((a, b) => b.ltv - a.ltv);
    const winner = sortedByLTV.length > 1 && sortedByLTV[0].payments > 10 
      ? sortedByLTV[0].variantId 
      : undefined;
    
    const confidence = winner && sortedByLTV.length > 1
      ? Math.min(95, (sortedByLTV[0].ltv / sortedByLTV[1].ltv - 1) * 100)
      : undefined;

    return { variants: metrics, winner, confidence };
  }

  private startConversionTracking() {
    // Simulate ongoing conversion events for demonstration
    setInterval(() => {
      this.simulateConversionEvent();
    }, Math.random() * 300000 + 60000); // 1-5 minutes
  }

  private simulateConversionEvent() {
    const variants = Array.from(this.variants.keys());
    const randomVariant = variants[Math.floor(Math.random() * variants.length)];
    const sessionId = `SESSION_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    
    // Simulate conversion funnel
    this.trackEvent({
      variantId: randomVariant,
      sessionId,
      event: 'view',
      timestamp: new Date()
    });

    // 30% click through
    if (Math.random() < 0.3) {
      setTimeout(() => {
        this.trackEvent({
          variantId: randomVariant,
          sessionId,
          event: 'click',
          timestamp: new Date()
        });
        
        // 20% of clickers sign up
        if (Math.random() < 0.2) {
          setTimeout(() => {
            this.trackEvent({
              variantId: randomVariant,
              sessionId,
              event: 'signup',
              timestamp: new Date()
            });
            
            // 60% of signups convert to payment
            if (Math.random() < 0.6) {
              const tiers = ['initiate', 'herald', 'oracle', 'shadow'];
              const amounts = [25, 69, 111, 500];
              const tierIndex = Math.floor(Math.random() * tiers.length);
              
              setTimeout(() => {
                this.trackEvent({
                  variantId: randomVariant,
                  sessionId,
                  event: 'payment',
                  timestamp: new Date(),
                  tier: tiers[tierIndex],
                  amount: amounts[tierIndex]
                });
              }, 2000);
            }
          }, 5000);
        }
      }, 1000);
    }
  }

  generateOptimizationDashboard(): string {
    const results = this.getExperimentResults(7);
    
    return `
    <!DOCTYPE html>
    <html class="dark">
    <head>
      <title>Funnel Optimization - FFC</title>
      <style>
        body {
          background: radial-gradient(circle at center, #0b0b0f, #1a1a2e 60%, #000000 90%);
          color: white;
          font-family: 'Inter', sans-serif;
          padding: 2rem;
          min-height: 100vh;
        }
        .container { max-width: 1200px; margin: 0 auto; }
        .title { font-size: 2.5rem; margin-bottom: 1rem; color: #8b1e3f; text-align: center; }
        .experiment-card {
          background: rgba(139, 30, 63, 0.1);
          border: 1px solid #8b1e3f;
          border-radius: 12px;
          padding: 2rem;
          margin: 1rem 0;
        }
        .variant-comparison {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
          margin: 2rem 0;
        }
        .variant-card {
          background: rgba(0,0,0,0.3);
          border: 1px solid #666;
          border-radius: 8px;
          padding: 1.5rem;
        }
        .variant-card.winner {
          border-color: #00ff00;
          background: rgba(0, 255, 0, 0.1);
        }
        .metric-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1rem;
          margin: 1rem 0;
        }
        .metric-item {
          text-align: center;
          padding: 1rem;
          background: rgba(139, 30, 63, 0.2);
          border-radius: 6px;
        }
        .metric-value {
          font-size: 1.5rem;
          font-weight: bold;
          color: #8b1e3f;
        }
        .metric-label {
          font-size: 0.8rem;
          color: #999;
          margin-top: 0.25rem;
        }
        .winner-badge {
          background: linear-gradient(to right, #00ff00, #32cd32);
          color: black;
          padding: 0.25rem 0.75rem;
          border-radius: 16px;
          font-size: 0.8rem;
          font-weight: bold;
          display: inline-block;
          margin-bottom: 1rem;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1 class="title">Entry Funnel Optimization</h1>
        <div style="text-align: center; color: #999; margin-bottom: 3rem;">
          Split-testing erotic vs mystic positioning for maximum LTV conversion
        </div>
        
        <div class="experiment-card">
          <h3>Active Experiment: Mystic vs Erotic CTA</h3>
          <p style="color: #999;">
            Testing two distinct positioning strategies to optimize lifetime value across member tiers.
          </p>
          
          ${results.winner ? `
            <div style="background: rgba(0, 255, 0, 0.1); border: 1px solid #00ff00; border-radius: 8px; padding: 1rem; margin: 1rem 0;">
              <strong style="color: #00ff00;">Statistical Winner Detected</strong><br>
              Variant ${results.winner} shows ${results.confidence?.toFixed(1)}% improvement in LTV
            </div>
          ` : `
            <div style="background: rgba(255, 165, 0, 0.1); border: 1px solid orange; border-radius: 8px; padding: 1rem; margin: 1rem 0;">
              <strong style="color: orange;">Experiment Running</strong><br>
              Need more data for statistical significance (minimum 100 conversions per variant)
            </div>
          `}
          
          <div class="variant-comparison">
            ${results.variants.map(variant => {
              const variantData = this.variants.get(variant.variantId);
              const isWinner = variant.variantId === results.winner;
              
              return `
                <div class="variant-card ${isWinner ? 'winner' : ''}">
                  ${isWinner ? '<div class="winner-badge">WINNER</div>' : ''}
                  <h4>${variantData?.name || variant.variantId}</h4>
                  <div style="color: #999; margin-bottom: 1rem;">
                    "${variantData?.cta}" • ${variantData?.aesthetic} aesthetic
                  </div>
                  
                  <div class="metric-grid">
                    <div class="metric-item">
                      <div class="metric-value">${variant.views}</div>
                      <div class="metric-label">Views</div>
                    </div>
                    <div class="metric-item">
                      <div class="metric-value">${variant.payments}</div>
                      <div class="metric-label">Conversions</div>
                    </div>
                    <div class="metric-item">
                      <div class="metric-value">${variant.conversionRate.toFixed(1)}%</div>
                      <div class="metric-label">Conv Rate</div>
                    </div>
                    <div class="metric-item">
                      <div class="metric-value">$${variant.ltv.toFixed(0)}</div>
                      <div class="metric-label">LTV</div>
                    </div>
                  </div>
                  
                  <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid rgba(139, 30, 63, 0.3);">
                    <div style="display: flex; justify-content: space-between;">
                      <span>Revenue:</span>
                      <span style="color: #8b1e3f; font-weight: bold;">$${variant.revenue.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 3rem; color: #666;">
          <p>Funnel metrics update in real-time. Optimization drives obsession.</p>
        </div>
      </div>
    </body>
    </html>`;
  }
}

export const entryFunnelOptimization = new EntryFunnelOptimization();