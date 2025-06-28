import { GoogleGenerativeAI } from "@google/generative-ai";

// DON'T DELETE THIS COMMENT
// Follow these instructions when using this blueprint:
// - Note that the newest Gemini model series is "gemini-2.5-flash" or gemini-2.5-pro"
//   - do not change this unless explicitly requested by the user

// This API key is from Gemini Developer API Key, not vertex AI API Key
const genai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export class GeminiService {
  async generateYouTubeContent(
    title: string, 
    content: string, 
    source: string
  ): Promise<{ title: string; description: string; tags: string[]; thumbnail_text: string; hook: string }> {
    try {
      const systemPrompt = `You are a top YouTube content strategist who creates viral, engaging content that gets millions of views. 
Your expertise is transforming news articles into compelling YouTube content that captures attention and drives engagement.`;

      const prompt = `Transform this news article into engaging YouTube content:

Article Title: ${title}
Content: ${content}
Source: ${source}

Create optimized YouTube content with these elements:

1. CATCHY TITLE: Rewrite the title to be more engaging, use power words, create curiosity, and appeal to emotions. Make it YouTube-friendly and clickable.

2. ENGAGING DESCRIPTION: Write a compelling description that:
   - Hooks viewers in the first 2 lines
   - Explains why this matters to them
   - Creates urgency or curiosity
   - Includes call-to-action for engagement
   - Uses relevant keywords naturally
   - 150-200 words

3. STRATEGIC TAGS: Generate 8-12 relevant tags that help with discovery

4. THUMBNAIL TEXT: Suggest 2-4 words for thumbnail overlay that create curiosity

5. OPENING HOOK: Write a compelling 15-20 second opening script that immediately grabs attention

Focus on making content that:
- Appeals to emotions (surprise, curiosity, concern, excitement)
- Uses storytelling elements
- Creates urgency or FOMO
- Relates to viewer's life
- Promises value or revelation

Respond with JSON in this exact format:
{
  "title": "optimized title",
  "description": "engaging description",
  "tags": ["tag1", "tag2", "tag3"],
  "thumbnail_text": "2-4 words",
  "hook": "opening script"
}`;

      const model = genai.getGenerativeModel({ model: "gemini-2.5-flash" });
      
      const response = await model.generateContent(`${systemPrompt}\n\n${prompt}`);

      const resultText = response.response.text();
      
      // Clean up the response text to extract JSON from markdown code blocks
      let cleanText = resultText.trim();
      if (cleanText.startsWith('```json')) {
        cleanText = cleanText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanText.startsWith('```')) {
        cleanText = cleanText.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      const parsed = JSON.parse(cleanText);
      return {
        title: parsed.title || title,
        description: parsed.description || "Failed to generate description",
        tags: parsed.tags || [],
        thumbnail_text: parsed.thumbnail_text || "",
        hook: parsed.hook || ""
      };
    } catch (error) {
      console.error("Error generating YouTube content:", error);
      return {
        title,
        description: "Failed to generate content",
        tags: [],
        thumbnail_text: "",
        hook: ""
      };
    }
  }

  async generateBulkDescriptions(items: Array<{
    title: string;
    content: string;
    source: string;
  }>): Promise<string[]> {
    const descriptions = [];
    
    for (const item of items) {
      try {
        const youtubeContent = await this.generateYouTubeContent(
          item.title, 
          item.content, 
          item.source
        );
        descriptions.push(youtubeContent.description);
        
        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`Failed to generate description for "${item.title}":`, error);
        descriptions.push(`Breaking: ${item.title} - Stay informed with the latest updates from ${item.source}. Like and subscribe for more news content!`);
      }
    }
    
    return descriptions;
  }
}

export const geminiService = new GeminiService();