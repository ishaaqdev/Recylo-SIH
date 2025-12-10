import { useState } from "react";
import { Gift, Clock, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

const possibleRewards = [
  { icon: "🎧", title: "Wireless Earbuds" },
  { icon: "🎒", title: "Eco Backpack" },
  { icon: "🌱", title: "Plant Kit" },
  { icon: "☕", title: "Reusable Mug" },
  { icon: "🧴", title: "Eco Care Kit" },
  { icon: "🎁", title: "Mystery Box" },
];

const LuckyDraw = () => {
  const [entered, setEntered] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleEnter = () => {
    setEntered(true);
    setShowConfirm(true);
    toast({
      title: "Entry Confirmed!",
      description: "You're in the next lucky draw.",
    });
  };

  // Mock countdown - in real app would be dynamic
  const timeLeft = "23h 45m 32s";

  return (
    <div className="min-h-screen bg-background pb-28 px-5 pt-8">
      <div className="text-center mb-8 animate-fade-up">
        <h1 className="text-2xl font-bold text-foreground">Lucky Draw 🎁</h1>
        <p className="text-muted-foreground">Win exciting eco-rewards!</p>
      </div>

      {/* Timer Card */}
      <div className="bg-gradient-to-br from-violet-100 to-purple-100 rounded-3xl p-6 mb-6 animate-fade-up stagger-1">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Next Draw In</p>
            <h2 className="text-3xl font-bold text-foreground">{timeLeft}</h2>
          </div>
          <div className="w-16 h-16 bg-violet-200 rounded-2xl flex items-center justify-center">
            <Clock className="w-8 h-8 text-violet-600" />
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-violet-200">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Total Entries</span>
            <span className="font-semibold text-foreground">1,247</span>
          </div>
          <div className="flex items-center justify-between text-sm mt-2">
            <span className="text-muted-foreground">Your Entry Status</span>
            <span
              className={`font-semibold ${
                entered ? "text-emerald-600" : "text-amber-600"
              }`}
            >
              {entered ? "Entered ✓" : "Not Entered"}
            </span>
          </div>
        </div>
      </div>

      {/* Possible Rewards */}
      <div className="mb-8 animate-fade-up stagger-2">
        <h3 className="text-lg font-bold text-foreground mb-4">Possible Rewards</h3>
        <div className="grid grid-cols-3 gap-3">
          {possibleRewards.map((reward) => (
            <div
              key={reward.title}
              className="bg-card rounded-2xl p-4 text-center soft-shadow"
            >
              <span className="text-3xl mb-2 block">{reward.icon}</span>
              <p className="text-xs font-medium text-muted-foreground">
                {reward.title}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Enter Button */}
      <div className="animate-fade-up stagger-3">
        <Button
          onClick={handleEnter}
          disabled={entered}
          className="w-full h-14 rounded-2xl text-base font-semibold"
        >
          {entered ? (
            <>
              <Check className="w-5 h-5 mr-2" />
              Entry Confirmed
            </>
          ) : (
            <>
              <Gift className="w-5 h-5 mr-2" />
              Enter Draw
            </>
          )}
        </Button>
        <p className="text-xs text-center text-muted-foreground mt-3">
          Costs 50 points to enter
        </p>
      </div>

      {/* Rules */}
      <div className="mt-8 bg-muted/50 rounded-2xl p-5 animate-fade-up stagger-4">
        <h4 className="font-semibold text-foreground mb-3">How It Works</h4>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-start gap-2">
            <span className="text-primary">1.</span>
            Enter the draw with 50 points
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary">2.</span>
            Wait for the timer to reach zero
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary">3.</span>
            One lucky winner gets a random reward
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary">4.</span>
            Non-winners get 25 points back
          </li>
        </ul>
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-card w-full max-w-sm rounded-3xl p-8 animate-scale-in text-center">
            <span className="text-6xl mb-4 block animate-float">🎟️</span>
            <h3 className="text-2xl font-bold text-foreground mb-2">You're In!</h3>
            <p className="text-muted-foreground mb-6">
              Your entry has been confirmed. Good luck!
            </p>
            <Button
              onClick={() => setShowConfirm(false)}
              className="w-full rounded-2xl h-12"
            >
              Got It!
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LuckyDraw;
