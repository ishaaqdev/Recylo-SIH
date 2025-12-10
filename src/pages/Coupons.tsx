import { useEffect, useState } from "react";
import { ArrowLeft, Ticket, Calendar, ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

interface Coupon {
  id: string;
  title: string;
  discount: string;
  expiry_date: string;
  status: string;
}

interface StoreCoupon {
  id: string;
  store: string;
  discount: string;
  cost: number;
  description: string;
}

const storeCoupons: StoreCoupon[] = [
  { id: "amazon", store: "Amazon", discount: "50% Off", cost: 500, description: "Up to ₹500 off on electronics" },
  { id: "swiggy", store: "Swiggy", discount: "40% Off", cost: 300, description: "On orders above ₹199" },
  { id: "zomato", store: "Zomato", discount: "₹150 Off", cost: 250, description: "On orders above ₹299" },
  { id: "flipkart", store: "Flipkart", discount: "30% Off", cost: 400, description: "On fashion & lifestyle" },
  { id: "myntra", store: "Myntra", discount: "₹500 Off", cost: 450, description: "On orders above ₹1499" },
  { id: "uber", store: "Uber", discount: "₹100 Off", cost: 200, description: "On your next 3 rides" },
];

const Coupons = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [userPoints, setUserPoints] = useState(0);
  const [householdId, setHouseholdId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"available" | "my">("available");

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      const { data: household } = await supabase
        .from("households")
        .select("id, points")
        .limit(1)
        .maybeSingle();

      if (household) {
        setUserPoints(household.points);
        setHouseholdId(household.id);

        const { data } = await supabase
          .from("coupons")
          .select("*")
          .eq("household_id", household.id)
          .order("status", { ascending: true });

        if (data) {
          setCoupons(data);
        }
      }
    } catch (error) {
      console.error("Error fetching coupons:", error);
    } finally {
      setLoading(false);
    }
  };

  const buyCoupon = async (storeCoupon: StoreCoupon) => {
    if (storeCoupon.cost > userPoints) {
      toast({
        title: "Not enough points",
        description: `You need ${storeCoupon.cost} points but have ${userPoints}`,
        variant: "destructive",
      });
      return;
    }

    try {
      if (householdId) {
        await supabase
          .from("households")
          .update({ points: userPoints - storeCoupon.cost })
          .eq("id", householdId);

        await supabase.from("coupons").insert({
          household_id: householdId,
          title: `${storeCoupon.store} - ${storeCoupon.discount}`,
          discount: storeCoupon.discount,
          expiry_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        });

        setUserPoints((prev) => prev - storeCoupon.cost);
        fetchCoupons();

        toast({
          title: "Coupon purchased",
          description: `${storeCoupon.store} coupon added to your collection`,
        });
      }
    } catch (error) {
      toast({
        title: "Failed to purchase coupon",
        variant: "destructive",
      });
    }
  };

  const useCoupon = async (couponId: string) => {
    try {
      await supabase
        .from("coupons")
        .update({ status: "used" })
        .eq("id", couponId);

      toast({
        title: "Coupon applied",
        description: "Your discount has been applied.",
      });

      fetchCoupons();
    } catch (error) {
      toast({
        title: "Error using coupon",
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-24 px-5 pt-8">
        <Skeleton className="h-8 w-40 mb-2 rounded-xl" />
        <Skeleton className="h-5 w-56 mb-8 rounded-xl" />
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-full mb-4 rounded-2xl" />
        ))}
      </div>
    );
  }

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
          <h1 className="text-xl font-bold text-foreground">Coupons</h1>
          <p className="text-sm text-muted-foreground">Redeem & save</p>
        </div>
      </div>

      {/* Points Balance */}
      <div className="bg-card rounded-2xl p-4 mb-6 border border-border/30 animate-fade-up">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Your Points</span>
          <span className="text-xl font-bold text-foreground">{userPoints.toLocaleString()}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-muted rounded-xl p-1 mb-6 animate-fade-up">
        <button
          onClick={() => setActiveTab("available")}
          className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-colors ${
            activeTab === "available"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground"
          }`}
        >
          Available
        </button>
        <button
          onClick={() => setActiveTab("my")}
          className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-colors ${
            activeTab === "my"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground"
          }`}
        >
          My Coupons
        </button>
      </div>

      {activeTab === "available" ? (
        <div className="space-y-3">
          {storeCoupons.map((coupon, index) => (
            <div
              key={coupon.id}
              className={`bg-card rounded-2xl p-4 border border-border/30 animate-fade-up stagger-${(index % 5) + 1}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                    <ShoppingBag className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">{coupon.store}</h4>
                    <p className="text-xs text-muted-foreground">{coupon.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-primary">{coupon.discount}</p>
                  <p className="text-xs text-muted-foreground">{coupon.cost} pts</p>
                </div>
              </div>
              <Button
                onClick={() => buyCoupon(coupon)}
                variant="outline"
                className="w-full mt-3 rounded-xl"
              >
                Redeem
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <>
          {coupons.length === 0 ? (
            <div className="text-center py-16 animate-fade-up">
              <Ticket className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
              <h3 className="font-semibold text-foreground mb-2">No Coupons Yet</h3>
              <p className="text-sm text-muted-foreground">
                Redeem points to get coupons
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {coupons.map((coupon, index) => (
                <div
                  key={coupon.id}
                  className={`bg-card rounded-2xl p-4 border border-border/30 animate-fade-up stagger-${(index % 5) + 1} ${
                    coupon.status === "used" ? "opacity-60" : ""
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                        <Ticket className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground">{coupon.title}</h4>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          <span>Expires: {formatDate(coupon.expiry_date)}</span>
                        </div>
                      </div>
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-medium ${
                        coupon.status === "unused"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {coupon.status === "unused" ? "Active" : "Used"}
                    </span>
                  </div>
                  {coupon.status === "unused" && (
                    <Button
                      onClick={() => useCoupon(coupon.id)}
                      className="w-full rounded-xl"
                    >
                      Use Coupon
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Coupons;
