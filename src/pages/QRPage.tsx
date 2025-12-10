import { useEffect, useState } from "react";
import { User, MapPin, Hash } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import QRCode from "react-qr-code";

interface Household {
  id: string;
  name: string;
  address: string;
  qr_code: string;
}

const QRPage = () => {
  const [household, setHousehold] = useState<Household | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHousehold = async () => {
      try {
        const { data } = await supabase
          .from("households")
          .select("id, name, address, qr_code")
          .limit(1)
          .maybeSingle();

        if (data) {
          setHousehold(data);
        }
      } catch (error) {
        console.error("Error fetching household:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHousehold();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-24 px-5 pt-8">
        <Skeleton className="h-8 w-48 mb-2 rounded-xl" />
        <Skeleton className="h-5 w-64 mb-8 rounded-xl" />
        <Skeleton className="h-32 w-full mb-6 rounded-3xl" />
        <Skeleton className="h-64 w-64 mx-auto rounded-none" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-28 px-5 pt-8">
      <div className="text-center mb-8 animate-fade-up">
        <h1 className="text-2xl font-bold text-foreground">Recylo Collection QR</h1>
        <p className="text-muted-foreground">Show this to the trash collector</p>
      </div>

      {/* User Info Card */}
      <div className="bg-card rounded-3xl p-5 premium-shadow mb-8 animate-fade-up stagger-1">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-secondary rounded-xl flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Name</p>
              <p className="font-semibold text-foreground">{household?.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-secondary rounded-xl flex items-center justify-center">
              <Hash className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Household ID</p>
              <p className="font-mono text-sm text-foreground">{household?.qr_code}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-secondary rounded-xl flex items-center justify-center">
              <MapPin className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Address</p>
              <p className="text-sm text-foreground">{household?.address}</p>
            </div>
          </div>
        </div>
      </div>

      {/* QR Code - Sharp, no rounded corners */}
      <div className="flex justify-center mb-8 animate-fade-up stagger-2">
        <div className="bg-card p-6 premium-shadow">
          <QRCode
            value={household?.qr_code || "RECYLO-DEMO"}
            size={200}
            level="H"
            style={{ height: "auto", maxWidth: "100%", width: "100%" }}
          />
        </div>
      </div>

      {/* Logos Row */}
      <div className="flex items-center justify-center gap-6 mb-8 animate-fade-up stagger-3">
        <div className="text-center">
          <div className="w-12 h-12 bg-secondary rounded-xl flex items-center justify-center mb-1">
            <span className="text-lg font-bold text-primary">SIH</span>
          </div>
          <p className="text-[10px] text-muted-foreground">SIH 2025</p>
        </div>
        <div className="text-center">
          <div className="w-12 h-12 bg-secondary rounded-xl flex items-center justify-center mb-1">
            <span className="text-lg">🇮🇳</span>
          </div>
          <p className="text-[10px] text-muted-foreground">Govt. of Odisha</p>
        </div>
        <div className="text-center">
          <div className="w-12 h-12 bg-secondary rounded-xl flex items-center justify-center mb-1">
            <span className="text-lg">🧹</span>
          </div>
          <p className="text-[10px] text-muted-foreground">Swachh Bharat</p>
        </div>
      </div>

      {/* Footer */}
      <p className="text-center text-xs text-muted-foreground animate-fade-up stagger-4">
        Powered by Recylo · Smart India Hackathon 2025
      </p>
    </div>
  );
};

export default QRPage;
