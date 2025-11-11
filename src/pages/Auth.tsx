import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GraduationCap } from "lucide-react";
import { toast } from "sonner";
import logo from "@/assets/logo.png";
import { z } from "zod";

const signupSchema = z.object({
  firstName: z.string().trim().min(1, "Förnamn krävs").max(100, "Förnamn får vara max 100 tecken"),
  lastName: z.string().trim().min(1, "Efternamn krävs").max(100, "Efternamn får vara max 100 tecken"),
  email: z.string().trim().email("Ogiltig e-postadress").max(255, "E-post får vara max 255 tecken"),
  password: z.string().min(6, "Lösenord måste vara minst 6 tecken"),
});

const loginSchema = z.object({
  email: z.string().trim().email("Ogiltig e-postadress"),
  password: z.string().min(1, "Lösenord krävs"),
});

const Auth = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(false);

  // Signup form
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");

  // Login form
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        if (session) {
          navigate("/dashboard");
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        navigate("/dashboard");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const validated = signupSchema.parse({
        firstName,
        lastName,
        email: signupEmail,
        password: signupPassword,
      });

      const { error } = await supabase.auth.signUp({
        email: validated.email,
        password: validated.password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
          data: {
            first_name: validated.firstName,
            last_name: validated.lastName,
          },
        },
      });

      if (error) {
        if (error.message.includes("already registered")) {
          toast.error("E-postadressen är redan registrerad");
        } else {
          toast.error(error.message);
        }
        return;
      }

      toast.success("Konto skapat! Du kan nu logga in.");
      setFirstName("");
      setLastName("");
      setSignupEmail("");
      setSignupPassword("");
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        const firstError = error.errors[0];
        toast.error(firstError.message);
      } else {
        toast.error("Ett fel uppstod vid registrering");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const validated = loginSchema.parse({
        email: loginEmail,
        password: loginPassword,
      });

      const { error } = await supabase.auth.signInWithPassword({
        email: validated.email,
        password: validated.password,
      });

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          toast.error("Ogiltiga inloggningsuppgifter");
        } else {
          toast.error(error.message);
        }
        return;
      }

      toast.success("Välkommen tillbaka!");
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        const firstError = error.errors[0];
        toast.error(firstError.message);
      } else {
        toast.error("Ett fel uppstod vid inloggning");
      }
    } finally {
      setLoading(false);
    }
  };

  if (session) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10">
      <div className="w-full max-w-md p-8">
        <Card className="border-border shadow-lg">
          <CardHeader className="space-y-4 text-center">
            <div className="flex justify-center">
              <img src={logo} alt="PresencePoint" className="h-16 w-16 rounded-full object-cover" />
            </div>
            <div>
              <CardTitle className="text-3xl font-bold">PresencePoint</CardTitle>
              <CardDescription className="text-base mt-2">
                Skolnärvaro System
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Logga In</TabsTrigger>
                <TabsTrigger value="signup">Registrera</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">E-post</Label>
                    <Input
                      id="login-email"
                      type="email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="larare@skola.se"
                      required
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Lösenord</Label>
                    <Input
                      id="login-password"
                      type="password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      disabled={loading}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Loggar in..." : "Logga In"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">Förnamn</Label>
                      <Input
                        id="firstName"
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="Anna"
                        required
                        disabled={loading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Efternamn</Label>
                      <Input
                        id="lastName"
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Andersson"
                        required
                        disabled={loading}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">E-post</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      placeholder="larare@skola.se"
                      required
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Lösenord</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      placeholder="Minst 6 tecken"
                      required
                      disabled={loading}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Skapar konto..." : "Skapa Konto"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
