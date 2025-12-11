import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Clock, Leaf, Recycle, Trash2, AlertTriangle, Scale } from "lucide-react";
import { DonutChart } from "@/components/ui/DonutChart";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

interface BinData {
  organic: number;
  recyclable: number;
  non_recyclable: number;
  hazardous: number;
}

interface BinConversion {
  from: string;
  to: string;
}

const BIN_CONVERSIONS_KEY = "recylo_bin_conversions";

const binTypeConfig = [
  { key: "organic", label: "Organic", color: "hsl(var(--organic))", icon: Leaf, bgColor: "bg-emerald-50", lastDeposit: "2 hours ago" },
  { key: "recyclable", label: "Recyclable", color: "hsl(var(--recyclable))", icon: Recycle, bgColor: "bg-sky-50", lastDeposit: "5 hours ago" },
  { key: "non_recyclable", label: "Non-Recyclable", color: "hsl(var(--non-recyclable))", icon: Trash2, bgColor: "bg-gray-100", lastDeposit: "1 day ago" },
  { key: "hazardous", label: "Hazardous", color: "hsl(var(--hazardous))", icon: AlertTriangle, bgColor: "bg-red-50", lastDeposit: "3 days ago" },
];

const getWeightFromPercentage = (percentage: number) => {
  const maxCapacity = 10;
  return ((percentage / 100) * maxCapacity).toFixed(1);
};

const BinDetail = () => {
  const { binType } = useParams<{ binType: string }>();
  const navigate = useNavigate();
  const [binData, setBinData] = useState<BinData | null>(null);
  const [loading, setLoading] = useState(true);
  const [conversions, setConversions] = useState<BinConversion[]>([]);

  useEffect(() => {
    const loadConversions = () => {
      const stored = localStorage.getItem(BIN_CONVERSIONS_KEY);
      if (stored) {
        setConversions(JSON.parse(stored));
      }
    };
    loadConversions();
  }, []);

  useEffect(() => {
    const fetchBins = async () => {
      try {
        const { data: householdData } = await supabase
          .from("households")
          .select("id")
          .limit(1)
          .maybeSingle();

        if (householdData) {
          const { data: binsData } = await supabase
            .from("bins")
            .select("*")
            .eq("household_id", householdData.id)
            .maybeSingle();

          if (binsData) {
            setBinData(binsData);
          }
        }
      } catch (error) {
        console.error("Error fetching bins:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBins();
  }, []);

  const getDisplayType = (binKey: string) => {
    const conversion = conversions.find((c) => c.from === binKey);
    if (conversion) {
      return binTypeConfig.find((b) => b.key === conversion.to);
    }
    return binTypeConfig.find((b) => b.key === binKey);
  };

  const currentBinConfig = binTypeConfig.find((b) => b.key === binType);
  const displayType = binType ? getDisplayType(binType) : null;
  
  if (!currentBinConfig || !binType) {
    navigate("/bins");
    return null;
  }

  const percentage = binData ? (binData[binType as keyof BinData] as number) : 0;
  const IconComponent = displayType?.icon || currentBinConfig.icon;
  const isConverted = conversions.some((c) => c.from === binType);

  // Calculate total waste
  const totalWaste = binData
    ? Object.values({
        organic: binData.organic,
        recyclable: binData.recyclable,
        non_recyclable: binData.non_recyclable,
        hazardous: binData.hazardous,
      }).reduce((sum, val) => sum + parseFloat(getWeightFromPercentage(val)), 0)
    : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-20 px-5 pt-8">
        <Skeleton className="h-10 w-10 rounded-xl mb-6" />
        <Skeleton className="h-40 w-full rounded-3xl mb-6" />
        <Skeleton className="h-32 w-full rounded-3xl" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 px-5 pt-8">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="w-10 h-10 bg-card rounded-xl flex items-center justify-center border border-border/30 mb-6 animate-fade-up"
      >
        <ArrowLeft className="w-5 h-5 text-foreground" />
      </button>

      {/* Main Card */}
      <div className={`${displayType?.bgColor || currentBinConfig.bgColor} rounded-3xl p-6 mb-6 animate-fade-up`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <IconComponent className="w-6 h-6 text-foreground/70" />
            <div>
              <h1 className="text-xl font-semibold text-foreground">
                {displayType?.label || currentBinConfig.label} Bin
              </h1>
              {isConverted && (
                <span className="text-xs text-muted-foreground">
                  Converted from {currentBinConfig.label}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-center py-6">
          <DonutChart
            percentage={percentage}
            color={displayType?.color || currentBinConfig.color}
            label=""
            size={140}
            strokeWidth={12}
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="space-y-3 animate-fade-up stagger-1">
        <div className="bg-card rounded-2xl p-4 border border-border/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                <Scale className="w-5 h-5 text-primary" />
              </div>
              <span className="text-sm text-muted-foreground">Current Weight</span>
            </div>
            <span className="text-lg font-bold text-foreground">
              {getWeightFromPercentage(percentage)} kg
            </span>
          </div>
        </div>

        <div className="bg-card rounded-2xl p-4 border border-border/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                <div className="w-5 h-5 rounded-full border-4 border-emerald-500" />
              </div>
              <span className="text-sm text-muted-foreground">Fill Level</span>
            </div>
            <span className="text-lg font-bold text-foreground">{percentage}%</span>
          </div>
        </div>

        <div className="bg-card rounded-2xl p-4 border border-border/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-500" />
              </div>
              <span className="text-sm text-muted-foreground">Last Deposit</span>
            </div>
            <span className="text-lg font-bold text-foreground">
              {displayType?.lastDeposit || currentBinConfig.lastDeposit}
            </span>
          </div>
        </div>

        <div className="bg-card rounded-2xl p-4 border border-border/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-blue-500" />
              </div>
              <span className="text-sm text-muted-foreground">Max Capacity</span>
            </div>
            <span className="text-lg font-bold text-foreground">10 kg</span>
          </div>
        </div>
      </div>

      {/* Total Waste Summary */}
      <div className="mt-6 bg-primary/5 rounded-2xl p-4 border border-primary/20 animate-fade-up stagger-2">
        <p className="text-sm text-muted-foreground mb-1">Total Waste Collected</p>
        <p className="text-2xl font-bold text-foreground">{totalWaste.toFixed(1)} kg</p>
      </div>

      {/* Back to Bins Button */}
      <Button
        onClick={() => navigate("/bins")}
        className="w-full mt-6 h-12 rounded-2xl"
      >
        Back to All Bins
      </Button>
    </div>
  );
};

export default BinDetail;