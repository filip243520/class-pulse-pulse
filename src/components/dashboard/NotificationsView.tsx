import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Bell, AlertCircle, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { sv } from "date-fns/locale";

interface AbsenceNotification {
  id: string;
  timestamp: string;
  student: {
    first_name: string;
    last_name: string;
    student_number: string;
  };
  lesson: {
    classes: {
      name: string;
    };
  };
}

const NotificationsView = () => {
  const [notifications, setNotifications] = useState<AbsenceNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAbsences();
    
    const channel = supabase
      .channel("attendance-changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "attendance_records",
          filter: "status=eq.absent",
        },
        (payload) => {
          toast.error("Ny frånvaro registrerad", {
            description: "En elev har markerats som frånvarande",
          });
          fetchAbsences();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchAbsences = async () => {
    try {
      const today = new Date();
      today.setDate(today.getDate() - 7);

      const { data, error } = await supabase
        .from("attendance_records")
        .select(`
          id,
          timestamp,
          students (
            first_name,
            last_name,
            student_number
          ),
          lessons (
            classes (
              name
            )
          )
        `)
        .eq("status", "absent")
        .gte("timestamp", today.toISOString())
        .order("timestamp", { ascending: false })
        .limit(20);

      if (error) throw error;

      const formatted = (data || []).map((record: any) => ({
        id: record.id,
        timestamp: record.timestamp,
        student: record.students,
        lesson: record.lessons,
      }));

      setNotifications(formatted);
    } catch (error: any) {
      toast.error("Kunde inte hämta frånvaronotiser");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Frånvaronotiser</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <p>Laddar notiser...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Frånvaronotiser
            </CardTitle>
            <CardDescription>Senaste 7 dagarna</CardDescription>
          </div>
          {notifications.length > 0 && (
            <Badge variant="destructive" className="text-sm">
              {notifications.length} frånvaro{notifications.length !== 1 ? "r" : ""}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {notifications.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle2 className="w-12 h-12 text-success mx-auto mb-4" />
            <p className="text-lg font-medium">Inga frånvaron!</p>
            <p className="text-sm text-muted-foreground">Alla elever har varit närvarande</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className="flex items-start gap-3 p-4 border border-destructive/20 bg-destructive/5 rounded-lg"
              >
                <AlertCircle className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold">
                    {notification.student.first_name} {notification.student.last_name}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {notification.lesson?.classes?.name || "Okänd klass"} •{" "}
                    {format(new Date(notification.timestamp), "d MMM yyyy, HH:mm", { locale: sv })}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Elevnr: {notification.student.student_number}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default NotificationsView;
