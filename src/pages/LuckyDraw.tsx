import { useState, useEffect } from "react";
import { ArrowLeft, Ticket, Plus, Minus, Check } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Draw {
  id: string;
  title: string;
  prize: string;
  ticketCost: number;
  endDate: string;
  totalTickets: number;
  userTickets: number;
}

const draws: Draw[] = [
  {
    id: "1",
    title: "iPhone 15 Pro",
    prize: "Brand new iPhone 15 Pro 256GB",
    ticketCost: 500,
    endDate: "2025-01-15",
    totalTickets: 2547,
    userTickets: 0,
  },
  {
    id: "2",
    title: "Electric Car",
    prize: "Tesla Model 3 Standard Range",
    ticketCost: 2000,
    endDate: "2025-02-01",
    totalTickets: 892,
    userTickets: 0,
  },
  {
    id: "3",
    title: "Bali Trip",
    prize: "7 Days All-Inclusive Bali Vacation",
    ticketCost: 300,
    endDate: "2025-01-20",
    totalTickets: 3421,
    userTickets: 0,
  },
  {
    id: "4",
    title: "AirPods Pro",
    prize: "Apple AirPods Pro 2nd Gen",
    ticketCost: 100,
    endDate: "2025-01-10",
    totalTickets: 5678,
    userTickets: 0,
  },
  {
    id: "5",
    title: "Gaming Console",
    prize: "PlayStation 5 with 2 Controllers",
    ticketCost: 200,
    endDate: "2025-01-25",
    totalTickets: 1892,
    userTickets: 0,
  },
];

const LuckyDraw = () => {
  const [userDraws, setUserDraws] = useState<Draw[]>(draws);
  const [ticketCounts, setTicketCounts] = useState<Record<string, number>>({});
  const [userPoints, setUserPoints] = useState(0);
  const [householdId, setHouseholdId] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState<string | null>(null);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    const { data: household } = await supabase
      .from("households")
      .select("id, points")
      .limit(1)
      .maybeSingle();

    if (household) {
      setUserPoints(household.points);
      setHouseholdId(household.id);
    }
  };

  const updateTicketCount = (drawId: string, delta: number) => {
    setTicketCounts((prev) => ({
      ...prev,
      [drawId]: Math.max(0, (prev[drawId] || 0) + delta),
    }));
  };

  const buyTickets = async (draw: Draw) => {
    const count = ticketCounts[draw.id] || 0;
    if (count === 0) return;

    const totalCost = count * draw.ticketCost;
    if (totalCost > userPoints) {
      toast({
        title: "Not enough points",
        description: `You need ${totalCost} points but have ${userPoints}`,
        variant: "destructive",
      });
      return;
    }

    try {
      if (householdId) {
        await supabase
          .from("households")
          .update({ points: userPoints - totalCost })
          .eq("id", householdId);
      }

      setUserPoints((prev) => prev - totalCost);
      setUserDraws((prev) =>
        prev.map((d) =>
          d.id === draw.id
            ? { ...d, userTickets: d.userTickets + count, totalTickets: d.totalTickets + count }
            : d
        )
      );
      setTicketCounts((prev) => ({ ...prev, [draw.id]: 0 }));
      setShowConfirm(draw.id);

      toast({
        title: "Tickets purchased",
        description: `You bought ${count} ticket${count > 1 ? "s" : ""} for ${draw.title}`,
      });
    } catch (error) {
      toast({
        title: "Failed to purchase tickets",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getTimeRemaining = (endDate: string) => {
    const diff = new Date(endDate).getTime() - Date.now();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    return `${days} days left`;
  };

  return (
    <div className="min-h-screen bg-background pb-28 px-5 pt-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6 animate-fade-up">
        <Link
          to="/rewards"
          className="w-10 h-10 bg-card rounded-xl flex items-center justify-center border border-border/30"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-foreground">Lucky Draws</h1>
          <p className="text-sm text-muted-foreground">Win amazing prizes</p>
        </div>
      </div>

      {/* Points Balance */}
      <div className="bg-card rounded-2xl p-4 mb-6 border border-border/30 animate-fade-up">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Your Points</span>
          <span className="text-xl font-bold text-foreground">{userPoints.toLocaleString()}</span>
        </div>
      </div>

      {/* Draws List */}
      <div className="space-y-4">
        {userDraws.map((draw, index) => (
          <div
            key={draw.id}
            className={`bg-card rounded-2xl p-5 border border-border/30 animate-fade-up stagger-${(index % 5) + 1}`}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-foreground">{draw.title}</h3>
                <p className="text-sm text-muted-foreground">{draw.prize}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">{getTimeRemaining(draw.endDate)}</p>
                <p className="text-xs text-muted-foreground">Ends {formatDate(draw.endDate)}</p>
              </div>
            </div>

            <div className="flex items-center justify-between mb-4 text-sm">
              <span className="text-muted-foreground">
                {draw.totalTickets.toLocaleString()} entries
              </span>
              <span className="text-primary font-medium">
                {draw.ticketCost} pts/ticket
              </span>
            </div>

            {draw.userTickets > 0 && (
              <div className="bg-primary/10 text-primary text-sm font-medium px-3 py-2 rounded-xl mb-4 flex items-center gap-2">
                <Check className="w-4 h-4" />
                You have {draw.userTickets} ticket{draw.userTickets > 1 ? "s" : ""}
              </div>
            )}

            <div className="flex items-center gap-3">
              <div className="flex items-center bg-muted rounded-xl">
                <button
                  onClick={() => updateTicketCount(draw.id, -1)}
                  className="p-3 hover:bg-muted/80 rounded-l-xl transition-colors"
                >
                  <Minus className="w-4 h-4 text-foreground" />
                </button>
                <span className="w-12 text-center font-medium text-foreground">
                  {ticketCounts[draw.id] || 0}
                </span>
                <button
                  onClick={() => updateTicketCount(draw.id, 1)}
                  className="p-3 hover:bg-muted/80 rounded-r-xl transition-colors"
                >
                  <Plus className="w-4 h-4 text-foreground" />
                </button>
              </div>
              <Button
                onClick={() => buyTickets(draw)}
                disabled={(ticketCounts[draw.id] || 0) === 0}
                className="flex-1 rounded-xl"
              >
                <Ticket className="w-4 h-4 mr-2" />
                Buy Tickets
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-card w-full max-w-sm rounded-3xl p-8 animate-scale-in text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">You're In</h3>
            <p className="text-muted-foreground mb-6">
              Good luck! Winners will be announced when the draw ends.
            </p>
            <Button
              onClick={() => setShowConfirm(null)}
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

export default LuckyDraw;
