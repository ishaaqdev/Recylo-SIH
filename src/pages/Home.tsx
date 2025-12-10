import { useEffect, useState } from "react";
import { PointsCard } from "@/components/home/PointsCard";
import { BinOverview } from "@/components/home/BinOverview";
import { EcoFactsCarousel } from "@/components/home/EcoFactsCarousel";
import { ComplaintCard } from "@/components/home/ComplaintCard";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

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

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch household
        const { data: householdData } = await supabase
          .from("households")
          .select("*")
          .limit(1)
          .maybeSingle();

        if (householdData) {
          setHousehold(householdData);

          // Fetch bins
          const { data: binsData } = await supabase
            .from("bins")
            .select("*")
            .eq("household_id", householdData.id)
            .maybeSingle();

          if (binsData) {
            setBinData(binsData);
          }
        }

        // Fetch eco facts
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
    <div className="min-h-screen bg-background pb-28 px-5 pt-8">
      {/* Header */}
      <div className="mb-6 animate-fade-up">
        <h1 className="text-2xl font-bold text-foreground">
          Hi, {household?.name?.split(" ")[0] || "there"} 👋
        </h1>
        <p className="text-muted-foreground">Welcome to Recylo</p>
      </div>

      {/* Points & Level Card */}
      {household && (
        <div className="mb-6">
          <PointsCard points={household.points} level={household.level} />
        </div>
      )}

      {/* Bin Overview */}
      {binData && (
        <div className="mb-6">
          <BinOverview binData={binData} />
        </div>
      )}

      {/* Eco Facts Carousel */}
      {ecoFacts.length > 0 && (
        <div className="mb-6">
          <EcoFactsCarousel facts={ecoFacts} />
        </div>
      )}

      {/* Complaint Card */}
      {household && <ComplaintCard householdId={household.id} />}
    </div>
  );
};

export default Home;
