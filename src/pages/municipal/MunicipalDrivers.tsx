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
import { Users, Truck, TrendingUp, Search, Filter } from "lucide-react";
import StatCard from "@/components/municipal/StatCard";

interface Driver {
  id: string;
  driver_id: string;
  name: string;
  phone: string | null;
  created_at: string;
  collectionsToday: number;
  collectionsWeek: number;
}

const MunicipalDrivers = () => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [filteredDrivers, setFilteredDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [stats, setStats] = useState({
    totalDrivers: 0,
    activeToday: 0,
    totalCollections: 0,
  });

  useEffect(() => {
    fetchDrivers();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchTerm, statusFilter, drivers]);

  const applyFilters = () => {
    let filtered = drivers;

    if (searchTerm) {
      filtered = filtered.filter(
        (d) =>
          d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          d.driver_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          d.phone?.includes(searchTerm)
      );
    }

    if (statusFilter === "active") {
      filtered = filtered.filter((d) => d.collectionsToday > 0);
    } else if (statusFilter === "inactive") {
      filtered = filtered.filter((d) => d.collectionsToday === 0);
    }

    setFilteredDrivers(filtered);
  };

  const fetchDrivers = async () => {
    const { data: driversData, error } = await supabase
      .from("drivers")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && driversData) {
      const today = new Date().toISOString().split("T")[0];
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

      const driversWithStats = await Promise.all(
        driversData.map(async (driver) => {
          const { count: todayCount } = await supabase
            .from("collection_logs")
            .select("*", { count: "exact", head: true })
            .eq("driver_id", driver.driver_id)
            .gte("collected_at", today);

          const { count: weekCount } = await supabase
            .from("collection_logs")
            .select("*", { count: "exact", head: true })
            .eq("driver_id", driver.driver_id)
            .gte("collected_at", weekAgo);

          return {
            ...driver,
            collectionsToday: todayCount || 0,
            collectionsWeek: weekCount || 0,
          };
        })
      );

      setDrivers(driversWithStats);
      setFilteredDrivers(driversWithStats);

      const activeToday = driversWithStats.filter((d) => d.collectionsToday > 0).length;
      const totalCollections = driversWithStats.reduce((sum, d) => sum + d.collectionsWeek, 0);

      setStats({
        totalDrivers: driversData.length,
        activeToday,
        totalCollections,
      });
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Driver Management</h1>
        <p className="text-muted-foreground">Monitor driver performance and activity</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Total Drivers" value={stats.totalDrivers} icon={Users} />
        <StatCard
          title="Active Today"
          value={stats.activeToday}
          icon={Truck}
          iconClassName="bg-green-500"
        />
        <StatCard
          title="Weekly Collections"
          value={stats.totalCollections}
          icon={TrendingUp}
          iconClassName="bg-blue-500"
        />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, ID, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Drivers</SelectItem>
                <SelectItem value="active">Active Today</SelectItem>
                <SelectItem value="inactive">Inactive Today</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="mt-3 text-sm text-muted-foreground">
            Showing {filteredDrivers.length} of {drivers.length} drivers
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Registered Drivers</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Driver ID</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Collections Today</TableHead>
                <TableHead>Collections This Week</TableHead>
                <TableHead>Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : filteredDrivers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No drivers found
                  </TableCell>
                </TableRow>
              ) : (
                filteredDrivers.map((driver) => (
                  <TableRow key={driver.id}>
                    <TableCell className="font-medium">{driver.name}</TableCell>
                    <TableCell className="font-mono text-sm">{driver.driver_id}</TableCell>
                    <TableCell>{driver.phone || "-"}</TableCell>
                    <TableCell>
                      <Badge className={driver.collectionsToday > 0 ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}>
                        {driver.collectionsToday > 0 ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={driver.collectionsToday > 0 ? "default" : "secondary"}>
                        {driver.collectionsToday}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{driver.collectionsWeek}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(driver.created_at).toLocaleDateString()}
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

export default MunicipalDrivers;
