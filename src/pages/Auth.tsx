import { Auth as SupabaseAuth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Session } from "@supabase/supabase-js";
import { GraduationCap } from "lucide-react";

const Auth = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        navigate("/dashboard");
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        navigate("/dashboard");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10">
      <div className="w-full max-w-md p-8">
        <div className="bg-card rounded-lg shadow-lg p-8 border border-border">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mb-4">
              <GraduationCap className="w-10 h-10 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">Närvaro</h1>
            <p className="text-muted-foreground mt-2">Skolnärvaro System</p>
          </div>
          
          <SupabaseAuth
            supabaseClient={supabase}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: "hsl(210 90% 48%)",
                    brandAccent: "hsl(210 90% 40%)",
                  },
                },
              },
            }}
            providers={[]}
            redirectTo={`${window.location.origin}/dashboard`}
          />
        </div>
      </div>
    </div>
  );
};

export default Auth;
