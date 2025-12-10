import { cn } from "@/lib/utils";

interface DonutChartProps {
  percentage: number;
  color: string;
  size?: number;
  strokeWidth?: number;
  label: string;
  icon: React.ReactNode;
  className?: string;
}

export const DonutChart = ({
  percentage,
  color,
  size = 100,
  strokeWidth = 10,
  label,
  icon,
  className,
}: DonutChartProps) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          className="transform -rotate-90"
        >
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth={strokeWidth}
          />
          {/* Foreground circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="donut-segment transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold text-foreground">{percentage}%</span>
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-lg">{icon}</span>
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
      </div>
    </div>
  );
};
