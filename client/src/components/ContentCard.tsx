import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Check, X, Clock, Calendar } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ContentCardProps {
  id: number;
  title: string;
  source: string;
  upvotes: number;
  aiDescription?: string;
  status: string;
  thumbnailUrl?: string;
  duration?: number;
  scheduledAt?: string;
  createdAt: string;
}

export default function ContentCard({
  id,
  title,
  source,
  upvotes,
  aiDescription,
  status,
  thumbnailUrl,
  duration,
  scheduledAt,
  createdAt
}: ContentCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const approveMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/content-items/${id}/approve`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/content-items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Success",
        description: "Video approved and ready for scheduling"
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to approve video: ${error.message}`,
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
        description: "Video rejected and removed from queue"
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to reject video: ${error.message}`,
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

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
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
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start space-x-4">
          {/* Thumbnail */}
          <div className="flex-shrink-0">
            <div className="w-24 h-16 bg-gray-200 rounded-lg overflow-hidden relative">
              {thumbnailUrl ? (
                <img 
                  src={thumbnailUrl} 
                  alt={title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                  <Eye size={20} className="text-gray-500" />
                </div>
              )}
              {duration && (
                <div className="absolute bottom-1 right-1 bg-black bg-opacity-75 text-white text-xs px-1 rounded">
                  {formatDuration(duration)}
                </div>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-text-black truncate">{title}</h4>
            <p className="text-sm text-gray-600 mt-1">
              From r/{source} • {upvotes.toLocaleString()} upvotes
            </p>
            
            {aiDescription && (
              <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                {aiDescription}
              </p>
            )}
            
            <div className="flex items-center space-x-4 mt-3">
              {getStatusBadge()}
              <span className="text-xs text-gray-500">
                {scheduledAt ? `Scheduled for ${new Date(scheduledAt).toLocaleString()}` : `Generated ${formatTimeAgo(createdAt)}`}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex-shrink-0 flex items-center space-x-2">
            <Button variant="ghost" size="sm" className="text-accent-blue hover:bg-blue-50">
              <Eye size={16} />
            </Button>
            
            {status === "pending" && (
              <>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-success-green hover:bg-green-50"
                  onClick={() => approveMutation.mutate()}
                  disabled={approveMutation.isPending}
                >
                  <Check size={16} />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-error-red hover:bg-red-50"
                  onClick={() => rejectMutation.mutate()}
                  disabled={rejectMutation.isPending}
                >
                  <X size={16} />
                </Button>
              </>
            )}
            
            {status === "approved" && (
              <Button variant="ghost" size="sm" className="text-gray-400">
                <Calendar size={16} />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
