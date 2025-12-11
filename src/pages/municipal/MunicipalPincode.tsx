import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import StatCard from "@/components/municipal/StatCard";
import {
  MapPin,
  Home,
  TrendingUp,
  Recycle,
  AlertTriangle,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface PincodeStats {
  pincode: string;
  householdCount: number;
  totalCollections: number;
  passRate: number;
  totalWasteKg: number;
  recyclableKg: number;
  organicKg: number;
  hazardousKg: number;
}

const COLORS = ["hsl(210, 70%, 55%)", "hsl(160, 60%, 50%)", "hsl(30, 80%, 55%)", "hsl(280, 60%, 55%)", "hsl(0, 70%, 55%)"];

const MunicipalPincode = () => {
  const [loading, setLoading] = useState(true);
  const [pincodeStats, setPincodeStats] = useState<PincodeStats[]>([]);
  const [totalHouseholds, setTotalHouseholds] = useState(0);
  const [totalPincodes, setTotalPincodes] = useState(0);

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel('pincode-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'collection_logs' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trash_detections' }, () => fetchData())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [householdsRes, collectionsRes, detectionsRes] = await Promise.all([
        supabase.from("households").select("id, pincode, district"),
        supabase.from("collection_logs").select("household_id, segregation_status"),
        supabase.from("trash_detections").select("household_id, class, weight_kg"),
      ]);

      const households = householdsRes.data || [];
      const collections = collectionsRes.data || [];
      const detections = detectionsRes.data || [];

      setTotalHouseholds(households.length);

      // Group by pincode
      const pincodeMap = new Map<string, {
        households: Set<string>;
        collections: number;
        passCount: number;
        recyclable: number;
        organic: number;
        hazardous: number;
        nonRecyclable: number;
      }>();

      households.forEach(h => {
        const pincode = h.pincode || "Unknown";
        if (!pincodeMap.has(pincode)) {
          pincodeMap.set(pincode, {
            households: new Set(),
            collections: 0,
            passCount: 0,
            recyclable: 0,
            organic: 0,
            hazardous: 0,
            nonRecyclable: 0,
          });
        }
        pincodeMap.get(pincode)!.households.add(h.id);
      });

      // Map household to pincode
      const householdPincode = new Map<string, string>();
      households.forEach(h => {
        householdPincode.set(h.id, h.pincode || "Unknown");
      });

      // Process collections
      collections.forEach(c => {
        const pincode = householdPincode.get(c.household_id);
        if (pincode && pincodeMap.has(pincode)) {
          const stats = pincodeMap.get(pincode)!;
          stats.collections++;
          if (c.segregation_status === "pass") {
            stats.passCount++;
          }
        }
      });

      // Process detections
      detections.forEach(d => {
        const pincode = householdPincode.get(d.household_id);
        if (pincode && pincodeMap.has(pincode)) {
          const stats = pincodeMap.get(pincode)!;
          const weight = Number(d.weight_kg) || 0;
          if (d.class === "recyclable") stats.recyclable += weight;
          else if (d.class === "organic") stats.organic += weight;
          else if (d.class === "hazardous") stats.hazardous += weight;
          else stats.nonRecyclable += weight;
        }
      });

      // Convert to array
      const statsArray: PincodeStats[] = Array.from(pincodeMap.entries()).map(([pincode, data]) => ({
        pincode,
        householdCount: data.households.size,
        totalCollections: data.collections,
        passRate: data.collections > 0 ? Math.round((data.passCount / data.collections) * 100) : 0,
        totalWasteKg: data.recyclable + data.organic + data.hazardous + data.nonRecyclable,
        recyclableKg: data.recyclable,
        organicKg: data.organic,
        hazardousKg: data.hazardous,
      }));

      statsArray.sort((a, b) => b.totalWasteKg - a.totalWasteKg);
      setPincodeStats(statsArray);
      setTotalPincodes(statsArray.length);
    } catch (error) {
      console.error("Error fetching pincode data:", error);
    } finally {
      setLoading(false);
    }
  };

  const topPincodes = pincodeStats.slice(0, 5);
  const avgPassRate = pincodeStats.length > 0
    ? Math.round(pincodeStats.reduce((a, b) => a + b.passRate, 0) / pincodeStats.length)
    : 0;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse h-8 bg-slate-200 rounded w-48" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="animate-pulse h-28 bg-slate-200 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Pincode Performance</h1>
        <p className="text-muted-foreground">Monitor waste collection efficiency by area</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Pincodes"
          value={totalPincodes}
          icon={MapPin}
          iconClassName="bg-primary"
        />
        <StatCard
          title="Total Households"
          value={totalHouseholds}
          icon={Home}
          iconClassName="bg-blue-500"
        />
        <StatCard
          title="Avg Segregation Rate"
          value={`${avgPassRate}%`}
          icon={CheckCircle2}
          iconClassName="bg-green-500"
        />
        <StatCard
          title="Total Waste Collected"
          value={`${pincodeStats.reduce((a, b) => a + b.totalWasteKg, 0).toFixed(1)} kg`}
          icon={Recycle}
          iconClassName="bg-emerald-500"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Pincodes by Waste */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Top Pincodes by Waste Collected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topPincodes} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" unit=" kg" />
                <YAxis dataKey="pincode" type="category" width={80} />
                <Tooltip formatter={(value: number) => [`${value.toFixed(1)} kg`, "Waste"]} />
                <Bar dataKey="totalWasteKg" radius={[0, 4, 4, 0]}>
                  {topPincodes.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Segregation Pass Rate by Pincode */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              Segregation Pass Rate by Pincode
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topPincodes} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 100]} unit="%" />
                <YAxis dataKey="pincode" type="category" width={80} />
                <Tooltip formatter={(value: number) => [`${value}%`, "Pass Rate"]} />
                <Bar dataKey="passRate" radius={[0, 4, 4, 0]}>
                  {topPincodes.map((entry) => (
                    <Cell 
                      key={`cell-${entry.pincode}`} 
                      fill={entry.passRate >= 80 ? "hsl(142, 70%, 45%)" : entry.passRate >= 50 ? "hsl(45, 80%, 50%)" : "hsl(0, 70%, 55%)"} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            Pincode-wise Performance Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pincode</TableHead>
                <TableHead className="text-center">Households</TableHead>
                <TableHead className="text-center">Collections</TableHead>
                <TableHead className="text-center">Pass Rate</TableHead>
                <TableHead className="text-right">Recyclable (kg)</TableHead>
                <TableHead className="text-right">Organic (kg)</TableHead>
                <TableHead className="text-right">Hazardous (kg)</TableHead>
                <TableHead className="text-right">Total (kg)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pincodeStats.map((stat) => (
                <TableRow key={stat.pincode}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      {stat.pincode}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">{stat.householdCount}</TableCell>
                  <TableCell className="text-center">{stat.totalCollections}</TableCell>
                  <TableCell className="text-center">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        stat.passRate >= 80
                          ? "bg-green-100 text-green-700"
                          : stat.passRate >= 50
                          ? "bg-amber-100 text-amber-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {stat.passRate >= 80 ? (
                        <CheckCircle2 className="w-3 h-3 inline mr-1" />
                      ) : stat.passRate < 50 ? (
                        <XCircle className="w-3 h-3 inline mr-1" />
                      ) : null}
                      {stat.passRate}%
                    </span>
                  </TableCell>
                  <TableCell className="text-right text-blue-600">{stat.recyclableKg.toFixed(1)}</TableCell>
                  <TableCell className="text-right text-green-600">{stat.organicKg.toFixed(1)}</TableCell>
                  <TableCell className="text-right text-red-600">{stat.hazardousKg.toFixed(1)}</TableCell>
                  <TableCell className="text-right font-semibold">{stat.totalWasteKg.toFixed(1)}</TableCell>
                </TableRow>
              ))}
              {pincodeStats.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No pincode data available
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default MunicipalPincode;