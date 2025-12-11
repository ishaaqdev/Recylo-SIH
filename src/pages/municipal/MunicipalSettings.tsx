import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { User, Mail, Phone, Briefcase, Save } from "lucide-react";

const MunicipalSettings = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    department: "",
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: municipalUser } = await supabase
      .from("municipal_users")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (municipalUser) {
      setProfile({
        name: municipalUser.name,
        email: municipalUser.email,
        phone: municipalUser.phone || "",
        department: municipalUser.department || "",
      });
    }
  };

  const handleSave = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const { error } = await supabase
      .from("municipal_users")
      .update({
        name: profile.name,
        phone: profile.phone,
        department: profile.department,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Saved", description: "Profile updated successfully" });
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground">Manage your account settings</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>Update your personal details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="name"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="email"
                value={profile.email}
                disabled
                className="pl-10 bg-slate-50"
              />
            </div>
            <p className="text-xs text-muted-foreground">Email cannot be changed</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="phone"
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="department">Department</Label>
            <div className="relative">
              <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="department"
                value={profile.department}
                onChange={(e) => setProfile({ ...profile, department: e.target.value })}
                className="pl-10"
              />
            </div>
          </div>

          <Button onClick={handleSave} disabled={loading} className="w-full">
            <Save className="w-4 h-4 mr-2" />
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>About</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p><strong>Recylo Municipal Dashboard</strong></p>
          <p>Smart Waste Management System</p>
          <p>Smart India Hackathon 2025</p>
          <div className="flex gap-4 pt-4">
            <img src="/placeholder.svg" alt="SIH Logo" className="h-10" />
            <img src="/placeholder.svg" alt="Odisha Govt Logo" className="h-10" />
            <img src="/placeholder.svg" alt="Swachh Bharat Logo" className="h-10" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MunicipalSettings;
