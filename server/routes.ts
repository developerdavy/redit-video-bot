import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { redditService } from "./services/reddit";
import { geminiService } from "./services/gemini";
import { youtubeService } from "./services/youtube";
import { insertRedditSourceSchema, insertTiktokSourceSchema, insertContentItemSchema, insertCampaignSchema } from "@shared/schema";
import { tiktokService } from "./services/tiktok";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // Demo user ID for all operations
  const DEMO_USER_ID = 1;

  // Stats endpoint
  app.get("/api/stats", async (req, res) => {
    try {
      const stats = await storage.getStats(DEMO_USER_ID);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Bulk fetch from all active sources
  app.post("/api/fetch-all-sources", async (req, res) => {
    try {
      const sources = await storage.getRedditSources(DEMO_USER_ID);
      const activeSources = sources.filter(source => source.isActive);
      
      if (activeSources.length === 0) {
        return res.json({ message: "No active Reddit sources found", totalFetched: 0 });
      }

      let totalFetched = 0;
      const results = [];

      for (const source of activeSources) {
        try {
          const videos = await redditService.getPopularVideos(source.subreddit, 5);
          
          for (const video of videos) {
            try {
              // Check if we already have this video
              const existingItems = await storage.getContentItems(DEMO_USER_ID);
              const exists = existingItems.find(item => item.sourceId === video.id);
              
              if (!exists) {
                await storage.createContentItem({
                  userId: DEMO_USER_ID,
                  redditSourceId: source.id,
                  sourceId: video.id,
                  title: video.title,
                  videoUrl: video.videoUrl,
                  thumbnailUrl: video.thumbnailUrl,
                  duration: video.duration,
                  upvotes: video.upvotes,
                  status: "pending"
                });
                totalFetched++;
                results.push({ 
                  source: source.subreddit,
                  id: video.id, 
                  title: video.title, 
                  upvotes: video.upvotes,
                  success: true 
                });
              }
            } catch (error) {
              results.push({ 
                source: source.subreddit,
                id: video.id, 
                title: video.title, 
                success: false, 
                error: (error as Error).message 
              });
            }
          }
        } catch (error) {
          results.push({ 
            source: source.subreddit,
            success: false, 
            error: (error as Error).message 
          });
        }
      }

      res.json({
        totalFetched,
        sourcesFetched: activeSources.length,
        results
      });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Reddit sources endpoints
  app.get("/api/reddit-sources", async (req, res) => {
    try {
      const sources = await storage.getRedditSources(DEMO_USER_ID);
      res.json(sources);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.post("/api/reddit-sources", async (req, res) => {
    try {
      const data = insertRedditSourceSchema.parse({ ...req.body, userId: DEMO_USER_ID });
      
      // Skip subreddit validation to avoid OAuth issues

      const source = await storage.createRedditSource(data);
      res.json(source);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  });

  app.patch("/api/reddit-sources/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const source = await storage.updateRedditSource(id, updates);
      
      if (!source) {
        return res.status(404).json({ error: "Reddit source not found" });
      }
      
      res.json(source);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  });

  app.delete("/api/reddit-sources/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteRedditSource(id);
      
      if (!deleted) {
        return res.status(404).json({ error: "Reddit source not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  });

  // TikTok sources endpoints
  app.get("/api/tiktok-sources", async (req, res) => {
    try {
      const sources = await storage.getTiktokSources(DEMO_USER_ID);
      res.json(sources);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.post("/api/tiktok-sources", async (req, res) => {
    try {
      const data = insertTiktokSourceSchema.parse({ ...req.body, userId: DEMO_USER_ID });
      
      // Skip hashtag validation for now
      const source = await storage.createTiktokSource(data);
      res.json(source);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  });

  app.patch("/api/tiktok-sources/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const source = await storage.updateTiktokSource(id, updates);
      
      if (!source) {
        return res.status(404).json({ error: "TikTok source not found" });
      }
      
      res.json(source);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  });

  app.delete("/api/tiktok-sources/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteTiktokSource(id);
      
      if (!deleted) {
        return res.status(404).json({ error: "TikTok source not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  });

  // Fetch TikTok content by hashtag
  app.post("/api/tiktok-sources/:id/fetch", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const source = await storage.getTiktokSource(id);
      
      if (!source) {
        return res.status(404).json({ error: "TikTok source not found" });
      }

      const videos = await tiktokService.getTrendingVideos(source.hashtag, 10);
      
      if (!videos || videos.length === 0) {
        return res.status(400).json({ 
          error: "Unable to fetch TikTok videos. Please check your API credentials and try again." 
        });
      }
      
      let fetched = 0;
      for (const video of videos) {
        try {
          // Check if we already have this video
          const existingItems = await storage.getContentItems(DEMO_USER_ID);
          const exists = existingItems.find(item => item.sourceId === video.id);
          
          if (!exists) {
            await storage.createContentItem({
              userId: DEMO_USER_ID,
              title: video.title,
              sourceId: video.id,
              videoUrl: video.url,
              thumbnailUrl: video.thumbnailUrl,
              upvotes: video.upvotes,
              duration: video.duration,
              status: "pending",
              tiktokSourceId: source.id,
            });
            fetched++;
          }
        } catch (error) {
          console.error(`Error saving TikTok video ${video.id}:`, error);
        }
      }
      
      res.json({ 
        fetched, 
        total: videos.length,
        message: `Successfully fetched ${fetched} new videos from TikTok hashtag #${source.hashtag}`
      });
    } catch (error) {
      res.status(500).json({ 
        error: `Failed to fetch TikTok content: ${(error as Error).message}` 
      });
    }
  });

  // Content items endpoints
  app.get("/api/content-items", async (req, res) => {
    try {
      const status = req.query.status as string | undefined;
      const items = await storage.getContentItems(DEMO_USER_ID, status);
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.post("/api/content-items/:id/approve", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const item = await storage.updateContentItem(id, { status: "approved" });
      
      if (!item) {
        return res.status(404).json({ error: "Content item not found" });
      }
      
      res.json(item);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  });

  app.post("/api/content-items/:id/reject", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const item = await storage.updateContentItem(id, { status: "rejected" });
      
      if (!item) {
        return res.status(404).json({ error: "Content item not found" });
      }
      
      res.json(item);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  });

  app.post("/api/content-items/:id/schedule", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { scheduledAt } = req.body;
      
      const item = await storage.updateContentItem(id, { 
        scheduledAt: new Date(scheduledAt),
        status: "approved"
      });
      
      if (!item) {
        return res.status(404).json({ error: "Content item not found" });
      }
      
      res.json(item);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  });

  // Fetch new content from Reddit
  app.post("/api/fetch-reddit-content", async (req, res) => {
    try {
      const sources = await storage.getRedditSources(DEMO_USER_ID);
      const activeSources = sources.filter(source => source.isActive);
      
      if (activeSources.length === 0) {
        return res.status(400).json({ error: "No active Reddit sources found" });
      }

      let totalFetched = 0;
      const results = [];

      for (const source of activeSources) {
        try {
          const videos = await redditService.getPopularVideos(source.subreddit, 10);
          
          for (const video of videos) {
            // Check if we already have this video
            const existing = await storage.getContentItems(DEMO_USER_ID);
            const alreadyExists = existing.some(item => item.sourceId === video.id);
            
            if (!alreadyExists) {
              await storage.createContentItem({
                userId: DEMO_USER_ID,
                redditSourceId: source.id,
                sourceId: video.id,
                title: video.title,
                videoUrl: video.videoUrl,
                thumbnailUrl: video.thumbnailUrl,
                duration: video.duration,
                upvotes: video.upvotes,
                status: "pending"
              });
              totalFetched++;
            }
          }
          
          results.push({
            subreddit: source.subreddit,
            fetched: videos.length,
            success: true
          });
        } catch (error) {
          results.push({
            subreddit: source.subreddit,
            fetched: 0,
            success: false,
            error: (error as Error).message
          });
        }
      }

      res.json({
        totalFetched,
        results
      });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Generate AI descriptions
  app.post("/api/generate-descriptions", async (req, res) => {
    try {
      const { contentItemIds } = req.body;
      
      if (!Array.isArray(contentItemIds)) {
        return res.status(400).json({ error: "contentItemIds must be an array" });
      }

      const results = [];

      for (const itemId of contentItemIds) {
        try {
          const item = await storage.getContentItem(itemId);
          if (!item) {
            results.push({ itemId, success: false, error: "Item not found" });
            continue;
          }

          const source = await storage.getRedditSource(item.redditSourceId);
          if (!source) {
            results.push({ itemId, success: false, error: "Source not found" });
            continue;
          }

          const description = await geminiService.generateYouTubeDescription(
            item.title,
            source.subreddit,
            item.upvotes,
            item.duration || 0
          );

          await storage.updateContentItem(itemId, { aiDescription: description });
          results.push({ itemId, success: true, description });
        } catch (error) {
          results.push({ itemId, success: false, error: (error as Error).message });
        }
      }

      res.json({ results });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Bulk generate descriptions for pending items
  app.post("/api/bulk-generate-descriptions", async (req, res) => {
    try {
      const pendingItems = await storage.getContentItems(DEMO_USER_ID, "pending");
      const itemsWithoutDescriptions = pendingItems.filter(item => !item.aiDescription);
      
      if (itemsWithoutDescriptions.length === 0) {
        return res.json({ message: "No items need description generation", processed: 0 });
      }

      let processed = 0;
      const results = [];

      for (const item of itemsWithoutDescriptions) {
        try {
          const source = await storage.getRedditSource(item.redditSourceId);
          if (!source) continue;

          const description = await geminiService.generateYouTubeDescription(
            item.title,
            source.subreddit,
            item.upvotes,
            item.duration || 0
          );

          await storage.updateContentItem(item.id, { aiDescription: description });
          processed++;
          results.push({ itemId: item.id, success: true });
        } catch (error) {
          results.push({ itemId: item.id, success: false, error: (error as Error).message });
        }
      }

      res.json({ processed, results });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Campaigns endpoints
  app.get("/api/campaigns", async (req, res) => {
    try {
      const campaigns = await storage.getCampaigns(DEMO_USER_ID);
      res.json(campaigns);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.post("/api/campaigns", async (req, res) => {
    try {
      const data = insertCampaignSchema.parse({ ...req.body, userId: DEMO_USER_ID });
      const campaign = await storage.createCampaign(data);
      res.json(campaign);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  });

  return httpServer;
}
