interface RedditPost {
  id: string;
  title: string;
  url: string;
  thumbnail: string;
  ups: number;
  is_video: boolean;
  media?: {
    reddit_video?: {
      fallback_url: string;
      duration: number;
    };
  };
}

interface RedditResponse {
  data: {
    children: Array<{
      data: RedditPost;
    }>;
  };
}

export class RedditService {
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  private async getAccessToken(): Promise<string> {
    // Check if we have a valid token
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    const clientId = process.env.REDDIT_CLIENT_ID;
    const clientSecret = process.env.REDDIT_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error('Reddit API credentials not configured. Please set REDDIT_CLIENT_ID and REDDIT_CLIENT_SECRET environment variables.');
    }

    // Get OAuth token from Reddit
    const authString = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    
    const response = await fetch('https://www.reddit.com/api/v1/access_token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authString}`,
        'User-Agent': 'ContentBot/1.0.0 by /u/ContentBot',
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'grant_type=client_credentials'
    });

    if (!response.ok) {
      throw new Error(`Reddit OAuth error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    this.accessToken = data.access_token;
    this.tokenExpiry = Date.now() + (data.expires_in * 1000) - 60000; // Refresh 1 minute early

    return this.accessToken;
  }

  private async makeRequest(url: string): Promise<any> {
    const token = await this.getAccessToken();
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'User-Agent': 'ContentBot/1.0.0 by /u/ContentBot'
      }
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        // Token expired, clear it and retry once
        this.accessToken = null;
        const newToken = await this.getAccessToken();
        const retryResponse = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${newToken}`,
            'User-Agent': 'ContentBot/1.0.0 by /u/ContentBot'
          }
        });
        
        if (!retryResponse.ok) {
          throw new Error(`Reddit API error: ${retryResponse.status} ${retryResponse.statusText}`);
        }
        
        return retryResponse.json();
      }
      
      throw new Error(`Reddit API error: ${response.status} ${response.statusText}`);
    }
    
    return response.json();
  }

  async getPopularVideos(subreddit: string, limit: number = 25): Promise<Array<{
    id: string;
    title: string;
    videoUrl: string;
    thumbnailUrl: string;
    duration: number;
    upvotes: number;
  }>> {
    try {
      const url = `https://www.reddit.com/r/${subreddit}/hot.json?limit=${limit}`;
      const data: RedditResponse = await this.makeRequest(url);
      
      const videos = data.data.children
        .map(child => child.data)
        .filter(post => post.is_video && post.media?.reddit_video)
        .map(post => ({
          id: post.id,
          title: post.title,
          videoUrl: post.media!.reddit_video!.fallback_url,
          thumbnailUrl: post.thumbnail !== 'self' ? post.thumbnail : '',
          duration: post.media!.reddit_video!.duration || 0,
          upvotes: post.ups
        }));

      return videos;
    } catch (error) {
      console.error(`Error fetching videos from r/${subreddit}:`, error);
      throw new Error(`Failed to fetch videos from r/${subreddit}: ${error.message}`);
    }
  }

  async checkSubredditExists(subreddit: string): Promise<boolean> {
    try {
      const url = `https://www.reddit.com/r/${subreddit}/about.json`;
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'ContentBot/1.0.0'
        }
      });
      
      return response.ok;
    } catch (error) {
      return false;
    }
  }
}

export const redditService = new RedditService();
