import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Session, User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GraduationCap, LogOut, Users, BookOpen, Calendar, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import StudentsView from "@/components/dashboard/StudentsView";
import ClassesView from "@/components/dashboard/ClassesView";
import AttendanceView from "@/components/dashboard/AttendanceView";

const Dashboard = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [studentCount, setStudentCount] = useState(0);
  const [classCount, setClassCount] = useState(0);
  const [attendanceRate, setAttendanceRate] = useState(0);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (!session) {
        navigate("/auth");
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    const fetchStats = async () => {
      const { count: students } = await supabase
        .from("students")
        .select("*", { count: "exact", head: true });
      
      const { count: classes } = await supabase
        .from("classes")
        .select("*", { count: "exact", head: true });

      // Get today's attendance rate
      const today = new Date().toISOString().split("T")[0];
      const { data: todayRecords } = await supabase
        .from("attendance_records")
        .select("status")
        .gte("timestamp", `${today}T00:00:00`)
        .lte("timestamp", `${today}T23:59:59`);

      const presentToday = todayRecords?.filter((r) => r.status === "present").length || 0;
      const attendanceRate = students ? (presentToday / students) * 100 : 0;

      setStudentCount(students || 0);
      setClassCount(classes || 0);
      setAttendanceRate(attendanceRate);
    };

    if (user) {
      fetchStats();
    }
  }, [user]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Utloggad");
    navigate("/auth");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <GraduationCap className="w-16 h-16 text-primary mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Laddar...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Närvaro System</h1>
              <p className="text-sm text-muted-foreground">Skolnärvaro Dashboard</p>
            </div>
          </div>
          <Button onClick={handleSignOut} variant="outline" size="sm">
            <LogOut className="w-4 h-4 mr-2" />
            Logga ut
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Totalt Elever</CardTitle>
              <Users className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{studentCount}</div>
              <p className="text-xs text-muted-foreground mt-1">Registrerade elever</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Klasser</CardTitle>
              <BookOpen className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{classCount}</div>
              <p className="text-xs text-muted-foreground mt-1">Aktiva klasser</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Närvaro Idag</CardTitle>
              <CheckCircle2 className="w-4 h-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">{attendanceRate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground mt-1">Genomsnittlig närvaro</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="students" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="students">
              <Users className="w-4 h-4 mr-2" />
              Elever
            </TabsTrigger>
            <TabsTrigger value="classes">
              <BookOpen className="w-4 h-4 mr-2" />
              Klasser
            </TabsTrigger>
            <TabsTrigger value="attendance">
              <Calendar className="w-4 h-4 mr-2" />
              Närvaro
            </TabsTrigger>
          </TabsList>

          <TabsContent value="students">
            <StudentsView />
          </TabsContent>

          <TabsContent value="classes">
            <ClassesView />
          </TabsContent>

          <TabsContent value="attendance">
            <AttendanceView />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Dashboard;
