import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { newsService } from "./services/news";
import { geminiService } from "./services/gemini";
import { youtubeService } from "./services/youtube";
import { videoGenerationService } from "./services/video-simple";
import { insertNewsSourceSchema, insertContentItemSchema, insertCampaignSchema } from "@shared/schema";

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

  // News Sources CRUD operations
  app.get("/api/news-sources", async (req, res) => {
    try {
      const sources = await storage.getNewsSources(DEMO_USER_ID);
      res.json(sources);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.post("/api/news-sources", async (req, res) => {
    try {
      const validatedData = insertNewsSourceSchema.parse({
        ...req.body,
        userId: DEMO_USER_ID
      });
      
      const source = await storage.createNewsSource(validatedData);
      res.json(source);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  });

  app.put("/api/news-sources/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { category, keywords, country, isActive } = req.body;
      
      const source = await storage.updateNewsSource(id, { category, keywords, country, isActive });
      
      if (!source) {
        return res.status(404).json({ error: "News source not found" });
      }
      
      res.json(source);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  });

  app.delete("/api/news-sources/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteNewsSource(id);
      
      if (!deleted) {
        return res.status(404).json({ error: "News source not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  });

  // Fetch news content by source
  app.post("/api/news-sources/:id/fetch", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const source = await storage.getNewsSource(id);
      
      if (!source) {
        return res.status(404).json({ error: "News source not found" });
      }

      const articles = await newsService.getTopHeadlines(
        source.category, 
        source.country || 'us', 
        source.keywords || undefined, 
        10
      );
      
      if (!articles || articles.length === 0) {
        return res.status(400).json({ 
          error: `No articles found for ${source.category} category${source.keywords ? ` with keywords "${source.keywords}"` : ''}. Try removing keywords or selecting a different category.` 
        });
      }
      
      let fetched = 0;
      for (const article of articles) {
        try {
          // Check if we already have this article
          const existingItems = await storage.getContentItems(DEMO_USER_ID);
          const exists = existingItems.find(item => item.sourceId === article.id);
          
          if (!exists) {
            await storage.createContentItem({
              userId: DEMO_USER_ID,
              newsSourceId: source.id,
              sourceId: article.id,
              title: article.title,
              content: article.content,
              url: article.url,
              imageUrl: article.imageUrl,
              publishedAt: new Date(article.publishedAt),
              sourceName: article.source,
              status: "pending"
            });
            fetched++;
          }
        } catch (itemError) {
          console.error("Error saving content item:", itemError);
        }
      }
      
      res.json({ 
        message: `Successfully fetched ${fetched} new articles from ${source.category} news`,
        totalFound: articles.length,
        newItems: fetched
      });
    } catch (error) {
      console.error("Error fetching news content:", error);
      res.status(500).json({ error: `Failed to fetch news content: ${(error as Error).message}` });
    }
  });

  // Content Items CRUD operations
  app.get("/api/content-items", async (req, res) => {
    try {
      const status = req.query.status as string | undefined;
      const items = await storage.getContentItems(DEMO_USER_ID, status);
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.post("/api/content-items", async (req, res) => {
    try {
      const validatedData = insertContentItemSchema.parse({
        ...req.body,
        userId: DEMO_USER_ID
      });
      
      const item = await storage.createContentItem(validatedData);
      res.json(item);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  });

  app.put("/api/content-items/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      
      const item = await storage.updateContentItem(id, updates);
      
      if (!item) {
        return res.status(404).json({ error: "Content item not found" });
      }
      
      res.json(item);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  });

  app.delete("/api/content-items/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteContentItem(id);
      
      if (!deleted) {
        return res.status(404).json({ error: "Content item not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  });

  // Content Item Actions
  app.post("/api/content-items/:id/approve", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const item = await storage.updateContentItem(id, { status: "approved" });
      
      if (!item) {
        return res.status(404).json({ error: "Content item not found" });
      }
      
      res.json({ success: true, message: "Content item approved" });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.post("/api/content-items/:id/reject", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const item = await storage.updateContentItem(id, { status: "rejected" });
      
      if (!item) {
        return res.status(404).json({ error: "Content item not found" });
      }
      
      res.json({ success: true, message: "Content item rejected" });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // YouTube Content Optimization
  app.post("/api/content-items/:id/youtube-optimize", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { title, content, source } = req.body;
      
      console.log("YouTube optimize request:", { id, title: !!title, content: !!content, source: !!source });
      console.log("Request body:", req.body);
      
      if (!title || !content || !source) {
        return res.status(400).json({ 
          error: "Title, content, and source are required",
          received: { title: !!title, content: !!content, source: !!source }
        });
      }

      const youtubeContent = await geminiService.generateYouTubeContent(title, content, source);
      
      res.json(youtubeContent);
    } catch (error) {
      console.error("Error optimizing YouTube content:", error);
      res.status(500).json({ error: `Failed to optimize content: ${(error as Error).message}` });
    }
  });

  // AI Description Generation
  app.post("/api/content-items/generate-descriptions", async (req, res) => {
    try {
      const { items } = req.body;
      
      if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: "Items array is required" });
      }

      const descriptions = await geminiService.generateBulkDescriptions(items);
      
      // Update each item with its generated description
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const description = descriptions[i];
        
        if (description && item.id) {
          await storage.updateContentItem(item.id, {
            aiDescription: description
          });
        }
      }
      
      res.json({ 
        message: `Generated descriptions for ${descriptions.length} items`,
        descriptions 
      });
    } catch (error) {
      console.error("Error generating descriptions:", error);
      res.status(500).json({ error: `Failed to generate descriptions: ${(error as Error).message}` });
    }
  });

  // Campaigns CRUD operations
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
      const validatedData = insertCampaignSchema.parse({
        ...req.body,
        userId: DEMO_USER_ID
      });
      
      const campaign = await storage.createCampaign(validatedData);
      res.json(campaign);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  });

  app.put("/api/campaigns/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      
      const campaign = await storage.updateCampaign(id, updates);
      
      if (!campaign) {
        return res.status(404).json({ error: "Campaign not found" });
      }
      
      res.json(campaign);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  });

  app.delete("/api/campaigns/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteCampaign(id);
      
      if (!deleted) {
        return res.status(404).json({ error: "Campaign not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  });

  // YouTube Integration (placeholder for future implementation)
  app.post("/api/content-items/:id/upload", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const item = await storage.getContentItem(id);
      
      if (!item) {
        return res.status(404).json({ error: "Content item not found" });
      }

      // This would integrate with YouTube API to upload the content
      const result = await youtubeService.uploadVideo(
        Buffer.from(""), // Placeholder for actual video content
        {
          title: item.title,
          description: item.aiDescription || item.content,
          tags: [],
          categoryId: "22", // People & Blogs
          privacyStatus: "private"
        }
      );
      
      // Update item status to posted
      await storage.updateContentItem(id, { status: "posted" });
      
      res.json({ 
        message: "Content uploaded to YouTube successfully",
        videoUrl: result.url
      });
    } catch (error) {
      console.error("Error uploading to YouTube:", error);
      res.status(500).json({ error: `Failed to upload to YouTube: ${(error as Error).message}` });
    }
  });

  // Video Generation from Articles
  app.post("/api/content-items/:id/generate-video", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { title, content, hook, thumbnailText } = req.body;
      
      if (!title || !content) {
        return res.status(400).json({ error: "Title and content are required" });
      }

      const videoResult = await videoGenerationService.generateVideo({
        title,
        content,
        hook: hook || `Breaking: ${title}`,
        thumbnailText: thumbnailText || title
      });
      
      // Update content item with video path
      await storage.updateContentItem(id, {
        status: "video_generated"
      });
      
      res.json({
        success: true,
        videoPath: videoResult.relativePath,
        duration: videoResult.duration,
        message: "Video generated successfully"
      });
    } catch (error) {
      console.error("Error generating video:", error);
      res.status(500).json({ error: `Failed to generate video: ${(error as Error).message}` });
    }
  });

  // AI Analysis for Compilation Settings
  app.post("/api/content-items/analyze-compilation", async (req, res) => {
    try {
      const { articleIds } = req.body;
      
      if (!Array.isArray(articleIds) || articleIds.length === 0) {
        return res.status(400).json({ error: "Article IDs array is required" });
      }

      // Fetch the articles data
      const articles = [];
      for (const articleId of articleIds) {
        const article = await storage.getContentItem(articleId);
        if (article) {
          articles.push({
            title: article.title,
            content: article.content,
            source: article.sourceName,
            publishedAt: article.publishedAt ? article.publishedAt.toISOString() : new Date().toISOString()
          });
        }
      }

      if (articles.length === 0) {
        return res.status(400).json({ error: "No valid articles found" });
      }

      const analysis = await geminiService.analyzeCompilationArticles(articles);
      
      res.json(analysis);
    } catch (error) {
      console.error("Error analyzing compilation articles:", error);
      res.status(500).json({ error: `Failed to analyze articles: ${(error as Error).message}` });
    }
  });

  // Compilation Video Generation
  app.post("/api/content-items/generate-compilation", async (req, res) => {
    try {
      const { articleIds, compilationTitle, hook, thumbnailText } = req.body;
      
      if (!Array.isArray(articleIds) || articleIds.length === 0) {
        return res.status(400).json({ error: "Article IDs array is required" });
      }
      
      if (!compilationTitle || !hook || !thumbnailText) {
        return res.status(400).json({ error: "Compilation title, hook, and thumbnail text are required" });
      }

      // Fetch the articles data
      const articles = [];
      for (const articleId of articleIds) {
        const article = await storage.getContentItem(articleId);
        if (article) {
          articles.push({
            title: article.title,
            content: article.content,
            source: article.sourceName,
            publishedAt: article.publishedAt ? article.publishedAt.toISOString() : new Date().toISOString()
          });
        }
      }

      if (articles.length === 0) {
        return res.status(400).json({ error: "No valid articles found" });
      }

      // For now, generate a compilation by creating a single video with combined content
      const combinedContent = articles.map((article, index) => 
        `${index + 1}. ${article.title}\n${article.content}\nSource: ${article.source}\n`
      ).join('\n---\n');

      const result = await videoGenerationService.generateVideo({
        title: compilationTitle,
        content: combinedContent,
        hook,
        thumbnailText
      });
      
      res.json({ 
        success: true, 
        videoPath: result.relativePath,
        duration: result.duration,
        articleCount: articles.length,
        message: `Compilation video generated successfully! ${articles.length} articles, ${Math.round(result.duration)}s duration`
      });
    } catch (error) {
      console.error("Error generating compilation video:", error);
      res.status(500).json({ error: `Failed to generate compilation video: ${(error as Error).message}` });
    }
  });

  // Serve generated videos
  app.use("/videos", (req, res, next) => {
    // Basic security: only serve .mp4 files
    if (!req.path.endsWith('.mp4')) {
      return res.status(404).json({ error: "Not found" });
    }
    next();
  }, express.static('./generated-videos'));

  return httpServer;
}