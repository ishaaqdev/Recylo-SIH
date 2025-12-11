import { useState } from "react";
import { Link } from "react-router-dom";
import { DonutChart } from "@/components/ui/DonutChart";
import { X, Clock } from "lucide-react";

interface BinData {
  organic: number;
  recyclable: number;
  non_recyclable: number;
  hazardous: number;
}

interface BinOverviewProps {
  binData: BinData;
}

// Mock weight data (in kg) - in real app, this would come from the database
const getWeightFromPercentage = (percentage: number) => {
  const maxCapacity = 10; // 10 kg max capacity per bin
  return ((percentage / 100) * maxCapacity).toFixed(1);
};

export const BinOverview = ({ binData }: BinOverviewProps) => {
  const [selectedBin, setSelectedBin] = useState<string | null>(null);

  const bins = [
    {
      label: "Organic",
      percentage: binData.organic,
      color: "hsl(var(--organic))",
      lastDeposit: "2 hours ago",
    },
    {
      label: "Recyclable",
      percentage: binData.recyclable,
      color: "hsl(var(--recyclable))",
      lastDeposit: "5 hours ago",
    },
    {
      label: "Non-Recyclable",
      percentage: binData.non_recyclable,
      color: "hsl(var(--non-recyclable))",
      lastDeposit: "1 day ago",
    },
    {
      label: "Hazardous",
      percentage: binData.hazardous,
      color: "hsl(var(--hazardous))",
      lastDeposit: "3 days ago",
    },
  ];

  const selectedBinData = bins.find((bin) => bin.label === selectedBin);

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
            key={bin.label}
            onClick={() => setSelectedBin(bin.label)}
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

      {/* Detail Modal */}
      {selectedBin && selectedBinData && (
        <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
          <div className="bg-card w-full max-w-sm rounded-2xl p-6 animate-scale-in">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-foreground">
                {selectedBinData.label} Bin
              </h3>
              <button
                onClick={() => setSelectedBin(null)}
                className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center"
              >
                <X className="w-4 h-4 text-foreground" />
              </button>
            </div>

            <div className="flex justify-center mb-6">
              <DonutChart
                percentage={selectedBinData.percentage}
                color={selectedBinData.color}
                label=""
                size={120}
                strokeWidth={10}
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-muted rounded-xl">
                <span className="text-sm text-muted-foreground">Fill Level</span>
                <span className="font-semibold text-foreground">{selectedBinData.percentage}%</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted rounded-xl">
                <span className="text-sm text-muted-foreground">Weight</span>
                <span className="font-semibold text-foreground">
                  {getWeightFromPercentage(selectedBinData.percentage)} kg
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted rounded-xl">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Last Deposit
                </span>
                <span className="font-semibold text-foreground">{selectedBinData.lastDeposit}</span>
              </div>
            </div>

            <button
              onClick={() => setSelectedBin(null)}
              className="w-full mt-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
