import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Star, Clock, Gift, Lock, Check, Ticket, RotateCw, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import TaskQRModal from "@/components/rewards/TaskQRModal";

interface Task {
  id: string;
  title: string;
  description: string;
  points_reward: number;
  level_reward: number;
  icon: string;
}

interface Household {
  id: string;
  points: number;
  level: number;
}

interface ActiveTask {
  id: string;
  startedAt: number;
}

interface CompletedTask {
  taskId: string;
  pointsAwarded: number;
  levelAwarded: number;
}

const ACTIVE_TASKS_KEY = "recylo_active_tasks";

// Define special rewards for alternate levels
const specialRewards: Record<number, { type: string; label: string }> = {
  2: { type: "spin", label: "Free Spin" },
  4: { type: "coupon", label: "Coupon" },
  6: { type: "draw", label: "Lucky Draw" },
  8: { type: "spin", label: "Free Spin" },
  10: { type: "coupon", label: "Coupon" },
  12: { type: "draw", label: "Lucky Draw" },
  14: { type: "spin", label: "2x Spins" },
  16: { type: "coupon", label: "Premium Coupon" },
  18: { type: "draw", label: "Lucky Draw" },
  20: { type: "spin", label: "3x Spins" },
  22: { type: "coupon", label: "Super Coupon" },
  24: { type: "draw", label: "Lucky Draw" },
  26: { type: "spin", label: "5x Spins" },
  28: { type: "coupon", label: "Mega Coupon" },
  30: { type: "draw", label: "Grand Draw" },
};

const Rewards = () => {
  const [household, setHousehold] = useState<Household | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTasks, setActiveTasks] = useState<ActiveTask[]>([]);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showCongrats, setShowCongrats] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [pendingCompleteTask, setPendingCompleteTask] = useState<Task | null>(null);
  const [completedTaskInfo, setCompletedTaskInfo] = useState<CompletedTask | null>(null);

  useEffect(() => {
    fetchData();
    loadActiveTasks();
  }, []);

  // Subscribe to real-time updates for household points/level and task completions
  useEffect(() => {
    if (!household?.id) return;

    const channel = supabase
      .channel('rewards-realtime')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'households',
          filter: `id=eq.${household.id}`
        },
        (payload) => {
          console.log('Household updated:', payload);
          setHousehold(prev => prev ? { ...prev, ...payload.new } : null);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'task_completions',
          filter: `household_id=eq.${household.id}`
        },
        (payload: any) => {
          console.log('Task completion verified by driver:', payload);
          // Find the task that was completed
          const completedTask = tasks.find(t => t.id === payload.new.task_id);
          if (completedTask) {
            // Close QR modal and show congrats
            setShowQRModal(false);
            setPendingCompleteTask(null);
            setSelectedTask(completedTask);
            setCompletedTaskInfo({
              taskId: completedTask.id,
              pointsAwarded: payload.new.points_awarded || completedTask.points_reward,
              levelAwarded: payload.new.level_awarded || completedTask.level_reward
            });
            setShowCongrats(true);
            
            // Remove from active tasks
            const newActiveTasks = activeTasks.filter(t => t.id !== completedTask.id);
            saveActiveTasks(newActiveTasks);
            
            // Refresh household data to get updated points/level
            fetchData();
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_tasks',
          filter: `household_id=eq.${household.id}`
        },
        (payload: any) => {
          console.log('Task status updated:', payload);
          if (payload.new.status === 'completed') {
            // Find the task that was completed
            const completedTask = tasks.find(t => t.id === payload.new.task_id);
            if (completedTask) {
              // Close QR modal and show congrats
              setShowQRModal(false);
              setPendingCompleteTask(null);
              setSelectedTask(completedTask);
              setCompletedTaskInfo({
                taskId: completedTask.id,
                pointsAwarded: completedTask.points_reward,
                levelAwarded: completedTask.level_reward
              });
              setShowCongrats(true);
              
              // Remove from active tasks
              const newActiveTasks = activeTasks.filter(t => t.id !== completedTask.id);
              saveActiveTasks(newActiveTasks);
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'user_tasks',
          filter: `household_id=eq.${household.id}`
        },
        (payload: any) => {
          console.log('Task updated:', payload);
          if (payload.new.status === 'completed') {
            const completedTask = tasks.find(t => t.id === payload.new.task_id);
            if (completedTask) {
              setShowQRModal(false);
              setPendingCompleteTask(null);
              setSelectedTask(completedTask);
              setCompletedTaskInfo({
                taskId: completedTask.id,
                pointsAwarded: completedTask.points_reward,
                levelAwarded: completedTask.level_reward
              });
              setShowCongrats(true);
              
              const newActiveTasks = activeTasks.filter(t => t.id !== completedTask.id);
              saveActiveTasks(newActiveTasks);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [household?.id, tasks, activeTasks]);

  const loadActiveTasks = () => {
    const stored = localStorage.getItem(ACTIVE_TASKS_KEY);
    if (stored) {
      setActiveTasks(JSON.parse(stored));
    }
  };

  const saveActiveTasks = (tasks: ActiveTask[]) => {
    localStorage.setItem(ACTIVE_TASKS_KEY, JSON.stringify(tasks));
    setActiveTasks(tasks);
  };

  const fetchData = async () => {
    try {
      // Get current user session
      const { data: { session } } = await supabase.auth.getSession();
      
      let householdData = null;
      
      if (session?.user?.id) {
        // Fetch household by user_id
        const { data } = await supabase
          .from("households")
          .select("id, points, level")
          .eq("user_id", session.user.id)
          .maybeSingle();
        householdData = data;
      }
      
      // Fallback for backward compatibility
      if (!householdData) {
        const { data } = await supabase
          .from("households")
          .select("id, points, level")
          .limit(1)
          .maybeSingle();
        householdData = data;
      }

      if (householdData) {
        setHousehold(householdData);
      }

      const { data: tasksData } = await supabase.from("rewards_tasks").select("*");

      if (tasksData) {
        setTasks(tasksData);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartTask = (task: Task) => {
    setSelectedTask(task);
    setShowTaskModal(true);
  };

  const confirmStartTask = () => {
    if (selectedTask) {
      const newActiveTasks = [
        ...activeTasks,
        { id: selectedTask.id, startedAt: Date.now() },
      ];
      saveActiveTasks(newActiveTasks);
      setShowTaskModal(false);
      toast({
        title: "Task Started",
        description: "You have 48 hours to complete this task.",
      });
    }
  };

  const getTimeRemaining = (startedAt: number) => {
    const elapsed = Date.now() - startedAt;
    const remaining = 48 * 60 * 60 * 1000 - elapsed;
    if (remaining <= 0) return "Expired";
    const hours = Math.floor(remaining / (60 * 60 * 1000));
    const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
    return `${hours}h ${minutes}m`;
  };

  const isTaskActive = (taskId: string) => {
    return activeTasks.some((t) => t.id === taskId);
  };

  const getActiveTask = (taskId: string) => {
    return activeTasks.find((t) => t.id === taskId);
  };

  const handleCompleteClick = (task: Task) => {
    setPendingCompleteTask(task);
    setShowQRModal(true);
  };


  // Generate 30 levels
  const levels = Array.from({ length: 30 }, (_, i) => ({
    number: i + 1,
    points: (i + 1) * 50,
    status: household
      ? i + 1 < household.level
        ? "completed"
        : i + 1 === household.level
        ? "current"
        : "locked"
      : "locked",
    specialReward: specialRewards[i + 1] || null,
  }));

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-24 px-5 pt-8">
        <Skeleton className="h-32 w-full mb-6 rounded-2xl" />
        <Skeleton className="h-8 w-32 mb-4 rounded-xl" />
        <div className="flex gap-3 overflow-x-auto pb-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40 w-40 flex-shrink-0 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 px-5 pt-8">
      {/* Points Card */}
      <div className="bg-primary rounded-3xl p-5 mb-6 animate-fade-up">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm text-primary-foreground/80 mb-1">Your Points</p>
            <h2 className="text-3xl font-bold text-primary-foreground">
              {household?.points?.toLocaleString()}
            </h2>
          </div>
          <div className="flex items-center gap-1.5 bg-primary-foreground/20 px-3 py-1.5 rounded-full">
            <Star className="w-4 h-4 text-primary-foreground" />
            <span className="text-sm font-semibold text-primary-foreground">
              Level {household?.level}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <Link
            to="/spinwheel"
            className="flex-1 bg-primary-foreground/20 rounded-xl p-3 text-center hover:bg-primary-foreground/30 transition-colors"
          >
            <RotateCw className="w-5 h-5 text-primary-foreground mx-auto mb-1" />
            <p className="text-xs font-medium text-primary-foreground">Spin</p>
          </Link>
          <Link
            to="/luckydraw"
            className="flex-1 bg-primary-foreground/20 rounded-xl p-3 text-center hover:bg-primary-foreground/30 transition-colors"
          >
            <Gift className="w-5 h-5 text-primary-foreground mx-auto mb-1" />
            <p className="text-xs font-medium text-primary-foreground">Draws</p>
          </Link>
          <Link
            to="/coupons"
            className="flex-1 bg-primary-foreground/20 rounded-xl p-3 text-center hover:bg-primary-foreground/30 transition-colors"
          >
            <Ticket className="w-5 h-5 text-primary-foreground mx-auto mb-1" />
            <p className="text-xs font-medium text-primary-foreground">Coupons</p>
          </Link>
        </div>
      </div>

      {/* Tasks */}
      <div className="mb-8 animate-fade-up stagger-1">
        <h3 className="font-semibold text-foreground mb-4">Eco Tasks</h3>
        <div className="space-y-3">
          {tasks.map((task) => {
            const isActive = isTaskActive(task.id);
            const activeTask = getActiveTask(task.id);
            return (
              <div
                key={task.id}
                className="bg-card rounded-2xl p-4 border border-border/30"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="font-medium text-foreground">{task.title}</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {task.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="bg-primary/10 text-primary px-2 py-1 rounded-full font-medium">
                      +{task.points_reward} pts
                    </span>
                    {task.level_reward > 0 && (
                      <span className="bg-muted text-foreground px-2 py-1 rounded-full font-medium">
                        +{task.level_reward} lvl
                      </span>
                    )}
                  </div>
                </div>
                {isActive && activeTask ? (
                  <div className="flex items-center gap-3">
                    <div className="flex-1 flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span>{getTimeRemaining(activeTask.startedAt)}</span>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleCompleteClick(task)}
                      className="rounded-xl"
                    >
                      <QrCode className="w-4 h-4 mr-1" />
                      Complete
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleStartTask(task)}
                    className="w-full rounded-xl"
                  >
                    Start Task
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Levels - 2 columns x 15 rows */}
      <div className="animate-fade-up stagger-2">
        <h3 className="font-semibold text-foreground mb-4">Level Progress</h3>
        <div className="grid grid-cols-2 gap-3">
          {levels.map((level) => (
            <div
              key={level.number}
              className={`rounded-2xl p-4 border transition-all ${
                level.status === "completed"
                  ? "bg-emerald-50 border-emerald-200"
                  : level.status === "current"
                  ? "bg-primary/10 border-primary/30"
                  : "bg-card border-border/30"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {level.status === "completed" ? (
                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                      <Check className="w-4 h-4 text-emerald-600" />
                    </div>
                  ) : level.status === "current" ? (
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                      <span className="text-sm font-bold text-primary-foreground">{level.number}</span>
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                      <Lock className="w-3 h-3 text-muted-foreground" />
                    </div>
                  )}
                  <span className={`text-lg font-bold ${
                    level.status === "completed" 
                      ? "text-emerald-700" 
                      : level.status === "current" 
                      ? "text-primary" 
                      : "text-muted-foreground"
                  }`}>
                    Level {level.number}
                  </span>
                </div>
              </div>
              <div className="flex flex-col">
                <span className={`text-xs ${
                  level.status === "completed" 
                    ? "text-emerald-600" 
                    : level.status === "current" 
                    ? "text-primary" 
                    : "text-muted-foreground"
                }`}>
                  {level.points} pts
                </span>
                {level.specialReward && (
                  <span className={`text-xs px-2 py-0.5 rounded-full mt-2 w-fit ${
                    level.status === "completed"
                      ? "bg-emerald-200 text-emerald-700"
                      : level.status === "current"
                      ? "bg-primary/20 text-primary"
                      : "bg-muted text-muted-foreground"
                  }`}>
                    {level.specialReward.label}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Task Start Modal */}
      {showTaskModal && selectedTask && (
        <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-[60] flex items-center justify-center p-6">
          <div className="bg-card w-full max-w-sm rounded-2xl p-6 animate-scale-in">
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Clock className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {selectedTask.title}
              </h3>
              <p className="text-sm text-muted-foreground">
                48 hours to complete
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowTaskModal(false)}
                className="flex-1 rounded-xl h-11"
              >
                Cancel
              </Button>
              <Button onClick={confirmStartTask} className="flex-1 rounded-xl h-11">
                Start
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Congratulations Modal */}
      {showCongrats && selectedTask && (
        <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-[60] flex items-center justify-center p-6">
          <div className="bg-card w-full max-w-sm rounded-2xl p-6 animate-scale-in text-center">
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Check className="w-6 h-6 text-emerald-600" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Task Completed!
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Driver verified your task! You earned {completedTaskInfo?.pointsAwarded || selectedTask.points_reward} points
              {(completedTaskInfo?.levelAwarded || selectedTask.level_reward) > 0 &&
                ` and advanced ${completedTaskInfo?.levelAwarded || selectedTask.level_reward} level`}
            </p>
            <Button
              onClick={() => {
                setShowCongrats(false);
                setSelectedTask(null);
                setCompletedTaskInfo(null);
                fetchData(); // Refresh data
              }}
              className="w-full rounded-xl h-11"
            >
              Claim Reward
            </Button>
          </div>
        </div>
      )}

      {/* Task QR Verification Modal */}
      {showQRModal && pendingCompleteTask && household && (
        <TaskQRModal
          open={showQRModal}
          onClose={() => {
            setShowQRModal(false);
            setPendingCompleteTask(null);
          }}
          taskId={pendingCompleteTask.id}
          taskTitle={pendingCompleteTask.title}
          householdId={household.id}
        />
      )}
    </div>
  );
};

export default Rewards;
