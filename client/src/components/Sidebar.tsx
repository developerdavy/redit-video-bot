import { Link, useLocation } from "wouter";
import { 
  Youtube, 
  BarChart3, 
  Calendar, 
  Eye, 
  Bot, 
  Settings,
  User,
  Plus
} from "lucide-react";
import { FaReddit } from "react-icons/fa";
import { Button } from "@/components/ui/button";

const navigation = [
  { name: "Dashboard", href: "/", icon: BarChart3 },
  { name: "Reddit Sources", href: "/reddit-sources", icon: FaReddit },
  { name: "AI Generator", href: "/ai-generator", icon: Bot },
  { name: "Preview Queue", href: "/preview-queue", icon: Eye },
  { name: "Scheduled Posts", href: "/scheduled-posts", icon: Calendar },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
];

export default function Sidebar() {
  const [location] = useLocation();

  return (
    <aside className="w-64 bg-white shadow-lg border-r border-gray-200 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-youtube-red rounded-lg flex items-center justify-center">
            <Youtube className="text-white" size={20} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-text-black">ContentBot</h1>
            <p className="text-sm text-gray-500">YouTube Automation</p>
          </div>
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navigation.map((item) => {
            const isActive = location === item.href;
            const IconComponent = item.icon;
            
            return (
              <li key={item.name}>
                <Link href={item.href} className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive 
                    ? "bg-youtube-red text-white" 
                    : "text-gray-700 hover:bg-gray-100"
                }`}>
                  <IconComponent size={18} />
                  <span>{item.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      
      {/* User Profile */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-accent-blue rounded-full flex items-center justify-center">
            <User className="text-white" size={16} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-text-black">John Creator</p>
            <p className="text-xs text-gray-500">Free Plan</p>
          </div>
          <Button variant="ghost" size="sm">
            <Settings size={16} />
          </Button>
        </div>
      </div>
    </aside>
  );
}
