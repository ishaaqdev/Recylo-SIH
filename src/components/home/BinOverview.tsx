import { Link } from "react-router-dom";
import { DonutChart } from "@/components/ui/DonutChart";

interface BinData {
  organic: number;
  recyclable: number;
  non_recyclable: number;
  hazardous: number;
}

interface BinOverviewProps {
  binData: BinData;
}

export const BinOverview = ({ binData }: BinOverviewProps) => {
  const bins = [
    {
      label: "Organic",
      percentage: binData.organic,
      color: "hsl(var(--organic))",
      icon: "🥬",
    },
    {
      label: "Recyclable",
      percentage: binData.recyclable,
      color: "hsl(var(--recyclable))",
      icon: "♻️",
    },
    {
      label: "Non-Recyclable",
      percentage: binData.non_recyclable,
      color: "hsl(var(--non-recyclable))",
      icon: "🗑️",
    },
    {
      label: "Hazardous",
      percentage: binData.hazardous,
      color: "hsl(var(--hazardous))",
      icon: "⚠️",
    },
  ];

  return (
    <div className="bg-card rounded-3xl p-5 premium-shadow animate-fade-up stagger-2">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-lg font-bold text-foreground">Recylo Sort 1.0</h3>
          <p className="text-sm text-muted-foreground">Smart Bin Overview</p>
        </div>
        <Link
          to="/bins"
          className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
        >
          Know More
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-6">
        {bins.map((bin) => (
          <DonutChart
            key={bin.label}
            percentage={bin.percentage}
            color={bin.color}
            label={bin.label}
            icon={bin.icon}
            size={90}
            strokeWidth={8}
          />
        ))}
      </div>
    </div>
  );
};
