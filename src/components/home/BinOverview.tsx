import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { DonutChart } from "@/components/ui/DonutChart";
import { Leaf, Recycle, Trash2, AlertTriangle } from "lucide-react";

interface BinData {
  organic: number;
  recyclable: number;
  non_recyclable: number;
  hazardous: number;
}

interface BinOverviewProps {
  binData: BinData | null;
}

interface BinConversion {
  from: string;
  to: string;
}

const BIN_CONVERSIONS_KEY = "recylo_bin_conversions";

const binTypeConfig = [
  { key: "organic", label: "Organic", color: "hsl(var(--organic))", icon: Leaf },
  { key: "recyclable", label: "Recyclable", color: "hsl(var(--recyclable))", icon: Recycle },
  { key: "non_recyclable", label: "Non-Recyclable", color: "hsl(var(--non-recyclable))", icon: Trash2 },
  { key: "hazardous", label: "Hazardous", color: "hsl(var(--hazardous))", icon: AlertTriangle },
];

export const BinOverview = ({ binData }: BinOverviewProps) => {
  const navigate = useNavigate();
  const [conversions, setConversions] = useState<BinConversion[]>([]);

  useEffect(() => {
    const loadConversions = () => {
      const stored = localStorage.getItem(BIN_CONVERSIONS_KEY);
      if (stored) {
        setConversions(JSON.parse(stored));
      } else {
        setConversions([]);
      }
    };

    loadConversions();

    const handleConversionUpdate = () => loadConversions();
    
    window.addEventListener("binConversionsUpdated", handleConversionUpdate);
    window.addEventListener("storage", handleConversionUpdate);
    
    return () => {
      window.removeEventListener("binConversionsUpdated", handleConversionUpdate);
      window.removeEventListener("storage", handleConversionUpdate);
    };
  }, []);

  const getDisplayType = (binKey: string) => {
    const conversion = conversions.find((c) => c.from === binKey);
    if (conversion) {
      return binTypeConfig.find((b) => b.key === conversion.to);
    }
    return binTypeConfig.find((b) => b.key === binKey);
  };

  // Default bin data to 0 if not available
  const defaultBinData: BinData = {
    organic: 0,
    recyclable: 0,
    non_recyclable: 0,
    hazardous: 0,
  };

  const actualBinData = binData || defaultBinData;

  const bins = binTypeConfig.map((binType) => {
    const displayType = getDisplayType(binType.key);
    return {
      originalKey: binType.key,
      label: displayType?.label || binType.label,
      percentage: actualBinData[binType.key as keyof BinData] || 0,
      color: displayType?.color || binType.color,
      icon: displayType?.icon || binType.icon,
    };
  });

  const handleBinClick = (binKey: string) => {
    navigate(`/bins/${binKey}`);
  };

  return (
    <div className="bg-card rounded-3xl p-5 premium-shadow animate-fade-up stagger-2">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Recylo Sort 1.0</h3>
          <p className="text-sm text-muted-foreground">Smart Bin Overview</p>
        </div>
        <Link
          to="/bins"
          className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
        >
          View Details
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-6">
        {bins.map((bin) => (
          <button
            key={bin.originalKey}
            onClick={() => handleBinClick(bin.originalKey)}
            className="flex flex-col items-center cursor-pointer hover:opacity-80 transition-opacity"
          >
            <DonutChart
              percentage={bin.percentage}
              color={bin.color}
              label={bin.label}
              size={80}
              strokeWidth={6}
            />
          </button>
        ))}
      </div>
    </div>
  );
};
