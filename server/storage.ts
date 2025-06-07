import { users, subscriptions, nftTokens, type User, type InsertUser, type InsertSubscription, type InsertNftToken } from "@shared/schema";

export interface IStorage {
  // User management
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserStripeInfo(id: number, customerId: string, subscriptionId?: string): Promise<User>;
  updateUserWallet(id: number, walletAddress: string): Promise<User>;
  updateUserNft(id: number, nftTokenId: string): Promise<User>;
  
  // Subscription management
  createSubscription(subscription: InsertSubscription): Promise<void>;
  updateSubscriptionStatus(userId: number, status: string): Promise<void>;
  
  // NFT tracking
  createNftToken(nftToken: InsertNftToken): Promise<void>;
  getUserNfts(userId: number): Promise<any[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private subscriptions: Map<number, any>;
  private nftTokens: Map<number, any>;
  private currentUserId: number;
  private currentSubscriptionId: number;
  private currentNftId: number;

  constructor() {
    this.users = new Map();
    this.subscriptions = new Map();
    this.nftTokens = new Map();
    this.currentUserId = 1;
    this.currentSubscriptionId = 1;
    this.currentNftId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = {
      id,
      email: insertUser.email,
      tier: insertUser.tier || 'initiate',
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      walletAddress: null,
      nftTokenId: null,
      createdAt: new Date(),
      lastActiveAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async updateUserStripeInfo(id: number, customerId: string, subscriptionId?: string): Promise<User> {
    const user = this.users.get(id);
    if (!user) throw new Error('User not found');
    
    const updatedUser = {
      ...user,
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscriptionId || user.stripeSubscriptionId,
    };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async updateUserWallet(id: number, walletAddress: string): Promise<User> {
    const user = this.users.get(id);
    if (!user) throw new Error('User not found');
    
    const updatedUser = { ...user, walletAddress };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async updateUserNft(id: number, nftTokenId: string): Promise<User> {
    const user = this.users.get(id);
    if (!user) throw new Error('User not found');
    
    const updatedUser = { ...user, nftTokenId };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async createSubscription(subscription: InsertSubscription): Promise<void> {
    const id = this.currentSubscriptionId++;
    this.subscriptions.set(id, { ...subscription, id });
  }

  async updateSubscriptionStatus(userId: number, status: string): Promise<void> {
    Array.from(this.subscriptions.entries()).forEach(([id, sub]) => {
      if (sub.userId === userId) {
        this.subscriptions.set(id, { ...sub, status });
      }
    });
  }

  async createNftToken(nftToken: InsertNftToken): Promise<void> {
    const id = this.currentNftId++;
    this.nftTokens.set(id, { ...nftToken, id, createdAt: new Date() });
  }

  async getUserNfts(userId: number): Promise<any[]> {
    return Array.from(this.nftTokens.values()).filter(nft => nft.userId === userId);
  }
}

export const storage = new MemStorage();
