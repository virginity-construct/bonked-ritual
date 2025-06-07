import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  tier: text("tier").notNull().default("initiate"), // initiate, herald, oracle, shadow
  walletAddress: text("wallet_address"), // Silent Solana wallet
  nftTokenId: text("nft_token_id"), // Helius-minted NFT
  createdAt: timestamp("created_at").defaultNow(),
  lastActiveAt: timestamp("last_active_at").defaultNow(),
});

export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  tier: text("tier").notNull(),
  status: text("status").notNull(), // active, cancelled, past_due
  currentPeriodEnd: timestamp("current_period_end"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const nftTokens = pgTable("nft_tokens", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  tokenId: text("token_id").notNull(),
  tier: text("tier").notNull(),
  mintSignature: text("mint_signature"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  tier: true,
});

export const insertSubscriptionSchema = createInsertSchema(subscriptions).pick({
  userId: true,
  tier: true,
  status: true,
  currentPeriodEnd: true,
});

export const insertNftTokenSchema = createInsertSchema(nftTokens).pick({
  userId: true,
  tokenId: true,
  tier: true,
  mintSignature: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type Subscription = typeof subscriptions.$inferSelect;
export type InsertNftToken = z.infer<typeof insertNftTokenSchema>;
export type NftToken = typeof nftTokens.$inferSelect;
