import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";

interface Reward {
  id: string;
  title: string;
  icon: string;
  reward_type: string;
  reward_value: number;
}

const wheelColors = [
  "#1A73E8",
  "#4C9FFF",
  "#7CB9FF",
  "#1A73E8",
  "#4C9FFF",
  "#7CB9FF",
];

const SpinWheel = () => {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [wonReward, setWonReward] = useState<Reward | null>(null);
  const [showResult, setShowResult] = useState(false);
  const wheelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchRewards();
  }, []);

  const fetchRewards = async () => {
    try {
      const { data } = await supabase.from("spinwheel_rewards").select("*");
      if (data) {
        setRewards(data);
      }
    } catch (error) {
      console.error("Error fetching rewards:", error);
    } finally {
      setLoading(false);
    }
  };

  const spin = () => {
    if (spinning || rewards.length === 0) return;

    setSpinning(true);
    setShowResult(false);

    const randomIndex = Math.floor(Math.random() * rewards.length);
    const segmentAngle = 360 / rewards.length;
    const stopAngle = 360 - randomIndex * segmentAngle - segmentAngle / 2;
    const spins = 5;
    const finalRotation = rotation + spins * 360 + stopAngle;

    setRotation(finalRotation);

    setTimeout(() => {
      setSpinning(false);
      setWonReward(rewards[randomIndex]);
      setShowResult(true);

      // Add reward to user
      addRewardToUser(rewards[randomIndex]);
    }, 4000);
  };

  const addRewardToUser = async (reward: Reward) => {
    try {
      const { data: household } = await supabase
        .from("households")
        .select("id, points")
        .limit(1)
        .maybeSingle();

      if (household) {
        if (reward.reward_type === "points") {
          await supabase
            .from("households")
            .update({ points: household.points + reward.reward_value })
            .eq("id", household.id);
        } else if (reward.reward_type === "coupon") {
          await supabase.from("coupons").insert({
            household_id: household.id,
            title: `${reward.reward_value}% Off Coupon`,
            discount: `${reward.reward_value}%`,
            expiry_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          });
        }
      }
    } catch (error) {
      console.error("Error adding reward:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-24 px-5 pt-8">
        <Skeleton className="h-8 w-40 mx-auto mb-8 rounded-xl" />
        <Skeleton className="h-64 w-64 mx-auto rounded-full" />
      </div>
    );
  }

  const segmentAngle = 360 / rewards.length;

  return (
    <div className="min-h-screen bg-background pb-28 px-5 pt-8">
      <div className="text-center mb-8 animate-fade-up">
        <h1 className="text-2xl font-bold text-foreground">Spin & Win 🎉</h1>
        <p className="text-muted-foreground">Try your luck today!</p>
      </div>

      {/* Wheel Container */}
      <div className="relative flex justify-center items-center mb-8 animate-fade-up stagger-1">
        {/* Pointer */}
        <div className="absolute top-0 z-10 w-0 h-0 border-l-[15px] border-r-[15px] border-t-[30px] border-l-transparent border-r-transparent border-t-primary" />

        {/* Wheel */}
        <div
          ref={wheelRef}
          className="w-72 h-72 rounded-full premium-shadow relative overflow-hidden"
          style={{
            transform: `rotate(${rotation}deg)`,
            transition: spinning ? "transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)" : "none",
          }}
        >
          {rewards.map((reward, index) => {
            const startAngle = index * segmentAngle;
            return (
              <div
                key={reward.id}
                className="absolute w-full h-full"
                style={{
                  transform: `rotate(${startAngle}deg)`,
                  clipPath: `polygon(50% 50%, 50% 0%, ${
                    50 + 50 * Math.tan((segmentAngle * Math.PI) / 360)
                  }% 0%)`,
                }}
              >
                <div
                  className="absolute inset-0 flex items-start justify-center pt-8"
                  style={{
                    backgroundColor: wheelColors[index % wheelColors.length],
                    transform: `rotate(${segmentAngle / 2}deg)`,
                  }}
                >
                  <div className="text-center text-primary-foreground">
                    <span className="text-2xl block mb-1">{reward.icon}</span>
                    <span className="text-[10px] font-semibold">{reward.title}</span>
                  </div>
                </div>
              </div>
            );
          })}
          {/* Center Circle */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 bg-card rounded-full premium-shadow flex items-center justify-center">
              <span className="text-2xl">🎰</span>
            </div>
          </div>
        </div>
      </div>

      {/* Spin Button */}
      <div className="text-center animate-fade-up stagger-2">
        <Button
          onClick={spin}
          disabled={spinning}
          className="h-16 px-12 rounded-full text-lg font-bold premium-shadow"
        >
          {spinning ? "Spinning..." : "SPIN"}
        </Button>
        <p className="text-xs text-muted-foreground mt-4">1 spin every 24 hours</p>
      </div>

      {/* Result Modal */}
      {showResult && wonReward && (
        <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-card w-full max-w-sm rounded-3xl p-8 animate-scale-in text-center">
            <span className="text-6xl mb-4 block animate-float">{wonReward.icon}</span>
            <h3 className="text-2xl font-bold text-foreground mb-2">
              Congratulations! 🎉
            </h3>
            <p className="text-lg text-primary font-semibold mb-2">{wonReward.title}</p>
            <p className="text-muted-foreground mb-6">
              {wonReward.reward_type === "points"
                ? `You won ${wonReward.reward_value} points!`
                : `You won a ${wonReward.reward_value}% off coupon!`}
            </p>
            <Button
              onClick={() => setShowResult(false)}
              className="w-full rounded-2xl h-12"
            >
              Claim Reward
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SpinWheel;
