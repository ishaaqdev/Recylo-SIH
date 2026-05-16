import { useEffect, useState } from "react";
import { X, Bell, CheckCircle, Info, AlertTriangle, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";

interface NotificationSheetProps {
  isOpen: boolean;
  onClose: () => void;
  householdId?: string;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  type: "success" | "info" | "warning" | "level";
}

const getIcon = (type: string) => {
  switch (type) {
    case "success":
      return <CheckCircle className="w-5 h-5 text-emerald-600" />;
    case "warning":
      return <AlertTriangle className="w-5 h-5 text-amber-600" />;
    case "level":
      return <TrendingUp className="w-5 h-5 text-primary" />;
    default:
      return <Info className="w-5 h-5 text-primary" />;
  }
};

export const NotificationSheet = ({ isOpen, onClose, householdId }: NotificationSheetProps) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && householdId) {
      fetchNotifications();
    }
  }, [isOpen, householdId]);

  const fetchNotifications = async () => {
    if (!householdId) return;
    
    setLoading(true);
    try {
      // Fetch recent collection logs
      const { data: collections } = await supabase
        .from("collection_logs")
        .select("*")
        .eq("household_id", householdId)
        .order("collected_at", { ascending: false })
        .limit(10);

      // Fetch recent task completions
      const { data: taskCompletions } = await supabase
        .from("task_completions")
        .select("*, rewards_tasks(title)")
        .eq("household_id", householdId)
        .order("completed_at", { ascending: false })
        .limit(5);

      const notifs: Notification[] = [];

      // Add collection notifications
      if (collections) {
        collections.forEach((col) => {
          if (col.segregation_status === "pass") {
            notifs.push({
              id: `col-${col.id}`,
              title: "Points Earned!",
              message: "You earned 10 points and advanced 1 level for proper segregation!",
              time: formatDistanceToNow(new Date(col.collected_at), { addSuffix: true }),
              type: "success",
            });
          } else {
            notifs.push({
              id: `col-${col.id}`,
              title: "Collection Completed",
              message: "Your waste was collected. Remember to segregate properly next time!",
              time: formatDistanceToNow(new Date(col.collected_at), { addSuffix: true }),
              type: "warning",
            });
          }
        });
      }

      // Add task completion notifications
      if (taskCompletions) {
        taskCompletions.forEach((tc: any) => {
          notifs.push({
            id: `task-${tc.id}`,
            title: "Task Completed!",
            message: `Earned ${tc.points_awarded} points and ${tc.level_awarded} level${tc.level_awarded > 1 ? 's' : ''} for "${tc.rewards_tasks?.title || 'task'}"`,
            time: formatDistanceToNow(new Date(tc.completed_at), { addSuffix: true }),
            type: "level",
          });
        });
      }

      // Sort by time (most recent first)
      notifs.sort((a, b) => {
        const aTime = new Date(a.time).getTime();
        const bTime = new Date(b.time).getTime();
        return bTime - aTime;
      });

      setNotifications(notifs.slice(0, 15));
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

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
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-card rounded-2xl p-4 border border-border/30 animate-pulse">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                  <div className="h-3 bg-muted rounded w-full" />
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No notifications yet</p>
            </div>
          ) : (
            notifications.map((notification) => (
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
            ))
          )}
        </div>
      </div>
    </div>
  );
};