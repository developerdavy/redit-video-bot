import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Youtube, Sparkles, Copy, Check, Video, Play, Download, Loader2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface YouTubeOptimizerProps {
  id: number;
  title: string;
  content: string;
  source: string;
  children: React.ReactNode;
}

interface YouTubeContent {
  title: string;
  description: string;
  tags: string[];
  thumbnail_text: string;
  hook: string;
}

export default function YouTubeOptimizer({
  id,
  title,
  content,
  source,
  children
}: YouTubeOptimizerProps) {
  const { toast } = useToast();
  const [optimizedContent, setOptimizedContent] = useState<YouTubeContent | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [generatedVideo, setGeneratedVideo] = useState<{ videoPath: string; duration: number } | null>(null);

  const generateMutation = useMutation<YouTubeContent>({
    mutationFn: async (): Promise<YouTubeContent> => {
      const response = await fetch(`/api/content-items/${id}/youtube-optimize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, source })
      });
      
      if (!response.ok) {
        throw new Error("Failed to optimize content");
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      setOptimizedContent(data);
      toast({
        title: "Success",
        description: "YouTube content optimized successfully!"
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to optimize content: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  const videoMutation = useMutation<{ videoPath: string; duration: number }>({
    mutationFn: async (): Promise<{ videoPath: string; duration: number }> => {
      if (!optimizedContent) {
        throw new Error("Please optimize content first");
      }
      
      const response = await fetch(`/api/content-items/${id}/generate-video`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: optimizedContent.title,
          content,
          hook: optimizedContent.hook,
          thumbnailText: optimizedContent.thumbnail_text
        })
      });
      
      if (!response.ok) {
        throw new Error("Failed to generate video");
      }
      
      const data = await response.json();
      return { videoPath: data.videoPath, duration: data.duration };
    },
    onSuccess: (data) => {
      setGeneratedVideo(data);
      toast({
        title: "Success",
        description: `Video generated successfully! Duration: ${Math.round(data.duration)}s`
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
      toast({
        title: "Copied!",
        description: `${field} copied to clipboard`
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive"
      });
    }
  };

  const getEngagementTips = () => [
    "Hook viewers in first 15 seconds",
    "Use emotional triggers (curiosity, urgency, surprise)",
    "Include strong call-to-actions",
    "Optimize title for search keywords",
    "Use eye-catching thumbnail text",
    "Tell a story with clear beginning/middle/end",
    "Create content that sparks discussion",
    "Use trending topics and hashtags"
  ];

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto" aria-describedby="youtube-optimizer-description">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Youtube className="text-red-600" size={24} />
            <span>YouTube Content Optimizer</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Original Content */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Original Article</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-sm font-medium">Title</Label>
                  <p className="text-sm text-gray-700 mt-1">{title}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Source</Label>
                  <p className="text-sm text-gray-600 mt-1">{source}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Content Preview</Label>
                  <p className="text-sm text-gray-700 mt-1 line-clamp-4">
                    {content.length > 200 ? `${content.substring(0, 200)}...` : content}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Engagement Tips */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2">
                  <Sparkles size={20} />
                  <span>YouTube Engagement Tips</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {getEngagementTips().map((tip, index) => (
                    <li key={index} className="flex items-start space-x-2 text-sm">
                      <div className="w-1.5 h-1.5 bg-red-600 rounded-full mt-2 flex-shrink-0"></div>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Optimized Content */}
          <div className="space-y-4">
            {!optimizedContent ? (
              <Card className="h-full flex items-center justify-center">
                <CardContent className="text-center py-12">
                  <Youtube className="text-red-600 mx-auto mb-4" size={48} />
                  <h3 className="text-lg font-semibold mb-2">Generate YouTube Content</h3>
                  <p className="text-gray-600 mb-4">
                    Transform this news article into engaging YouTube content optimized for views and engagement
                  </p>
                  <Button 
                    onClick={() => generateMutation.mutate()}
                    disabled={generateMutation.isPending}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    <Sparkles size={16} className="mr-2" />
                    {generateMutation.isPending ? "Optimizing..." : "Optimize for YouTube"}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {/* Optimized Title */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center justify-between">
                      YouTube Title
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(optimizedContent.title, "Title")}
                      >
                        {copiedField === "Title" ? <Check size={16} /> : <Copy size={16} />}
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Input 
                      value={optimizedContent.title} 
                      readOnly 
                      className="font-medium"
                    />
                  </CardContent>
                </Card>

                {/* Thumbnail Text */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center justify-between">
                      Thumbnail Text
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(optimizedContent.thumbnail_text, "Thumbnail")}
                      >
                        {copiedField === "Thumbnail" ? <Check size={16} /> : <Copy size={16} />}
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Badge variant="secondary" className="text-lg px-3 py-2">
                      {optimizedContent.thumbnail_text}
                    </Badge>
                  </CardContent>
                </Card>

                {/* Opening Hook */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center justify-between">
                      Opening Hook (First 15 seconds)
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(optimizedContent.hook, "Hook")}
                      >
                        {copiedField === "Hook" ? <Check size={16} /> : <Copy size={16} />}
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Textarea 
                      value={optimizedContent.hook} 
                      readOnly 
                      rows={3}
                      className="resize-none"
                    />
                  </CardContent>
                </Card>

                {/* Description */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center justify-between">
                      YouTube Description
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(optimizedContent.description, "Description")}
                      >
                        {copiedField === "Description" ? <Check size={16} /> : <Copy size={16} />}
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Textarea 
                      value={optimizedContent.description} 
                      readOnly 
                      rows={6}
                      className="resize-none"
                    />
                  </CardContent>
                </Card>

                {/* Tags */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center justify-between">
                      Tags
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(optimizedContent.tags.join(", "), "Tags")}
                      >
                        {copiedField === "Tags" ? <Check size={16} /> : <Copy size={16} />}
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {optimizedContent.tags.map((tag, index) => (
                        <Badge key={index} variant="outline">
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Video Generation Section */}
                <Card className="border-green-200 bg-green-50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center space-x-2">
                      <Video className="text-green-600" size={20} />
                      <span>Generate Video</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {!generatedVideo ? (
                      <div>
                        <p className="text-sm text-gray-600 mb-3">
                          Create a complete video from your optimized content with engaging visuals and text overlays.
                        </p>
                        <Button 
                          onClick={() => videoMutation.mutate()}
                          disabled={videoMutation.isPending}
                          className="w-full bg-green-600 hover:bg-green-700 text-white"
                        >
                          {videoMutation.isPending ? (
                            <>
                              <Loader2 size={16} className="mr-2 animate-spin" />
                              Generating Video...
                            </>
                          ) : (
                            <>
                              <Video size={16} className="mr-2" />
                              Create Video
                            </>
                          )}
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                          <div className="flex items-center space-x-3">
                            <Play className="text-green-600" size={20} />
                            <div>
                              <p className="font-medium text-sm">Video Ready!</p>
                              <p className="text-xs text-gray-600">Duration: {Math.round(generatedVideo.duration)}s</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(`/videos/${generatedVideo.videoPath}`, '_blank')}
                            >
                              <Play size={14} className="mr-1" />
                              Watch
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                const link = document.createElement('a');
                                link.href = `/videos/${generatedVideo.videoPath}`;
                                link.download = generatedVideo.videoPath;
                                link.click();
                              }}
                            >
                              <Download size={14} className="mr-1" />
                              Download
                            </Button>
                          </div>
                        </div>
                        <Button 
                          onClick={() => videoMutation.mutate()}
                          disabled={videoMutation.isPending}
                          variant="outline"
                          className="w-full"
                        >
                          <Video size={16} className="mr-2" />
                          Generate New Video
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Button 
                  onClick={() => generateMutation.mutate()}
                  disabled={generateMutation.isPending}
                  variant="outline"
                  className="w-full"
                >
                  <Sparkles size={16} className="mr-2" />
                  Generate New Optimization
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}