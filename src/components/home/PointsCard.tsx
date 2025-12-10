import { Sparkles, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

interface PointsCardProps {
  points: number;
  level: number;
}

export const PointsCard = ({ points, level }: PointsCardProps) => {
  return (
    <div className="recylo-gradient rounded-3xl p-6 premium-shadow animate-fade-up">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-primary-foreground/80 text-sm font-medium mb-1">
            Total Points
          </p>
          <h2 className="text-4xl font-bold text-primary-foreground mb-3">
            {points.toLocaleString()}
          </h2>
          <div className="inline-flex items-center gap-1.5 bg-primary-foreground/20 backdrop-blur-sm px-3 py-1.5 rounded-full">
            <Sparkles className="w-4 h-4 text-primary-foreground" />
            <span className="text-sm font-semibold text-primary-foreground">
              Level {level}
            </span>
          </div>
        </div>
        <div className="w-16 h-16 bg-primary-foreground/20 rounded-2xl flex items-center justify-center">
          <span className="text-3xl">🏆</span>
        </div>
      </div>
      <Link
        to="/rewards"
        className="mt-5 flex items-center justify-between bg-primary-foreground/20 hover:bg-primary-foreground/30 transition-colors rounded-2xl px-4 py-3 group"
      >
        <span className="text-primary-foreground font-semibold">
          Redeem Rewards
        </span>
        <ChevronRight className="w-5 h-5 text-primary-foreground group-hover:translate-x-1 transition-transform" />
      </Link>
    </div>
  );
};
