import { 
  users, 
  newsSources,
  contentItems, 
  campaigns,
  type User, 
  type InsertUser,
  type NewsSource,
  type InsertNewsSource,
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

  // News Sources
  getNewsSources(userId: number): Promise<NewsSource[]>;
  getNewsSource(id: number): Promise<NewsSource | undefined>;
  createNewsSource(source: InsertNewsSource): Promise<NewsSource>;
  updateNewsSource(id: number, updates: Partial<NewsSource>): Promise<NewsSource | undefined>;
  deleteNewsSource(id: number): Promise<boolean>;

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
    articlesGenerated: number;
    newsSources: number;
    successRate: number;
    queueLength: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }

  async getNewsSources(userId: number): Promise<NewsSource[]> {
    return db.select().from(newsSources).where(eq(newsSources.userId, userId));
  }

  async getNewsSource(id: number): Promise<NewsSource | undefined> {
    const result = await db.select().from(newsSources).where(eq(newsSources.id, id)).limit(1);
    return result[0];
  }

  async createNewsSource(insertSource: InsertNewsSource): Promise<NewsSource> {
    const result = await db.insert(newsSources).values(insertSource).returning();
    return result[0];
  }

  async updateNewsSource(id: number, updates: Partial<NewsSource>): Promise<NewsSource | undefined> {
    const result = await db.update(newsSources)
      .set(updates)
      .where(eq(newsSources.id, id))
      .returning();
    return result[0];
  }

  async deleteNewsSource(id: number): Promise<boolean> {
    const result = await db.delete(newsSources).where(eq(newsSources.id, id)).returning();
    return result.length > 0;
  }

  async getContentItems(userId: number, status?: string): Promise<ContentItem[]> {
    const query = db.select().from(contentItems).where(eq(contentItems.userId, userId));
    
    if (status) {
      return query.where(and(eq(contentItems.userId, userId), eq(contentItems.status, status)));
    }
    
    return query;
  }

  async getContentItem(id: number): Promise<ContentItem | undefined> {
    const result = await db.select().from(contentItems).where(eq(contentItems.id, id)).limit(1);
    return result[0];
  }

  async createContentItem(insertItem: InsertContentItem): Promise<ContentItem> {
    const result = await db.insert(contentItems).values(insertItem).returning();
    return result[0];
  }

  async updateContentItem(id: number, updates: Partial<ContentItem>): Promise<ContentItem | undefined> {
    const result = await db.update(contentItems)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(contentItems.id, id))
      .returning();
    return result[0];
  }

  async deleteContentItem(id: number): Promise<boolean> {
    const result = await db.delete(contentItems).where(eq(contentItems.id, id)).returning();
    return result.length > 0;
  }

  async getCampaigns(userId: number): Promise<Campaign[]> {
    return db.select().from(campaigns).where(eq(campaigns.userId, userId));
  }

  async getCampaign(id: number): Promise<Campaign | undefined> {
    const result = await db.select().from(campaigns).where(eq(campaigns.id, id)).limit(1);
    return result[0];
  }

  async createCampaign(insertCampaign: InsertCampaign): Promise<Campaign> {
    const result = await db.insert(campaigns).values(insertCampaign).returning();
    return result[0];
  }

  async updateCampaign(id: number, updates: Partial<Campaign>): Promise<Campaign | undefined> {
    const result = await db.update(campaigns)
      .set(updates)
      .where(eq(campaigns.id, id))
      .returning();
    return result[0];
  }

  async deleteCampaign(id: number): Promise<boolean> {
    const result = await db.delete(campaigns).where(eq(campaigns.id, id)).returning();
    return result.length > 0;
  }

  async getStats(userId: number): Promise<{
    articlesGenerated: number;
    newsSources: number;
    successRate: number;
    queueLength: number;
  }> {
    const [userNewsSources, userContentItems] = await Promise.all([
      this.getNewsSources(userId),
      this.getContentItems(userId)
    ]);

    const articlesGenerated = userContentItems.length;
    const newsSources = userNewsSources.length;
    const approvedArticles = userContentItems.filter(item => item.status === 'approved').length;
    const successRate = articlesGenerated > 0 ? Math.round((approvedArticles / articlesGenerated) * 100) : 0;
    const queueLength = userContentItems.filter(item => item.status === 'pending').length;

    return {
      articlesGenerated,
      newsSources,
      successRate,
      queueLength
    };
  }
}

export const storage = new DatabaseStorage();