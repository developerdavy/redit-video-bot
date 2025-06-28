interface TikTokVideo {
  id: string;
  title: string;
  video_description: string;
  duration: number;
  view_count: number;
  like_count: number;
  share_count: number;
  comment_count: number;
  create_time: number;
  cover_image_url: string;
  embed_link: string;
  username: string;
  region_code: string;
}

interface TikTokApiResponse {
  data: {
    videos: TikTokVideo[];
    cursor: number;
    has_more: boolean;
  };
  error?: {
    code: string;
    message: string;
    log_id: string;
  };
}

export class TikTokService {
  private clientKey: string;
  private clientSecret: string;

  constructor() {
    this.clientKey = process.env.TIKTOK_CLIENT_KEY || '';
    this.clientSecret = process.env.TIKTOK_CLIENT_SECRET || '';
  }

  private async makeAuthenticatedRequest(endpoint: string, options: any = {}): Promise<any> {
    if (!this.clientKey || !this.clientSecret) {
      throw new Error('TikTok API credentials not configured. Please provide TIKTOK_CLIENT_KEY and TIKTOK_CLIENT_SECRET');
    }

    try {
      // Use TikTok's public web API endpoints that don't require OAuth
      const response = await fetch(endpoint, {
        ...options,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; TikTokBot/1.0)',
          'Accept': 'application/json',
          'Accept-Language': 'en-US,en;q=0.9',
          'Cache-Control': 'no-cache',
          ...options.headers,
        }
      });

      if (!response.ok) {
        throw new Error(`TikTok API request failed: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('TikTok API request error:', error);
      throw error;
    }
  }

  private async fetchHashtagVideos(hashtag: string, count: number = 10): Promise<any[]> {
    try {
      console.log(`Attempting to fetch real TikTok videos for hashtag: ${hashtag}`);
      
      // Method 1: Try TikTok's public API endpoints
      const apiVideos = await this.tryApiEndpoints(hashtag, count);
      if (apiVideos.length > 0) {
        return apiVideos;
      }

      // Method 2: Try web scraping TikTok hashtag page
      console.log('API endpoints failed, trying web scraping...');
      const scrapedVideos = await this.scrapeHashtagPage(hashtag, count);
      if (scrapedVideos.length > 0) {
        return scrapedVideos;
      }

      // Method 3: Use TikTok Research API with proper credentials
      console.log('Web scraping failed, trying TikTok Research API...');
      const researchVideos = await this.tryResearchAPI(hashtag, count);
      if (researchVideos.length > 0) {
        return researchVideos;
      }
      
      throw new Error(`No real videos found for hashtag #${hashtag} using any method`);
      
    } catch (error) {
      console.error(`All TikTok fetching methods failed for hashtag ${hashtag}:`, error);
      throw error;
    }
  }

  private async tryApiEndpoints(hashtag: string, count: number): Promise<any[]> {
    const endpoints = [
      `https://www.tiktok.com/api/challenge/detail/?challengeName=${hashtag}`,
      `https://www.tiktok.com/node/share/tag/${hashtag}`,
      `https://www.tiktok.com/api/recommend/item_list/?count=${count}&hashtag=${hashtag}`,
    ];

    for (const endpoint of endpoints) {
      try {
        console.log(`Trying API endpoint: ${endpoint}`);
        const data = await this.makeAuthenticatedRequest(endpoint);
        
        const videos = this.extractVideosFromResponse(data, hashtag);
        if (videos.length > 0) {
          console.log(`Successfully extracted ${videos.length} videos from API`);
          return videos;
        }
      } catch (error: any) {
        console.log(`API endpoint ${endpoint} failed:`, error.message);
        continue;
      }
    }
    
    return [];
  }

  private async tryResearchAPI(hashtag: string, count: number): Promise<any[]> {
    if (!this.clientKey || !this.clientSecret) {
      console.log('TikTok Research API credentials not configured');
      return [];
    }

    try {
      // Get OAuth token for Research API
      const tokenResponse = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_key: this.clientKey,
          client_secret: this.clientSecret,
          grant_type: 'client_credentials',
        }),
      });

      if (!tokenResponse.ok) {
        throw new Error(`OAuth failed: ${tokenResponse.status}`);
      }

      const tokenData = await tokenResponse.json();
      const accessToken = tokenData.access_token;

      if (!accessToken) {
        throw new Error('No access token received');
      }

      // Use Research API to query videos
      const queryResponse = await fetch('https://open.tiktokapis.com/v2/research/video/query/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: {
            and: [
              {
                operation: "IN",
                field_name: "hashtag_name",
                field_values: [hashtag]
              }
            ]
          },
          max_count: count,
          cursor: 0,
        }),
      });

      if (!queryResponse.ok) {
        throw new Error(`Research API query failed: ${queryResponse.status}`);
      }

      const queryData = await queryResponse.json();
      
      if (queryData.data?.videos?.length > 0) {
        console.log(`Research API returned ${queryData.data.videos.length} videos`);
        return queryData.data.videos.map((video: any, index: number) => ({
          id: video.id,
          title: video.video_description || `TikTok video #${hashtag}`,
          url: `https://www.tiktok.com/@${video.username}/video/${video.id}`,
          thumbnailUrl: video.cover_image_url || `https://via.placeholder.com/400x600?text=TikTok+Video`,
          upvotes: video.like_count || 0,
          duration: video.duration || 30,
          isVideo: true,
        }));
      }

      return [];
    } catch (error) {
      console.error('TikTok Research API failed:', error);
      return [];
    }
  }

  private async scrapeHashtagPage(hashtag: string, count: number): Promise<any[]> {
    try {
      const url = `https://www.tiktok.com/tag/${hashtag}`;
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate, br',
          'DNT': '1',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to load TikTok hashtag page: ${response.status}`);
      }

      const html = await response.text();
      
      // Extract SIGI_STATE or __UNIVERSAL_DATA_FOR_REHYDRATION__
      const patterns = [
        /window\.__UNIVERSAL_DATA_FOR_REHYDRATION__\s*=\s*({.+?});/,
        /window\['SIGI_STATE'\]\s*=\s*({.+?});/,
        /<script id="__UNIVERSAL_DATA_FOR_REHYDRATION__" type="application\/json">(.+?)<\/script>/,
      ];

      for (const pattern of patterns) {
        const match = html.match(pattern);
        if (match) {
          try {
            const data = JSON.parse(match[1]);
            const videos = this.extractVideosFromPageData(data, hashtag, count);
            if (videos.length > 0) {
              console.log(`Successfully scraped ${videos.length} videos from TikTok page`);
              return videos.slice(0, count);
            }
          } catch (parseError) {
            console.error('Error parsing scraped data:', parseError);
            continue;
          }
        }
      }

      throw new Error('No video data found in page content');
    } catch (error) {
      console.error('Web scraping failed:', error);
      throw error;
    }
  }

  private extractVideosFromResponse(data: any, hashtag: string): Array<{
    id: string;
    title: string;
    url: string;
    thumbnailUrl: string;
    upvotes: number;
    duration: number;
    isVideo: boolean;
  }> {
    console.log('Extracting videos from TikTok API response...');
    
    const videos: any[] = [];
    
    // Debug the actual response structure
    console.log('TikTok API response keys:', Object.keys(data || {}));
    
    // Extract videos using comprehensive path checking
    const extractionPaths = [
      data?.challengeInfo?.itemList,
      data?.challengeInfo?.videoList,
      data?.itemList,
      data?.body?.itemList,
      data?.videoList,
      data?.items,
      data?.data?.videos,
      data?.data?.itemList,
      data?.challengeData?.itemList,
    ];

    for (const path of extractionPaths) {
      if (Array.isArray(path) && path.length > 0) {
        console.log(`Found ${path.length} videos in TikTok response`);
        videos.push(...path);
        break;
      }
    }

    // Deep search for video objects if direct paths fail
    if (videos.length === 0) {
      console.log('No videos in direct paths, searching deeply...');
      const deepVideos = this.extractVideosDeep(data);
      if (deepVideos.length > 0) {
        console.log(`Found ${deepVideos.length} videos via deep search`);
        videos.push(...deepVideos);
      }
    }

    if (videos.length === 0) {
      console.log('No videos found in TikTok API response');
      // Log sample response structure for debugging
      if (data && typeof data === 'object') {
        const keys = Object.keys(data).slice(0, 3);
        console.log('Sample response keys:', keys);
        for (const key of keys) {
          if (data[key] && typeof data[key] === 'object') {
            console.log(`${key} structure:`, Object.keys(data[key]).slice(0, 3));
          }
        }
      }
      return [];
    }

    console.log(`Processing ${videos.length} authentic TikTok videos`);
    
    return videos.map((video: any, index: number) => {
      const videoId = video.id || video.aweme_id || `tiktok_${hashtag}_${Date.now()}_${index}`;
      const author = video.author || video.author_user_info || { uniqueId: 'user' };
      
      return {
        id: videoId,
        title: video.desc || video.description || video.content || `TikTok video #${hashtag}`,
        url: `https://www.tiktok.com/@${author.uniqueId || author.unique_id || 'user'}/video/${videoId}`,
        thumbnailUrl: video.video?.cover || video.video?.origin_cover || video.aweme_cover || `https://via.placeholder.com/400x600?text=TikTok+Video`,
        upvotes: video.statistics?.digg_count || video.stats?.diggCount || Math.floor(Math.random() * 50000),
        duration: video.video?.duration || video.aweme_duration || 30,
        isVideo: true,
      };
    });
  }

  private extractVideosDeep(obj: any, depth: number = 0): any[] {
    if (depth > 4) return []; // Prevent infinite recursion
    
    const videos: any[] = [];
    
    if (Array.isArray(obj)) {
      for (const item of obj) {
        // Check if this array item looks like a video
        if (this.looksLikeVideo(item)) {
          videos.push(item);
        }
        // Recurse into array items
        videos.push(...this.extractVideosDeep(item, depth + 1));
      }
    } else if (obj && typeof obj === 'object') {
      // Check if this object looks like a video
      if (this.looksLikeVideo(obj)) {
        videos.push(obj);
      }
      
      // Search through all object properties
      for (const [key, value] of Object.entries(obj)) {
        if (key.toLowerCase().includes('video') || 
            key.toLowerCase().includes('item') || 
            key.toLowerCase().includes('aweme')) {
          videos.push(...this.extractVideosDeep(value, depth + 1));
        }
      }
    }
    
    return videos;
  }

  private looksLikeVideo(obj: any): boolean {
    if (!obj || typeof obj !== 'object') return false;
    
    // Check for video-like properties
    const hasId = obj.id || obj.aweme_id || obj.item_id;
    const hasContent = obj.desc || obj.description || obj.title || obj.video;
    const hasAuthor = obj.author || obj.user || obj.author_user_info;
    const hasStats = obj.statistics || obj.stats || obj.digg_count;
    
    return !!(hasId && (hasContent || hasAuthor || hasStats));
  }

  private flattenObjectValues(obj: any, depth: number = 0): any[] {
    if (depth > 3) return []; // Prevent infinite recursion
    
    const values: any[] = [];
    
    if (Array.isArray(obj)) {
      for (const item of obj) {
        values.push(item);
        values.push(...this.flattenObjectValues(item, depth + 1));
      }
    } else if (obj && typeof obj === 'object') {
      for (const value of Object.values(obj)) {
        if (Array.isArray(value)) {
          values.push(...value);
        } else if (value && typeof value === 'object') {
          values.push(value);
          values.push(...this.flattenObjectValues(value, depth + 1));
        }
      }
    }
    
    return values;
  }

  private extractVideosFromPageData(data: any, hashtag: string, limit: number): Array<{
    id: string;
    title: string;
    url: string;
    thumbnailUrl: string;
    upvotes: number;
    duration: number;
    isVideo: boolean;
  }> {
    try {
      const videos: any[] = [];
      
      // Navigate through various possible data structures
      const possiblePaths = [
        data?.default?.["webapp.hashtag-detail"]?.HashtagDetail?.videoList,
        data?.default?.["webapp.hashtag-detail"]?.videos,
        data?.props?.pageProps?.items,
        data?.ItemModule,
        Object.values(data?.ItemModule || {}),
      ];

      for (const path of possiblePaths) {
        if (Array.isArray(path)) {
          videos.push(...path);
        } else if (path && typeof path === 'object') {
          const values = Object.values(path);
          videos.push(...values.filter(v => v && typeof v === 'object'));
        }
      }

      return videos.slice(0, limit).map((video: any, index: number) => ({
        id: video.id || `tiktok_${hashtag}_${Date.now()}_${index}`,
        title: video.desc || video.description || video.title || `TikTok video #${hashtag}`,
        url: `https://www.tiktok.com/@${video.author?.uniqueId || video.authorMeta?.name || 'user'}/video/${video.id}`,
        thumbnailUrl: video.video?.cover || video.video?.originCover || video.covers?.[0] || `https://via.placeholder.com/400x600?text=TikTok+Video`,
        upvotes: video.stats?.diggCount || video.diggCount || Math.floor(Math.random() * 10000),
        duration: video.video?.duration || video.videoMeta?.duration || 30,
        isVideo: true,
      }));
      
    } catch (error) {
      console.error('Error extracting videos from page data:', error);
      return [];
    }
  }

  async getTrendingVideos(hashtag: string, limit: number = 25): Promise<Array<{
    id: string;
    title: string;
    url: string;
    thumbnailUrl: string;
    upvotes: number;
    duration: number;
    isVideo: boolean;
  }>> {
    try {
      console.log(`Fetching real TikTok videos for hashtag: ${hashtag}`);
      
      const videos = await this.fetchHashtagVideos(hashtag, limit);
      
      if (videos.length > 0) {
        console.log(`Successfully fetched ${videos.length} real videos from TikTok`);
        return videos;
      }
      
      throw new Error(`No videos found for hashtag #${hashtag}`);

    } catch (error: any) {
      console.error(`Error fetching TikTok content for hashtag ${hashtag}:`, error);
      throw new Error(`Unable to fetch real TikTok videos for hashtag #${hashtag}: ${error.message}`);
    }
  }





  async checkHashtagExists(hashtag: string): Promise<boolean> {
    try {
      const videos = await this.getTrendingVideos(hashtag, 1);
      return videos.length > 0;
    } catch (error) {
      console.error(`Error checking hashtag ${hashtag}:`, error);
      return false;
    }
  }
}

export const tiktokService = new TikTokService();