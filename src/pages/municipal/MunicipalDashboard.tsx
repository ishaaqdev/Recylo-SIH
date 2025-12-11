import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import StatCard from "@/components/municipal/StatCard";
import {
  Home,
  Truck,
  Scale,
  Recycle,
  AlertTriangle,
  CheckCircle,
  Leaf,
  Filter,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from "recharts";

const COLORS = ["#22c55e", "#3b82f6", "#1e293b", "#ef4444"];

const MunicipalDashboard = () => {
  const [stats, setStats] = useState({
    totalHouseholds: 0,
    totalCollectionsToday: 0,
    totalWasteToday: 0,
    totalRecyclables: 0,
    pendingComplaints: 0,
    segregationAccuracy: 85,
  });

  const [wasteDistribution, setWasteDistribution] = useState<any[]>([]);
  const [complaintTypes, setComplaintTypes] = useState<any[]>([]);
  const [districts, setDistricts] = useState<string[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState<string>("all");

  // Trend data with units in kg
  const [wasteTrend, setWasteTrend] = useState([
    { day: "Mon", recyclable: 120, organic: 80, nonRecyclable: 40, hazardous: 5 },
    { day: "Tue", recyclable: 150, organic: 90, nonRecyclable: 35, hazardous: 8 },
    { day: "Wed", recyclable: 130, organic: 85, nonRecyclable: 45, hazardous: 3 },
    { day: "Thu", recyclable: 180, organic: 100, nonRecyclable: 30, hazardous: 6 },
    { day: "Fri", recyclable: 160, organic: 95, nonRecyclable: 38, hazardous: 4 },
    { day: "Sat", recyclable: 200, organic: 110, nonRecyclable: 42, hazardous: 7 },
    { day: "Sun", recyclable: 140, organic: 75, nonRecyclable: 28, hazardous: 2 },
  ]);

  const [collectionsTrend, setCollectionsTrend] = useState([
    { day: "Mon", collections: 45 },
    { day: "Tue", collections: 52 },
    { day: "Wed", collections: 48 },
    { day: "Thu", collections: 61 },
    { day: "Fri", collections: 55 },
    { day: "Sat", collections: 70 },
    { day: "Sun", collections: 38 },
  ]);

  useEffect(() => {
    fetchDistricts();
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [selectedDistrict]);

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

  const fetchDashboardData = async () => {
    // Build query based on district filter
    let householdsQuery = supabase.from("households").select("id, district", { count: "exact" });
    
    if (selectedDistrict !== "all") {
      householdsQuery = householdsQuery.eq("district", selectedDistrict);
    }

    const { data: householdsData, count: householdsCount } = await householdsQuery;
    const householdIds = householdsData?.map((h: any) => h.id) || [];

    // Fetch today's collections filtered by households
    const today = new Date().toISOString().split("T")[0];
    let collectionsQuery = supabase
      .from("collection_logs")
      .select("*", { count: "exact", head: true })
      .gte("collected_at", today);

    if (householdIds.length > 0 && selectedDistrict !== "all") {
      collectionsQuery = collectionsQuery.in("household_id", householdIds);
    }

    const { count: collectionsToday } = await collectionsQuery;

    // Fetch pending complaints filtered
    let complaintsQuery = supabase
      .from("complaints")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending");

    if (householdIds.length > 0 && selectedDistrict !== "all") {
      complaintsQuery = complaintsQuery.in("household_id", householdIds);
    }

    const { count: pendingComplaints } = await complaintsQuery;

    // Fetch bins data filtered
    let binsQuery = supabase.from("bins").select("*");
    if (householdIds.length > 0 && selectedDistrict !== "all") {
      binsQuery = binsQuery.in("household_id", householdIds);
    }

    const { data: binsData } = await binsQuery;

    if (binsData) {
      const totals = binsData.reduce(
        (acc, bin) => ({
          recyclable: acc.recyclable + (bin.recyclable || 0),
          organic: acc.organic + (bin.organic || 0),
          nonRecyclable: acc.nonRecyclable + (bin.non_recyclable || 0),
          hazardous: acc.hazardous + (bin.hazardous || 0),
        }),
        { recyclable: 0, organic: 0, nonRecyclable: 0, hazardous: 0 }
      );

      // Convert percentage to kg (assuming 10kg capacity per bin category)
      const totalKg = Object.values(totals).reduce((a, b) => a + (b / 100) * 10 * binsData.length, 0);
      const recyclableKg = (totals.recyclable / 100) * 10 * binsData.length;

      setWasteDistribution([
        { name: "Recyclable", value: totals.recyclable, kg: recyclableKg.toFixed(1), color: "#22c55e" },
        { name: "Organic", value: totals.organic, kg: ((totals.organic / 100) * 10 * binsData.length).toFixed(1), color: "#3b82f6" },
        { name: "Non-Recyclable", value: totals.nonRecyclable, kg: ((totals.nonRecyclable / 100) * 10 * binsData.length).toFixed(1), color: "#1e293b" },
        { name: "Hazardous", value: totals.hazardous, kg: ((totals.hazardous / 100) * 10 * binsData.length).toFixed(1), color: "#ef4444" },
      ]);

      setStats((prev) => ({
        ...prev,
        totalWasteToday: Math.round(totalKg),
        totalRecyclables: Math.round(recyclableKg),
      }));
    }

    // Fetch complaint types filtered
    let complaintTypesQuery = supabase.from("complaints").select("category, household_id");
    if (householdIds.length > 0 && selectedDistrict !== "all") {
      complaintTypesQuery = complaintTypesQuery.in("household_id", householdIds);
    }

    const { data: complaintsData } = await complaintTypesQuery;
    if (complaintsData) {
      const categoryCounts = complaintsData.reduce((acc: any, c) => {
        acc[c.category] = (acc[c.category] || 0) + 1;
        return acc;
      }, {});

      setComplaintTypes(
        Object.entries(categoryCounts).map(([name, count]) => ({ name, count }))
      );
    }

    // Calculate segregation accuracy from collection logs
    let segregationQuery = supabase.from("collection_logs").select("segregation_status");
    if (householdIds.length > 0 && selectedDistrict !== "all") {
      segregationQuery = segregationQuery.in("household_id", householdIds);
    }

    const { data: segregationData } = await segregationQuery;
    let accuracy = 85;
    if (segregationData && segregationData.length > 0) {
      const passCount = segregationData.filter((s: any) => s.segregation_status === "pass").length;
      accuracy = Math.round((passCount / segregationData.length) * 100);
    }

    setStats((prev) => ({
      ...prev,
      totalHouseholds: householdsCount || 0,
      totalCollectionsToday: collectionsToday || 0,
      pendingComplaints: pendingComplaints || 0,
      segregationAccuracy: accuracy,
    }));
  };

  const totalWasteKg = wasteDistribution.reduce((sum, w) => sum + parseFloat(w.kg || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header with Filter */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Overview of waste management operations</p>
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

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          title="Total Households"
          value={stats.totalHouseholds}
          icon={Home}
          trend={{ value: 5.2, isPositive: true }}
        />
        <StatCard
          title="Collections Today"
          value={stats.totalCollectionsToday}
          icon={Truck}
          trend={{ value: 12, isPositive: true }}
        />
        <StatCard
          title="Total Waste (kg)"
          value={stats.totalWasteToday}
          icon={Scale}
        />
        <StatCard
          title="Recyclables (kg)"
          value={stats.totalRecyclables}
          icon={Recycle}
          iconClassName="bg-green-500"
        />
        <StatCard
          title="Pending Complaints"
          value={stats.pendingComplaints}
          icon={AlertTriangle}
          iconClassName="bg-amber-500"
        />
        <StatCard
          title="Segregation Accuracy"
          value={`${stats.segregationAccuracy}%`}
          icon={CheckCircle}
          iconClassName="bg-blue-500"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Waste Distribution Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Waste Category Distribution</CardTitle>
            <p className="text-sm text-muted-foreground">
              Total: {totalWasteKg.toFixed(1)} kg across all bins
            </p>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={wasteDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, kg }) => `${name}: ${kg} kg`}
                  >
                    {wasteDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: any, name: string, props: any) => [
                      `${props.payload.kg} kg (${value}%)`,
                      name
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Waste Trend Line Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Waste Weight Trend (Weekly)</CardTitle>
            <p className="text-sm text-muted-foreground">Values in kilograms (kg)</p>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={wasteTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="day" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} unit=" kg" />
                  <Tooltip formatter={(value: any) => [`${value} kg`]} />
                  <Legend />
                  <Line type="monotone" dataKey="recyclable" name="Recyclable (kg)" stroke="#22c55e" strokeWidth={2} />
                  <Line type="monotone" dataKey="organic" name="Organic (kg)" stroke="#3b82f6" strokeWidth={2} />
                  <Line type="monotone" dataKey="nonRecyclable" name="Non-Recyclable (kg)" stroke="#1e293b" strokeWidth={2} />
                  <Line type="monotone" dataKey="hazardous" name="Hazardous (kg)" stroke="#ef4444" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Collections Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Daily Collections</CardTitle>
            <p className="text-sm text-muted-foreground">Number of pickups per day</p>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={collectionsTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="day" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} />
                  <Tooltip />
                  <Line type="monotone" dataKey="collections" stroke="#3b82f6" strokeWidth={2} dot={{ fill: "#3b82f6" }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Complaint Types Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Complaint Types</CardTitle>
            <p className="text-sm text-muted-foreground">Distribution by category</p>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={complaintTypes} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" stroke="#64748b" fontSize={12} />
                  <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={11} width={80} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#f59e0b" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* CO2 Savings Card */}
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Leaf className="w-5 h-5 text-green-600" />
              CO₂ Savings Estimate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-6">
              <p className="text-5xl font-bold text-green-600">
                {(stats.totalRecyclables * 2.5).toFixed(1)}
              </p>
              <p className="text-lg text-green-700 mt-2">kg CO₂ saved</p>
              <p className="text-sm text-muted-foreground mt-4">
                Based on {stats.totalRecyclables} kg recyclables diverted from landfill
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MunicipalDashboard;
