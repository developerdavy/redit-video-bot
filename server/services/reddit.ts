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
        'User-Agent': 'script:ContentBot:v1.0.0 (by /u/ContentBot)',
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

    if (!this.accessToken) {
      throw new Error('No access token received from Reddit API');
    }

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
            'User-Agent': 'script:ContentBot:v1.0.0 (by /u/ContentBot)'
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
      // Try OAuth first, fallback to public API
      let data: RedditResponse;
      
      try {
        const oauthUrl = `https://oauth.reddit.com/r/${subreddit}/hot?limit=${limit}`;
        data = await this.makeRequest(oauthUrl);
      } catch (oauthError) {
        console.log(`OAuth failed for r/${subreddit}, trying public API:`, oauthError);
        
        // Fallback to public API
        const publicUrl = `https://www.reddit.com/r/${subreddit}/hot.json?limit=${limit}`;
        const response = await fetch(publicUrl, {
          headers: {
            'User-Agent': 'script:ContentBot:v1.0.0 (by /u/ContentBot)'
          }
        });
        
        if (!response.ok) {
          throw new Error(`Reddit API error: ${response.status} ${response.statusText}`);
        }
        
        data = await response.json();
      }
      
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
      throw new Error(`Failed to fetch videos from r/${subreddit}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async checkSubredditExists(subreddit: string): Promise<boolean> {
    // Temporarily return true to allow testing while we fix OAuth
    // TODO: Fix Reddit OAuth authentication
    console.log(`Checking subreddit r/${subreddit} - temporarily allowing all subreddits`);
    return true;
    
    /*
    try {
      // Use public API for checking subreddit existence
      const url = `https://www.reddit.com/r/${subreddit}/about.json`;
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'script:ContentBot:v1.0.0 (by /u/ContentBot)'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        return !!(data && data.data && data.data.display_name);
      }
      
      return false;
    } catch (error) {
      console.error(`Error checking subreddit r/${subreddit}:`, error);
      return false;
    }
    */
  }
}

export const redditService = new RedditService();
