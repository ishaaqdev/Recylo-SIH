import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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
  X,
  Save,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";

interface Household {
  id: string;
  name: string;
  phone: string;
  address: string;
  level: number;
  points: number;
  total_waste_recycled: number;
}

const settingsItems = [
  { icon: Bell, label: "Notifications" },
  { icon: Shield, label: "Privacy Policy" },
  { icon: HelpCircle, label: "Help & Support" },
  { icon: Info, label: "About Recylo" },
];

const Profile = () => {
  const navigate = useNavigate();
  const [household, setHousehold] = useState<Household | null>(null);
  const [loading, setLoading] = useState(true);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", phone: "", address: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchHousehold();
  }, []);

  const fetchHousehold = async () => {
    try {
      const { data } = await supabase
        .from("households")
        .select("*")
        .limit(1)
        .maybeSingle();

      if (data) {
        setHousehold(data);
        setEditForm({
          name: data.name || "",
          phone: data.phone || "",
          address: data.address || "",
        });
      }
    } catch (error) {
      console.error("Error fetching household:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!household) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from("households")
        .update({
          name: editForm.name,
          phone: editForm.phone,
          address: editForm.address,
        })
        .eq("id", household.id);

      if (error) throw error;

      setHousehold({ ...household, ...editForm });
      setEditModalOpen(false);
      toast({
        title: "Profile updated",
        description: "Your changes have been saved.",
      });
    } catch (error) {
      toast({
        title: "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast({ title: "Logged out successfully" });
      navigate("/auth");
    } catch (error) {
      toast({
        title: "Failed to logout",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-20 px-5 pt-8">
        <Skeleton className="h-40 w-full mb-6 rounded-3xl" />
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-56 w-full rounded-3xl" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 px-5 pt-8">
      {/* Profile Card */}
      <div className="bg-primary rounded-3xl p-6 mb-6 animate-fade-up">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 bg-primary-foreground/20 rounded-2xl flex items-center justify-center">
            <User className="w-7 h-7 text-primary-foreground" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-primary-foreground">{household?.name}</h2>
            <p className="text-primary-foreground/70 text-sm">{household?.phone}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={() => setEditModalOpen(true)}
            variant="secondary"
            className="flex-1 rounded-xl bg-primary-foreground/20 hover:bg-primary-foreground/30 text-primary-foreground border-0"
          >
            <Edit2 className="w-4 h-4 mr-2" />
            Edit Profile
          </Button>
          <Link
            to="/qr"
            className="w-11 h-11 bg-primary-foreground/20 hover:bg-primary-foreground/30 rounded-xl flex items-center justify-center transition-colors"
          >
            <QrCode className="w-5 h-5 text-primary-foreground" />
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-card rounded-2xl p-4 text-center border border-border/50 animate-fade-up" style={{ animationDelay: '100ms' }}>
          <Star className="w-5 h-5 text-primary mx-auto mb-2" />
          <p className="text-xl font-semibold text-foreground">{household?.level}</p>
          <p className="text-xs text-muted-foreground">Level</p>
        </div>
        <div className="bg-card rounded-2xl p-4 text-center border border-border/50 animate-fade-up" style={{ animationDelay: '200ms' }}>
          <Target className="w-5 h-5 text-primary mx-auto mb-2" />
          <p className="text-xl font-semibold text-foreground">
            {household?.points?.toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground">Points</p>
        </div>
        <div className="bg-card rounded-2xl p-4 text-center border border-border/50 animate-fade-up" style={{ animationDelay: '300ms' }}>
          <Recycle className="w-5 h-5 text-primary mx-auto mb-2" />
          <p className="text-xl font-semibold text-foreground">
            {household?.total_waste_recycled}
          </p>
          <p className="text-xs text-muted-foreground">kg</p>
        </div>
      </div>

      {/* Settings List */}
      <div className="bg-card rounded-3xl border border-border/50 overflow-hidden animate-fade-up" style={{ animationDelay: '400ms' }}>
        {settingsItems.map((item) => (
          <button
            key={item.label}
            className="w-full flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors border-b border-border/30 last:border-b-0"
          >
            <item.icon className="w-5 h-5 text-primary" />
            <span className="flex-1 text-left font-medium text-foreground text-sm">
              {item.label}
            </span>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        ))}
        <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-4 p-4 hover:bg-destructive/5 transition-colors"
        >
          <LogOut className="w-5 h-5 text-destructive" />
          <span className="flex-1 text-left font-medium text-destructive text-sm">Logout</span>
          <ChevronRight className="w-4 h-4 text-destructive/50" />
        </button>
      </div>

      {/* Edit Profile Modal */}
      {editModalOpen && (
        <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-md rounded-3xl p-6 animate-scale-in">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-foreground">Edit Profile</h3>
              <button
                onClick={() => setEditModalOpen(false)}
                className="p-2 rounded-full hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Name</label>
                <Input
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="rounded-xl"
                  placeholder="Enter your name"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Phone</label>
                <Input
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="rounded-xl"
                  placeholder="Enter your phone"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Address</label>
                <Input
                  value={editForm.address}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  className="rounded-xl"
                  placeholder="Enter your address"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setEditModalOpen(false)}
                className="flex-1 rounded-xl"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveProfile}
                disabled={saving}
                className="flex-1 rounded-xl"
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
