import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { PointsCard } from "@/components/home/PointsCard";
import { BinOverview } from "@/components/home/BinOverview";
import { EcoFactsCarousel } from "@/components/home/EcoFactsCarousel";
import { ComplaintCard } from "@/components/home/ComplaintCard";
import { NotificationSheet } from "@/components/home/NotificationSheet";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";

interface Household {
  id: string;
  name: string;
  points: number;
  level: number;
}

interface BinData {
  organic: number;
  recyclable: number;
  non_recyclable: number;
  hazardous: number;
}

interface EcoFact {
  id: string;
  text: string;
  icon: string;
  category: string;
}

const Home = () => {
  const [household, setHousehold] = useState<Household | null>(null);
  const [binData, setBinData] = useState<BinData | null>(null);
  const [ecoFacts, setEcoFacts] = useState<EcoFact[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get current user session
        const { data: { session } } = await supabase.auth.getSession();
        
        let householdData = null;
        
        if (session?.user?.id) {
          // Fetch household by user_id
          const { data } = await supabase
            .from("households")
            .select("*")
            .eq("user_id", session.user.id)
            .maybeSingle();
          householdData = data;
        }
        
        // Fallback to first household if no user_id match (for backward compatibility)
        if (!householdData) {
          const { data } = await supabase
            .from("households")
            .select("*")
            .limit(1)
            .maybeSingle();
          householdData = data;
        }

        if (householdData) {
          setHousehold(householdData);

          const { data: binsData } = await supabase
            .from("bins")
            .select("*")
            .eq("household_id", householdData.id)
            .maybeSingle();

          // Set bin data even if null - component will handle default
          setBinData(binsData || null);
        }

        const { data: factsData } = await supabase
          .from("ecofacts")
          .select("*");

        if (factsData) {
          setEcoFacts(factsData);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Real-time subscription for household updates and collection logs
  useEffect(() => {
    if (!household?.id) return;

    // Subscribe to household updates
    const householdChannel = supabase
      .channel('home-household-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'households',
          filter: `id=eq.${household.id}`
        },
        (payload: any) => {
          console.log('Household updated:', payload);
          const oldLevel = household.level;
          const newLevel = payload.new.level;
          const newPoints = payload.new.points;
          
          setHousehold(prev => prev ? { ...prev, ...payload.new } : null);
          
          // Show toast notification when points/level updated
          if (newLevel > oldLevel || newPoints > household.points) {
            toast({
              title: "Collection Complete!",
              description: `You earned 10 points and advanced from Level ${oldLevel} to Level ${newLevel}!`,
            });
          }
        }
      )
      .subscribe();

    // Subscribe to collection logs for immediate notification
    const collectionChannel = supabase
      .channel('home-collection-logs')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'collection_logs'
        },
        (payload: any) => {
          console.log('New collection logged:', payload);
          // Check if this collection is for the current household
          if (payload.new.household_id === household.id && payload.new.segregation_status === 'pass') {
            // Refetch household data to get updated points/level
            const refetchHousehold = async () => {
              const { data } = await supabase
                .from("households")
                .select("*")
                .eq("id", household.id)
                .maybeSingle();
              if (data) {
                const oldLevel = household.level;
                setHousehold(data);
                toast({
                  title: "Collection Complete!",
                  description: `You earned 10 points and advanced from Level ${oldLevel} to Level ${data.level}!`,
                });
              }
            };
            // Small delay to ensure DB update is complete
            setTimeout(refetchHousehold, 500);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(householdChannel);
      supabase.removeChannel(collectionChannel);
    };
  }, [household?.id, household?.level, household?.points]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-24 px-5 pt-6">
        <Skeleton className="h-8 w-48 mb-2 rounded-xl" />
        <Skeleton className="h-5 w-32 mb-6 rounded-xl" />
        <Skeleton className="h-48 w-full mb-6 rounded-3xl" />
        <Skeleton className="h-64 w-full mb-6 rounded-3xl" />
        <Skeleton className="h-32 w-full rounded-3xl" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 px-5 pt-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 animate-fade-up">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Hi, {household?.name?.split(" ")[0] || "there"}
          </h1>
          <p className="text-muted-foreground">Welcome to Recylo</p>
        </div>
        <button
          onClick={() => setShowNotifications(true)}
          className="w-10 h-10 bg-card rounded-xl flex items-center justify-center border border-border/30 soft-shadow"
        >
          <Bell className="w-5 h-5 text-foreground" />
        </button>
      </div>

      {/* Points & Level Card */}
      {household && (
        <div className="mb-6">
          <PointsCard points={household.points} level={household.level} />
        </div>
      )}

      {/* Bin Overview - Always show even with 0% filled */}
      <div className="mb-6">
        <BinOverview binData={binData} />
      </div>

      {/* Eco Facts Carousel */}
      {ecoFacts.length > 0 && (
        <div className="mb-6">
          <EcoFactsCarousel facts={ecoFacts} />
        </div>
      )}

      {/* Complaint Card */}
      {household && <ComplaintCard householdId={household.id} />}

      {/* Notifications Sheet */}
      <NotificationSheet 
        isOpen={showNotifications} 
        onClose={() => setShowNotifications(false)}
        householdId={household?.id}
      />
    </div>
  );
};

export default Home;
