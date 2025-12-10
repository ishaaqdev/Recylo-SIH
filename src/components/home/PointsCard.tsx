import { Star, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

interface PointsCardProps {
  points: number;
  level: number;
}

export const PointsCard = ({ points, level }: PointsCardProps) => {
  return (
    <div className="bg-card rounded-3xl p-6 premium-shadow border border-border/30 animate-fade-up">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-muted-foreground text-sm font-medium mb-1">
            Total Points
          </p>
          <h2 className="text-4xl font-bold text-foreground">
            {points.toLocaleString()}
          </h2>
        </div>
        <div className="flex items-center gap-1.5 bg-primary/10 px-3 py-1.5 rounded-full">
          <Star className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-primary">
            Level {level}
          </span>
        </div>
      </div>
      <Link
        to="/rewards"
        className="flex items-center justify-between bg-primary hover:bg-primary/90 transition-colors rounded-2xl px-4 py-3 group"
      >
        <span className="text-primary-foreground font-semibold">
          Redeem Rewards
        </span>
        <ChevronRight className="w-5 h-5 text-primary-foreground group-hover:translate-x-1 transition-transform" />
      </Link>
    </div>
  );
};
