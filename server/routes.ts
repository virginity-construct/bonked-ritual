import type { Express } from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";
import { MailService } from '@sendgrid/mail';
import { storage } from "./storage";
import { insertUserSchema } from "@shared/schema";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}

if (!process.env.SENDGRID_API_KEY) {
  throw new Error('Missing required SendGrid API key: SENDGRID_API_KEY');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
});

const mailService = new MailService();
mailService.setApiKey(process.env.SENDGRID_API_KEY);

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Create user and initiate subscription
  app.post("/api/create-subscription", async (req, res) => {
    try {
      const { email, tier = 'initiate' } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      // Check if user exists
      let user = await storage.getUserByEmail(email);
      
      if (!user) {
        // Create new user
        user = await storage.createUser({ email, tier });
      }

      // Create Stripe customer if not exists
      let customerId = user.stripeCustomerId;
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          metadata: { userId: user.id.toString() }
        });
        customerId = customer.id;
        user = await storage.updateUserStripeInfo(user.id, customerId);
      }

      // Tier pricing mapping
      const tierPricing = {
        initiate: process.env.STRIPE_PRICE_INITIATE || 'price_initiate_25_monthly',
        herald: process.env.STRIPE_PRICE_HERALD || 'price_herald_69_quarterly',
        oracle: process.env.STRIPE_PRICE_ORACLE || 'price_oracle_111_biannual',
        shadow: process.env.STRIPE_PRICE_SHADOW || 'price_shadow_500_annual'
      };

      // Create subscription
      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: tierPricing[tier as keyof typeof tierPricing] }],
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
      });

      // Update user with subscription ID
      await storage.updateUserStripeInfo(user.id, customerId, subscription.id);
      
      // Create subscription record
      await storage.createSubscription({
        userId: user.id,
        tier,
        status: subscription.status,
        currentPeriodEnd: subscription.current_period_end ? new Date(subscription.current_period_end * 1000) : null,
      });

      const invoice = subscription.latest_invoice as Stripe.Invoice;
      const paymentIntent = invoice?.payment_intent as Stripe.PaymentIntent;

      res.json({
        subscriptionId: subscription.id,
        clientSecret: paymentIntent.client_secret,
      });

    } catch (error: any) {
      console.error('Subscription creation error:', error);
      res.status(500).json({ message: "Error creating subscription: " + error.message });
    }
  });

  // Stripe webhook handler
  app.post("/api/stripe-webhook", async (req, res) => {
    const sig = req.headers['stripe-signature'] as string;
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
    } catch (err: any) {
      console.log(`Webhook signature verification failed.`, err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('Payment succeeded:', paymentIntent.id);
        break;

      case 'invoice.payment_succeeded':
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;
        
        // Find user by Stripe customer ID
        const users = await storage.getUser(1); // This would need proper implementation
        // Trigger silent Web3 operations
        await triggerSilentWeb3Operations(customerId, invoice.subscription as string);
        break;

      case 'customer.subscription.updated':
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdate(subscription);
        break;

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  });

  // Silent Web3 wallet creation
  app.post("/api/create-wallet", async (req, res) => {
    try {
      const { email, userId } = req.body;
      
      // Magic.link integration would go here
      // This is a placeholder for the silent wallet creation
      const mockWalletAddress = `FFC${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
      
      await storage.updateUserWallet(userId, mockWalletAddress);
      
      res.json({ walletAddress: mockWalletAddress });
    } catch (error: any) {
      console.error('Wallet creation error:', error);
      res.status(500).json({ message: "Error creating wallet: " + error.message });
    }
  });

  // Silent NFT minting via Helius API
  app.post("/api/mint-nft", async (req, res) => {
    try {
      const { userId, tier, walletAddress } = req.body;
      
      // Helius API integration would go here
      // This is a placeholder for the silent NFT minting
      const mockTokenId = `TOKEN_${tier.toUpperCase()}_${Date.now()}`;
      
      await storage.createNftToken({
        userId,
        tokenId: mockTokenId,
        tier,
        mintSignature: `SIG_${Date.now()}`,
      });
      
      await storage.updateUserNft(userId, mockTokenId);
      
      res.json({ tokenId: mockTokenId });
    } catch (error: any) {
      console.error('NFT minting error:', error);
      res.status(500).json({ message: "Error minting NFT: " + error.message });
    }
  });

  // SendGrid email automation
  app.post("/api/send-oracle-content", async (req, res) => {
    try {
      const { email, content, tier } = req.body;
      
      const emailContent = {
        to: email,
        from: process.env.SENDGRID_FROM_EMAIL || 'oracle@ffc.club',
        subject: 'Your Oracle Prophecy Awaits',
        html: `
          <div style="background: #0b0b0f; color: #ffffff; padding: 40px; font-family: serif;">
            <h1 style="color: #8b1e3f; text-align: center;">Whispers from the Oracle</h1>
            <div style="margin: 20px 0; line-height: 1.6;">
              ${content}
            </div>
            <p style="text-align: center; color: #666; font-size: 12px;">
              FFC • Confidential • Tier: ${tier}
            </p>
          </div>
        `
      };

      await mailService.send(emailContent);
      res.json({ sent: true });
    } catch (error: any) {
      console.error('Email sending error:', error);
      res.status(500).json({ message: "Error sending email: " + error.message });
    }
  });

  // Helper functions for Web3 operations
  async function triggerSilentWeb3Operations(customerId: string, subscriptionId: string) {
    try {
      // Find user by Stripe customer ID and trigger wallet + NFT creation
      console.log('Triggering silent Web3 operations for:', customerId);
      
      // This would integrate with Magic.link and Helius APIs
      // For now, we'll log the operations
    } catch (error) {
      console.error('Silent Web3 operations failed:', error);
    }
  }

  async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
    try {
      const customerId = subscription.customer as string;
      console.log('Handling subscription update for:', customerId);
      
      // Update subscription status in database
      // Trigger tier-specific NFT minting if upgrade
    } catch (error) {
      console.error('Subscription update handling failed:', error);
    }
  }

  const httpServer = createServer(app);
  return httpServer;
}
