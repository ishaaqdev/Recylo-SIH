import { useNavigate } from "react-router-dom";
import { LogOut, User, IdCard, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const DriverProfile = () => {
  const navigate = useNavigate();

  // Static driver data for demo
  const driver = {
    name: "Ramesh Kumar",
    id: "DRV-2024-0847",
    avatar: "RK"
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast({ title: "Logged out successfully" });
      navigate("/auth");
    } catch (error) {
      toast({ 
        title: "Logout failed", 
        variant: "destructive" 
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white pb-24">
      {/* Header */}
      <div className="bg-sky-500 px-6 pt-12 pb-16">
        <h1 className="text-xl font-semibold text-white">Profile</h1>
      </div>

      {/* Profile Card */}
      <div className="px-6 -mt-10">
        <div className="bg-white rounded-3xl p-6 shadow-xl">
          {/* Avatar */}
          <div className="flex flex-col items-center mb-6">
            <div className="w-24 h-24 bg-sky-100 rounded-full flex items-center justify-center mb-4 border-4 border-white shadow-lg">
              <span className="text-3xl font-bold text-sky-600">{driver.avatar}</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">{driver.name}</h2>
            <p className="text-gray-500">Truck Driver</p>
          </div>

          {/* Info Cards */}
          <div className="space-y-3">
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
              <div className="w-12 h-12 bg-sky-100 rounded-xl flex items-center justify-center">
                <User className="w-6 h-6 text-sky-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Full Name</p>
                <p className="font-semibold text-gray-900">{driver.name}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                <IdCard className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Driver ID</p>
                <p className="font-semibold text-gray-900 font-mono">{driver.id}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                <Truck className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Role</p>
                <p className="font-semibold text-gray-900">Waste Collection Driver</p>
              </div>
            </div>
          </div>
        </div>

        {/* Logout Button */}
        <Button
          onClick={handleLogout}
          variant="outline"
          className="w-full h-14 mt-6 rounded-2xl border-2 border-red-200 text-red-600 hover:bg-red-50 text-lg font-medium"
        >
          <LogOut className="w-5 h-5 mr-3" />
          Logout
        </Button>
      </div>
    </div>
  );
};

export default DriverProfile;