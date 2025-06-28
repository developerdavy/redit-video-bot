import ffmpeg from 'fluent-ffmpeg';
import { createCanvas } from 'canvas';
import { createWriteStream, mkdirSync, existsSync, writeFileSync } from 'fs';
import { join } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const pipelineAsync = promisify(pipeline);

interface VideoGenerationOptions {
  title: string;
  content: string;
  hook: string;
  description: string;
  thumbnailText: string;
  audioScript: string;
  duration?: number;
}

interface VideoSegment {
  text: string;
  startTime: number;
  duration: number;
  imageUrl?: string;
}

export class VideoGenerationService {
  private outputDir = './generated-videos';
  private tempDir = './temp-assets';

  constructor() {
    // Ensure directories exist
    if (!existsSync(this.outputDir)) {
      mkdirSync(this.outputDir, { recursive: true });
    }
    if (!existsSync(this.tempDir)) {
      mkdirSync(this.tempDir, { recursive: true });
    }
  }

  async generateVideo(options: VideoGenerationOptions): Promise<{ videoPath: string; duration: number }> {
    const videoId = `video_${Date.now()}`;
    const outputPath = join(this.outputDir, `${videoId}.mp4`);

    try {
      // 1. Generate audio from script
      const audioPath = await this.generateAudio(options.audioScript, videoId);
      
      // 2. Create visual segments
      const segments = await this.createVideoSegments(options);
      
      // 3. Generate background images for each segment
      const visualPaths = await this.generateVisuals(segments, videoId);
      
      // 4. Compose final video
      const finalVideo = await this.composeVideo(audioPath, visualPaths, outputPath, segments);
      
      return {
        videoPath: outputPath,
        duration: finalVideo.duration
      };
    } catch (error) {
      console.error('Video generation failed:', error);
      throw new Error(`Video generation failed: ${(error as Error).message}`);
    }
  }

  private async generateAudio(script: string, videoId: string): Promise<string> {
    const audioPath = join(this.tempDir, `${videoId}_audio.wav`);
    
    try {
      // Use system TTS via espeak (lightweight alternative)
      const command = `espeak "${script.replace(/"/g, '\\"')}" --stdout | ffmpeg -f wav -i - -ar 44100 -ac 1 "${audioPath}" -y`;
      
      await execAsync(command);
      return audioPath;
    } catch (error) {
      console.error('Audio generation failed:', error);
      // Fallback: create silent audio with text overlay
      const silentCommand = `ffmpeg -f lavfi -i anullsrc=r=44100:cl=mono -t 60 "${audioPath}" -y`;
      await execAsync(silentCommand);
      return audioPath;
    }
  }

  private async createVideoSegments(options: VideoGenerationOptions): Promise<VideoSegment[]> {
    const { hook, content, title } = options;
    
    // Break content into digestible segments (about 10-15 seconds each)
    const segments: VideoSegment[] = [];
    
    // Hook segment (first 15 seconds)
    segments.push({
      text: hook,
      startTime: 0,
      duration: 15,
    });

    // Break main content into chunks
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);
    const avgWordsPerSecond = 2.5; // Average speaking pace
    let currentTime = 15;

    for (let i = 0; i < sentences.length; i += 2) {
      const segmentText = sentences.slice(i, i + 2).join('. ').trim();
      if (segmentText) {
        const wordCount = segmentText.split(' ').length;
        const segmentDuration = Math.max(8, Math.min(20, wordCount / avgWordsPerSecond));
        
        segments.push({
          text: segmentText,
          startTime: currentTime,
          duration: segmentDuration,
        });
        
        currentTime += segmentDuration;
      }
    }

    return segments;
  }

  private async generateVisuals(segments: VideoSegment[], videoId: string): Promise<string[]> {
    const visualPaths: string[] = [];

    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      const imagePath = join(this.tempDir, `${videoId}_visual_${i}.png`);
      
      // Create dynamic background with text overlay
      await this.createSegmentVisual(segment, imagePath, i);
      visualPaths.push(imagePath);
    }

    return visualPaths;
  }

  private async createSegmentVisual(segment: VideoSegment, outputPath: string, index: number): Promise<void> {
    const canvas = createCanvas(1920, 1080);
    const ctx = canvas.getContext('2d');

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, 1920, 1080);
    const colors = [
      ['#ff4444', '#ff6b6b'], // Red theme for news
      ['#4444ff', '#6b6bff'], // Blue theme
      ['#44ff44', '#6bff6b'], // Green theme
      ['#ff44ff', '#ff6bff'], // Purple theme
    ];
    const colorPair = colors[index % colors.length];
    gradient.addColorStop(0, colorPair[0]);
    gradient.addColorStop(1, colorPair[1]);
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1920, 1080);

    // Add subtle pattern overlay
    ctx.globalAlpha = 0.1;
    for (let x = 0; x < 1920; x += 50) {
      for (let y = 0; y < 1080; y += 50) {
        ctx.fillStyle = 'white';
        ctx.fillRect(x, y, 25, 25);
      }
    }
    ctx.globalAlpha = 1;

    // Add text overlay
    ctx.fillStyle = 'white';
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 3;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Dynamic font size based on text length
    const fontSize = Math.max(40, Math.min(80, 1000 / segment.text.length));
    ctx.font = `bold ${fontSize}px Arial, sans-serif`;

    // Word wrap text
    const words = segment.text.split(' ');
    const lines: string[] = [];
    let currentLine = '';
    
    for (const word of words) {
      const testLine = currentLine + (currentLine ? ' ' : '') + word;
      const metrics = ctx.measureText(testLine);
      
      if (metrics.width > 1600 && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) lines.push(currentLine);

    // Draw text lines
    const lineHeight = fontSize * 1.2;
    const totalHeight = lines.length * lineHeight;
    const startY = (1080 - totalHeight) / 2;

    lines.forEach((line, i) => {
      const y = startY + (i * lineHeight) + (lineHeight / 2);
      ctx.strokeText(line, 960, y);
      ctx.fillText(line, 960, y);
    });

    // Add news source indicator
    ctx.font = 'bold 36px Arial';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.fillText('BREAKING NEWS', 960, 100);

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

  private async composeVideo(audioPath: string, visualPaths: string[], outputPath: string, segments: VideoSegment[]): Promise<{ duration: number }> {
    return new Promise((resolve, reject) => {
      let videoCommand = ffmpeg();

      // Add all image inputs
      visualPaths.forEach((imagePath) => {
        videoCommand = videoCommand.addInput(imagePath);
      });

      // Add audio input
      videoCommand = videoCommand.addInput(audioPath);

      // Create complex filter for video composition
      let filterComplex = '';
      let previousOutput = '';

      // Create video segments with proper timing
      for (let i = 0; i < segments.length; i++) {
        const segment = segments[i];
        const duration = segment.duration;
        
        if (i === 0) {
          // First segment
          filterComplex += `[${i}:v]scale=1920:1080,setpts=PTS-STARTPTS[v${i}];`;
          filterComplex += `[v${i}]tpad=stop_mode=clone:stop_duration=${duration}[vout${i}];`;
          previousOutput = `vout${i}`;
        } else {
          // Subsequent segments
          filterComplex += `[${i}:v]scale=1920:1080,setpts=PTS-STARTPTS[v${i}];`;
          filterComplex += `[v${i}]tpad=stop_mode=clone:stop_duration=${duration}[vtemp${i}];`;
          filterComplex += `[${previousOutput}][vtemp${i}]concat=n=2:v=1:a=0[vout${i}];`;
          previousOutput = `vout${i}`;
        }
      }

      // Final output
      filterComplex += `[${previousOutput}]fps=30[vfinal];`;
      filterComplex += `[${visualPaths.length}:a]aresample=44100[afinal]`;

      videoCommand
        .complexFilter(filterComplex)
        .outputOptions([
          '-map', '[vfinal]',
          '-map', '[afinal]',
          '-c:v', 'libx264',
          '-c:a', 'aac',
          '-b:v', '2M',
          '-b:a', '128k',
          '-preset', 'medium',
          '-movflags', '+faststart'
        ])
        .output(outputPath)
        .on('end', () => {
          // Calculate total duration
          const totalDuration = segments.reduce((sum, segment) => sum + segment.duration, 0);
          resolve({ duration: totalDuration });
        })
        .on('error', (err) => {
          console.error('FFmpeg error:', err);
          reject(new Error(`Video composition failed: ${err.message}`));
        })
        .run();
    });
  }

  async generateFullVideoScript(title: string, content: string, hook: string): Promise<string> {
    // Create a comprehensive script for the video
    const script = `
${hook}

Let me break this down for you.

${content}

This is exactly why you need to stay informed about these developments. 

What do you think about this? Let me know in the comments below, and don't forget to subscribe for more breaking news and analysis.

Thanks for watching, and I'll see you in the next video!
    `.trim();

    return script;
  }
}

export const videoGenerationService = new VideoGenerationService();