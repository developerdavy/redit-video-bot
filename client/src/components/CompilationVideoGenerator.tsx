import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Video, Play, Download, Loader2, Plus, Sparkles, Brain } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface ContentItem {
  id: number;
  title: string;
  content: string;
  sourceName: string;
  publishedAt: string;
  status: string;
}

interface CompilationVideoGeneratorProps {
  children: React.ReactNode;
}

export default function CompilationVideoGenerator({ children }: CompilationVideoGeneratorProps) {
  const { toast } = useToast();
  const [selectedArticles, setSelectedArticles] = useState<number[]>([]);
  const [compilationTitle, setCompilationTitle] = useState("");
  const [hook, setHook] = useState("");
  const [thumbnailText, setThumbnailText] = useState("");
  const [aiAnalysis, setAiAnalysis] = useState<{
    compilationTitle: string;
    hook: string;
    thumbnailText: string;
    theme: string;
    reasoning: string;
  } | null>(null);
  const [generatedVideo, setGeneratedVideo] = useState<{ videoPath: string; duration: number; articleCount: number } | null>(null);

  // Fetch approved content items
  const { data: contentItems = [] } = useQuery<ContentItem[]>({
    queryKey: ["/api/content-items"],
    select: (data) => data.filter((item: ContentItem) => item.status === "approved")
  });

  const analyzeArticlesMutation = useMutation<{
    compilationTitle: string;
    hook: string;
    thumbnailText: string;
    theme: string;
    reasoning: string;
  }>({
    mutationFn: async (): Promise<{
      compilationTitle: string;
      hook: string;
      thumbnailText: string;
      theme: string;
      reasoning: string;
    }> => {
      if (selectedArticles.length === 0) {
        throw new Error("Please select at least one article");
      }

      const response = await fetch("/api/content-items/analyze-compilation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          articleIds: selectedArticles
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to analyze articles");
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      setAiAnalysis(data);
      setCompilationTitle(data.compilationTitle);
      setHook(data.hook);
      setThumbnailText(data.thumbnailText);
      toast({
        title: "AI Analysis Complete",
        description: `Optimized compilation settings generated based on ${data.theme}`
      });
    },
    onError: (error) => {
      toast({
        title: "Analysis Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const generateCompilationMutation = useMutation<{ videoPath: string; duration: number; articleCount: number }>({
    mutationFn: async (): Promise<{ videoPath: string; duration: number; articleCount: number }> => {
      if (selectedArticles.length === 0) {
        throw new Error("Please select at least one article");
      }
      
      if (!compilationTitle || !hook || !thumbnailText) {
        throw new Error("Please fill in all required fields");
      }

      const response = await fetch("/api/content-items/generate-compilation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          articleIds: selectedArticles,
          compilationTitle,
          hook,
          thumbnailText
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to generate compilation video");
      }
      
      const data = await response.json();
      return { 
        videoPath: data.videoPath, 
        duration: data.duration,
        articleCount: data.articleCount 
      };
    },
    onSuccess: (data) => {
      setGeneratedVideo(data);
      toast({
        title: "Success",
        description: `Compilation video generated! ${data.articleCount} articles, ${Math.round(data.duration)}s duration`
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

  const handleArticleToggle = (articleId: number) => {
    setSelectedArticles(prev => 
      prev.includes(articleId) 
        ? prev.filter(id => id !== articleId)
        : [...prev, articleId]
    );
  };

  const handleSelectAll = () => {
    if (selectedArticles.length === contentItems.length) {
      setSelectedArticles([]);
    } else {
      setSelectedArticles(contentItems.map(item => item.id));
    }
  };

  const generateSuggestedContent = () => {
    if (selectedArticles.length > 0) {
      const selectedItems = contentItems.filter(item => selectedArticles.includes(item.id));
      const sources = Array.from(new Set(selectedItems.map(item => item.sourceName)));
      
      setCompilationTitle(`Today's Top ${selectedItems.length} Stories${sources.length > 1 ? ` from ${sources.slice(0, 2).join(' & ')}` : ''}`);
      setHook(`Breaking: ${selectedItems.length} Major Stories You Need to Know!`);
      setThumbnailText(`${selectedItems.length} BIG STORIES`);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Video className="text-red-600" size={24} />
            <span>Generate Compilation Video</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Article Selection */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center justify-between">
                  Select Articles ({selectedArticles.length} selected)
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSelectAll}
                  >
                    {selectedArticles.length === contentItems.length ? "Deselect All" : "Select All"}
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 max-h-96 overflow-y-auto">
                {contentItems.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">
                    No approved articles available. Please approve some articles first.
                  </p>
                ) : (
                  contentItems.map(item => (
                    <div key={item.id} className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                      <Checkbox
                        checked={selectedArticles.includes(item.id)}
                        onCheckedChange={() => handleArticleToggle(item.id)}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{item.title}</p>
                        <p className="text-xs text-gray-500">
                          {item.sourceName} • {new Date(item.publishedAt).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                          {item.content}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          {/* Compilation Settings */}
          <div className="space-y-4">
            {!generatedVideo ? (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center justify-between">
                    Compilation Settings
                    <div className="flex items-center space-x-2">
                      {selectedArticles.length > 0 && (
                        <Button
                          onClick={() => analyzeArticlesMutation.mutate()}
                          disabled={analyzeArticlesMutation.isPending}
                          size="sm"
                          className="bg-purple-600 hover:bg-purple-700 text-white"
                        >
                          {analyzeArticlesMutation.isPending ? (
                            <>
                              <Loader2 size={14} className="mr-1 animate-spin" />
                              AI Analysis
                            </>
                          ) : (
                            <>
                              <Brain size={14} className="mr-1" />
                              AI Optimize
                            </>
                          )}
                        </Button>
                      )}
                      {selectedArticles.length > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={generateSuggestedContent}
                        >
                          <Plus size={14} className="mr-1" />
                          Quick
                        </Button>
                      )}
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {aiAnalysis && (
                    <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <Sparkles className="text-purple-600" size={16} />
                        <h4 className="font-medium text-purple-800">AI Analysis Complete</h4>
                      </div>
                      <p className="text-sm text-purple-700 mb-2">
                        <strong>Theme:</strong> {aiAnalysis.theme}
                      </p>
                      <p className="text-sm text-purple-600">
                        {aiAnalysis.reasoning}
                      </p>
                    </div>
                  )}
                  
                  <div>
                    <Label htmlFor="compilationTitle">Video Title *</Label>
                    <Input
                      id="compilationTitle"
                      value={compilationTitle}
                      onChange={(e) => setCompilationTitle(e.target.value)}
                      placeholder="Today's Top News Stories"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="hook">Opening Hook *</Label>
                    <Textarea
                      id="hook"
                      value={hook}
                      onChange={(e) => setHook(e.target.value)}
                      placeholder="Breaking: Here are the stories everyone's talking about!"
                      rows={2}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="thumbnailText">Thumbnail Text *</Label>
                    <Input
                      id="thumbnailText"
                      value={thumbnailText}
                      onChange={(e) => setThumbnailText(e.target.value)}
                      placeholder="TOP NEWS"
                    />
                  </div>
                  
                  <Button 
                    onClick={() => generateCompilationMutation.mutate()}
                    disabled={generateCompilationMutation.isPending || selectedArticles.length === 0}
                    className="w-full bg-red-600 hover:bg-red-700 text-white"
                  >
                    {generateCompilationMutation.isPending ? (
                      <>
                        <Loader2 size={16} className="mr-2 animate-spin" />
                        Generating Video...
                      </>
                    ) : (
                      <>
                        <Video size={16} className="mr-2" />
                        Generate Compilation Video
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-green-200 bg-green-50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <Video className="text-green-600" size={20} />
                    <span>Compilation Video Ready!</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="p-4 bg-white rounded-lg border">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-medium">{compilationTitle}</p>
                        <p className="text-sm text-gray-600">
                          {generatedVideo.articleCount} articles • {Math.round(generatedVideo.duration)}s duration
                        </p>
                      </div>
                      <Play className="text-green-600" size={24} />
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        onClick={() => window.open(`/videos/${generatedVideo.videoPath}`, '_blank')}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <Play size={14} className="mr-1" />
                        Watch Video
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
                    onClick={() => {
                      setGeneratedVideo(null);
                      setSelectedArticles([]);
                      setCompilationTitle("");
                      setHook("");
                      setThumbnailText("");
                      setAiAnalysis(null);
                    }}
                    variant="outline"
                    className="w-full"
                  >
                    Create Another Compilation
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}