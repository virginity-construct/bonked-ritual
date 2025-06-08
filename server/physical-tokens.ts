import { storage } from "./storage";

interface PhysicalToken {
  userId: number;
  tokenType: 'coin' | 'sigil' | 'scroll';
  tier: string;
  shippingAddress: string;
  trackingNumber?: string;
  shipped: boolean;
  deliveryDate?: Date;
  customMessage?: string;
}

interface ShippingAddress {
  name: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export class PhysicalTokenService {
  private shippingProvider: string;
  
  constructor() {
    this.shippingProvider = process.env.SHIPPING_PROVIDER || 'shippo';
  }

  async checkTokenEligibility(userId: number): Promise<{eligible: boolean, reason?: string}> {
    const user = await storage.getUser(userId);
    if (!user) {
      return { eligible: false, reason: 'User not found' };
    }

    // Check if user has been active for 6 months
    const membershipStart = user.createdAt || new Date();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    if (membershipStart > sixMonthsAgo) {
      const daysRemaining = Math.ceil((sixMonthsAgo.getTime() - membershipStart.getTime()) / (1000 * 60 * 60 * 24));
      return { 
        eligible: false, 
        reason: `Physical token unlocks after 6 months. ${Math.abs(daysRemaining)} days remaining.` 
      };
    }

    // Check tier eligibility
    if (!['herald', 'oracle', 'shadow'].includes(user.tier)) {
      return { 
        eligible: false, 
        reason: 'Physical tokens available for Herald+ tiers only' 
      };
    }

    return { eligible: true };
  }

  async scheduleTokenShipment(userId: number, shippingAddress: ShippingAddress): Promise<PhysicalToken> {
    const eligibility = await this.checkTokenEligibility(userId);
    if (!eligibility.eligible) {
      throw new Error(eligibility.reason);
    }

    const user = await storage.getUser(userId);
    if (!user) throw new Error('User not found');

    const tokenType = this.getTokenTypeByTier(user.tier);
    const customMessage = this.generateCustomMessage(user.tier, user.username || '');

    const token: PhysicalToken = {
      userId,
      tokenType,
      tier: user.tier,
      shippingAddress: this.formatAddress(shippingAddress),
      shipped: false,
      customMessage
    };

    // In production, integrate with shipping API
    console.log('Physical token scheduled for shipment:', token);
    
    return token;
  }

  private getTokenTypeByTier(tier: string): 'coin' | 'sigil' | 'scroll' {
    switch (tier) {
      case 'herald':
        return 'coin';
      case 'oracle':
        return 'sigil';
      case 'shadow':
        return 'scroll';
      default:
        return 'coin';
    }
  }

  private generateCustomMessage(tier: string, username: string): string {
    const messages = {
      herald: `${username}, your token carries the weight of recognition. What was hidden is now manifest.`,
      oracle: `${username}, this sigil binds you to the mysteries you've unlocked. Power made tangible.`,
      shadow: `${username}, the words contained within this scroll are yours alone. Guard them well.`
    };

    return messages[tier as keyof typeof messages] || 'Your journey continues in the physical realm.';
  }

  private formatAddress(address: ShippingAddress): string {
    return `${address.name}\n${address.street}\n${address.city}, ${address.state} ${address.zipCode}\n${address.country}`;
  }

  generateTokenDescriptions(): Record<string, string> {
    return {
      coin: 'Hand-forged bronze coin with FFC sigil. Warm to the touch, cold to the uninitiated.',
      sigil: 'Obsidian pendant etched with your personal oracle symbol. Unique to your journey.',
      scroll: 'Handwritten parchment sealed with wax. Contains prophecies meant for your eyes only.'
    };
  }

  async processShipment(tokenId: string, trackingNumber: string): Promise<void> {
    // Integration with shipping provider
    console.log(`Token ${tokenId} shipped with tracking: ${trackingNumber}`);
  }
}

export const physicalTokenService = new PhysicalTokenService();