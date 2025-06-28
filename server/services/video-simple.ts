import ffmpeg from 'fluent-ffmpeg';
import { createCanvas } from 'canvas';
import { createWriteStream, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

interface VideoOptions {
  title: string;
  content: string;
  hook: string;
  thumbnailText: string;
}

interface ArticleData {
  title: string;
  content: string;
  source: string;
  publishedAt: string;
}

interface CompilationVideoOptions {
  articles: ArticleData[];
  compilationTitle: string;
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
      // Create engaging visual slides from the content
      const slides = this.createContentSlides(options);
      const slidePaths = await this.generateSlideImages(slides, videoId);
      
      // Compose video with slides
      const duration = await this.createSlideshowVideo(slidePaths, outputPath);
      
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

  private createContentSlides(options: VideoOptions) {
    const { title, content, hook, thumbnailText } = options;
    
    // Break content into digestible slides
    const slides = [
      {
        type: 'title',
        text: thumbnailText || title,
        subtitle: 'BREAKING NEWS',
        duration: 3
      },
      {
        type: 'hook',
        text: hook,
        subtitle: '',
        duration: 5
      }
    ];

    // Split content into sentences and group into slides
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);
    for (let i = 0; i < sentences.length; i += 2) {
      const slideText = sentences.slice(i, i + 2).join('. ').trim();
      if (slideText) {
        slides.push({
          type: 'content',
          text: slideText,
          subtitle: '',
          duration: Math.max(4, slideText.length / 15)
        });
      }
    }

    // Add call-to-action slide
    slides.push({
      type: 'cta',
      text: 'What do you think?',
      subtitle: 'Like & Subscribe for more news!',
      duration: 3
    });

    return slides;
  }

  private async generateSlideImages(slides: any[], videoId: string): Promise<string[]> {
    const slidePaths: string[] = [];

    for (let i = 0; i < slides.length; i++) {
      const slide = slides[i];
      const imagePath = join(this.outputDir, `${videoId}_slide_${i}.png`);
      
      await this.createSlideImage(slide, imagePath, i);
      slidePaths.push(imagePath);
    }

    return slidePaths;
  }

  private async createSlideImage(slide: any, outputPath: string, index: number): Promise<void> {
    const canvas = createCanvas(1920, 1080);
    const ctx = canvas.getContext('2d');

    // Background gradient based on slide type
    const gradients = {
      title: ['#ff4444', '#cc0000'],
      hook: ['#4444ff', '#0000cc'],
      content: ['#2d3748', '#1a202c'],
      cta: ['#ff6b35', '#f7931e']
    };

    const colors = gradients[slide.type as keyof typeof gradients] || gradients.content;
    const gradient = ctx.createLinearGradient(0, 0, 1920, 1080);
    gradient.addColorStop(0, colors[0]);
    gradient.addColorStop(1, colors[1]);
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1920, 1080);

    // Add dynamic pattern overlay
    ctx.globalAlpha = 0.1;
    for (let x = 0; x < 1920; x += 100) {
      for (let y = 0; y < 1080; y += 100) {
        ctx.fillStyle = 'white';
        ctx.fillRect(x + Math.sin(y/100) * 20, y + Math.cos(x/100) * 20, 50, 50);
      }
    }
    ctx.globalAlpha = 1;

    // Title/Main text
    ctx.fillStyle = 'white';
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 4;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Dynamic font sizing
    const maxWidth = 1600;
    let fontSize = slide.type === 'title' ? 120 : 80;
    ctx.font = `bold ${fontSize}px Arial, sans-serif`;
    
    while (ctx.measureText(slide.text).width > maxWidth && fontSize > 40) {
      fontSize -= 5;
      ctx.font = `bold ${fontSize}px Arial, sans-serif`;
    }

    // Word wrap and display text
    const words = slide.text.split(' ');
    const lines: string[] = [];
    let currentLine = '';
    
    for (const word of words) {
      const testLine = currentLine + (currentLine ? ' ' : '') + word;
      if (ctx.measureText(testLine).width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) lines.push(currentLine);

    // Draw main text
    const lineHeight = fontSize * 1.2;
    const totalHeight = lines.length * lineHeight;
    const startY = (1080 - totalHeight) / 2;

    lines.forEach((line, i) => {
      const y = startY + (i * lineHeight) + (lineHeight / 2);
      ctx.strokeText(line, 960, y);
      ctx.fillText(line, 960, y);
    });

    // Subtitle
    if (slide.subtitle) {
      ctx.font = 'bold 48px Arial';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      const subtitleY = slide.type === 'title' ? 150 : 950;
      ctx.fillText(slide.subtitle, 960, subtitleY);
    }

    // News ticker for content slides
    if (slide.type === 'content') {
      ctx.fillStyle = 'rgba(255, 68, 68, 0.9)';
      ctx.fillRect(0, 50, 1920, 80);
      ctx.fillStyle = 'white';
      ctx.font = 'bold 36px Arial';
      ctx.textAlign = 'left';
      ctx.fillText('🔴 LIVE NEWS UPDATE', 50, 100);
    }

    // Save canvas to file
    const buffer = canvas.toBuffer('image/png');
    const writeStream = createWriteStream(outputPath);
    writeStream.write(buffer);
    writeStream.end();

    return new Promise((resolve, reject) => {
      writeStream.on('finish', resolve);
      writeStream.on('error', reject);
    });
  }

  private async createSlideshowVideo(slidePaths: string[], outputPath: string): Promise<number> {
    return new Promise((resolve, reject) => {
      let command = ffmpeg();
      
      // Add all slide inputs
      slidePaths.forEach(slidePath => {
        command = command.addInput(slidePath);
      });

      // Calculate durations (3-6 seconds per slide)
      const slideDurations = [3, 5, 4, 4, 4, 3]; // Adjust based on content
      const totalDuration = slideDurations.reduce((sum, dur) => sum + dur, 0);

      // Create filter for slideshow with crossfade transitions
      let filterComplex = '';
      let previousOutput = '';

      slidePaths.forEach((_, i) => {
        const duration = slideDurations[i] || 4;
        
        if (i === 0) {
          filterComplex += `[${i}:v]scale=1920:1080,setpts=PTS-STARTPTS,fade=in:st=0:d=0.5[v${i}];`;
          filterComplex += `[v${i}]tpad=stop_mode=clone:stop_duration=${duration}[vout${i}];`;
          previousOutput = `vout${i}`;
        } else {
          filterComplex += `[${i}:v]scale=1920:1080,setpts=PTS-STARTPTS,fade=in:st=0:d=0.5,fade=out:st=${duration-0.5}:d=0.5[v${i}];`;
          filterComplex += `[v${i}]tpad=stop_mode=clone:stop_duration=${duration}[vtemp${i}];`;
          filterComplex += `[${previousOutput}][vtemp${i}]concat=n=2:v=1:a=0[vout${i}];`;
          previousOutput = `vout${i}`;
        }
      });

      filterComplex += `[${previousOutput}]fps=30[vfinal]`;

      command
        .complexFilter(filterComplex)
        .outputOptions([
          '-map', '[vfinal]',
          '-c:v', 'libx264',
          '-preset', 'medium',
          '-crf', '23',
          '-movflags', '+faststart',
          '-pix_fmt', 'yuv420p'
        ])
        .output(outputPath)
        .on('end', () => {
          resolve(totalDuration);
        })
        .on('error', (err) => {
          console.error('FFmpeg error:', err);
          reject(new Error(`Video composition failed: ${err.message}`));
        })
        .run();
    });
  }

  async generateCompilationVideo(options: CompilationVideoOptions): Promise<{ videoPath: string; duration: number; relativePath: string }> {
    const videoId = `compilation_${Date.now()}`;
    const outputPath = join(this.outputDir, `${videoId}.mp4`);
    
    try {
      // Create slides for compilation video
      const slides = this.createCompilationSlides(options);
      const slidePaths = await this.generateSlideImages(slides, videoId);
      
      // Compose video with slides
      const duration = await this.createSlideshowVideo(slidePaths, outputPath);
      
      return {
        videoPath: outputPath,
        duration,
        relativePath: `${videoId}.mp4`
      };
    } catch (error) {
      console.error('Compilation video generation failed:', error);
      throw new Error(`Compilation video generation failed: ${(error as Error).message}`);
    }
  }

  private createCompilationSlides(options: CompilationVideoOptions) {
    const { articles, compilationTitle, hook, thumbnailText } = options;
    
    const slides = [
      // Opening slide with hook
      {
        type: 'title',
        text: hook,
        background: 'gradient-red',
        duration: 3
      },
      // Main title slide
      {
        type: 'title', 
        text: compilationTitle,
        background: 'gradient-blue',
        duration: 4
      }
    ];

    // Add slides for each article
    articles.forEach((article, index) => {
      // Article number slide
      slides.push({
        type: 'number',
        text: `#${index + 1}`,
        background: 'gradient-purple',
        duration: 2
      });
      
      // Article title slide
      slides.push({
        type: 'subtitle',
        text: article.title,
        background: 'gradient-blue',
        duration: 5
      });
      
      // Article content slide
      slides.push({
        type: 'content',
        text: article.content,
        background: 'gradient-green',
        duration: 6
      });
      
      // Source attribution slide
      slides.push({
        type: 'source',
        text: `Source: ${article.source}`,
        background: 'gradient-gray',
        duration: 2
      });
    });

    // Closing slide with thumbnail text
    slides.push({
      type: 'closing',
      text: thumbnailText,
      background: 'gradient-red',
      duration: 4
    });

    return slides;
  }
}

export const videoGenerationService = new VideoGenerationService();