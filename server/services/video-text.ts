import ffmpeg from 'fluent-ffmpeg';
import { mkdirSync, existsSync, writeFileSync } from 'fs';
import { join } from 'path';

interface VideoOptions {
  title: string;
  content: string;
  hook: string;
  thumbnailText: string;
}

export class VideoGenerationService {
  private outputDir = './generated-videos';

  constructor() {
    if (!existsSync(this.outputDir)) {
      mkdirSync(this.outputDir, { recursive: true });
    }
  }

  async generateVideo(options: VideoOptions): Promise<{ videoPath: string; duration: number; relativePath: string }> {
    const videoId = `video_${Date.now()}`;
    const outputPath = join(this.outputDir, `${videoId}.mp4`);
    
    try {
      // Create text-based video with scrolling news content
      const duration = await this.createTextVideo(options, outputPath);
      
      return {
        videoPath: outputPath,
        duration,
        relativePath: `${videoId}.mp4`
      };
    } catch (error) {
      console.error('Video generation failed:', error);
      throw new Error(`Video generation failed: ${(error as Error).message}`);
    }
  }

  private async createTextVideo(options: VideoOptions, outputPath: string): Promise<number> {
    const { title, content, hook, thumbnailText } = options;
    
    // Calculate video duration based on content length
    const avgReadingSpeed = 180; // words per minute
    const wordCount = content.split(' ').length;
    const baseDuration = Math.max(30, (wordCount / avgReadingSpeed) * 60);
    const duration = Math.min(120, baseDuration); // Cap at 2 minutes

    return new Promise((resolve, reject) => {
      // Create a simple text-based video using FFmpeg's drawtext filter
      const command = ffmpeg();

      // Generate solid color background with animated text overlay
      command
        .input('color=red:size=1920x1080:duration=' + duration)
        .inputFormat('lavfi')
        .videoFilters([
          // Main title at top
          `drawtext=fontfile=/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf:text='${this.escapeText(thumbnailText || title)}':fontcolor=white:fontsize=72:x=(w-text_w)/2:y=100:shadowcolor=black:shadowx=3:shadowy=3`,
          
          // "BREAKING NEWS" banner
          `drawtext=fontfile=/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf:text='🔴 BREAKING NEWS':fontcolor=yellow:fontsize=48:x=50:y=50:shadowcolor=black:shadowx=2:shadowy=2`,
          
          // Hook text in center
          `drawtext=fontfile=/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf:text='${this.escapeText(hook)}':fontcolor=white:fontsize=36:x=(w-text_w)/2:y=400:shadowcolor=black:shadowx=2:shadowy=2`,
          
          // Scrolling content text
          `drawtext=fontfile=/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf:text='${this.escapeText(content.substring(0, 800))}':fontcolor=white:fontsize=28:x=100:y=600+t*20:shadowcolor=black:shadowx=2:shadowy=2`,
          
          // Call to action at bottom
          `drawtext=fontfile=/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf:text='👍 LIKE & SUBSCRIBE FOR MORE NEWS!':fontcolor=yellow:fontsize=32:x=(w-text_w)/2:y=980:shadowcolor=black:shadowx=2:shadowy=2`
        ])
        .outputOptions([
          '-c:v', 'libx264',
          '-preset', 'medium',
          '-crf', '23',
          '-pix_fmt', 'yuv420p',
          '-movflags', '+faststart'
        ])
        .output(outputPath)
        .on('end', () => {
          resolve(duration);
        })
        .on('error', (err) => {
          console.error('FFmpeg error:', err);
          reject(new Error(`Video composition failed: ${err.message}`));
        })
        .run();
    });
  }

  private escapeText(text: string): string {
    // Escape special characters for FFmpeg drawtext filter
    return text
      .replace(/'/g, "\\'")
      .replace(/:/g, "\\:")
      .replace(/\[/g, "\\[")
      .replace(/\]/g, "\\]")
      .replace(/,/g, "\\,")
      .replace(/;/g, "\\;")
      .replace(/\n/g, " ")
      .replace(/\r/g, " ")
      .substring(0, 200); // Limit length to prevent overflow
  }
}

export const videoGenerationService = new VideoGenerationService();