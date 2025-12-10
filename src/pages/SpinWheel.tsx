import { useEffect, useState, useRef } from "react";
import { ArrowLeft, RotateCw } from "lucide-react";
import { Link } from "react-router-dom";
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

const SPIN_COOLDOWN_KEY = "recylo_last_spin";
const FREE_SPINS_KEY = "recylo_free_spins";
const COOLDOWN_HOURS = 6;

const SpinWheel = () => {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [wonReward, setWonReward] = useState<Reward | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [canSpin, setCanSpin] = useState(true);
  const [timeLeft, setTimeLeft] = useState("");
  const [freeSpins, setFreeSpins] = useState(0);
  const wheelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchRewards();
    checkSpinAvailability();
    loadFreeSpins();

    const interval = setInterval(() => {
      checkSpinAvailability();
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const loadFreeSpins = () => {
    const stored = localStorage.getItem(FREE_SPINS_KEY);
    if (stored) {
      setFreeSpins(parseInt(stored, 10));
    }
  };

  const checkSpinAvailability = () => {
    const lastSpin = localStorage.getItem(SPIN_COOLDOWN_KEY);
    const storedFreeSpins = parseInt(localStorage.getItem(FREE_SPINS_KEY) || "0", 10);
    
    if (storedFreeSpins > 0) {
      setCanSpin(true);
      setTimeLeft("");
      return;
    }

    if (!lastSpin) {
      setCanSpin(true);
      setTimeLeft("");
      return;
    }

    const lastSpinTime = new Date(lastSpin).getTime();
    const now = Date.now();
    const diff = now - lastSpinTime;
    const cooldownMs = COOLDOWN_HOURS * 60 * 60 * 1000;

    if (diff >= cooldownMs) {
      setCanSpin(true);
      setTimeLeft("");
    } else {
      setCanSpin(false);
      const remaining = cooldownMs - diff;
      const hours = Math.floor(remaining / (60 * 60 * 1000));
      const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
      const seconds = Math.floor((remaining % (60 * 1000)) / 1000);
      setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
    }
  };

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
    if (spinning || rewards.length === 0 || (!canSpin && freeSpins === 0)) return;

    // Use free spin if available
    if (freeSpins > 0) {
      const newFreeSpins = freeSpins - 1;
      setFreeSpins(newFreeSpins);
      localStorage.setItem(FREE_SPINS_KEY, newFreeSpins.toString());
    } else {
      localStorage.setItem(SPIN_COOLDOWN_KEY, new Date().toISOString());
    }

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
      addRewardToUser(rewards[randomIndex]);
      checkSpinAvailability();
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
        } else if (reward.reward_type === "spin") {
          const currentSpins = parseInt(localStorage.getItem(FREE_SPINS_KEY) || "0", 10);
          const newSpins = currentSpins + reward.reward_value;
          localStorage.setItem(FREE_SPINS_KEY, newSpins.toString());
          setFreeSpins(newSpins);
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
      {/* Header */}
      <div className="flex items-center gap-4 mb-8 animate-fade-up">
        <Link
          to="/rewards"
          className="w-10 h-10 bg-card rounded-xl flex items-center justify-center border border-border/30"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-foreground">Spin & Win</h1>
          <p className="text-sm text-muted-foreground">Try your luck</p>
        </div>
      </div>

      {/* Free Spins Badge */}
      {freeSpins > 0 && (
        <div className="bg-primary/10 text-primary text-sm font-medium px-4 py-2 rounded-full text-center mb-6 animate-fade-up">
          You have {freeSpins} free spin{freeSpins > 1 ? "s" : ""} available
        </div>
      )}

      {/* Wheel Container */}
      <div className="relative flex justify-center items-center mb-8 animate-fade-up stagger-1">
        {/* Pointer */}
        <div className="absolute top-0 z-10 w-0 h-0 border-l-[12px] border-r-[12px] border-t-[24px] border-l-transparent border-r-transparent border-t-primary" />

        {/* Wheel */}
        <div
          ref={wheelRef}
          className="w-72 h-72 rounded-full border-4 border-primary/20 relative overflow-hidden"
          style={{
            transform: `rotate(${rotation}deg)`,
            transition: spinning ? "transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)" : "none",
          }}
        >
          {rewards.map((reward, index) => {
            const angle = index * segmentAngle;
            const isEven = index % 2 === 0;
            return (
              <div
                key={reward.id}
                className="absolute w-full h-full origin-center"
                style={{
                  transform: `rotate(${angle}deg)`,
                }}
              >
                <div
                  className={`absolute top-0 left-1/2 -translate-x-1/2 w-36 h-36 origin-bottom flex flex-col items-center pt-4 ${
                    isEven ? "bg-primary" : "bg-primary/70"
                  }`}
                  style={{
                    clipPath: `polygon(50% 100%, 0 0, 100% 0)`,
                  }}
                >
                  <span className="text-xs font-medium text-primary-foreground text-center px-2 mt-2">
                    {reward.title}
                  </span>
                </div>
              </div>
            );
          })}
          
          {/* Center Circle */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 bg-card rounded-full border-4 border-primary flex items-center justify-center">
              <RotateCw className="w-6 h-6 text-primary" />
            </div>
          </div>
        </div>
      </div>

      {/* Spin Button */}
      <div className="text-center animate-fade-up stagger-2">
        <Button
          onClick={spin}
          disabled={spinning || (!canSpin && freeSpins === 0)}
          className="h-14 px-12 rounded-2xl text-base font-semibold"
        >
          {spinning ? "Spinning..." : "SPIN"}
        </Button>
        {timeLeft && freeSpins === 0 && (
          <p className="text-sm text-muted-foreground mt-4">
            Next spin in: {timeLeft}
          </p>
        )}
        {!timeLeft && freeSpins === 0 && canSpin && (
          <p className="text-xs text-muted-foreground mt-4">
            1 spin every {COOLDOWN_HOURS} hours
          </p>
        )}
      </div>

      {/* Result Modal */}
      {showResult && wonReward && (
        <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-card w-full max-w-sm rounded-3xl p-8 animate-scale-in text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <RotateCw className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">
              Congratulations
            </h3>
            <p className="text-lg text-primary font-semibold mb-2">{wonReward.title}</p>
            <p className="text-muted-foreground mb-6">
              {wonReward.reward_type === "points"
                ? `You won ${wonReward.reward_value} points`
                : wonReward.reward_type === "spin"
                ? `You won ${wonReward.reward_value} free spin${wonReward.reward_value > 1 ? "s" : ""}`
                : `You won a ${wonReward.reward_value}% off coupon`}
            </p>
            <Button
              onClick={() => setShowResult(false)}
              className="w-full rounded-2xl h-12"
            >
              Continue
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SpinWheel;
