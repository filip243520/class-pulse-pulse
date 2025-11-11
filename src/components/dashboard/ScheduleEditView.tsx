import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Trash2, Edit2, Clock, MapPin } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

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

interface Class {
  id: string;
  name: string;
}

const DAYS = ["Måndag", "Tisdag", "Onsdag", "Torsdag", "Fredag"];

const ScheduleEditView = () => {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);

  // Form fields
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedDay, setSelectedDay] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [room, setRoom] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      await Promise.all([fetchLessons(), fetchClasses()]);
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      const { data: teacherClasses } = await supabase
        .from("teacher_classes")
        .select("class_id");

      if (!teacherClasses || teacherClasses.length === 0) {
        setClasses([]);
        return;
      }

      const classIds = teacherClasses.map((tc) => tc.class_id);

      const { data, error } = await supabase
        .from("classes")
        .select("*")
        .in("id", classIds)
        .order("name", { ascending: true });

      if (error) throw error;
      setClasses(data || []);
    } catch (error: any) {
      console.error(error);
    }
  };

  const fetchLessons = async () => {
    try {
      const { data: teacherClasses } = await supabase
        .from("teacher_classes")
        .select("class_id");

      if (!teacherClasses || teacherClasses.length === 0) {
        setLessons([]);
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
      toast.error("Kunde inte hämta lektioner");
      console.error(error);
    }
  };

  const handleOpenDialog = (lesson?: Lesson) => {
    if (lesson) {
      setEditingLesson(lesson);
      setSelectedClassId(lesson.class_id);
      setSelectedDay(lesson.day_of_week.toString());
      setStartTime(lesson.start_time);
      setEndTime(lesson.end_time);
      setRoom(lesson.room);
    } else {
      setEditingLesson(null);
      setSelectedClassId("");
      setSelectedDay("");
      setStartTime("");
      setEndTime("");
      setRoom("");
    }
    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedClassId || !selectedDay || !startTime || !endTime || !room) {
      toast.error("Alla fält måste fyllas i");
      return;
    }

    try {
      const lessonData = {
        class_id: selectedClassId,
        day_of_week: parseInt(selectedDay),
        start_time: startTime,
        end_time: endTime,
        room: room,
      };

      if (editingLesson) {
        const { error } = await supabase
          .from("lessons")
          .update(lessonData)
          .eq("id", editingLesson.id);

        if (error) throw error;
        toast.success("Lektion uppdaterad");
      } else {
        const { error } = await supabase
          .from("lessons")
          .insert(lessonData);

        if (error) throw error;
        toast.success("Lektion tillagd");
      }

      setOpen(false);
      fetchLessons();
    } catch (error: any) {
      toast.error(error.message || "Kunde inte spara lektion");
      console.error(error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("lessons")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Lektion borttagen");
      fetchLessons();
    } catch (error: any) {
      toast.error("Kunde inte ta bort lektion");
      console.error(error);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Redigera Schema</CardTitle>
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
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Redigera Schema</CardTitle>
            <CardDescription>Hantera dina lektioner och schemaläggning</CardDescription>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="w-4 h-4 mr-2" />
                Lägg till Lektion
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingLesson ? "Redigera Lektion" : "Lägg till Ny Lektion"}
                </DialogTitle>
                <DialogDescription>
                  Fyll i lektionsinformation
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="class">Klass *</Label>
                  <Select value={selectedClassId} onValueChange={setSelectedClassId} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Välj klass" />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.map((cls) => (
                        <SelectItem key={cls.id} value={cls.id}>
                          {cls.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="day">Dag *</Label>
                  <Select value={selectedDay} onValueChange={setSelectedDay} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Välj dag" />
                    </SelectTrigger>
                    <SelectContent>
                      {DAYS.map((day, index) => (
                        <SelectItem key={index} value={(index + 1).toString()}>
                          {day}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startTime">Starttid *</Label>
                    <Input
                      id="startTime"
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endTime">Sluttid *</Label>
                    <Input
                      id="endTime"
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="room">Sal *</Label>
                  <Input
                    id="room"
                    type="text"
                    value={room}
                    onChange={(e) => setRoom(e.target.value)}
                    placeholder="t.ex. A201"
                    required
                  />
                </div>
                <Button type="submit" className="w-full">
                  {editingLesson ? "Uppdatera" : "Lägg till"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {lessons.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>Inga lektioner ännu. Lägg till din första lektion!</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Dag</TableHead>
                <TableHead>Tid</TableHead>
                <TableHead>Klass</TableHead>
                <TableHead>Sal</TableHead>
                <TableHead className="text-right">Åtgärder</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lessons.map((lesson) => (
                <TableRow key={lesson.id}>
                  <TableCell className="font-medium">
                    {DAYS[lesson.day_of_week - 1]}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      {lesson.start_time.slice(0, 5)} - {lesson.end_time.slice(0, 5)}
                    </div>
                  </TableCell>
                  <TableCell>{lesson.classes.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      {lesson.room}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenDialog(lesson)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(lesson.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default ScheduleEditView;
