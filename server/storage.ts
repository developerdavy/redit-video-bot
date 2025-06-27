import { 
  users, 
  redditSources, 
  contentItems, 
  campaigns,
  type User, 
  type InsertUser,
  type RedditSource,
  type InsertRedditSource,
  type ContentItem,
  type InsertContentItem,
  type Campaign,
  type InsertCampaign
} from "@shared/schema";

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
    redditSources: number;
    successRate: number;
    queueLength: number;
  }>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private redditSources: Map<number, RedditSource>;
  private contentItems: Map<number, ContentItem>;
  private campaigns: Map<number, Campaign>;
  private currentUserId: number;
  private currentRedditSourceId: number;
  private currentContentItemId: number;
  private currentCampaignId: number;

  constructor() {
    this.users = new Map();
    this.redditSources = new Map();
    this.contentItems = new Map();
    this.campaigns = new Map();
    this.currentUserId = 1;
    this.currentRedditSourceId = 1;
    this.currentContentItemId = 1;
    this.currentCampaignId = 1;

    // Create default user for demo
    this.createUser({ username: "demo", password: "demo" });
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
    redditSources: number;
    successRate: number;
    queueLength: number;
  }> {
    const userContentItems = await this.getContentItems(userId);
    const userRedditSources = await this.getRedditSources(userId);
    const queueItems = await this.getContentItems(userId, "pending");
    const approvedItems = userContentItems.filter(item => item.status === "approved" || item.status === "posted");
    
    return {
      videosGenerated: userContentItems.length,
      redditSources: userRedditSources.filter(source => source.isActive).length,
      successRate: userContentItems.length > 0 ? (approvedItems.length / userContentItems.length) * 100 : 0,
      queueLength: queueItems.length
    };
  }
}

export const storage = new MemStorage();
