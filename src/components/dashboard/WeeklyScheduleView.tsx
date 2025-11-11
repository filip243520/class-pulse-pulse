import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Clock, MapPin } from "lucide-react";

interface Lesson {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  room: string;
  class_id: string;
  classes: {
    name: string;
  };
}

const DAYS = ["Måndag", "Tisdag", "Onsdag", "Torsdag", "Fredag"];
const TIME_SLOTS = Array.from({ length: 10 }, (_, i) => `${8 + i}:00`);

const WeeklyScheduleView = () => {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLessons();
  }, []);

  const fetchLessons = async () => {
    try {
      const { data: teacherClasses } = await supabase
        .from("teacher_classes")
        .select("class_id");

      if (!teacherClasses || teacherClasses.length === 0) {
        setLessons([]);
        setLoading(false);
        return;
      }

      const classIds = teacherClasses.map((tc) => tc.class_id);

      const { data, error } = await supabase
        .from("lessons")
        .select(`
          *,
          classes (
            name
          )
        `)
        .in("class_id", classIds)
        .order("day_of_week", { ascending: true })
        .order("start_time", { ascending: true });

      if (error) throw error;
      setLessons(data || []);
    } catch (error: any) {
      toast.error("Kunde inte hämta schema");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getLessonForSlot = (day: number, timeSlot: string) => {
    return lessons.find((lesson) => {
      const lessonHour = parseInt(lesson.start_time.split(":")[0]);
      const slotHour = parseInt(timeSlot.split(":")[0]);
      return lesson.day_of_week === day && lessonHour === slotHour;
    });
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Veckoschema</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <p>Laddar schema...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Veckoschema</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            <div className="grid grid-cols-6 gap-2">
              <div className="font-semibold text-sm text-muted-foreground p-2">Tid</div>
              {DAYS.map((day) => (
                <div key={day} className="font-semibold text-sm text-center p-2 bg-muted rounded-t-lg">
                  {day}
                </div>
              ))}

              {TIME_SLOTS.map((timeSlot) => (
                <>
                  <div key={`time-${timeSlot}`} className="text-sm text-muted-foreground p-2 font-medium">
                    {timeSlot}
                  </div>
                  {DAYS.map((_, dayIndex) => {
                    const lesson = getLessonForSlot(dayIndex + 1, timeSlot);
                    return (
                      <div
                        key={`${dayIndex}-${timeSlot}`}
                        className="min-h-[80px] border border-border rounded-lg p-2"
                      >
                        {lesson && (
                          <div className="bg-primary/10 border border-primary/20 rounded p-2 h-full">
                            <div className="font-semibold text-sm text-primary">
                              {lesson.classes.name}
                            </div>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                              <Clock className="w-3 h-3" />
                              {lesson.start_time.slice(0, 5)} - {lesson.end_time.slice(0, 5)}
                            </div>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <MapPin className="w-3 h-3" />
                              {lesson.room}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WeeklyScheduleView;
