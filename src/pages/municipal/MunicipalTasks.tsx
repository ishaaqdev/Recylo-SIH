import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ClipboardList, Play, CheckCircle, TrendingUp } from "lucide-react";
import StatCard from "@/components/municipal/StatCard";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface Task {
  id: string;
  title: string;
  description: string | null;
  points_reward: number;
  level_reward: number;
  time_limit: string | null;
  icon: string | null;
  startedCount: number;
  completedCount: number;
}

const MunicipalTasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState({
    totalTasks: 0,
    startsToday: 0,
    completionsToday: 0,
  });

  // Dummy engagement data
  const engagementTrend = [
    { day: "Mon", starts: 12, completions: 8 },
    { day: "Tue", starts: 15, completions: 10 },
    { day: "Wed", starts: 18, completions: 14 },
    { day: "Thu", starts: 22, completions: 16 },
    { day: "Fri", starts: 20, completions: 15 },
    { day: "Sat", starts: 25, completions: 20 },
    { day: "Sun", starts: 14, completions: 10 },
  ];

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    const { data: tasksData, error } = await supabase
      .from("rewards_tasks")
      .select("*")
      .order("title");

    if (!error && tasksData) {
      // Fetch user_tasks counts for each task
      const tasksWithStats = await Promise.all(
        tasksData.map(async (task) => {
          const { count: startedCount } = await supabase
            .from("user_tasks")
            .select("*", { count: "exact", head: true })
            .eq("task_id", task.id);

          const { count: completedCount } = await supabase
            .from("user_tasks")
            .select("*", { count: "exact", head: true })
            .eq("task_id", task.id)
            .eq("status", "completed");

          return {
            ...task,
            startedCount: startedCount || 0,
            completedCount: completedCount || 0,
          };
        })
      );

      setTasks(tasksWithStats);

      // Calculate stats
      const today = new Date().toISOString().split("T")[0];
      const { count: startsToday } = await supabase
        .from("user_tasks")
        .select("*", { count: "exact", head: true })
        .gte("started_at", today);

      const { count: completionsToday } = await supabase
        .from("user_tasks")
        .select("*", { count: "exact", head: true })
        .eq("status", "completed")
        .gte("completed_at", today);

      setStats({
        totalTasks: tasksData.length,
        startsToday: startsToday || 0,
        completionsToday: completionsToday || 0,
      });
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Tasks & Engagement</h1>
        <p className="text-muted-foreground">Track user task participation and completion</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Total Tasks" value={stats.totalTasks} icon={ClipboardList} />
        <StatCard
          title="Starts Today"
          value={stats.startsToday}
          icon={Play}
          iconClassName="bg-blue-500"
        />
        <StatCard
          title="Completions Today"
          value={stats.completionsToday}
          icon={CheckCircle}
          iconClassName="bg-green-500"
        />
      </div>

      {/* Engagement Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Task Engagement Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={engagementTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="day" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="starts"
                  name="Task Starts"
                  stroke="#3b82f6"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="completions"
                  name="Completions"
                  stroke="#22c55e"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Tasks Table */}
      <Card>
        <CardHeader>
          <CardTitle>Available Tasks</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Task Title</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Points</TableHead>
                <TableHead>Level Reward</TableHead>
                <TableHead>Started</TableHead>
                <TableHead>Completed</TableHead>
                <TableHead>Completion Rate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : tasks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No tasks available
                  </TableCell>
                </TableRow>
              ) : (
                tasks.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell className="font-medium">{task.title}</TableCell>
                    <TableCell className="max-w-[200px] truncate text-muted-foreground">
                      {task.description || "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="default">{task.points_reward} pts</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">+{task.level_reward} level</Badge>
                    </TableCell>
                    <TableCell>{task.startedCount}</TableCell>
                    <TableCell>{task.completedCount}</TableCell>
                    <TableCell>
                      <Badge
                        className={
                          task.startedCount > 0
                            ? Math.round((task.completedCount / task.startedCount) * 100) >= 50
                              ? "bg-green-100 text-green-700"
                              : "bg-amber-100 text-amber-700"
                            : "bg-slate-100 text-slate-700"
                        }
                      >
                        {task.startedCount > 0
                          ? `${Math.round((task.completedCount / task.startedCount) * 100)}%`
                          : "N/A"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default MunicipalTasks;
