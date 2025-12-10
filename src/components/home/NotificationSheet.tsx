import { X, Bell, CheckCircle, Info, AlertTriangle } from "lucide-react";

interface NotificationSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

const notifications = [
  {
    id: "1",
    title: "Collection Completed",
    message: "Your waste was collected successfully today.",
    time: "2 hours ago",
    type: "success",
  },
  {
    id: "2",
    title: "Points Earned",
    message: "You earned 50 points for proper waste segregation.",
    time: "5 hours ago",
    type: "info",
  },
  {
    id: "3",
    title: "Bin Almost Full",
    message: "Your recyclable bin is 85% full. Schedule a pickup soon.",
    time: "1 day ago",
    type: "warning",
  },
  {
    id: "4",
    title: "Level Up",
    message: "Congratulations! You've reached Level 5.",
    time: "2 days ago",
    type: "success",
  },
  {
    id: "5",
    title: "New Task Available",
    message: "Complete the weekly recycling challenge to earn bonus points.",
    time: "3 days ago",
    type: "info",
  },
];

const getIcon = (type: string) => {
  switch (type) {
    case "success":
      return <CheckCircle className="w-5 h-5 text-emerald-600" />;
    case "warning":
      return <AlertTriangle className="w-5 h-5 text-amber-600" />;
    default:
      return <Info className="w-5 h-5 text-primary" />;
  }
};

export const NotificationSheet = ({ isOpen, onClose }: NotificationSheetProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50 animate-fade-up">
      <div className="absolute right-0 top-0 bottom-0 w-full max-w-sm bg-background animate-slide-in-right">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Notifications</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
        
        <div className="p-4 space-y-3 overflow-y-auto max-h-[calc(100vh-80px)]">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className="bg-card rounded-2xl p-4 border border-border/30"
            >
              <div className="flex gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  {getIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-foreground text-sm">
                    {notification.title}
                  </h4>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {notification.message}
                  </p>
                  <span className="text-xs text-muted-foreground/70 mt-2 block">
                    {notification.time}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
