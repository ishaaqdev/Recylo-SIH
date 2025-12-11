import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import MunicipalSidebar from "@/components/municipal/MunicipalSidebar";

const MunicipalLayout = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/municipal/auth");
      } else {
        setUser(session.user);
        // Verify municipal user
        supabase
          .from("municipal_users")
          .select("*")
          .eq("user_id", session.user.id)
          .maybeSingle()
          .then(({ data }) => {
            if (!data) {
              supabase.auth.signOut();
              navigate("/municipal/auth");
            }
          });
      }
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/municipal/auth");
      } else {
        setUser(session.user);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <MunicipalSidebar />
      <main className="flex-1 p-6 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default MunicipalLayout;
