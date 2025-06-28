import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Calendar, Clock, Check, X } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ContentDetailModalProps {
  id: number;
  title: string;
  source: string;
  content: string;
  url: string;
  imageUrl?: string;
  publishedAt?: string;
  aiDescription?: string;
  status: string;
  scheduledAt?: string;
  createdAt: string;
  children: React.ReactNode;
}

export default function ContentDetailModal({
  id,
  title,
  source,
  content,
  url,
  imageUrl,
  publishedAt,
  aiDescription,
  status,
  scheduledAt,
  createdAt,
  children
}: ContentDetailModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const approveMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/content-items/${id}/approve`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/content-items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Success",
        description: "Article approved and ready for scheduling"
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to approve article: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  const rejectMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/content-items/${id}/reject`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/content-items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Success",
        description: "Article rejected and removed from queue"
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to reject article: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  const getStatusBadge = () => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="secondary" className="bg-warning-yellow bg-opacity-20 text-warning-yellow">
            <Clock size={12} className="mr-1" />
            Pending Review
          </Badge>
        );
      case "approved":
        return (
          <Badge variant="secondary" className="bg-success-green bg-opacity-20 text-success-green">
            <Check size={12} className="mr-1" />
            Approved
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="secondary" className="bg-error-red bg-opacity-20 text-error-red">
            <X size={12} className="mr-1" />
            Rejected
          </Badge>
        );
      case "posted":
        return (
          <Badge variant="secondary" className="bg-accent-blue bg-opacity-20 text-accent-blue">
            <Calendar size={12} className="mr-1" />
            Posted
          </Badge>
        );
      default:
        return null;
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "Just now";
    if (diffInHours === 1) return "1 hour ago";
    return `${diffInHours} hours ago`;
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" aria-describedby="content-description">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-text-black pr-8">
            {title}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Article Image */}
          {imageUrl && (
            <div className="w-full">
              <img 
                src={imageUrl} 
                alt={title}
                className="w-full max-h-64 object-cover rounded-lg"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
            </div>
          )}

          {/* Metadata */}
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center space-x-4">
              {getStatusBadge()}
              <span className="text-sm text-gray-600">
                From {source}
              </span>
              <span className="text-sm text-gray-600">
                {publishedAt ? new Date(publishedAt).toLocaleDateString() : 'Recently published'}
              </span>
            </div>
            
            <Button variant="outline" size="sm" asChild>
              <a href={url} target="_blank" rel="noopener noreferrer">
                <ExternalLink size={16} className="mr-2" />
                View Original
              </a>
            </Button>
          </div>

          {/* Content */}
          <div className="prose max-w-none">
            <h3 className="text-lg font-semibold mb-3">Article Content</h3>
            <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
              {content || "No content available for this article."}
            </div>
          </div>

          {/* AI Description */}
          {aiDescription && (
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-2 text-blue-800">AI-Generated Description</h3>
              <p className="text-blue-700 leading-relaxed">
                {aiDescription}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-sm text-gray-500">
              {scheduledAt ? `Scheduled for ${new Date(scheduledAt).toLocaleString()}` : `Generated ${formatTimeAgo(createdAt)}`}
            </div>
            
            {status === "pending" && (
              <div className="flex space-x-2">
                <Button 
                  variant="outline"
                  onClick={() => rejectMutation.mutate()}
                  disabled={rejectMutation.isPending}
                  className="text-error-red border-error-red hover:bg-red-50"
                >
                  <X size={16} className="mr-2" />
                  Reject
                </Button>
                <Button 
                  onClick={() => approveMutation.mutate()}
                  disabled={approveMutation.isPending}
                  className="bg-success-green hover:bg-green-600 text-white"
                >
                  <Check size={16} className="mr-2" />
                  Approve
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}