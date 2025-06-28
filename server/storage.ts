import { 
  users, 
  redditSources, 
  tiktokSources,
  contentItems, 
  campaigns,
  type User, 
  type InsertUser,
  type RedditSource,
  type InsertRedditSource,
  type TiktokSource,
  type InsertTiktokSource,
  type ContentItem,
  type InsertContentItem,
  type Campaign,
  type InsertCampaign
} from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Reddit Sources
  getRedditSources(userId: number): Promise<RedditSource[]>;
  getRedditSource(id: number): Promise<RedditSource | undefined>;
  createRedditSource(source: InsertRedditSource): Promise<RedditSource>;
  updateRedditSource(id: number, updates: Partial<RedditSource>): Promise<RedditSource | undefined>;
  deleteRedditSource(id: number): Promise<boolean>;

  // TikTok Sources
  getTiktokSources(userId: number): Promise<TiktokSource[]>;
  getTiktokSource(id: number): Promise<TiktokSource | undefined>;
  createTiktokSource(source: InsertTiktokSource): Promise<TiktokSource>;
  updateTiktokSource(id: number, updates: Partial<TiktokSource>): Promise<TiktokSource | undefined>;
  deleteTiktokSource(id: number): Promise<boolean>;

  // Content Items
  getContentItems(userId: number, status?: string): Promise<ContentItem[]>;
  getContentItem(id: number): Promise<ContentItem | undefined>;
  createContentItem(item: InsertContentItem): Promise<ContentItem>;
  updateContentItem(id: number, updates: Partial<ContentItem>): Promise<ContentItem | undefined>;
  deleteContentItem(id: number): Promise<boolean>;

  // Campaigns
  getCampaigns(userId: number): Promise<Campaign[]>;
  getCampaign(id: number): Promise<Campaign | undefined>;
  createCampaign(campaign: InsertCampaign): Promise<Campaign>;
  updateCampaign(id: number, updates: Partial<Campaign>): Promise<Campaign | undefined>;
  deleteCampaign(id: number): Promise<boolean>;

  // Stats
  getStats(userId: number): Promise<{
    videosGenerated: number;
    tiktokSources: number;
    successRate: number;
    queueLength: number;
  }>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private redditSources: Map<number, RedditSource>;
  private tiktokSources: Map<number, TiktokSource>;
  private contentItems: Map<number, ContentItem>;
  private campaigns: Map<number, Campaign>;
  private currentUserId: number;
  private currentRedditSourceId: number;
  private currentTiktokSourceId: number;
  private currentContentItemId: number;
  private currentCampaignId: number;

  constructor() {
    this.users = new Map();
    this.redditSources = new Map();
    this.tiktokSources = new Map();
    this.contentItems = new Map();
    this.campaigns = new Map();
    this.currentUserId = 1;
    this.currentRedditSourceId = 1;
    this.currentTiktokSourceId = 1;
    this.currentContentItemId = 1;
    this.currentCampaignId = 1;

    // Create default user for demo
    this.createUser({ username: "demo", password: "demo" });
    
    // Add demo Reddit sources synchronously
    this.seedDemoSources();
  }

  private seedDemoSources() {
    // Add popular video subreddits
    const demoSources = [
      { subreddit: "funny", isActive: true },
      { subreddit: "nextfuckinglevel", isActive: true },
      { subreddit: "PublicFreakout", isActive: false },
      { subreddit: "interestingasfuck", isActive: true }
    ];

    demoSources.forEach(source => {
      const id = this.currentRedditSourceId++;
      const redditSource = {
        id,
        userId: 1,
        subreddit: source.subreddit,
        isActive: source.isActive,
        createdAt: new Date()
      };
      this.redditSources.set(id, redditSource);
    });
  }

  // Users
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Reddit Sources
  async getRedditSources(userId: number): Promise<RedditSource[]> {
    return Array.from(this.redditSources.values()).filter(source => source.userId === userId);
  }

  async getRedditSource(id: number): Promise<RedditSource | undefined> {
    return this.redditSources.get(id);
  }

  async createRedditSource(insertSource: InsertRedditSource): Promise<RedditSource> {
    const id = this.currentRedditSourceId++;
    const source: RedditSource = { 
      ...insertSource, 
      id, 
      isActive: insertSource.isActive ?? true,
      createdAt: new Date() 
    };
    this.redditSources.set(id, source);
    return source;
  }

  async updateRedditSource(id: number, updates: Partial<RedditSource>): Promise<RedditSource | undefined> {
    const source = this.redditSources.get(id);
    if (!source) return undefined;
    
    const updated = { ...source, ...updates };
    this.redditSources.set(id, updated);
    return updated;
  }

  async deleteRedditSource(id: number): Promise<boolean> {
    return this.redditSources.delete(id);
  }

  // TikTok Sources
  async getTiktokSources(userId: number): Promise<TiktokSource[]> {
    return Array.from(this.tiktokSources.values()).filter(source => source.userId === userId);
  }

  async getTiktokSource(id: number): Promise<TiktokSource | undefined> {
    return this.tiktokSources.get(id);
  }

  async createTiktokSource(insertSource: InsertTiktokSource): Promise<TiktokSource> {
    const id = this.currentTiktokSourceId++;
    const source: TiktokSource = { 
      ...insertSource, 
      id, 
      isActive: insertSource.isActive ?? true,
      createdAt: new Date() 
    };
    this.tiktokSources.set(id, source);
    return source;
  }

  async updateTiktokSource(id: number, updates: Partial<TiktokSource>): Promise<TiktokSource | undefined> {
    const source = this.tiktokSources.get(id);
    if (!source) return undefined;
    
    const updated = { ...source, ...updates };
    this.tiktokSources.set(id, updated);
    return updated;
  }

  async deleteTiktokSource(id: number): Promise<boolean> {
    return this.tiktokSources.delete(id);
  }

  // Content Items
  async getContentItems(userId: number, status?: string): Promise<ContentItem[]> {
    return Array.from(this.contentItems.values()).filter(item => {
      const userMatch = item.userId === userId;
      const statusMatch = !status || item.status === status;
      return userMatch && statusMatch;
    });
  }

  async getContentItem(id: number): Promise<ContentItem | undefined> {
    return this.contentItems.get(id);
  }

  async createContentItem(insertItem: InsertContentItem): Promise<ContentItem> {
    const id = this.currentContentItemId++;
    const now = new Date();
    const item: ContentItem = { 
      ...insertItem, 
      id, 
      redditSourceId: insertItem.redditSourceId ?? null,
      tiktokSourceId: insertItem.tiktokSourceId ?? null,
      status: insertItem.status ?? "pending",
      thumbnailUrl: insertItem.thumbnailUrl ?? null,
      duration: insertItem.duration ?? null,
      upvotes: insertItem.upvotes ?? 0,
      aiDescription: insertItem.aiDescription ?? null,
      scheduledAt: insertItem.scheduledAt ?? null,
      createdAt: now,
      updatedAt: now
    };
    this.contentItems.set(id, item);
    return item;
  }

  async updateContentItem(id: number, updates: Partial<ContentItem>): Promise<ContentItem | undefined> {
    const item = this.contentItems.get(id);
    if (!item) return undefined;
    
    const updated = { ...item, ...updates, updatedAt: new Date() };
    this.contentItems.set(id, updated);
    return updated;
  }

  async deleteContentItem(id: number): Promise<boolean> {
    return this.contentItems.delete(id);
  }

  // Campaigns
  async getCampaigns(userId: number): Promise<Campaign[]> {
    return Array.from(this.campaigns.values()).filter(campaign => campaign.userId === userId);
  }

  async getCampaign(id: number): Promise<Campaign | undefined> {
    return this.campaigns.get(id);
  }

  async createCampaign(insertCampaign: InsertCampaign): Promise<Campaign> {
    const id = this.currentCampaignId++;
    const campaign: Campaign = { 
      ...insertCampaign, 
      id, 
      isActive: insertCampaign.isActive ?? true,
      description: insertCampaign.description ?? null,
      settings: insertCampaign.settings ?? null,
      createdAt: new Date() 
    };
    this.campaigns.set(id, campaign);
    return campaign;
  }

  async updateCampaign(id: number, updates: Partial<Campaign>): Promise<Campaign | undefined> {
    const campaign = this.campaigns.get(id);
    if (!campaign) return undefined;
    
    const updated = { ...campaign, ...updates };
    this.campaigns.set(id, updated);
    return updated;
  }

  async deleteCampaign(id: number): Promise<boolean> {
    return this.campaigns.delete(id);
  }

  // Stats
  async getStats(userId: number): Promise<{
    videosGenerated: number;
    tiktokSources: number;
    successRate: number;
    queueLength: number;
  }> {
    const userContentItems = await this.getContentItems(userId);
    const userTiktokSources = await this.getTiktokSources(userId);
    const queueItems = await this.getContentItems(userId, "pending");
    const approvedItems = userContentItems.filter(item => item.status === "approved" || item.status === "posted");
    
    return {
      videosGenerated: userContentItems.length,
      tiktokSources: userTiktokSources.filter(source => source.isActive).length,
      successRate: userContentItems.length > 0 ? (approvedItems.length / userContentItems.length) * 100 : 0,
      queueLength: queueItems.length
    };
  }
}

// Database Storage Implementation
export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    if (!db) throw new Error("Database not configured");
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  // Reddit Sources
  async getRedditSources(userId: number): Promise<RedditSource[]> {
    return await db.select().from(redditSources).where(eq(redditSources.userId, userId));
  }

  async getRedditSource(id: number): Promise<RedditSource | undefined> {
    const [source] = await db.select().from(redditSources).where(eq(redditSources.id, id));
    return source || undefined;
  }

  async createRedditSource(insertSource: InsertRedditSource): Promise<RedditSource> {
    const [source] = await db
      .insert(redditSources)
      .values(insertSource)
      .returning();
    return source;
  }

  async updateRedditSource(id: number, updates: Partial<RedditSource>): Promise<RedditSource | undefined> {
    const [source] = await db
      .update(redditSources)
      .set(updates)
      .where(eq(redditSources.id, id))
      .returning();
    return source || undefined;
  }

  async deleteRedditSource(id: number): Promise<boolean> {
    const result = await db
      .delete(redditSources)
      .where(eq(redditSources.id, id));
    return (result.rowCount || 0) > 0;
  }

  // TikTok Sources
  async getTiktokSources(userId: number): Promise<TiktokSource[]> {
    return await db.select().from(tiktokSources).where(eq(tiktokSources.userId, userId));
  }

  async getTiktokSource(id: number): Promise<TiktokSource | undefined> {
    const [source] = await db.select().from(tiktokSources).where(eq(tiktokSources.id, id));
    return source || undefined;
  }

  async createTiktokSource(insertSource: InsertTiktokSource): Promise<TiktokSource> {
    const [source] = await db
      .insert(tiktokSources)
      .values(insertSource)
      .returning();
    return source;
  }

  async updateTiktokSource(id: number, updates: Partial<TiktokSource>): Promise<TiktokSource | undefined> {
    const [source] = await db
      .update(tiktokSources)
      .set(updates)
      .where(eq(tiktokSources.id, id))
      .returning();
    return source || undefined;
  }

  async deleteTiktokSource(id: number): Promise<boolean> {
    const result = await db
      .delete(tiktokSources)
      .where(eq(tiktokSources.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Content Items
  async getContentItems(userId: number, status?: string): Promise<ContentItem[]> {
    if (status) {
      return await db.select().from(contentItems).where(
        and(eq(contentItems.userId, userId), eq(contentItems.status, status))
      );
    }
    return await db.select().from(contentItems).where(eq(contentItems.userId, userId));
  }

  async getContentItem(id: number): Promise<ContentItem | undefined> {
    const [item] = await db.select().from(contentItems).where(eq(contentItems.id, id));
    return item || undefined;
  }

  async createContentItem(insertItem: InsertContentItem): Promise<ContentItem> {
    const [item] = await db
      .insert(contentItems)
      .values(insertItem)
      .returning();
    return item;
  }

  async updateContentItem(id: number, updates: Partial<ContentItem>): Promise<ContentItem | undefined> {
    const [item] = await db
      .update(contentItems)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(contentItems.id, id))
      .returning();
    return item || undefined;
  }

  async deleteContentItem(id: number): Promise<boolean> {
    const result = await db
      .delete(contentItems)
      .where(eq(contentItems.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Campaigns
  async getCampaigns(userId: number): Promise<Campaign[]> {
    return await db.select().from(campaigns).where(eq(campaigns.userId, userId));
  }

  async getCampaign(id: number): Promise<Campaign | undefined> {
    const [campaign] = await db.select().from(campaigns).where(eq(campaigns.id, id));
    return campaign || undefined;
  }

  async createCampaign(insertCampaign: InsertCampaign): Promise<Campaign> {
    const [campaign] = await db
      .insert(campaigns)
      .values(insertCampaign)
      .returning();
    return campaign;
  }

  async updateCampaign(id: number, updates: Partial<Campaign>): Promise<Campaign | undefined> {
    const [campaign] = await db
      .update(campaigns)
      .set(updates)
      .where(eq(campaigns.id, id))
      .returning();
    return campaign || undefined;
  }

  async deleteCampaign(id: number): Promise<boolean> {
    const result = await db
      .delete(campaigns)
      .where(eq(campaigns.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Stats
  async getStats(userId: number): Promise<{
    videosGenerated: number;
    tiktokSources: number;
    successRate: number;
    queueLength: number;
  }> {
    const totalItems = await db.select().from(contentItems).where(eq(contentItems.userId, userId));
    const totalSources = await db.select().from(tiktokSources).where(eq(tiktokSources.userId, userId));
    const approvedItems = await db.select().from(contentItems).where(
      and(eq(contentItems.userId, userId), eq(contentItems.status, "approved"))
    );
    const pendingItems = await db.select().from(contentItems).where(
      and(eq(contentItems.userId, userId), eq(contentItems.status, "pending"))
    );

    const totalCount = totalItems.length;
    const approvedCount = approvedItems.length;
    
    return {
      videosGenerated: approvedCount,
      tiktokSources: totalSources.length,
      successRate: totalCount > 0 ? Math.round((approvedCount / totalCount) * 100) : 0,
      queueLength: pendingItems.length
    };
  }
}

export const storage = new MemStorage();
