import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Sparkles, Clock, Gift, Lock, Check, ChevronRight, Ticket } from "lucide-react";
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

const Rewards = () => {
  const [household, setHousehold] = useState<Household | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showCongrats, setShowCongrats] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

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
      setActiveTaskId(selectedTask.id);
      setShowTaskModal(false);
      toast({
        title: "Task Started!",
        description: "You have 48 hours to complete this task.",
      });
    }
  };

  const handleCompleteTask = async () => {
    if (!household || !selectedTask) return;

    try {
      await supabase
        .from("households")
        .update({
          points: household.points + selectedTask.points_reward,
          level: household.level + selectedTask.level_reward,
        })
        .eq("id", household.id);

      setShowCongrats(true);
      setActiveTaskId(null);
      fetchData();
    } catch (error) {
      toast({
        title: "Error completing task",
        variant: "destructive",
      });
    }
  };

  const levels = Array.from({ length: 30 }, (_, i) => ({
    number: i + 1,
    points: (i + 1) * 100,
    text: [
      "Getting Started",
      "Eco Beginner",
      "Green Sprout",
      "Recycling Fan",
      "Earth Helper",
      "Waste Warrior",
      "Green Champion",
      "Eco Expert",
      "Planet Saver",
      "Recylo Master",
    ][i % 10],
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
        <Skeleton className="h-40 w-full mb-6 rounded-3xl" />
        <Skeleton className="h-8 w-32 mb-4 rounded-xl" />
        <div className="flex gap-3 overflow-x-auto pb-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48 w-48 flex-shrink-0 rounded-3xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-28 px-5 pt-8">
      {/* Points Card */}
      <div className="recylo-gradient rounded-3xl p-6 premium-shadow mb-6 animate-fade-up">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-primary-foreground/80 text-sm mb-1">Your Rewards</p>
            <h2 className="text-4xl font-bold text-primary-foreground mb-2">
              {household?.points?.toLocaleString()}
            </h2>
            <div className="inline-flex items-center gap-1.5 bg-primary-foreground/20 px-3 py-1.5 rounded-full">
              <Sparkles className="w-4 h-4 text-primary-foreground" />
              <span className="text-sm font-semibold text-primary-foreground">
                Level {household?.level}
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Link
              to="/spinwheel"
              className="bg-primary-foreground/20 hover:bg-primary-foreground/30 p-3 rounded-2xl transition-colors"
            >
              <Gift className="w-6 h-6 text-primary-foreground" />
            </Link>
            <Link
              to="/coupons"
              className="bg-primary-foreground/20 hover:bg-primary-foreground/30 p-3 rounded-2xl transition-colors"
            >
              <Ticket className="w-6 h-6 text-primary-foreground" />
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-3 mb-6">
        <Link
          to="/spinwheel"
          className="flex-1 bg-amber-50 rounded-2xl p-4 text-center animate-fade-up stagger-1"
        >
          <span className="text-2xl mb-2 block">🎡</span>
          <p className="text-sm font-semibold text-foreground">Spin & Win</p>
        </Link>
        <Link
          to="/luckydraw"
          className="flex-1 bg-violet-50 rounded-2xl p-4 text-center animate-fade-up stagger-2"
        >
          <span className="text-2xl mb-2 block">🎁</span>
          <p className="text-sm font-semibold text-foreground">Lucky Draw</p>
        </Link>
        <Link
          to="/coupons"
          className="flex-1 bg-emerald-50 rounded-2xl p-4 text-center animate-fade-up stagger-3"
        >
          <span className="text-2xl mb-2 block">🎟️</span>
          <p className="text-sm font-semibold text-foreground">Coupons</p>
        </Link>
      </div>

      {/* Tasks Carousel */}
      <div className="mb-8 animate-fade-up stagger-4">
        <h3 className="text-lg font-bold text-foreground mb-4">Eco Tasks</h3>
        <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-2">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="flex-shrink-0 w-48 bg-card rounded-3xl p-5 soft-shadow"
            >
              <span className="text-3xl mb-3 block">{task.icon}</span>
              <h4 className="font-bold text-foreground mb-1">{task.title}</h4>
              <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                {task.description}
              </p>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-medium">
                  +{task.points_reward} pts
                </span>
                {task.level_reward > 0 && (
                  <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-medium">
                    +{task.level_reward} lvl
                  </span>
                )}
              </div>
              {activeTaskId === task.id ? (
                <Button
                  size="sm"
                  onClick={() => {
                    setSelectedTask(task);
                    handleCompleteTask();
                  }}
                  className="w-full rounded-xl text-xs"
                >
                  <Check className="w-3 h-3 mr-1" />
                  Complete
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleStartTask(task)}
                  className="w-full rounded-xl text-xs"
                >
                  Start Task
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Levels Grid */}
      <div className="animate-fade-up stagger-5">
        <h3 className="text-lg font-bold text-foreground mb-4">Level Progress</h3>
        <div className="grid grid-cols-2 gap-3">
          {levels.slice(0, 10).map((level) => (
            <div
              key={level.number}
              className={`rounded-2xl p-4 ${
                level.status === "completed"
                  ? "bg-emerald-50"
                  : level.status === "current"
                  ? "bg-primary/10 border-2 border-primary"
                  : "bg-muted/50"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`text-2xl font-bold ${
                    level.status === "completed"
                      ? "text-emerald-600"
                      : level.status === "current"
                      ? "text-primary"
                      : "text-muted-foreground"
                  }`}
                >
                  {level.number}
                </span>
                {level.status === "completed" && (
                  <Check className="w-5 h-5 text-emerald-500" />
                )}
                {level.status === "locked" && (
                  <Lock className="w-4 h-4 text-muted-foreground" />
                )}
              </div>
              <p className="text-xs text-muted-foreground">{level.text}</p>
              <p className="text-xs font-medium text-foreground mt-1">
                {level.points} pts
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Task Start Modal */}
      {showTaskModal && selectedTask && (
        <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-card w-full max-w-sm rounded-3xl p-6 animate-scale-in">
            <div className="text-center mb-6">
              <span className="text-5xl mb-4 block">{selectedTask.icon}</span>
              <h3 className="text-xl font-bold text-foreground mb-2">
                {selectedTask.title}
              </h3>
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span className="text-sm">48 hours to complete</span>
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowTaskModal(false)}
                className="flex-1 rounded-2xl h-12"
              >
                Cancel
              </Button>
              <Button onClick={confirmStartTask} className="flex-1 rounded-2xl h-12">
                Start Now
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Congratulations Modal */}
      {showCongrats && selectedTask && (
        <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-card w-full max-w-sm rounded-3xl p-6 animate-scale-in text-center">
            <span className="text-6xl mb-4 block animate-float">🎉</span>
            <h3 className="text-2xl font-bold text-foreground mb-2">
              Congratulations!
            </h3>
            <p className="text-muted-foreground mb-4">
              You earned {selectedTask.points_reward} points
              {selectedTask.level_reward > 0 &&
                ` and leveled up ${selectedTask.level_reward} time(s)`}
              !
            </p>
            <Button
              onClick={() => {
                setShowCongrats(false);
                setSelectedTask(null);
              }}
              className="w-full rounded-2xl h-12"
            >
              Claim Reward
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Rewards;
