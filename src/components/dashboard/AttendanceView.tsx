import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { ScanLine, TrendingUp, Users, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";

interface AttendanceStats {
  totalStudents: number;
  presentToday: number;
  absentToday: number;
  attendanceRate: number;
  weeklyRate: number;
}

const AttendanceView = () => {
  const [stats, setStats] = useState<AttendanceStats>({
    totalStudents: 0,
    presentToday: 0,
    absentToday: 0,
    attendanceRate: 0,
    weeklyRate: 0,
  });
  const [scannerActive, setScannerActive] = useState(false);
  const [cardBuffer, setCardBuffer] = useState("");
  const [lastKeyTime, setLastKeyTime] = useState(0);

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    if (!scannerActive) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      const currentTime = Date.now();
      
      // If more than 100ms since last key, reset buffer (new card scan)
      if (currentTime - lastKeyTime > 100) {
        setCardBuffer("");
      }
      
      setLastKeyTime(currentTime);

      if (e.key === "Enter") {
        // Card scan complete
        if (cardBuffer.length > 0) {
          handleCardScan(cardBuffer);
          setCardBuffer("");
        }
      } else if (e.key.length === 1) {
        // Build up card ID
        setCardBuffer((prev) => prev + e.key);
      }
    };

    window.addEventListener("keypress", handleKeyPress);
    return () => window.removeEventListener("keypress", handleKeyPress);
  }, [scannerActive, cardBuffer, lastKeyTime]);

  const fetchStats = async () => {
    try {
      // Get total students
      const { count: totalStudents } = await supabase
        .from("students")
        .select("*", { count: "exact", head: true });

      // Get today's attendance
      const today = new Date().toISOString().split("T")[0];
      const { data: todayRecords } = await supabase
        .from("attendance_records")
        .select("status")
        .gte("timestamp", `${today}T00:00:00`)
        .lte("timestamp", `${today}T23:59:59`);

      const presentToday = todayRecords?.filter((r) => r.status === "present").length || 0;
      const absentToday = todayRecords?.filter((r) => r.status === "absent").length || 0;
      const attendanceRate = totalStudents ? (presentToday / totalStudents) * 100 : 0;

      // Get last 7 days attendance rate
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const { data: weekRecords } = await supabase
        .from("attendance_records")
        .select("status")
        .gte("timestamp", weekAgo.toISOString());

      const weekPresent = weekRecords?.filter((r) => r.status === "present").length || 0;
      const weekTotal = weekRecords?.length || 0;
      const weeklyRate = weekTotal ? (weekPresent / weekTotal) * 100 : 0;

      setStats({
        totalStudents: totalStudents || 0,
        presentToday,
        absentToday,
        attendanceRate,
        weeklyRate,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const handleCardScan = async (cardId: string) => {
    try {
      // Find student by card reader ID
      const { data: student, error: studentError } = await supabase
        .from("students")
        .select("id, first_name, last_name")
        .eq("card_reader_id", cardId)
        .single();

      if (studentError || !student) {
        toast.error("Okänt kort: " + cardId);
        return;
      }

      // Check if already marked today
      const today = new Date().toISOString().split("T")[0];
      const { data: existingRecord } = await supabase
        .from("attendance_records")
        .select("id")
        .eq("student_id", student.id)
        .gte("timestamp", `${today}T00:00:00`)
        .lte("timestamp", `${today}T23:59:59`)
        .maybeSingle();

      if (existingRecord) {
        toast.info(`${student.first_name} ${student.last_name} redan markerad idag`);
        return;
      }

      // Create attendance record - we'll create a dummy lesson_id for now
      // In a real system, you'd match to the current lesson
      const { error: insertError } = await supabase
        .from("attendance_records")
        .insert({
          student_id: student.id,
          lesson_id: "00000000-0000-0000-0000-000000000000", // Placeholder
          status: "present",
          notes: "Scanned via NFC card reader",
        });

      if (insertError) {
        toast.error("Fel vid registrering");
        console.error(insertError);
        return;
      }

      toast.success(`✓ ${student.first_name} ${student.last_name} närvarande`);
      fetchStats(); // Refresh stats
    } catch (error) {
      console.error("Error processing card:", error);
      toast.error("Fel vid kortläsning");
    }
  };

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Totalt Elever</CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStudents}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Närvarande Idag</CardTitle>
            <CheckCircle2 className="w-4 h-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{stats.presentToday}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Frånvarande Idag</CardTitle>
            <XCircle className="w-4 h-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.absentToday}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Närvaro Idag</CardTitle>
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.attendanceRate.toFixed(1)}%</div>
          </CardContent>
        </Card>
      </div>

      {/* NFC Card Scanner */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>NFC Kortläsare</CardTitle>
              <CardDescription>
                Skanna studentkort för att registrera närvaro
                {scannerActive && " - Skanner aktiverad"}
              </CardDescription>
            </div>
            <Button
              onClick={() => setScannerActive(!scannerActive)}
              variant={scannerActive ? "destructive" : "default"}
            >
              <ScanLine className="w-4 h-4 mr-2" />
              {scannerActive ? "Stoppa Skanning" : "Starta Skanning"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {scannerActive ? (
            <div className="text-center py-12">
              <ScanLine className="w-16 h-16 text-primary mx-auto mb-4 animate-pulse" />
              <p className="text-lg font-medium">Väntar på kortskanningar...</p>
              <p className="text-sm text-muted-foreground mt-2">
                Skanna ett studentkort med NFC-läsaren
              </p>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p>Klicka på "Starta Skanning" för att aktivera kortläsaren</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Weekly Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Veckotrend</CardTitle>
          <CardDescription>Närvarostatistik senaste 7 dagarna</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Genomsnittlig närvaro</span>
              <span className="text-sm font-bold">{stats.weeklyRate.toFixed(1)}%</span>
            </div>
            <Progress value={stats.weeklyRate} className="h-2" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AttendanceView;
