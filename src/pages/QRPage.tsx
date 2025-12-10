import { useEffect, useState } from "react";
import { User, MapPin, Hash, Copy, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
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
  const [copied, setCopied] = useState(false);

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

  const copyToClipboard = () => {
    if (household?.qr_code) {
      navigator.clipboard.writeText(household.qr_code);
      setCopied(true);
      toast({ title: "Copied to clipboard" });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-24 px-5 pt-8">
        <Skeleton className="h-8 w-48 mb-2 rounded-xl" />
        <Skeleton className="h-5 w-64 mb-8 rounded-xl" />
        <Skeleton className="h-32 w-full mb-6 rounded-2xl" />
        <Skeleton className="h-64 w-64 mx-auto" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-28 px-5 pt-8">
      {/* Header */}
      <div className="text-center mb-8 animate-fade-up">
        <h1 className="text-xl font-bold text-foreground">Collection QR</h1>
        <p className="text-sm text-muted-foreground">Show this to the collector</p>
      </div>

      {/* QR Code Card */}
      <div className="bg-card rounded-3xl p-6 border border-border/30 mb-6 animate-fade-up stagger-1">
        <div className="flex justify-center mb-6">
          <div className="bg-background p-4 rounded-2xl">
            <QRCode
              value={household?.qr_code || "RECYLO-DEMO"}
              size={180}
              level="H"
              style={{ height: "auto", maxWidth: "100%", width: "100%" }}
            />
          </div>
        </div>

        {/* Household ID */}
        <button
          onClick={copyToClipboard}
          className="w-full bg-muted rounded-xl p-3 flex items-center justify-between mb-4 hover:bg-muted/80 transition-colors"
        >
          <span className="font-mono text-sm text-foreground">{household?.qr_code}</span>
          {copied ? (
            <Check className="w-4 h-4 text-emerald-600" />
          ) : (
            <Copy className="w-4 h-4 text-muted-foreground" />
          )}
        </button>

        {/* User Info */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center">
              <User className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Name</p>
              <p className="text-sm font-medium text-foreground">{household?.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center">
              <MapPin className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Address</p>
              <p className="text-sm font-medium text-foreground">{household?.address}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Partner Logos */}
      <div className="flex items-center justify-center gap-8 mb-6 animate-fade-up stagger-2">
        <div className="text-center">
          <div className="w-12 h-12 bg-card rounded-xl flex items-center justify-center border border-border/30 mb-1">
            <span className="text-xs font-bold text-primary">SIH</span>
          </div>
        </div>
        <div className="text-center">
          <div className="w-12 h-12 bg-card rounded-xl flex items-center justify-center border border-border/30 mb-1">
            <span className="text-xs font-bold text-foreground">GOI</span>
          </div>
        </div>
        <div className="text-center">
          <div className="w-12 h-12 bg-card rounded-xl flex items-center justify-center border border-border/30 mb-1">
            <span className="text-xs font-bold text-foreground">SB</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <p className="text-center text-xs text-muted-foreground animate-fade-up stagger-3">
        Powered by Recylo · SIH 2025
      </p>
    </div>
  );
};

export default QRPage;
