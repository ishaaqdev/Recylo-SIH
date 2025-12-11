import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User, LogOut, Truck, Phone, IdCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface DriverData {
  name: string;
  phone: string | null;
  driver_id: string;
}

const DriverProfile = () => {
  const navigate = useNavigate();
  const [driver, setDriver] = useState<DriverData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDriverData();
  }, []);

  const fetchDriverData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/driver/auth");
      return;
    }

    const { data, error } = await supabase
      .from("drivers")
      .select("name, phone, driver_id")
      .eq("user_id", session.user.id)
      .maybeSingle();

    if (error) {
      toast({
        title: "Error loading profile",
        variant: "destructive"
      });
    } else if (data) {
      setDriver(data);
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({ title: "Logged out successfully" });
    navigate("/driver/auth");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white pb-24">
      {/* Header */}
      <div className="bg-white px-6 pt-12 pb-6 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
        <p className="text-gray-500">Driver Information</p>
      </div>

      {/* Profile Card */}
      <div className="px-6 pt-6">
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <div className="flex flex-col items-center mb-6">
            <div className="w-24 h-24 bg-sky-100 rounded-full flex items-center justify-center mb-4">
              <User className="w-12 h-12 text-sky-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">{driver?.name || "Driver"}</h2>
            <p className="text-gray-500">Waste Collection Driver</p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
              <div className="w-12 h-12 bg-sky-100 rounded-xl flex items-center justify-center">
                <IdCard className="w-6 h-6 text-sky-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Driver ID</p>
                <p className="text-lg font-semibold text-gray-900 font-mono">{driver?.driver_id}</p>
              </div>
            </div>

            {driver?.phone && (
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <Phone className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="text-lg font-semibold text-gray-900">{driver.phone}</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                <Truck className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Role</p>
                <p className="text-lg font-semibold text-gray-900">Waste Collection Driver</p>
              </div>
            </div>
          </div>
        </div>

        {/* Logout Button */}
        <Button
          onClick={handleLogout}
          variant="outline"
          className="w-full h-14 rounded-2xl border-2 border-red-200 text-red-600 hover:bg-red-50 mt-6 text-lg font-semibold"
        >
          <LogOut className="w-5 h-5 mr-3" />
          Logout
        </Button>
      </div>
    </div>
  );
};

export default DriverProfile;