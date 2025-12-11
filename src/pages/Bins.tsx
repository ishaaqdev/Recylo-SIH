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

// Track bin conversions
interface BinConversion {
  from: string;
  to: string;
}

const BIN_CONVERSIONS_KEY = "recylo_bin_conversions";

const Bins = () => {
  const [binData, setBinData] = useState<BinData | null>(null);
  const [loading, setLoading] = useState(true);
  const [swapModalOpen, setSwapModalOpen] = useState(false);
  const [selectedBin, setSelectedBin] = useState<string | null>(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [swapTarget, setSwapTarget] = useState<string | null>(null);
  const [conversions, setConversions] = useState<BinConversion[]>([]);

  useEffect(() => {
    loadConversions();
    fetchBins();
  }, []);

  const loadConversions = () => {
    const stored = localStorage.getItem(BIN_CONVERSIONS_KEY);
    if (stored) {
      setConversions(JSON.parse(stored));
    }
  };

  const saveConversions = (newConversions: BinConversion[]) => {
    localStorage.setItem(BIN_CONVERSIONS_KEY, JSON.stringify(newConversions));
    setConversions(newConversions);
    // Dispatch custom event to notify other components in the same tab
    window.dispatchEvent(new CustomEvent("binConversionsUpdated"));
  };

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

    // Save the conversion
    const newConversions = [...conversions, { from: selectedBin, to: swapTarget }];
    saveConversions(newConversions);
    
    toast({
      title: "Bin converted successfully",
      description: `${binTypes.find((b) => b.key === selectedBin)?.label} bin is now used as ${binTypes.find((b) => b.key === swapTarget)?.label}.`,
    });

    setConfirmModalOpen(false);
    setSelectedBin(null);
    setSwapTarget(null);
  };

  // Get the display type for a bin (considering conversions)
  const getDisplayType = (binKey: string) => {
    const conversion = conversions.find((c) => c.from === binKey);
    if (conversion) {
      return binTypes.find((b) => b.key === conversion.to);
    }
    return binTypes.find((b) => b.key === binKey);
  };

  // Get empty bins for the swap section (bins that are at 0%)
  const emptyBins = binData
    ? binTypes.filter((bin) => {
        const isEmpty = (binData[bin.key as keyof BinData] as number) === 0;
        return isEmpty;
      })
    : [];

  // Handle re-converting an already converted bin
  const handleReconvert = (binKey: string) => {
    // Remove the existing conversion first
    const newConversions = conversions.filter((c) => c.from !== binKey);
    saveConversions(newConversions);
    // Then open swap modal for new conversion
    setSelectedBin(binKey);
    setSwapModalOpen(true);
  };

  // Undo a conversion (reset to original type)
  const handleUndoConversion = (binKey: string) => {
    const newConversions = conversions.filter((c) => c.from !== binKey);
    saveConversions(newConversions);
    toast({
      title: "Conversion undone",
      description: `Bin restored to ${binTypes.find((b) => b.key === binKey)?.label}.`,
    });
  };

  // Get converted bins
  const convertedBins = conversions.map((c) => ({
    originalKey: c.from,
    displayType: binTypes.find((b) => b.key === c.to)!,
    originalType: binTypes.find((b) => b.key === c.from)!,
  }));

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

  // Calculate total waste
  const totalWasteKg = binData
    ? Object.values({
        organic: binData.organic,
        recyclable: binData.recyclable,
        non_recyclable: binData.non_recyclable,
        hazardous: binData.hazardous,
      }).reduce((sum, val) => sum + (val / 100) * 10, 0)
    : 0;

  return (
    <div className="min-h-screen bg-background pb-20 px-5 pt-8">
      {/* Header Card */}
      <div className="bg-primary rounded-3xl p-5 mb-6 animate-fade-up">
        <h1 className="text-xl font-semibold text-primary-foreground">My Smart Bin</h1>
        <p className="text-primary-foreground/80 text-sm">Monitor your waste compartments</p>
      </div>

      {/* Total Waste Stats */}
      <div className="bg-card rounded-2xl p-4 mb-6 border border-border/30 animate-fade-up">
        <p className="text-sm text-muted-foreground mb-1">Total Waste Collected</p>
        <p className="text-2xl font-bold text-foreground">{totalWasteKg.toFixed(1)} kg</p>
        <div className="grid grid-cols-4 gap-2 mt-3">
          {binTypes.map((bin) => {
            const displayType = getDisplayType(bin.key);
            const weight = binData ? ((binData[bin.key as keyof BinData] as number) / 100) * 10 : 0;
            return (
              <div key={bin.key} className="text-center">
                <p className="text-xs text-muted-foreground">{displayType?.label.split('-')[0] || bin.label.split('-')[0]}</p>
                <p className="text-sm font-semibold text-foreground">{weight.toFixed(1)} kg</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        {binTypes.map((bin, index) => {
          const percentage = binData ? (binData[bin.key as keyof BinData] as number) : 0;
          const displayType = getDisplayType(bin.key);
          const isConverted = conversions.some((c) => c.from === bin.key);
          const IconComponent = displayType?.icon || bin.icon;
          
          return (
            <div
              key={bin.key}
              className={`${displayType?.bgColor || bin.bgColor} rounded-3xl p-4 animate-fade-up relative`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {isConverted && (
                <span className="absolute top-2 right-2 text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
                  Converted
                </span>
              )}
              <div className="flex items-center gap-2 mb-3">
                <IconComponent className="w-4 h-4 text-foreground/70" />
                <span className="text-xs font-medium text-foreground/70">{displayType?.label || bin.label}</span>
              </div>
              <div className="flex justify-center">
                <DonutChart
                  percentage={percentage}
                  color={displayType?.color || bin.color}
                  label=""
                  size={80}
                  strokeWidth={6}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Swap Empty Bins Section - Mobile Friendly */}
      {emptyBins.length > 0 && (
        <div className="bg-card rounded-3xl p-4 border border-border/50 animate-fade-up">
          <div className="flex items-center gap-2 mb-3">
            <ArrowLeftRight className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-foreground text-sm">Convert Empty Bins</h3>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            Convert empty bins to maximize usage.
          </p>
          <div className="space-y-2">
            {emptyBins.map((bin) => {
              const IconComponent = bin.icon;
              const isConverted = conversions.some((c) => c.from === bin.key);
              const currentConversion = conversions.find((c) => c.from === bin.key);
              const convertedTo = currentConversion ? binTypes.find((b) => b.key === currentConversion.to) : null;
              
              return (
                <div key={bin.key} className="p-3 bg-muted/50 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <IconComponent className="w-4 h-4 text-foreground/70 flex-shrink-0" />
                    <span className="text-sm font-medium truncate">{bin.label}</span>
                    {isConverted && convertedTo && (
                      <span className="text-xs text-muted-foreground">
                        → {convertedTo.label}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {isConverted ? (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleUndoConversion(bin.key)}
                          className="rounded-xl text-xs h-8 flex-1"
                        >
                          Undo
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleReconvert(bin.key)}
                          className="rounded-xl text-xs h-8 flex-1"
                        >
                          Re-convert
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSwapClick(bin.key)}
                        className="rounded-xl text-xs h-8 w-full"
                      >
                        Convert Bin
                      </Button>
                    )}
                  </div>
                </div>
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
              <h3 className="text-lg font-semibold text-foreground">Convert Bin Type</h3>
              <button
                onClick={() => setSwapModalOpen(false)}
                className="p-2 rounded-full hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Select what type of waste the {binTypes.find((b) => b.key === selectedBin)?.label} bin should collect instead:
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
              <h3 className="text-lg font-semibold text-foreground mb-2">Confirm Conversion</h3>
              <p className="text-muted-foreground text-sm">
                Convert {binTypes.find((b) => b.key === selectedBin)?.label} bin to collect{" "}
                {binTypes.find((b) => b.key === swapTarget)?.label} waste?
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                You'll have 2 bins for {binTypes.find((b) => b.key === swapTarget)?.label} waste.
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
