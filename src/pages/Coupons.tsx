import { useEffect, useState } from "react";
import { Ticket, Calendar, Check } from "lucide-react";
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

const Coupons = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      const { data: household } = await supabase
        .from("households")
        .select("id")
        .limit(1)
        .maybeSingle();

      if (household) {
        const { data } = await supabase
          .from("coupons")
          .select("*")
          .eq("household_id", household.id)
          .order("created_at", { ascending: false });

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

  const useCoupon = async (couponId: string) => {
    try {
      await supabase
        .from("coupons")
        .update({ status: "used" })
        .eq("id", couponId);

      toast({
        title: "Coupon Applied!",
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
          <Skeleton key={i} className="h-32 w-full mb-4 rounded-3xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-28 px-5 pt-8">
      <div className="mb-8 animate-fade-up">
        <h1 className="text-2xl font-bold text-foreground">My Coupons</h1>
        <p className="text-muted-foreground">Your claimed rewards & discounts</p>
      </div>

      {coupons.length === 0 ? (
        <div className="text-center py-16 animate-fade-up">
          <Ticket className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            No Coupons Yet
          </h3>
          <p className="text-muted-foreground text-sm">
            Spin the wheel or complete tasks to earn coupons!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {coupons.map((coupon, index) => (
            <div
              key={coupon.id}
              className={`bg-card rounded-3xl p-5 premium-shadow animate-fade-up stagger-${
                (index % 5) + 1
              } ${coupon.status === "used" ? "opacity-60" : ""}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={`text-2xl font-bold ${
                        coupon.status === "used"
                          ? "text-muted-foreground"
                          : "text-primary"
                      }`}
                    >
                      {coupon.discount}
                    </span>
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
                  <h4 className="font-semibold text-foreground mb-1">
                    {coupon.title}
                  </h4>
                  {coupon.expiry_date && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      <span>Expires: {formatDate(coupon.expiry_date)}</span>
                    </div>
                  )}
                </div>
                <div className="w-12 h-12 bg-secondary rounded-xl flex items-center justify-center">
                  <Ticket className="w-6 h-6 text-primary" />
                </div>
              </div>
              {coupon.status === "unused" && (
                <Button
                  onClick={() => useCoupon(coupon.id)}
                  className="w-full mt-4 rounded-xl"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Use Coupon
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Coupons;
