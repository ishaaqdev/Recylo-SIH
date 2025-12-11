import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import StatCard from "@/components/municipal/StatCard";
import { DonutChart } from "@/components/ui/DonutChart";
import {
  Recycle,
  AlertTriangle,
  Leaf,
  IndianRupee,
  TrendingUp,
  Package,
  Zap,
  Pill,
  Battery,
  Scissors,
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

// Pricing per kg in INR
const PRICES = {
  plastic: 30,
  metal: 45,
  cardboard: 12,
  paper: 10,
  batteries: 80,
  biomedical: 0, // Must be disposed safely, no resale
  ewaste: 120,
  toxic_sharp: 0, // Must be disposed safely
  compost: 8, // Organic to compost value
};

interface TrashDetection {
  id: string;
  household_id: string;
  detected_at: string;
  class: string;
  subclass: string;
  weight_kg: number;
}

interface Household {
  id: string;
  name: string;
  pincode: string;
  district: string;
}

const MunicipalRecycling = () => {
  const [loading, setLoading] = useState(true);
  const [detections, setDetections] = useState<TrashDetection[]>([]);
  const [households, setHouseholds] = useState<Household[]>([]);
  const [pincodeFilter, setPincodeFilter] = useState<string>("all");
  const [uniquePincodes, setUniquePincodes] = useState<string[]>([]);

  // Aggregated data
  const [recyclableData, setRecyclableData] = useState({
    plastic: 0,
    metal: 0,
    cardboard: 0,
    paper: 0,
  });
  const [hazardousData, setHazardousData] = useState({
    batteries: 0,
    biomedical: 0,
    ewaste: 0,
    toxic_sharp: 0,
  });
  const [organicData, setOrganicData] = useState(0);
  const [nonRecyclableData, setNonRecyclableData] = useState(0);

  useEffect(() => {
    fetchData();

    // Real-time subscription
    const channel = supabase
      .channel('recycling-updates')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'trash_detections' },
        () => fetchData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    processData();
  }, [detections, pincodeFilter, households]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [detectionsRes, householdsRes] = await Promise.all([
        supabase.from("trash_detections").select("*").order("detected_at", { ascending: false }),
        supabase.from("households").select("id, name, pincode, district"),
      ]);

      if (detectionsRes.data) setDetections(detectionsRes.data);
      if (householdsRes.data) {
        setHouseholds(householdsRes.data);
        const pincodes = [...new Set(householdsRes.data.map(h => h.pincode).filter(Boolean))];
        setUniquePincodes(pincodes as string[]);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const processData = () => {
    let filteredDetections = detections;

    if (pincodeFilter !== "all") {
      const householdIds = households
        .filter(h => h.pincode === pincodeFilter)
        .map(h => h.id);
      filteredDetections = detections.filter(d => householdIds.includes(d.household_id));
    }

    // Aggregate recyclables
    const recyclables = { plastic: 0, metal: 0, cardboard: 0, paper: 0 };
    const hazardous = { batteries: 0, biomedical: 0, ewaste: 0, toxic_sharp: 0 };
    let organic = 0;
    let nonRecyclable = 0;

    filteredDetections.forEach(d => {
      if (d.class === "recyclable") {
        if (d.subclass in recyclables) {
          recyclables[d.subclass as keyof typeof recyclables] += Number(d.weight_kg);
        }
      } else if (d.class === "hazardous") {
        if (d.subclass in hazardous) {
          hazardous[d.subclass as keyof typeof hazardous] += Number(d.weight_kg);
        }
      } else if (d.class === "organic") {
        organic += Number(d.weight_kg);
      } else if (d.class === "non_recyclable") {
        nonRecyclable += Number(d.weight_kg);
      }
    });

    setRecyclableData(recyclables);
    setHazardousData(hazardous);
    setOrganicData(organic);
    setNonRecyclableData(nonRecyclable);
  };

  // Calculate totals and values
  const totalRecyclable = Object.values(recyclableData).reduce((a, b) => a + b, 0);
  const totalHazardous = Object.values(hazardousData).reduce((a, b) => a + b, 0);

  const recyclableValue = 
    recyclableData.plastic * PRICES.plastic +
    recyclableData.metal * PRICES.metal +
    recyclableData.cardboard * PRICES.cardboard +
    recyclableData.paper * PRICES.paper;

  const hazardousValue = 
    hazardousData.batteries * PRICES.batteries +
    hazardousData.ewaste * PRICES.ewaste;

  const compostValue = organicData * PRICES.compost;
  const totalValue = recyclableValue + hazardousValue + compostValue;

  // Calculate percentages for donut charts
  const getRecyclablePercentages = () => {
    if (totalRecyclable === 0) return { plastic: 0, metal: 0, cardboard: 0, paper: 0 };
    return {
      plastic: Math.round((recyclableData.plastic / totalRecyclable) * 100),
      metal: Math.round((recyclableData.metal / totalRecyclable) * 100),
      cardboard: Math.round((recyclableData.cardboard / totalRecyclable) * 100),
      paper: Math.round((recyclableData.paper / totalRecyclable) * 100),
    };
  };

  const getHazardousPercentages = () => {
    if (totalHazardous === 0) return { batteries: 0, biomedical: 0, ewaste: 0, toxic_sharp: 0 };
    return {
      batteries: Math.round((hazardousData.batteries / totalHazardous) * 100),
      biomedical: Math.round((hazardousData.biomedical / totalHazardous) * 100),
      ewaste: Math.round((hazardousData.ewaste / totalHazardous) * 100),
      toxic_sharp: Math.round((hazardousData.toxic_sharp / totalHazardous) * 100),
    };
  };

  const recyclablePercents = getRecyclablePercentages();
  const hazardousPercents = getHazardousPercentages();

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Recycling Analytics</h1>
          <p className="text-muted-foreground">Material recovery value and waste classification insights</p>
        </div>
        <Select value={pincodeFilter} onValueChange={setPincodeFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by Pincode" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Pincodes</SelectItem>
            {uniquePincodes.map(p => (
              <SelectItem key={p} value={p}>{p}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Value Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Recovery Value"
          value={`₹${totalValue.toFixed(0)}`}
          icon={IndianRupee}
          iconClassName="bg-green-500"
          trend={{ value: 12, isPositive: true }}
        />
        <StatCard
          title="Recyclables Value"
          value={`₹${recyclableValue.toFixed(0)}`}
          icon={Recycle}
          iconClassName="bg-blue-500"
        />
        <StatCard
          title="E-Waste Value"
          value={`₹${hazardousValue.toFixed(0)}`}
          icon={Zap}
          iconClassName="bg-amber-500"
        />
        <StatCard
          title="Compost Value"
          value={`₹${compostValue.toFixed(0)}`}
          icon={Leaf}
          iconClassName="bg-emerald-500"
        />
      </div>

      {/* Weight Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Recyclables"
          value={`${totalRecyclable.toFixed(1)} kg`}
          icon={Recycle}
          iconClassName="bg-blue-100"
        />
        <StatCard
          title="Total Hazardous"
          value={`${totalHazardous.toFixed(1)} kg`}
          icon={AlertTriangle}
          iconClassName="bg-red-100"
        />
        <StatCard
          title="Total Organic"
          value={`${organicData.toFixed(1)} kg`}
          icon={Leaf}
          iconClassName="bg-green-100"
        />
        <StatCard
          title="Non-Recyclable"
          value={`${nonRecyclableData.toFixed(1)} kg`}
          icon={Package}
          iconClassName="bg-gray-100"
        />
      </div>

      {/* Donut Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recyclables Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Recycle className="w-5 h-5 text-blue-500" />
              Recyclables Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4">
              <DonutChart
                percentage={recyclablePercents.plastic}
                color="hsl(200, 80%, 50%)"
                label="Plastic"
                size={90}
                strokeWidth={8}
              />
              <DonutChart
                percentage={recyclablePercents.metal}
                color="hsl(220, 70%, 60%)"
                label="Metal"
                size={90}
                strokeWidth={8}
              />
              <DonutChart
                percentage={recyclablePercents.cardboard}
                color="hsl(30, 60%, 50%)"
                label="Cardboard"
                size={90}
                strokeWidth={8}
              />
              <DonutChart
                percentage={recyclablePercents.paper}
                color="hsl(45, 70%, 55%)"
                label="Paper"
                size={90}
                strokeWidth={8}
              />
            </div>
            <div className="mt-6 border-t pt-4">
              <h4 className="font-semibold mb-3">Material Values</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex justify-between p-2 bg-slate-50 rounded">
                  <span>Plastic ({recyclableData.plastic.toFixed(1)} kg)</span>
                  <span className="font-semibold text-green-600">₹{(recyclableData.plastic * PRICES.plastic).toFixed(0)}</span>
                </div>
                <div className="flex justify-between p-2 bg-slate-50 rounded">
                  <span>Metal ({recyclableData.metal.toFixed(1)} kg)</span>
                  <span className="font-semibold text-green-600">₹{(recyclableData.metal * PRICES.metal).toFixed(0)}</span>
                </div>
                <div className="flex justify-between p-2 bg-slate-50 rounded">
                  <span>Cardboard ({recyclableData.cardboard.toFixed(1)} kg)</span>
                  <span className="font-semibold text-green-600">₹{(recyclableData.cardboard * PRICES.cardboard).toFixed(0)}</span>
                </div>
                <div className="flex justify-between p-2 bg-slate-50 rounded">
                  <span>Paper ({recyclableData.paper.toFixed(1)} kg)</span>
                  <span className="font-semibold text-green-600">₹{(recyclableData.paper * PRICES.paper).toFixed(0)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Hazardous Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Hazardous Waste Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4">
              <DonutChart
                percentage={hazardousPercents.batteries}
                color="hsl(45, 90%, 50%)"
                label="Batteries"
                icon={<Battery className="w-4 h-4" />}
                size={90}
                strokeWidth={8}
              />
              <DonutChart
                percentage={hazardousPercents.biomedical}
                color="hsl(340, 80%, 55%)"
                label="Biomedical"
                icon={<Pill className="w-4 h-4" />}
                size={90}
                strokeWidth={8}
              />
              <DonutChart
                percentage={hazardousPercents.ewaste}
                color="hsl(280, 60%, 50%)"
                label="E-Waste"
                icon={<Zap className="w-4 h-4" />}
                size={90}
                strokeWidth={8}
              />
              <DonutChart
                percentage={hazardousPercents.toxic_sharp}
                color="hsl(0, 70%, 55%)"
                label="Toxic/Sharp"
                icon={<Scissors className="w-4 h-4" />}
                size={90}
                strokeWidth={8}
              />
            </div>
            <div className="mt-6 border-t pt-4">
              <h4 className="font-semibold mb-3">Recovery Values</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex justify-between p-2 bg-slate-50 rounded">
                  <span>Batteries ({hazardousData.batteries.toFixed(1)} kg)</span>
                  <span className="font-semibold text-green-600">₹{(hazardousData.batteries * PRICES.batteries).toFixed(0)}</span>
                </div>
                <div className="flex justify-between p-2 bg-slate-50 rounded">
                  <span>E-Waste ({hazardousData.ewaste.toFixed(1)} kg)</span>
                  <span className="font-semibold text-green-600">₹{(hazardousData.ewaste * PRICES.ewaste).toFixed(0)}</span>
                </div>
                <div className="flex justify-between p-2 bg-red-50 rounded">
                  <span>Biomedical ({hazardousData.biomedical.toFixed(1)} kg)</span>
                  <span className="font-semibold text-red-600">Safe Disposal</span>
                </div>
                <div className="flex justify-between p-2 bg-red-50 rounded">
                  <span>Toxic/Sharp ({hazardousData.toxic_sharp.toFixed(1)} kg)</span>
                  <span className="font-semibold text-red-600">Safe Disposal</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Organic Compost Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Leaf className="w-5 h-5 text-green-500" />
            Organic Waste → Compost Conversion
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-green-50 rounded-xl">
              <p className="text-sm text-muted-foreground mb-2">Total Organic Collected</p>
              <p className="text-3xl font-bold text-green-700">{organicData.toFixed(1)} kg</p>
            </div>
            <div className="text-center p-6 bg-emerald-50 rounded-xl">
              <p className="text-sm text-muted-foreground mb-2">Estimated Compost Output</p>
              <p className="text-3xl font-bold text-emerald-700">{(organicData * 0.6).toFixed(1)} kg</p>
              <p className="text-xs text-muted-foreground mt-1">(60% conversion rate)</p>
            </div>
            <div className="text-center p-6 bg-teal-50 rounded-xl">
              <p className="text-sm text-muted-foreground mb-2">Potential Market Value</p>
              <p className="text-3xl font-bold text-teal-700">₹{compostValue.toFixed(0)}</p>
              <p className="text-xs text-muted-foreground mt-1">@ ₹{PRICES.compost}/kg</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pricing Reference Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Material Pricing Reference
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Material</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Price (₹/kg)</TableHead>
                <TableHead className="text-right">Collected (kg)</TableHead>
                <TableHead className="text-right">Value (₹)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">Plastic</TableCell>
                <TableCell><span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">Recyclable</span></TableCell>
                <TableCell className="text-right">{PRICES.plastic}</TableCell>
                <TableCell className="text-right">{recyclableData.plastic.toFixed(1)}</TableCell>
                <TableCell className="text-right font-semibold">₹{(recyclableData.plastic * PRICES.plastic).toFixed(0)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Metal</TableCell>
                <TableCell><span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">Recyclable</span></TableCell>
                <TableCell className="text-right">{PRICES.metal}</TableCell>
                <TableCell className="text-right">{recyclableData.metal.toFixed(1)}</TableCell>
                <TableCell className="text-right font-semibold">₹{(recyclableData.metal * PRICES.metal).toFixed(0)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Cardboard</TableCell>
                <TableCell><span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">Recyclable</span></TableCell>
                <TableCell className="text-right">{PRICES.cardboard}</TableCell>
                <TableCell className="text-right">{recyclableData.cardboard.toFixed(1)}</TableCell>
                <TableCell className="text-right font-semibold">₹{(recyclableData.cardboard * PRICES.cardboard).toFixed(0)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Paper</TableCell>
                <TableCell><span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">Recyclable</span></TableCell>
                <TableCell className="text-right">{PRICES.paper}</TableCell>
                <TableCell className="text-right">{recyclableData.paper.toFixed(1)}</TableCell>
                <TableCell className="text-right font-semibold">₹{(recyclableData.paper * PRICES.paper).toFixed(0)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Batteries</TableCell>
                <TableCell><span className="px-2 py-1 bg-amber-100 text-amber-700 rounded text-xs">Hazardous</span></TableCell>
                <TableCell className="text-right">{PRICES.batteries}</TableCell>
                <TableCell className="text-right">{hazardousData.batteries.toFixed(1)}</TableCell>
                <TableCell className="text-right font-semibold">₹{(hazardousData.batteries * PRICES.batteries).toFixed(0)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">E-Waste</TableCell>
                <TableCell><span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">Hazardous</span></TableCell>
                <TableCell className="text-right">{PRICES.ewaste}</TableCell>
                <TableCell className="text-right">{hazardousData.ewaste.toFixed(1)}</TableCell>
                <TableCell className="text-right font-semibold">₹{(hazardousData.ewaste * PRICES.ewaste).toFixed(0)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Compost (Organic)</TableCell>
                <TableCell><span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">Organic</span></TableCell>
                <TableCell className="text-right">{PRICES.compost}</TableCell>
                <TableCell className="text-right">{organicData.toFixed(1)}</TableCell>
                <TableCell className="text-right font-semibold">₹{compostValue.toFixed(0)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default MunicipalRecycling;