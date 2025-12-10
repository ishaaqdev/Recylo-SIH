import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  User,
  QrCode,
  Star,
  Target,
  Recycle,
  Edit2,
  Bell,
  Shield,
  HelpCircle,
  Info,
  LogOut,
  ChevronRight,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

interface Household {
  id: string;
  name: string;
  phone: string;
  level: number;
  points: number;
  total_waste_recycled: number;
}

const settingsItems = [
  { icon: Edit2, label: "Edit Profile", color: "text-primary" },
  { icon: Bell, label: "Notifications", color: "text-amber-500" },
  { icon: Shield, label: "Privacy Policy", color: "text-emerald-500" },
  { icon: HelpCircle, label: "Help & Support", color: "text-sky-500" },
  { icon: Info, label: "About Recylo", color: "text-violet-500" },
];

const Profile = () => {
  const [household, setHousehold] = useState<Household | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHousehold = async () => {
      try {
        const { data } = await supabase
          .from("households")
          .select("*")
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
        <Skeleton className="h-48 w-full mb-6 rounded-3xl" />
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-64 w-full rounded-3xl" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-28 px-5 pt-8">
      {/* Profile Card */}
      <div className="bg-card rounded-3xl p-6 premium-shadow mb-6 animate-fade-up">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 recylo-gradient rounded-2xl flex items-center justify-center">
              <User className="w-8 h-8 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">{household?.name}</h2>
              <p className="text-muted-foreground text-sm">{household?.phone}</p>
              <p className="text-xs text-muted-foreground font-mono mt-1">
                ID: {household?.id.slice(0, 8)}
              </p>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <button className="flex-1 bg-secondary hover:bg-secondary/80 text-secondary-foreground font-semibold py-3 px-4 rounded-2xl transition-colors text-sm">
            Edit Profile
          </button>
          <Link
            to="/qr"
            className="w-12 h-12 bg-secondary hover:bg-secondary/80 rounded-2xl flex items-center justify-center transition-colors"
          >
            <QrCode className="w-5 h-5 text-primary" />
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-amber-50 rounded-2xl p-4 text-center animate-fade-up stagger-1">
          <Star className="w-6 h-6 text-amber-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-foreground">{household?.level}</p>
          <p className="text-xs text-muted-foreground">Level</p>
        </div>
        <div className="bg-sky-50 rounded-2xl p-4 text-center animate-fade-up stagger-2">
          <Target className="w-6 h-6 text-sky-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-foreground">
            {household?.points?.toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground">Points</p>
        </div>
        <div className="bg-emerald-50 rounded-2xl p-4 text-center animate-fade-up stagger-3">
          <Recycle className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-foreground">
            {household?.total_waste_recycled}
          </p>
          <p className="text-xs text-muted-foreground">kg Recycled</p>
        </div>
      </div>

      {/* Settings List */}
      <div className="bg-card rounded-3xl premium-shadow overflow-hidden animate-fade-up stagger-4">
        {settingsItems.map((item, index) => (
          <button
            key={item.label}
            className="w-full flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors"
          >
            <div className="w-10 h-10 bg-secondary rounded-xl flex items-center justify-center">
              <item.icon className={`w-5 h-5 ${item.color}`} />
            </div>
            <span className="flex-1 text-left font-medium text-foreground">
              {item.label}
            </span>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>
        ))}
        <button className="w-full flex items-center gap-4 p-4 hover:bg-red-50 transition-colors">
          <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
            <LogOut className="w-5 h-5 text-destructive" />
          </div>
          <span className="flex-1 text-left font-medium text-destructive">Logout</span>
          <ChevronRight className="w-5 h-5 text-destructive/50" />
        </button>
      </div>
    </div>
  );
};

export default Profile;
