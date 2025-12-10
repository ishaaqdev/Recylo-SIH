import { useEffect, useState } from "react";
import { ArrowLeftRight, X, Check } from "lucide-react";
import { DonutChart } from "@/components/ui/DonutChart";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";

interface BinData {
  id: string;
  organic: number;
  recyclable: number;
  non_recyclable: number;
  hazardous: number;
}

const binTypes = [
  { key: "organic", label: "Organic", color: "hsl(var(--organic))", icon: "🥬", bgColor: "bg-emerald-50" },
  { key: "recyclable", label: "Recyclable", color: "hsl(var(--recyclable))", icon: "♻️", bgColor: "bg-sky-50" },
  { key: "non_recyclable", label: "Non-Recyclable", color: "hsl(var(--non-recyclable))", icon: "🗑️", bgColor: "bg-gray-100" },
  { key: "hazardous", label: "Hazardous", color: "hsl(var(--hazardous))", icon: "⚠️", bgColor: "bg-red-50" },
];

const Bins = () => {
  const [binData, setBinData] = useState<BinData | null>(null);
  const [loading, setLoading] = useState(true);
  const [swapModalOpen, setSwapModalOpen] = useState(false);
  const [selectedBin, setSelectedBin] = useState<string | null>(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [swapTarget, setSwapTarget] = useState<string | null>(null);

  useEffect(() => {
    fetchBins();
  }, []);

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

  const handleSwapClick = (binKey: string) => {
    setSelectedBin(binKey);
    setSwapModalOpen(true);
  };

  const handleSwapSelect = (targetBin: string) => {
    setSwapTarget(targetBin);
    setSwapModalOpen(false);
    setConfirmModalOpen(true);
  };

  const handleConfirmSwap = async () => {
    if (!binData || !selectedBin || !swapTarget) return;

    const updates: Record<string, number> = {
      [selectedBin]: binData[swapTarget as keyof BinData] as number,
      [swapTarget]: binData[selectedBin as keyof BinData] as number,
    };

    try {
      const { error } = await supabase
        .from("bins")
        .update(updates)
        .eq("id", binData.id);

      if (error) throw error;

      toast({
        title: "Bins swapped successfully!",
        description: "Your bin configuration has been updated.",
      });

      fetchBins();
    } catch (error) {
      toast({
        title: "Failed to swap bins",
        variant: "destructive",
      });
    } finally {
      setConfirmModalOpen(false);
      setSelectedBin(null);
      setSwapTarget(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-24 px-5 pt-8">
        <Skeleton className="h-8 w-40 mb-2 rounded-xl" />
        <Skeleton className="h-5 w-56 mb-8 rounded-xl" />
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-48 rounded-3xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-28 px-5 pt-8">
      <div className="mb-8 animate-fade-up">
        <h1 className="text-2xl font-bold text-foreground">My Smart Bin</h1>
        <p className="text-muted-foreground">Monitor your waste compartments</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {binTypes.map((bin, index) => {
          const percentage = binData ? (binData[bin.key as keyof BinData] as number) : 0;
          
          return (
            <div
              key={bin.key}
              className={`${bin.bgColor} rounded-3xl p-5 soft-shadow animate-fade-up stagger-${index + 1}`}
            >
              <DonutChart
                percentage={percentage}
                color={bin.color}
                label={bin.label}
                icon={bin.icon}
                size={100}
                strokeWidth={10}
              />
              {percentage === 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSwapClick(bin.key)}
                  className="w-full mt-4 rounded-xl text-xs"
                >
                  <ArrowLeftRight className="w-3 h-3 mr-1" />
                  Swap Type
                </Button>
              )}
            </div>
          );
        })}
      </div>

      {/* Swap Modal */}
      {swapModalOpen && (
        <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50 flex items-end justify-center">
          <div className="bg-card w-full max-w-lg rounded-t-3xl p-6 animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-foreground">Swap Bin Type</h3>
              <button
                onClick={() => setSwapModalOpen(false)}
                className="p-2 rounded-full hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {binTypes
                .filter((b) => b.key !== selectedBin)
                .map((bin) => (
                  <button
                    key={bin.key}
                    onClick={() => handleSwapSelect(bin.key)}
                    className={`${bin.bgColor} p-4 rounded-2xl flex flex-col items-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all`}
                  >
                    <span className="text-2xl">{bin.icon}</span>
                    <span className="text-xs font-medium text-center">{bin.label}</span>
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      {confirmModalOpen && (
        <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-card w-full max-w-sm rounded-3xl p-6 animate-scale-in">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <ArrowLeftRight className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">Confirm Swap</h3>
              <p className="text-muted-foreground text-sm">
                Swap {binTypes.find((b) => b.key === selectedBin)?.label} with{" "}
                {binTypes.find((b) => b.key === swapTarget)?.label}?
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setConfirmModalOpen(false)}
                className="flex-1 rounded-2xl h-12"
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmSwap}
                className="flex-1 rounded-2xl h-12"
              >
                <Check className="w-4 h-4 mr-2" />
                Confirm
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Bins;
