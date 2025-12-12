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
  Leaf,
  Truck,
  Calendar,
  Wind,
  Package,
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
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { format, subDays, startOfDay, endOfDay } from "date-fns";

interface DailyActivity {
  date: string;
  collections: number;
  wasteKg: number;
}

const WASTE_COLORS = {
  recyclable: "hsl(200, 80%, 50%)",
  organic: "hsl(142, 70%, 45%)",
  hazardous: "hsl(0, 70%, 55%)",
  nonRecyclable: "hsl(220, 10%, 50%)",
};

// CO2 emission factors (kg CO2 per kg waste)
const CO2_FACTORS = {
  recyclable: -0.5, // Negative = savings from recycling
  organic: -0.3,    // Composting saves emissions
  hazardous: 0.8,   // Proper disposal has emissions
  nonRecyclable: 2.5, // Landfill emissions
};

const MunicipalPincode = () => {
  const [loading, setLoading] = useState(true);
  const [selectedPincode, setSelectedPincode] = useState<string>("");
  const [uniquePincodes, setUniquePincodes] = useState<string[]>([]);
  
  // Pincode-specific data
  const [householdCount, setHouseholdCount] = useState(0);
  const [binCount, setBinCount] = useState(0);
  const [driverCount, setDriverCount] = useState(0);
  const [totalCollections, setTotalCollections] = useState(0);
  const [passRate, setPassRate] = useState(0);
  
  // Waste data
  const [recyclableKg, setRecyclableKg] = useState(0);
  const [organicKg, setOrganicKg] = useState(0);
  const [hazardousKg, setHazardousKg] = useState(0);
  const [nonRecyclableKg, setNonRecyclableKg] = useState(0);
  
  // Daily activity
  const [dailyActivity, setDailyActivity] = useState<DailyActivity[]>([]);
  
  // Recent collections
  const [recentCollections, setRecentCollections] = useState<any[]>([]);

  useEffect(() => {
    fetchPincodes();
  }, []);

  useEffect(() => {
    if (selectedPincode) {
      fetchPincodeData();
    }
  }, [selectedPincode]);

  const fetchPincodes = async () => {
    try {
      const { data } = await supabase
        .from("households")
        .select("pincode")
        .not("pincode", "is", null);
      
      if (data) {
        const pincodes = [...new Set(data.map(h => h.pincode).filter(Boolean))] as string[];
        setUniquePincodes(pincodes.sort());
        if (pincodes.length > 0 && !selectedPincode) {
          setSelectedPincode(pincodes[0]);
        }
      }
    } catch (error) {
      console.error("Error fetching pincodes:", error);
    }
  };

  const fetchPincodeData = async () => {
    setLoading(true);
    try {
      // Fetch households in this pincode
      const { data: households } = await supabase
        .from("households")
        .select("id, name, phone")
        .eq("pincode", selectedPincode);
      
      const householdIds = households?.map(h => h.id) || [];
      setHouseholdCount(householdIds.length);

      // Fetch bins for these households
      const { data: bins } = await supabase
        .from("bins")
        .select("id, household_id")
        .in("household_id", householdIds.length > 0 ? householdIds : ['none']);
      
      setBinCount(bins?.length || 0);

      // Fetch collection logs
      const { data: collections } = await supabase
        .from("collection_logs")
        .select("id, household_id, collected_at, segregation_status, driver_id")
        .in("household_id", householdIds.length > 0 ? householdIds : ['none'])
        .order("collected_at", { ascending: false });
      
      const collectionData = collections || [];
      setTotalCollections(collectionData.length);
      
      // Calculate pass rate
      const passCount = collectionData.filter(c => c.segregation_status === "pass").length;
      setPassRate(collectionData.length > 0 ? Math.round((passCount / collectionData.length) * 100) : 0);

      // Count unique drivers
      const uniqueDrivers = new Set(collectionData.map(c => c.driver_id).filter(Boolean));
      setDriverCount(uniqueDrivers.size);

      // Recent collections with household names
      const recentWithNames = collectionData.slice(0, 10).map(c => {
        const household = households?.find(h => h.id === c.household_id);
        return {
          ...c,
          householdName: household?.name || "Unknown",
        };
      });
      setRecentCollections(recentWithNames);

      // Fetch trash detections
      const { data: detections } = await supabase
        .from("trash_detections")
        .select("id, household_id, class, weight_kg, detected_at")
        .in("household_id", householdIds.length > 0 ? householdIds : ['none']);
      
      const detectionData = detections || [];
      
      // Aggregate waste by category
      let recyclable = 0, organic = 0, hazardous = 0, nonRecyclable = 0;
      detectionData.forEach(d => {
        const weight = Number(d.weight_kg) || 0;
        if (d.class === "recyclable") recyclable += weight;
        else if (d.class === "organic") organic += weight;
        else if (d.class === "hazardous") hazardous += weight;
        else nonRecyclable += weight;
      });
      
      setRecyclableKg(recyclable);
      setOrganicKg(organic);
      setHazardousKg(hazardous);
      setNonRecyclableKg(nonRecyclable);

      // Calculate daily activity for last 7 days
      const last7Days: DailyActivity[] = [];
      for (let i = 6; i >= 0; i--) {
        const date = subDays(new Date(), i);
        const dayStart = startOfDay(date);
        const dayEnd = endOfDay(date);
        
        const dayCollections = collectionData.filter(c => {
          const collectedAt = new Date(c.collected_at);
          return collectedAt >= dayStart && collectedAt <= dayEnd;
        });
        
        const dayDetections = detectionData.filter(d => {
          const detectedAt = new Date(d.detected_at);
          return detectedAt >= dayStart && detectedAt <= dayEnd;
        });
        
        const dayWaste = dayDetections.reduce((sum, d) => sum + (Number(d.weight_kg) || 0), 0);
        
        last7Days.push({
          date: format(date, "MMM dd"),
          collections: dayCollections.length,
          wasteKg: dayWaste,
        });
      }
      setDailyActivity(last7Days);

    } catch (error) {
      console.error("Error fetching pincode data:", error);
    } finally {
      setLoading(false);
    }
  };

  const totalWaste = recyclableKg + organicKg + hazardousKg + nonRecyclableKg;
  
  // Calculate CO2 impact
  const co2Saved = (recyclableKg * Math.abs(CO2_FACTORS.recyclable)) + 
                   (organicKg * Math.abs(CO2_FACTORS.organic));
  const co2Emitted = (hazardousKg * CO2_FACTORS.hazardous) + 
                     (nonRecyclableKg * CO2_FACTORS.nonRecyclable);
  const netCO2 = co2Emitted - co2Saved;

  const wasteDistributionData = [
    { name: "Recyclable", value: recyclableKg, color: WASTE_COLORS.recyclable },
    { name: "Organic", value: organicKg, color: WASTE_COLORS.organic },
    { name: "Hazardous", value: hazardousKg, color: WASTE_COLORS.hazardous },
    { name: "Non-Recyclable", value: nonRecyclableKg, color: WASTE_COLORS.nonRecyclable },
  ];

  const formatWeight = (kg: number) => {
    if (kg >= 1000) return `${(kg / 1000).toFixed(2)} T`;
    return `${kg.toFixed(1)} kg`;
  };

  if (loading && !selectedPincode) {
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
      {/* Header with Pincode Selector */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Pincode Analytics</h1>
          <p className="text-muted-foreground">Detailed waste management data by pincode area</p>
        </div>
        <Select value={selectedPincode} onValueChange={setSelectedPincode}>
          <SelectTrigger className="w-48">
            <MapPin className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Select Pincode" />
          </SelectTrigger>
          <SelectContent className="bg-background border z-50">
            {uniquePincodes.map(p => (
              <SelectItem key={p} value={p}>{p}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedPincode && (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Households"
              value={householdCount}
              icon={Home}
              iconClassName="bg-blue-500"
            />
            <StatCard
              title="Total Bins"
              value={binCount}
              icon={Package}
              iconClassName="bg-purple-500"
            />
            <StatCard
              title="Active Drivers"
              value={driverCount}
              icon={Truck}
              iconClassName="bg-amber-500"
            />
            <StatCard
              title="Total Collections"
              value={totalCollections}
              icon={Calendar}
              iconClassName="bg-green-500"
            />
          </div>

          {/* Waste & Segregation Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Waste Collected"
              value={formatWeight(totalWaste)}
              icon={Recycle}
              iconClassName="bg-emerald-500"
            />
            <StatCard
              title="Segregation Pass Rate"
              value={`${passRate}%`}
              icon={CheckCircle2}
              iconClassName={passRate >= 80 ? "bg-green-500" : passRate >= 50 ? "bg-amber-500" : "bg-red-500"}
            />
            <StatCard
              title="CO₂ Saved"
              value={`${co2Saved.toFixed(1)} kg`}
              icon={Leaf}
              iconClassName="bg-green-600"
            />
            <StatCard
              title="Net CO₂ Impact"
              value={`${netCO2 >= 0 ? "+" : ""}${netCO2.toFixed(1)} kg`}
              icon={Wind}
              iconClassName={netCO2 <= 0 ? "bg-green-500" : "bg-red-500"}
            />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Waste Distribution Pie */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Recycle className="w-5 h-5 text-primary" />
                  Waste Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center gap-8">
                  <div className="w-48 h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={wasteDistributionData}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={70}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {wasteDistributionData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => formatWeight(value)} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-2 text-sm">
                    {wasteDistributionData.map((item) => (
                      <div key={item.name} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                        <span>{item.name}: {formatWeight(item.value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Daily Activity Line Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Daily Activity (Last 7 Days)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={dailyActivity}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" fontSize={12} />
                    <YAxis yAxisId="left" fontSize={12} />
                    <YAxis yAxisId="right" orientation="right" fontSize={12} />
                    <Tooltip />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="collections"
                      stroke="hsl(200, 80%, 50%)"
                      strokeWidth={2}
                      name="Collections"
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="wasteKg"
                      stroke="hsl(142, 70%, 45%)"
                      strokeWidth={2}
                      name="Waste (kg)"
                    />
                  </LineChart>
                </ResponsiveContainer>
                <div className="flex justify-center gap-6 mt-2 text-xs">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "hsl(200, 80%, 50%)" }} />
                    <span>Collections</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "hsl(142, 70%, 45%)" }} />
                    <span>Waste (kg)</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Waste Category Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                Waste Category Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-blue-50 rounded-xl text-center">
                  <Recycle className="w-8 h-8 mx-auto text-blue-500 mb-2" />
                  <p className="text-sm text-muted-foreground">Recyclable</p>
                  <p className="text-2xl font-bold text-blue-600">{formatWeight(recyclableKg)}</p>
                  <p className="text-xs text-green-600 mt-1">-{(recyclableKg * Math.abs(CO2_FACTORS.recyclable)).toFixed(1)} kg CO₂</p>
                </div>
                <div className="p-4 bg-green-50 rounded-xl text-center">
                  <Leaf className="w-8 h-8 mx-auto text-green-500 mb-2" />
                  <p className="text-sm text-muted-foreground">Organic</p>
                  <p className="text-2xl font-bold text-green-600">{formatWeight(organicKg)}</p>
                  <p className="text-xs text-green-600 mt-1">-{(organicKg * Math.abs(CO2_FACTORS.organic)).toFixed(1)} kg CO₂</p>
                </div>
                <div className="p-4 bg-red-50 rounded-xl text-center">
                  <AlertTriangle className="w-8 h-8 mx-auto text-red-500 mb-2" />
                  <p className="text-sm text-muted-foreground">Hazardous</p>
                  <p className="text-2xl font-bold text-red-600">{formatWeight(hazardousKg)}</p>
                  <p className="text-xs text-red-600 mt-1">+{(hazardousKg * CO2_FACTORS.hazardous).toFixed(1)} kg CO₂</p>
                </div>
                <div className="p-4 bg-slate-100 rounded-xl text-center">
                  <Package className="w-8 h-8 mx-auto text-slate-500 mb-2" />
                  <p className="text-sm text-muted-foreground">Non-Recyclable</p>
                  <p className="text-2xl font-bold text-slate-600">{formatWeight(nonRecyclableKg)}</p>
                  <p className="text-xs text-red-600 mt-1">+{(nonRecyclableKg * CO2_FACTORS.nonRecyclable).toFixed(1)} kg CO₂</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Collections Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Recent Collections in {selectedPincode}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Household</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Driver ID</TableHead>
                    <TableHead className="text-center">Segregation Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentCollections.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.householdName}</TableCell>
                      <TableCell>{format(new Date(c.collected_at), "MMM dd, yyyy HH:mm")}</TableCell>
                      <TableCell className="font-mono text-sm">{c.driver_id?.slice(0, 8) || "—"}</TableCell>
                      <TableCell className="text-center">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            c.segregation_status === "pass"
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {c.segregation_status === "pass" ? (
                            <CheckCircle2 className="w-3 h-3 inline mr-1" />
                          ) : (
                            <AlertTriangle className="w-3 h-3 inline mr-1" />
                          )}
                          {c.segregation_status === "pass" ? "Pass" : "Mixed"}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                  {recentCollections.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        No collections recorded for this pincode
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}

      {!selectedPincode && uniquePincodes.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <MapPin className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No pincodes found. Add households with pincode information to see analytics.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MunicipalPincode;
