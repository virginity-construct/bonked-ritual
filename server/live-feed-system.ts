import { anointingSystem } from "./anointing-system";
import { gamifiedTokens } from "./gamified-tokens";
import { prophecyReforging } from "./prophecy-reforging";

interface LiveFeedEvent {
  id: string;
  type: 'anointing' | 'token_claim' | 'prophecy_reforge' | 'governance_vote';
  timestamp: Date;
  displayText: string;
  userIds: number[];
  tier?: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
}

interface FeedSubscriber {
  id: string;
  userId?: number;
  tier?: string;
  lastSeen: Date;
  preferences: {
    anointings: boolean;
    tokenClaims: boolean;
    prophecies: boolean;
    governance: boolean;
  };
}

export class LiveFeedSystem {
  private events: LiveFeedEvent[] = [];
  private subscribers: Map<string, FeedSubscriber> = new Map();
  private maxEvents = 100;

  constructor() {
    this.initializeFeedSystem();
    this.startEventGeneration();
  }

  private initializeFeedSystem() {
    // Add sample live events
    this.addEvent({
      type: 'anointing',
      displayText: 'ORACLE 019 → HERALD 042: "You\'re seen. The veil trembles."',
      userIds: [19, 42],
      tier: 'oracle',
      urgency: 'high'
    });

    this.addEvent({
      type: 'token_claim',
      displayText: 'SHADOW 007 claimed Obsidian Sigil OS011 in 47sec',
      userIds: [7],
      tier: 'shadow',
      urgency: 'critical'
    });

    this.addEvent({
      type: 'prophecy_reforge',
      displayText: 'ORACLE 301 burned prophecy #4 for deeper truth ($13.50)',
      userIds: [301],
      tier: 'oracle',
      urgency: 'medium'
    });
  }

  private addEvent(event: Omit<LiveFeedEvent, 'id' | 'timestamp'>): void {
    const newEvent: LiveFeedEvent = {
      ...event,
      id: `EVENT_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      timestamp: new Date()
    };

    this.events.unshift(newEvent);
    
    // Keep only recent events
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(0, this.maxEvents);
    }

    // Broadcast to subscribers
    this.broadcastEvent(newEvent);
  }

  private broadcastEvent(event: LiveFeedEvent): void {
    console.log(`LIVE FEED: ${event.displayText}`);
    
    // In production, this would push to WebSocket connections
    this.subscribers.forEach((subscriber, id) => {
      if (this.shouldReceiveEvent(subscriber, event)) {
        // Send event to subscriber
      }
    });
  }

  private shouldReceiveEvent(subscriber: FeedSubscriber, event: LiveFeedEvent): boolean {
    switch (event.type) {
      case 'anointing':
        return subscriber.preferences.anointings;
      case 'token_claim':
        return subscriber.preferences.tokenClaims;
      case 'prophecy_reforge':
        return subscriber.preferences.prophecies;
      case 'governance_vote':
        return subscriber.preferences.governance;
      default:
        return false;
    }
  }

  private startEventGeneration(): void {
    // Simulate live activity every 30-90 seconds
    setInterval(() => {
      this.generateRandomEvent();
    }, Math.random() * 60000 + 30000); // 30-90 seconds
  }

  private generateRandomEvent(): void {
    const eventTypes = ['anointing', 'token_claim', 'prophecy_reforge', 'governance_vote'];
    const randomType = eventTypes[Math.floor(Math.random() * eventTypes.length)] as any;
    
    const mockEvents = {
      anointing: [
        'SHADOW 003 → ORACLE 157: "Your power sharpens what\'s hidden."',
        'ORACLE 092 → HERALD 224: "The circle recognizes your worth."',
        'SHADOW 015 → INITIATE 883: "Step closer to the veil."'
      ],
      token_claim: [
        'ORACLE 445 claimed Herald Coin HC023 in 12sec',
        'SHADOW 001 claimed Sacred Scroll SK007 in 3min',
        'HERALD 298 claimed Obsidian Sigil OS019 in 1min'
      ],
      prophecy_reforge: [
        'ORACLE 177 burned prophecy #2 seeking clarity ($9)',
        'SHADOW 088 reforged prophecy #5 at escalated cost ($33.75)',
        'ORACLE 203 sacrificed whisper for new revelation (127 $BONKED)'
      ],
      governance_vote: [
        'SHADOW 012 voted on Oracle Voice Recording proposal',
        'ORACLE 356 staked 2500 $BONKED for voting power',
        'Quorum reached: Sacred Voice Whisper approved (9/9)'
      ]
    };

    const templates = mockEvents[randomType];
    const randomTemplate = templates[Math.floor(Math.random() * templates.length)];
    
    const urgencyLevels = ['low', 'medium', 'high', 'critical'];
    const randomUrgency = urgencyLevels[Math.floor(Math.random() * urgencyLevels.length)] as any;

    this.addEvent({
      type: randomType,
      displayText: randomTemplate,
      userIds: [Math.floor(Math.random() * 999) + 1],
      urgency: randomUrgency
    });
  }

  subscribeToFeed(userId?: number, tier?: string): string {
    const subscriberId = `SUB_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    
    this.subscribers.set(subscriberId, {
      id: subscriberId,
      userId,
      tier,
      lastSeen: new Date(),
      preferences: {
        anointings: true,
        tokenClaims: true,
        prophecies: tier ? ['oracle', 'shadow'].includes(tier) : false,
        governance: tier ? ['oracle', 'shadow'].includes(tier) : false
      }
    });

    return subscriberId;
  }

  getRecentEvents(subscriberId?: string, limit: number = 20): LiveFeedEvent[] {
    let filteredEvents = this.events;

    if (subscriberId) {
      const subscriber = this.subscribers.get(subscriberId);
      if (subscriber) {
        filteredEvents = this.events.filter(event => 
          this.shouldReceiveEvent(subscriber, event)
        );
      }
    }

    return filteredEvents.slice(0, limit);
  }

  generateLiveFeedWidget(): string {
    const recentEvents = this.getRecentEvents(undefined, 10);
    
    return `
    <div id="live-feed-widget" style="
      position: fixed;
      top: 20px;
      right: 20px;
      width: 320px;
      background: rgba(26, 26, 46, 0.95);
      border: 1px solid #8b1e3f;
      border-radius: 12px;
      padding: 1rem;
      color: white;
      font-family: 'Inter', sans-serif;
      font-size: 0.8rem;
      max-height: 400px;
      overflow-y: auto;
      z-index: 1000;
      backdrop-filter: blur(10px);
    ">
      <div style="
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
        border-bottom: 1px solid rgba(139, 30, 63, 0.3);
        padding-bottom: 0.5rem;
      ">
        <h4 style="margin: 0; color: #8b1e3f;">Live Activity</h4>
        <div style="
          width: 8px;
          height: 8px;
          background: #00ff00;
          border-radius: 50%;
          animation: pulse 2s infinite;
        "></div>
      </div>
      
      <div id="feed-events">
        ${recentEvents.map(event => {
          const timeAgo = Math.floor((Date.now() - event.timestamp.getTime()) / 60000);
          const urgencyColors = {
            low: '#666',
            medium: '#8b1e3f',
            high: '#ff6b6b',
            critical: '#ffd700'
          };
          
          return `
            <div style="
              margin-bottom: 0.75rem;
              padding: 0.5rem;
              background: rgba(0,0,0,0.2);
              border-radius: 6px;
              border-left: 3px solid ${urgencyColors[event.urgency]};
            ">
              <div style="color: #ccc; line-height: 1.3;">
                ${event.displayText}
              </div>
              <div style="color: #666; font-size: 0.7rem; margin-top: 0.25rem;">
                ${timeAgo}m ago
              </div>
            </div>
          `;
        }).join('')}
      </div>
      
      <style>
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
        
        #live-feed-widget::-webkit-scrollbar {
          width: 4px;
        }
        
        #live-feed-widget::-webkit-scrollbar-track {
          background: rgba(0,0,0,0.1);
        }
        
        #live-feed-widget::-webkit-scrollbar-thumb {
          background: #8b1e3f;
          border-radius: 2px;
        }
      </style>
      
      <script>
        // Auto-refresh every 30 seconds
        setInterval(() => {
          fetch('/api/live-feed/events')
            .then(res => res.json())
            .then(data => {
              // Update feed events
              console.log('Feed updated:', data.events.length, 'events');
            })
            .catch(err => console.error('Feed update failed:', err));
        }, 30000);
      </script>
    </div>`;
  }
}

export const liveFeedSystem = new LiveFeedSystem();