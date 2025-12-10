import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Star, Clock, Gift, Lock, Check, ChevronRight, Ticket, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";

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

const ACTIVE_TASKS_KEY = "recylo_active_tasks";

const Rewards = () => {
  const [household, setHousehold] = useState<Household | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTasks, setActiveTasks] = useState<ActiveTask[]>([]);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showCongrats, setShowCongrats] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  useEffect(() => {
    fetchData();
    loadActiveTasks();
  }, []);

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
      const { data: householdData } = await supabase
        .from("households")
        .select("id, points, level")
        .limit(1)
        .maybeSingle();

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

  const handleCompleteTask = async (task: Task) => {
    if (!household) return;

    try {
      await supabase
        .from("households")
        .update({
          points: household.points + task.points_reward,
          level: household.level + task.level_reward,
        })
        .eq("id", household.id);

      const newActiveTasks = activeTasks.filter((t) => t.id !== task.id);
      saveActiveTasks(newActiveTasks);

      setSelectedTask(task);
      setShowCongrats(true);
      fetchData();
    } catch (error) {
      toast({
        title: "Error completing task",
        variant: "destructive",
      });
    }
  };

  const levels = Array.from({ length: 10 }, (_, i) => ({
    number: i + 1,
    points: (i + 1) * 100,
    status: household
      ? i + 1 < household.level
        ? "completed"
        : i + 1 === household.level
        ? "current"
        : "locked"
      : "locked",
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
    <div className="min-h-screen bg-background pb-28 px-5 pt-8">
      {/* Points Card */}
      <div className="bg-card rounded-2xl p-5 border border-border/30 mb-6 animate-fade-up">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Your Points</p>
            <h2 className="text-3xl font-bold text-foreground">
              {household?.points?.toLocaleString()}
            </h2>
          </div>
          <div className="flex items-center gap-1.5 bg-primary/10 px-3 py-1.5 rounded-full">
            <Star className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-primary">
              Level {household?.level}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <Link
            to="/spinwheel"
            className="flex-1 bg-muted rounded-xl p-3 text-center hover:bg-muted/80 transition-colors"
          >
            <RotateCw className="w-5 h-5 text-primary mx-auto mb-1" />
            <p className="text-xs font-medium text-foreground">Spin</p>
          </Link>
          <Link
            to="/luckydraw"
            className="flex-1 bg-muted rounded-xl p-3 text-center hover:bg-muted/80 transition-colors"
          >
            <Gift className="w-5 h-5 text-primary mx-auto mb-1" />
            <p className="text-xs font-medium text-foreground">Draws</p>
          </Link>
          <Link
            to="/coupons"
            className="flex-1 bg-muted rounded-xl p-3 text-center hover:bg-muted/80 transition-colors"
          >
            <Ticket className="w-5 h-5 text-primary mx-auto mb-1" />
            <p className="text-xs font-medium text-foreground">Coupons</p>
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
                      onClick={() => handleCompleteTask(task)}
                      className="rounded-xl"
                    >
                      <Check className="w-4 h-4 mr-1" />
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

      {/* Levels */}
      <div className="animate-fade-up stagger-2">
        <h3 className="font-semibold text-foreground mb-4">Level Progress</h3>
        <div className="bg-card rounded-2xl p-4 border border-border/30">
          <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-2">
            {levels.map((level) => (
              <div
                key={level.number}
                className={`flex-shrink-0 w-14 h-14 rounded-xl flex flex-col items-center justify-center ${
                  level.status === "completed"
                    ? "bg-emerald-100"
                    : level.status === "current"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                {level.status === "completed" ? (
                  <Check className="w-5 h-5 text-emerald-600" />
                ) : level.status === "locked" ? (
                  <Lock className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <span className="text-lg font-bold">{level.number}</span>
                )}
                <span className={`text-[10px] ${level.status === "current" ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                  {level.points}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Task Start Modal */}
      {showTaskModal && selectedTask && (
        <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50 flex items-center justify-center p-6">
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
        <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-card w-full max-w-sm rounded-2xl p-6 animate-scale-in text-center">
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Check className="w-6 h-6 text-emerald-600" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Task Completed
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              You earned {selectedTask.points_reward} points
              {selectedTask.level_reward > 0 &&
                ` and advanced ${selectedTask.level_reward} level`}
            </p>
            <Button
              onClick={() => {
                setShowCongrats(false);
                setSelectedTask(null);
              }}
              className="w-full rounded-xl h-11"
            >
              Continue
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Rewards;
