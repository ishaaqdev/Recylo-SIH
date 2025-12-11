import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClipboardList, Play, CheckCircle, TrendingUp, Filter, User, Truck } from "lucide-react";
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

interface TaskCompletion {
  id: string;
  task_id: string | null;
  household_id: string | null;
  driver_id: string | null;
  points_awarded: number;
  level_awarded: number;
  completed_at: string;
  task?: { title: string } | null;
  household?: { name: string; phone: string | null; district: string | null } | null;
  driver?: { name: string; driver_id: string } | null;
}

const MunicipalTasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [taskCompletions, setTaskCompletions] = useState<TaskCompletion[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [districts, setDistricts] = useState<string[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState("all");

  const [stats, setStats] = useState({
    totalTasks: 0,
    startsToday: 0,
    completionsToday: 0,
  });

  const [engagementTrend, setEngagementTrend] = useState([
    { day: "Mon", starts: 12, completions: 8 },
    { day: "Tue", starts: 15, completions: 10 },
    { day: "Wed", starts: 18, completions: 14 },
    { day: "Thu", starts: 22, completions: 16 },
    { day: "Fri", starts: 20, completions: 15 },
    { day: "Sat", starts: 25, completions: 20 },
    { day: "Sun", starts: 14, completions: 10 },
  ]);

  useEffect(() => {
    fetchDistricts();
    fetchTaskCompletions();
  }, []);

  useEffect(() => {
    fetchTasks();
    fetchTaskCompletions();
  }, [selectedDistrict]);

  useEffect(() => {
    const filtered = tasks.filter((task) =>
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (task.description?.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredTasks(filtered);
  }, [searchTerm, tasks]);

  const fetchDistricts = async () => {
    const { data } = await supabase
      .from("households")
      .select("district")
      .not("district", "is", null);

    if (data) {
      const uniqueDistricts = [...new Set(data.map((h: any) => h.district))].filter(Boolean);
      setDistricts(uniqueDistricts as string[]);
    }
  };

  const fetchTaskCompletions = async () => {
    let query = supabase
      .from("task_completions")
      .select(`
        *,
        task:rewards_tasks(title),
        household:households(name, phone, district),
        driver:drivers(name, driver_id)
      `)
      .order("completed_at", { ascending: false })
      .limit(100);

    if (selectedDistrict !== "all") {
      const { data: householdsData } = await supabase
        .from("households")
        .select("id")
        .eq("district", selectedDistrict);
      const householdIds = householdsData?.map((h: any) => h.id) || [];
      if (householdIds.length > 0) {
        query = query.in("household_id", householdIds);
      }
    }

    const { data, error } = await query;
    if (!error && data) {
      setTaskCompletions(data as any);
    }
  };

  const fetchTasks = async () => {
    // Get household IDs for district filter
    let householdIds: string[] = [];
    if (selectedDistrict !== "all") {
      const { data: householdsData } = await supabase
        .from("households")
        .select("id")
        .eq("district", selectedDistrict);
      householdIds = householdsData?.map((h: any) => h.id) || [];
    }

    const { data: tasksData, error } = await supabase
      .from("rewards_tasks")
      .select("*")
      .order("title");

    if (!error && tasksData) {
      const tasksWithStats = await Promise.all(
        tasksData.map(async (task) => {
          let startedQuery = supabase
            .from("user_tasks")
            .select("*", { count: "exact", head: true })
            .eq("task_id", task.id);

          let completedQuery = supabase
            .from("user_tasks")
            .select("*", { count: "exact", head: true })
            .eq("task_id", task.id)
            .eq("status", "completed");

          if (householdIds.length > 0) {
            startedQuery = startedQuery.in("household_id", householdIds);
            completedQuery = completedQuery.in("household_id", householdIds);
          }

          const { count: startedCount } = await startedQuery;
          const { count: completedCount } = await completedQuery;

          return {
            ...task,
            startedCount: startedCount || 0,
            completedCount: completedCount || 0,
          };
        })
      );

      setTasks(tasksWithStats);
      setFilteredTasks(tasksWithStats);

      // Calculate stats
      const today = new Date().toISOString().split("T")[0];
      let startsQuery = supabase
        .from("user_tasks")
        .select("*", { count: "exact", head: true })
        .gte("started_at", today);

      let completionsQuery = supabase
        .from("user_tasks")
        .select("*", { count: "exact", head: true })
        .eq("status", "completed")
        .gte("completed_at", today);

      if (householdIds.length > 0) {
        startsQuery = startsQuery.in("household_id", householdIds);
        completionsQuery = completionsQuery.in("household_id", householdIds);
      }

      const { count: startsToday } = await startsQuery;
      const { count: completionsToday } = await completionsQuery;

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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Tasks & Engagement</h1>
          <p className="text-muted-foreground">Track user task participation and completion</p>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <Select value={selectedDistrict} onValueChange={setSelectedDistrict}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by District" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Districts</SelectItem>
              {districts.map((district) => (
                <SelectItem key={district} value={district}>
                  {district}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
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

      {/* Tabs for Tasks and Completions */}
      <Tabs defaultValue="tasks" className="space-y-4">
        <TabsList>
          <TabsTrigger value="tasks">Available Tasks</TabsTrigger>
          <TabsTrigger value="completions">Verified Completions</TabsTrigger>
        </TabsList>

        <TabsContent value="tasks">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Available Tasks</CardTitle>
              <Input
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-xs"
              />
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
                  ) : filteredTasks.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No tasks available
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTasks.map((task) => (
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
        </TabsContent>

        <TabsContent value="completions">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                Driver-Verified Task Completions
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Task</TableHead>
                    <TableHead>Household</TableHead>
                    <TableHead>Driver</TableHead>
                    <TableHead>Points</TableHead>
                    <TableHead>Level</TableHead>
                    <TableHead>Verified At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {taskCompletions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No verified task completions yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    taskCompletions.map((completion) => (
                      <TableRow key={completion.id}>
                        <TableCell className="font-medium">
                          {completion.task?.title || "Unknown Task"}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-muted-foreground" />
                            <div>
                              <p className="font-medium">{completion.household?.name || "Unknown"}</p>
                              <p className="text-xs text-muted-foreground">
                                {completion.household?.district || "-"}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Truck className="w-4 h-4 text-muted-foreground" />
                            <div>
                              <p className="font-medium">{completion.driver?.name || "Unknown"}</p>
                              <p className="text-xs text-muted-foreground font-mono">
                                {completion.driver?.driver_id || "-"}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-green-100 text-green-700">
                            +{completion.points_awarded} pts
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">+{completion.level_awarded} lvl</Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {new Date(completion.completed_at).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MunicipalTasks;
