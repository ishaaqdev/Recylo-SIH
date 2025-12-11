import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Phone, MapPin, User, Lock, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Auth = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
    phone: "",
    address: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (error) throw error;

        toast({ title: "Login successful" });
        navigate("/");
      } else {
        // Validation
        if (formData.password !== formData.confirmPassword) {
          toast({
            title: "Passwords do not match",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        if (formData.password.length < 6) {
          toast({
            title: "Password must be at least 6 characters",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        const redirectUrl = `${window.location.origin}/`;

        const { error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            emailRedirectTo: redirectUrl,
            data: {
              name: formData.name,
              phone: formData.phone,
              address: formData.address,
            },
          },
        });

        if (error) throw error;

        // Create household entry
        await supabase.from("households").insert({
          name: formData.name,
          phone: formData.phone,
          address: formData.address,
          qr_code: `RECYLO-${Date.now().toString(36).toUpperCase()}`,
        });

        toast({
          title: "Account created",
          description: "You can now sign in.",
        });
        setIsLogin(true);
      }
    } catch (error: any) {
      toast({
        title: error.message || "An error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center px-6 py-12">
      {/* Logo & Title */}
      <div className="text-center mb-8 animate-fade-up">
        <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl font-bold text-primary-foreground">R</span>
        </div>
        <h1 className="text-2xl font-bold text-foreground">Recylo</h1>
        <p className="text-muted-foreground mt-1">Smart Waste Management</p>
      </div>

      {/* Tabs */}
      <div className="flex bg-muted rounded-xl p-1 mb-6 animate-fade-up">
        <button
          onClick={() => setIsLogin(true)}
          className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-colors ${
            isLogin ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
          }`}
        >
          Sign In
        </button>
        <button
          onClick={() => setIsLogin(false)}
          className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-colors ${
            !isLogin ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
          }`}
        >
          Sign Up
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4 animate-fade-up stagger-1">
        {!isLogin && (
          <>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                name="name"
                placeholder="Full Name"
                value={formData.name}
                onChange={handleChange}
                className="pl-11 h-12 rounded-xl"
                required={!isLogin}
              />
            </div>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                name="phone"
                placeholder="Phone Number"
                value={formData.phone}
                onChange={handleChange}
                className="pl-11 h-12 rounded-xl"
                required={!isLogin}
              />
            </div>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                name="address"
                placeholder="Address"
                value={formData.address}
                onChange={handleChange}
                className="pl-11 h-12 rounded-xl"
                required={!isLogin}
              />
            </div>
          </>
        )}

        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            name="email"
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            className="pl-11 h-12 rounded-xl"
            required
          />
        </div>

        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            name="password"
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            className="pl-11 pr-11 h-12 rounded-xl"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2"
          >
            {showPassword ? (
              <EyeOff className="w-5 h-5 text-muted-foreground" />
            ) : (
              <Eye className="w-5 h-5 text-muted-foreground" />
            )}
          </button>
        </div>

        {!isLogin && (
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              name="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm Password"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="pl-11 pr-11 h-12 rounded-xl"
              required={!isLogin}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              {showConfirmPassword ? (
                <EyeOff className="w-5 h-5 text-muted-foreground" />
              ) : (
                <Eye className="w-5 h-5 text-muted-foreground" />
              )}
            </button>
          </div>
        )}

        <Button
          type="submit"
          className="w-full h-12 rounded-xl text-base font-medium"
          disabled={loading}
        >
          {loading ? "Please wait..." : isLogin ? "Sign In" : "Create Account"}
        </Button>
      </form>

      {/* Footer */}
      <p className="text-center text-xs text-muted-foreground mt-8 animate-fade-up stagger-2">
        By continuing, you agree to our Terms of Service and Privacy Policy
      </p>
    </div>
  );
};

export default Auth;
