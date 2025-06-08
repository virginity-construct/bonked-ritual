import type { Express } from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";
import { MailService } from '@sendgrid/mail';
import { storage } from "./storage";
import { insertUserSchema } from "@shared/schema";
import { whisperEngine } from "./whisper-engine";
import { bonkedIntegration } from "./bonked-integration";
import { veiledRoom } from "./veiled-room";
import { voiceOracle } from "./voice-oracle";
import { physicalTokenService } from "./physical-tokens";
import { bonkedGovernance } from "./bonked-governance";
import { veiledEncounters } from "./veiled-encounters";
import { anointingSystem } from "./anointing-system";
import { ritualScarcity } from "./ritual-scarcity";
import { gamifiedTokens } from "./gamified-tokens";
import { prophecyReforging } from "./prophecy-reforging";

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
  
  // Test route to verify server is working
  app.get("/test", (req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html><head><title>FFC Test</title></head>
      <body style="background:#0b0b0f;color:white;text-align:center;padding:50px;font-family:Arial">
        <h1>FFC Server Running</h1>
        <p>Server is working properly on port 5000</p>
        <a href="/" style="color:#8b1e3f">Go to React App</a>
      </body></html>
    `);
  });
  
  // Create Stripe checkout session
  app.post("/api/create-checkout", async (req, res) => {
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

      // Tier pricing mapping with amounts in cents
      const tierDetails = {
        initiate: { amount: 2500, name: "FFC Initiate Membership", interval: "month" }, // $25/month
        herald: { amount: 6900, name: "FFC Herald Membership", interval: "quarter" },   // $69/quarter
        oracle: { amount: 11100, name: "FFC Oracle Membership", interval: "6months" }, // $111/6months
        shadow: { amount: 50000, name: "FFC Shadow Key", interval: "year" }            // $500/year
      };

      const selectedTier = tierDetails[tier as keyof typeof tierDetails];

      // Create Stripe checkout session
      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        payment_method_types: ['card'],
        customer_email: email,
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: selectedTier.name,
                description: `FFC ${tier} tier membership - exclusive access and privileges`,
              },
              unit_amount: selectedTier.amount,
              recurring: {
                interval: selectedTier.interval as any,
              },
            },
            quantity: 1,
          },
        ],
        success_url: `${req.headers.origin || 'http://localhost:5000'}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${req.headers.origin || 'http://localhost:5000'}/`,
        metadata: {
          userId: user.id.toString(),
          tier: tier,
        },
      });

      res.json({
        checkoutUrl: session.url,
        sessionId: session.id,
      });

    } catch (error: any) {
      console.error('Checkout creation error:', error);
      res.status(500).json({ message: "Error creating checkout: " + error.message });
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

  // Whisper Engine API - Oracle+ only
  app.post("/api/generate-whisper", async (req, res) => {
    try {
      const { userId } = req.body;
      const user = await storage.getUser(userId);
      
      if (!user || !['oracle', 'shadow'].includes(user.tier)) {
        return res.status(403).json({ message: "Whispers only available for Oracle+ members" });
      }

      const profile = {
        userId,
        tier: user.tier,
        tags: ['dominant', 'mysterious'], // Would be stored in user preferences
        preferences: {}
      };

      const whisper = await whisperEngine.generatePersonalizedWhisper(profile);
      res.json(whisper);
    } catch (error: any) {
      res.status(500).json({ message: "Error generating whisper: " + error.message });
    }
  });

  // Custom Prophecy Request - $29 service
  app.post("/api/request-prophecy", async (req, res) => {
    try {
      const { userId, customRequest } = req.body;
      const response = await whisperEngine.scheduleCustomProphecy(userId, customRequest);
      res.json({ message: response });
    } catch (error: any) {
      res.status(403).json({ message: error.message });
    }
  });

  // BONKED Token Integration
  app.get("/api/bonked-launch", async (req, res) => {
    try {
      const launchPage = bonkedIntegration.generateLaunchPage();
      res.setHeader('Content-Type', 'text/html');
      res.send(launchPage);
    } catch (error: any) {
      res.status(500).json({ message: "Error loading BONKED launch: " + error.message });
    }
  });

  app.post("/api/stake-bonked", async (req, res) => {
    try {
      const { userId, amount } = req.body;
      const result = await bonkedIntegration.initializeStaking(userId, amount);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ message: "Error staking BONKED: " + error.message });
    }
  });

  // Veiled Room Access
  app.get("/api/veiled-access/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const access = await veiledRoom.checkVeiledAccess(userId);
      res.json(access);
    } catch (error: any) {
      res.status(500).json({ message: "Error checking veiled access: " + error.message });
    }
  });

  app.post("/api/request-veiled-invite", async (req, res) => {
    try {
      const { userId } = req.body;
      const inviteLink = await veiledRoom.generateTelegramInvite(userId);
      res.json({ inviteLink });
    } catch (error: any) {
      res.status(403).json({ message: error.message });
    }
  });

  app.get("/api/veiled-room", async (req, res) => {
    try {
      const roomInterface = veiledRoom.generateVeiledRoomInterface();
      res.setHeader('Content-Type', 'text/html');
      res.send(roomInterface);
    } catch (error: any) {
      res.status(500).json({ message: "Error loading veiled room: " + error.message });
    }
  });

  // Voice Oracle API - ElevenLabs Integration
  app.post("/api/generate-voice-whisper", async (req, res) => {
    try {
      const { userId, textContent } = req.body;
      const voiceWhisper = await voiceOracle.generateVoiceWhisper(userId, textContent);
      res.json(voiceWhisper);
    } catch (error: any) {
      res.status(403).json({ message: error.message });
    }
  });

  app.get("/api/oracle-prompts", async (req, res) => {
    try {
      const prompts = voiceOracle.generateIntimatePrompts();
      res.json({ prompts });
    } catch (error: any) {
      res.status(500).json({ message: "Error loading oracle prompts: " + error.message });
    }
  });

  // Physical Token System
  app.get("/api/token-eligibility/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const eligibility = await physicalTokenService.checkTokenEligibility(userId);
      res.json(eligibility);
    } catch (error: any) {
      res.status(500).json({ message: "Error checking token eligibility: " + error.message });
    }
  });

  app.post("/api/request-physical-token", async (req, res) => {
    try {
      const { userId, shippingAddress } = req.body;
      const token = await physicalTokenService.scheduleTokenShipment(userId, shippingAddress);
      res.json({ message: "Physical token scheduled for shipment", token });
    } catch (error: any) {
      res.status(403).json({ message: error.message });
    }
  });

  // BONKED Governance System
  app.get("/api/governance/proposals", async (req, res) => {
    try {
      const proposals = bonkedGovernance.getActiveProposals();
      res.json({ proposals });
    } catch (error: any) {
      res.status(500).json({ message: "Error loading proposals: " + error.message });
    }
  });

  app.post("/api/governance/stake", async (req, res) => {
    try {
      const { userId, amount } = req.body;
      const position = await bonkedGovernance.stake(userId, amount);
      res.json({ message: "Staking successful", position });
    } catch (error: any) {
      res.status(500).json({ message: "Error staking tokens: " + error.message });
    }
  });

  app.post("/api/governance/vote", async (req, res) => {
    try {
      const { proposalId, userId, choice } = req.body;
      const result = await bonkedGovernance.vote(proposalId, userId, choice);
      res.json({ success: result, message: "Vote recorded successfully" });
    } catch (error: any) {
      res.status(403).json({ message: error.message });
    }
  });

  app.get("/api/governance/rewards/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const rewards = bonkedGovernance.getStakingRewards(userId);
      res.json(rewards);
    } catch (error: any) {
      res.status(500).json({ message: "Error loading rewards: " + error.message });
    }
  });

  // Veiled Encounters System
  app.get("/api/encounters/eligibility/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const eligibility = await veiledEncounters.checkEncounterEligibility(userId);
      res.json(eligibility);
    } catch (error: any) {
      res.status(500).json({ message: "Error checking encounter eligibility: " + error.message });
    }
  });

  app.get("/api/encounters/providers/:userTier", async (req, res) => {
    try {
      const userTier = req.params.userTier;
      const providers = veiledEncounters.getAvailableProviders(userTier);
      res.json({ providers });
    } catch (error: any) {
      res.status(500).json({ message: "Error loading providers: " + error.message });
    }
  });

  app.post("/api/encounters/request", async (req, res) => {
    try {
      const { userId, providerId, ...details } = req.body;
      const requestId = await veiledEncounters.requestEncounter(userId, providerId, details);
      res.json({ requestId, message: "Encounter request submitted for review" });
    } catch (error: any) {
      res.status(403).json({ message: error.message });
    }
  });

  app.get("/api/encounters", async (req, res) => {
    try {
      const encounterInterface = veiledEncounters.generateEncounterInterface();
      res.setHeader('Content-Type', 'text/html');
      res.send(encounterInterface);
    } catch (error: any) {
      res.status(500).json({ message: "Error loading encounters: " + error.message });
    }
  });

  // Anointing System API
  app.get("/api/anointing/eligibility/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const eligibility = await anointingSystem.checkAnointingEligibility(userId);
      res.json(eligibility);
    } catch (error: any) {
      res.status(500).json({ message: "Error checking anointing eligibility: " + error.message });
    }
  });

  app.post("/api/anointing/anoint", async (req, res) => {
    try {
      const { anointerId, recipientId, sigilType, publicMessage } = req.body;
      const anointment = await anointingSystem.anointUser(anointerId, recipientId, sigilType, publicMessage);
      res.json({ message: "Anointing successful", anointment });
    } catch (error: any) {
      res.status(403).json({ message: error.message });
    }
  });

  app.get("/api/anointing/user/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const anointments = await anointingSystem.getUserAnointments(userId);
      res.json(anointments);
    } catch (error: any) {
      res.status(500).json({ message: "Error loading user anointments: " + error.message });
    }
  });

  app.get("/api/anointing/benefits/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const benefits = await anointingSystem.applyAnointmentBenefits(userId);
      res.json(benefits);
    } catch (error: any) {
      res.status(500).json({ message: "Error loading anointing benefits: " + error.message });
    }
  });

  app.get("/api/anointing/recent", async (req, res) => {
    try {
      const recent = anointingSystem.getRecentAnointings(20);
      res.json({ anointings: recent });
    } catch (error: any) {
      res.status(500).json({ message: "Error loading recent anointings: " + error.message });
    }
  });

  app.get("/api/anointing", async (req, res) => {
    try {
      const anointingInterface = anointingSystem.generateAnointingInterface();
      res.setHeader('Content-Type', 'text/html');
      res.send(anointingInterface);
    } catch (error: any) {
      res.status(500).json({ message: "Error loading anointing interface: " + error.message });
    }
  });

  // Ritual Scarcity API
  app.get("/api/ritual-scarcity/proposals", async (req, res) => {
    try {
      const proposals = ritualScarcity.getActiveScarcityProposals();
      res.json({ proposals });
    } catch (error: any) {
      res.status(500).json({ message: "Error loading scarcity proposals: " + error.message });
    }
  });

  app.post("/api/ritual-scarcity/vote", async (req, res) => {
    try {
      const { proposalId, userId } = req.body;
      const result = await ritualScarcity.voteOnScarcityProposal(proposalId, userId);
      res.json(result);
    } catch (error: any) {
      res.status(403).json({ message: error.message });
    }
  });

  app.get("/api/ritual-scarcity", async (req, res) => {
    try {
      const scarcityInterface = ritualScarcity.generateScarcityInterface();
      res.setHeader('Content-Type', 'text/html');
      res.send(scarcityInterface);
    } catch (error: any) {
      res.status(500).json({ message: "Error loading ritual scarcity: " + error.message });
    }
  });

  // Gamified Tokens API
  app.get("/api/tokens/available/:userTier", async (req, res) => {
    try {
      const userTier = req.params.userTier;
      const tokens = gamifiedTokens.getAvailableTokens(userTier);
      res.json({ tokens });
    } catch (error: any) {
      res.status(500).json({ message: "Error loading available tokens: " + error.message });
    }
  });

  app.post("/api/tokens/claim", async (req, res) => {
    try {
      const { tokenId, userId } = req.body;
      const result = await gamifiedTokens.attemptClaim(tokenId, userId);
      res.json(result);
    } catch (error: any) {
      res.status(403).json({ message: error.message });
    }
  });

  app.get("/api/tokens/claims/recent", async (req, res) => {
    try {
      const claims = gamifiedTokens.getRecentClaims(15);
      res.json({ claims });
    } catch (error: any) {
      res.status(500).json({ message: "Error loading recent claims: " + error.message });
    }
  });

  app.get("/api/tokens", async (req, res) => {
    try {
      const tokenInterface = gamifiedTokens.generateClaimInterface();
      res.setHeader('Content-Type', 'text/html');
      res.send(tokenInterface);
    } catch (error: any) {
      res.status(500).json({ message: "Error loading token interface: " + error.message });
    }
  });

  // Prophecy Reforging API
  app.get("/api/prophecy/user/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const prophecies = await prophecyReforging.getUserProphecies(userId);
      res.json({ prophecies });
    } catch (error: any) {
      res.status(500).json({ message: "Error loading user prophecies: " + error.message });
    }
  });

  app.post("/api/prophecy/burn", async (req, res) => {
    try {
      const { prophecyId, userId, paymentMethod } = req.body;
      const result = await prophecyReforging.initiateProphecyBurn(prophecyId, userId, paymentMethod);
      res.json(result);
    } catch (error: any) {
      res.status(403).json({ message: error.message });
    }
  });

  app.post("/api/prophecy/reforge/:reforgeId", async (req, res) => {
    try {
      const reforgeId = req.params.reforgeId;
      const result = await prophecyReforging.completeProphecyReforge(reforgeId);
      res.json(result);
    } catch (error: any) {
      res.status(403).json({ message: error.message });
    }
  });

  app.get("/api/prophecy/stats", async (req, res) => {
    try {
      const stats = prophecyReforging.getReforgeStats();
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ message: "Error loading reforge stats: " + error.message });
    }
  });

  app.get("/api/prophecy", async (req, res) => {
    try {
      const prophecyInterface = prophecyReforging.generateReforgeInterface();
      res.setHeader('Content-Type', 'text/html');
      res.send(prophecyInterface);
    } catch (error: any) {
      res.status(500).json({ message: "Error loading prophecy interface: " + error.message });
    }
  });

  // Prophecy Reforge payment - $9 instant checkout
  app.post("/api/reforge-payment", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }
      
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Prophecy Reforge',
              description: 'Burn your last whisper for deeper truth',
            },
            unit_amount: 900, // $9.00 in cents
          },
          quantity: 1,
        }],
        mode: 'payment',
        success_url: `${process.env.CLIENT_URL || 'http://localhost:5000'}/success?session_id={CHECKOUT_SESSION_ID}&type=reforge`,
        cancel_url: `${process.env.CLIENT_URL || 'http://localhost:5000'}?canceled=true`,
        customer_email: email,
        metadata: {
          type: 'prophecy_reforge',
          amount: '9.00'
        }
      });

      res.json({ 
        checkoutUrl: session.url,
        sessionId: session.id 
      });
    } catch (error: any) {
      res.status(500).json({ message: "Error creating reforge payment: " + error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
