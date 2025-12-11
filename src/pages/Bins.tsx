import { useEffect, useState } from "react";
import { ArrowLeftRight, X, Check, Leaf, Recycle, Trash2, AlertTriangle } from "lucide-react";
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
  { key: "organic", label: "Organic", color: "hsl(var(--organic))", icon: Leaf, bgColor: "bg-emerald-50" },
  { key: "recyclable", label: "Recyclable", color: "hsl(var(--recyclable))", icon: Recycle, bgColor: "bg-sky-50" },
  { key: "non_recyclable", label: "Non-Recyclable", color: "hsl(var(--non-recyclable))", icon: Trash2, bgColor: "bg-gray-100" },
  { key: "hazardous", label: "Hazardous", color: "hsl(var(--hazardous))", icon: AlertTriangle, bgColor: "bg-red-50" },
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
        title: "Bins swapped successfully",
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

  // Get empty bins for the swap section
  const emptyBins = binData
    ? binTypes.filter((bin) => (binData[bin.key as keyof BinData] as number) === 0)
    : [];

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-20 px-5 pt-8">
        <Skeleton className="h-8 w-40 mb-2 rounded-xl" />
        <Skeleton className="h-5 w-56 mb-8 rounded-xl" />
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-40 rounded-3xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 px-5 pt-8">
      {/* Header Card */}
      <div className="bg-primary rounded-3xl p-5 mb-6 animate-fade-up">
        <h1 className="text-xl font-semibold text-primary-foreground">My Smart Bin</h1>
        <p className="text-primary-foreground/80 text-sm">Monitor your waste compartments</p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        {binTypes.map((bin, index) => {
          const percentage = binData ? (binData[bin.key as keyof BinData] as number) : 0;
          const IconComponent = bin.icon;
          
          return (
            <div
              key={bin.key}
              className={`${bin.bgColor} rounded-3xl p-4 animate-fade-up`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-center gap-2 mb-3">
                <IconComponent className="w-4 h-4 text-foreground/70" />
                <span className="text-xs font-medium text-foreground/70">{bin.label}</span>
              </div>
              <div className="flex justify-center">
                <DonutChart
                  percentage={percentage}
                  color={bin.color}
                  label=""
                  size={80}
                  strokeWidth={6}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Swap Empty Bins Section */}
      {emptyBins.length > 0 && (
        <div className="bg-card rounded-3xl p-5 border border-border/50 animate-fade-up">
          <div className="flex items-center gap-2 mb-4">
            <ArrowLeftRight className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-foreground">Swap Empty Bins</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            You have {emptyBins.length} empty bin{emptyBins.length > 1 ? 's' : ''}. Swap to use the space for another waste type.
          </p>
          <div className="flex flex-wrap gap-2">
            {emptyBins.map((bin) => {
              const IconComponent = bin.icon;
              return (
                <Button
                  key={bin.key}
                  variant="outline"
                  size="sm"
                  onClick={() => handleSwapClick(bin.key)}
                  className="rounded-xl"
                >
                  <IconComponent className="w-4 h-4 mr-2" />
                  Swap {bin.label}
                </Button>
              );
            })}
          </div>
        </div>
      )}

      {/* Swap Modal */}
      {swapModalOpen && (
        <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-[60] flex items-end justify-center">
          <div className="bg-card w-full max-w-lg rounded-t-3xl p-6 animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-foreground">Swap Bin Type</h3>
              <button
                onClick={() => setSwapModalOpen(false)}
                className="p-2 rounded-full hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Select a bin type to swap with {binTypes.find((b) => b.key === selectedBin)?.label}
            </p>
            <div className="grid grid-cols-3 gap-3">
              {binTypes
                .filter((b) => b.key !== selectedBin)
                .map((bin) => {
                  const IconComponent = bin.icon;
                  return (
                    <button
                      key={bin.key}
                      onClick={() => handleSwapSelect(bin.key)}
                      className={`${bin.bgColor} p-4 rounded-2xl flex flex-col items-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all`}
                    >
                      <IconComponent className="w-6 h-6 text-foreground/70" />
                      <span className="text-xs font-medium text-center text-foreground">{bin.label}</span>
                    </button>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      {confirmModalOpen && (
        <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-[60] flex items-center justify-center p-6">
          <div className="bg-card w-full max-w-sm rounded-3xl p-6 animate-scale-in">
            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <ArrowLeftRight className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Confirm Swap</h3>
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
