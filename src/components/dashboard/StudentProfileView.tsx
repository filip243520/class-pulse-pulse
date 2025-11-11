import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Calendar, CheckCircle2, XCircle, Clock } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";
import { sv } from "date-fns/locale";

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  student_number: string;
  card_reader_id: string | null;
}

interface AttendanceRecord {
  id: string;
  timestamp: string;
  status: string;
  notes: string | null;
  lessons: {
    classes: {
      name: string;
    };
  };
}

interface StudentProfileViewProps {
  studentId: string;
  onBack: () => void;
}

const StudentProfileView = ({ studentId, onBack }: StudentProfileViewProps) => {
  const [student, setStudent] = useState<Student | null>(null);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalDays: 0,
    presentDays: 0,
    absentDays: 0,
    attendanceRate: 0,
  });

  useEffect(() => {
    fetchStudentData();
  }, [studentId]);

  const fetchStudentData = async () => {
    try {
      const { data: studentData, error: studentError } = await supabase
        .from("students")
        .select("*")
        .eq("id", studentId)
        .single();

      if (studentError) throw studentError;
      setStudent(studentData);

      const { data: recordsData, error: recordsError } = await supabase
        .from("attendance_records")
        .select(`
          *,
          lessons (
            classes (
              name
            )
          )
        `)
        .eq("student_id", studentId)
        .order("timestamp", { ascending: false })
        .limit(50);

      if (recordsError) throw recordsError;
      setRecords(recordsData || []);

      const presentCount = recordsData?.filter((r) => r.status === "present").length || 0;
      const absentCount = recordsData?.filter((r) => r.status === "absent").length || 0;
      const total = recordsData?.length || 0;
      const rate = total > 0 ? (presentCount / total) * 100 : 0;

      setStats({
        totalDays: total,
        presentDays: presentCount,
        absentDays: absentCount,
        attendanceRate: rate,
      });
    } catch (error: any) {
      toast.error("Kunde inte hämta elevdata");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !student) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Elevprofil</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <p>Laddar elevdata...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Tillbaka
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {student.first_name} {student.last_name}
          </CardTitle>
          <CardDescription>Elevnummer: {student.student_number}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="w-4 h-4 text-success" />
                Närvarande
              </div>
              <div className="text-2xl font-bold text-success">{stats.presentDays}</div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <XCircle className="w-4 h-4 text-destructive" />
                Frånvarande
              </div>
              <div className="text-2xl font-bold text-destructive">{stats.absentDays}</div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                Närvaroproc.
              </div>
              <div className="text-2xl font-bold">{stats.attendanceRate.toFixed(1)}%</div>
            </div>
          </div>
          <div className="mt-4">
            <Progress value={stats.attendanceRate} className="h-2" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Närvarohistorik</CardTitle>
          <CardDescription>Senaste 50 registreringarna</CardDescription>
        </CardHeader>
        <CardContent>
          {records.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>Ingen närvarohistorik ännu</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Datum & Tid</TableHead>
                  <TableHead>Klass</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Noteringar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        {format(new Date(record.timestamp), "d MMM yyyy, HH:mm", { locale: sv })}
                      </div>
                    </TableCell>
                    <TableCell>{record.lessons?.classes?.name || "N/A"}</TableCell>
                    <TableCell>
                      {record.status === "present" ? (
                        <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                          Närvarande
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">
                          Frånvarande
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {record.notes || "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentProfileView;
