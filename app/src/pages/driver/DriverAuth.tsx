import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Truck, Mail, Lock, User, Phone, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const DriverAuth = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    phone: "",
    driverId: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password
        });

        if (error) throw error;
        toast({ title: "Welcome back, Driver!" });
        navigate("/driver");
      } else {
        if (!formData.driverId.trim()) {
          throw new Error("Driver ID is required");
        }

        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            emailRedirectTo: `${window.location.origin}/driver`
          }
        });

        if (authError) throw authError;

        if (authData.user) {
          const { error: profileError } = await supabase
            .from("drivers")
            .insert({
              user_id: authData.user.id,
              name: formData.name,
              phone: formData.phone,
              driver_id: formData.driverId
            });

          if (profileError) throw profileError;
        }

        toast({ title: "Account created!", description: "Welcome to Recylo Driver App" });
        navigate("/driver");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        {/* Logo */}
        <div className="w-20 h-20 bg-sky-500 rounded-3xl flex items-center justify-center mb-6 shadow-xl shadow-sky-200">
          <Truck className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Recylo Driver</h1>
        <p className="text-gray-500 mb-8">Waste Collection Portal</p>

        {/* Toggle */}
        <div className="flex bg-gray-100 rounded-2xl p-1 mb-8 w-full max-w-sm">
          <button
            onClick={() => setIsLogin(true)}
            className={`flex-1 py-3 rounded-xl font-medium transition-all ${
              isLogin ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => setIsLogin(false)}
            className={`flex-1 py-3 rounded-xl font-medium transition-all ${
              !isLogin ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
          {!isLogin && (
            <>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Full Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="pl-12 h-14 rounded-xl border-gray-200"
                  required
                />
              </div>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="tel"
                  placeholder="Phone Number"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="pl-12 h-14 rounded-xl border-gray-200"
                />
              </div>
              <div className="relative">
                <Truck className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Driver ID (e.g., DRV001)"
                  value={formData.driverId}
                  onChange={(e) => setFormData({ ...formData, driverId: e.target.value.toUpperCase() })}
                  className="pl-12 h-14 rounded-xl border-gray-200"
                  required
                />
              </div>
            </>
          )}

          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="pl-12 h-14 rounded-xl border-gray-200"
              required
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="pl-12 pr-12 h-14 rounded-xl border-gray-200"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-14 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-lg font-semibold shadow-lg shadow-sky-200"
          >
            {loading ? "Please wait..." : isLogin ? "Sign In" : "Create Account"}
          </Button>
        </form>
      </div>

      <div className="text-center pb-8 text-sm text-gray-400">
        Powered by Recylo · Smart India Hackathon 2025
      </div>
    </div>
  );
};

export default DriverAuth;