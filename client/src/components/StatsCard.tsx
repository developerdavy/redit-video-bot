import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: {
    value: string;
    label: string;
    positive?: boolean;
  };
  iconBgColor?: string;
}

export default function StatsCard({ 
  title, 
  value, 
  icon, 
  trend,
  iconBgColor = "bg-youtube-red bg-opacity-10"
}: StatsCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-text-black">{value}</p>
          </div>
          <div className={`w-12 h-12 ${iconBgColor} rounded-lg flex items-center justify-center`}>
            {icon}
          </div>
        </div>
        {trend && (
          <div className="mt-4 flex items-center text-sm">
            <span className={trend.positive !== false ? "text-success-green" : "text-error-red"}>
              {trend.value}
            </span>
            <span className="text-gray-600 ml-2">{trend.label}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
