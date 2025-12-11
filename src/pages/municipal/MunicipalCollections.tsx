import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Truck, CheckCircle, XCircle } from "lucide-react";
import StatCard from "@/components/municipal/StatCard";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";

interface CollectionLog {
  id: string;
  household_id: string | null;
  collected_at: string;
  status: string;
  driver_id: string | null;
  segregation_status: string | null;
  household?: { name: string; phone: string | null };
}

const MunicipalCollections = () => {
  const [collections, setCollections] = useState<CollectionLog[]>([]);
  const [filteredCollections, setFilteredCollections] = useState<CollectionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [segregationFilter, setSegregationFilter] = useState("all");

  const [stats, setStats] = useState({
    totalToday: 0,
    totalWeek: 0,
    passRate: 0,
    mixedCount: 0,
  });

  // Dummy chart data
  const dailyTrend = [
    { day: "Mon", collections: 45 },
    { day: "Tue", collections: 52 },
    { day: "Wed", collections: 48 },
    { day: "Thu", collections: 61 },
    { day: "Fri", collections: 55 },
    { day: "Sat", collections: 70 },
    { day: "Sun", collections: 38 },
  ];

  const segregationData = [
    { name: "Pass", value: 85, fill: "#22c55e" },
    { name: "Mixed", value: 15, fill: "#ef4444" },
  ];

  useEffect(() => {
    fetchCollections();
  }, []);

  useEffect(() => {
    let filtered = collections;

    if (searchTerm) {
      filtered = filtered.filter(
        (c) =>
          c.household?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.driver_id?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (segregationFilter !== "all") {
      filtered = filtered.filter((c) => c.segregation_status === segregationFilter);
    }

    setFilteredCollections(filtered);
  }, [searchTerm, segregationFilter, collections]);

  const fetchCollections = async () => {
    const { data, error } = await supabase
      .from("collection_logs")
      .select(`
        *,
        household:households(name, phone)
      `)
      .order("collected_at", { ascending: false })
      .limit(100);

    if (!error && data) {
      setCollections(data as any);
      setFilteredCollections(data as any);

      // Calculate stats
      const today = new Date().toISOString().split("T")[0];
      const todayCollections = data.filter((c) => c.collected_at.startsWith(today));
      const passCount = data.filter((c) => c.segregation_status === "pass").length;
      const mixedCount = data.filter((c) => c.segregation_status === "mixed").length;

      setStats({
        totalToday: todayCollections.length,
        totalWeek: data.length,
        passRate: data.length > 0 ? Math.round((passCount / data.length) * 100) : 0,
        mixedCount,
      });
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Collection Logs</h1>
        <p className="text-muted-foreground">Track waste collection activities</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Collections Today" value={stats.totalToday} icon={Truck} />
        <StatCard title="This Week" value={stats.totalWeek} icon={Truck} />
        <StatCard
          title="Segregation Pass Rate"
          value={`${stats.passRate}%`}
          icon={CheckCircle}
          iconClassName="bg-green-500"
        />
        <StatCard
          title="Mixed Waste Cases"
          value={stats.mixedCount}
          icon={XCircle}
          iconClassName="bg-red-500"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Daily Collections Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="day" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="collections"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ fill: "#3b82f6" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Segregation Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={segregationData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by household or driver..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={segregationFilter} onValueChange={setSegregationFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Segregation Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="pass">Pass</SelectItem>
                <SelectItem value="mixed">Mixed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Household</TableHead>
                <TableHead>Collected At</TableHead>
                <TableHead>Driver ID</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Segregation</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : filteredCollections.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No collection logs found
                  </TableCell>
                </TableRow>
              ) : (
                filteredCollections.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{log.household?.name || "Unknown"}</p>
                        <p className="text-xs text-muted-foreground">
                          {log.household?.phone || ""}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(log.collected_at).toLocaleString()}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {log.driver_id || "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="default">{log.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          log.segregation_status === "pass"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }
                      >
                        {log.segregation_status || "pass"}
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

export default MunicipalCollections;
