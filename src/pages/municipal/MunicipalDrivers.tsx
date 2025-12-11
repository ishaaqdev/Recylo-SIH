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
import { Users, Truck, TrendingUp } from "lucide-react";
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
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState({
    totalDrivers: 0,
    activeToday: 0,
    totalCollections: 0,
  });

  useEffect(() => {
    fetchDrivers();
  }, []);

  const fetchDrivers = async () => {
    const { data: driversData, error } = await supabase
      .from("drivers")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && driversData) {
      // Fetch collection counts for each driver
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

      // Calculate stats
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
                <TableHead>Collections Today</TableHead>
                <TableHead>Collections This Week</TableHead>
                <TableHead>Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : drivers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No drivers registered yet
                  </TableCell>
                </TableRow>
              ) : (
                drivers.map((driver) => (
                  <TableRow key={driver.id}>
                    <TableCell className="font-medium">{driver.name}</TableCell>
                    <TableCell className="font-mono text-sm">{driver.driver_id}</TableCell>
                    <TableCell>{driver.phone || "-"}</TableCell>
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
