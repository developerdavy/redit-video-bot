import { GoogleGenAI } from "@google/genai";

// DON'T DELETE THIS COMMENT
// Follow these instructions when using this blueprint:
// - Note that the newest Gemini model series is "gemini-2.5-flash" or gemini-2.5-pro"
//   - do not change this unless explicitly requested by the user

// This API key is from Gemini Developer API Key, not vertex AI API Key
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export class GeminiService {
  async generateYouTubeDescription(
    title: string, 
    subreddit: string, 
    upvotes: number,
    duration: number
  ): Promise<string> {
    try {
      const systemPrompt = `You are a YouTube content creator expert who writes engaging video descriptions that get high engagement rates. 
Create engaging YouTube video descriptions that maximize views and engagement.
Respond with JSON in this format: {"description": "your generated description"}`;

      const prompt = `Create an engaging YouTube video description for a funny video originally from Reddit. 

Video Details:
- Title: ${title}
- Source: r/${subreddit}
- Upvotes: ${upvotes}
- Duration: ${duration} seconds

Requirements:
- Make it engaging and clickable for YouTube audience
- Include relevant hashtags
- Mention it's from Reddit but make it YouTube-friendly
- Keep it under 200 words
- Include a call-to-action for likes and subscriptions
- Make it sound natural and enthusiastic

Respond with JSON in this format: { "description": "your generated description" }`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: "application/json",
          responseSchema: {
            type: "object",
            properties: {
              description: { type: "string" },
            },
            required: ["description"],
          },
        },
        contents: prompt,
      });

      const rawJson = response.text;
      console.log(`Raw JSON: ${rawJson}`);

      if (rawJson) {
        const result = JSON.parse(rawJson);
        return result.description;
      } else {
        throw new Error("Empty response from model");
      }
    } catch (error) {
      console.error('Error generating AI description:', error);
      throw new Error(`Failed to generate AI description: ${error.message}`);
    }
  }

  async generateBulkDescriptions(items: Array<{
    title: string;
    subreddit: string;
    upvotes: number;
    duration: number;
  }>): Promise<string[]> {
    const descriptions = [];
    
    for (const item of items) {
      try {
        const description = await this.generateYouTubeDescription(
          item.title, 
          item.subreddit, 
          item.upvotes, 
          item.duration
        );
        descriptions.push(description);
        
        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`Failed to generate description for "${item.title}":`, error);
        descriptions.push(`Hilarious video from r/${item.subreddit}! This ${item.duration}-second clip had ${item.upvotes} upvotes. Don't forget to like and subscribe for more funny content! #funny #reddit #viral`);
      }
    }
    
    return descriptions;
  }
}

export const geminiService = new GeminiService();
