import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, UserPlus, UserMinus } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Class {
  id: string;
  name: string;
  school_id: string;
  teacher_id: string | null;
  created_at: string;
}

const ClassesView = () => {
  const [open, setOpen] = useState(false);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [className, setClassName] = useState("");
  const [teacherId, setTeacherId] = useState<string | null>(null);
  const [assignedClasses, setAssignedClasses] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchClasses();
    fetchTeacherId();
  }, []);

  const fetchTeacherId = async () => {
    const { data } = await supabase
      .from("teachers")
      .select("id")
      .single();
    
    if (data) {
      setTeacherId(data.id);
      fetchAssignedClasses(data.id);
    }
  };

  const fetchAssignedClasses = async (tId: string) => {
    const { data } = await supabase
      .from("teacher_classes")
      .select("class_id")
      .eq("teacher_id", tId);

    if (data) {
      setAssignedClasses(new Set(data.map(tc => tc.class_id)));
    }
  };

  const fetchClasses = async () => {
    try {
      const { data, error } = await supabase
        .from("classes")
        .select("*")
        .order("name", { ascending: true });

      if (error) throw error;
      setClasses(data || []);
    } catch (error: any) {
      toast.error("Kunde inte hämta klasser");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddClass = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { data: teacher } = await supabase
        .from("teachers")
        .select("school_id")
        .single();

      if (!teacher) {
        toast.error("Du måste vara kopplad till en skola först");
        return;
      }

      const { error } = await supabase.from("classes").insert({
        school_id: teacher.school_id,
        name: className,
      });

      if (error) throw error;

      toast.success("Klass tillagd");
      setOpen(false);
      setClassName("");
      fetchClasses();
    } catch (error: any) {
      toast.error(error.message || "Kunde inte lägga till klass");
    }
  };

  const handleDeleteClass = async (id: string) => {
    try {
      const { error } = await supabase.from("classes").delete().eq("id", id);
      if (error) throw error;
      toast.success("Klass borttagen");
      fetchClasses();
    } catch (error: any) {
      toast.error("Kunde inte ta bort klass");
    }
  };

  const handleToggleAssignment = async (classId: string) => {
    if (!teacherId) return;

    try {
      const isAssigned = assignedClasses.has(classId);

      if (isAssigned) {
        // Remove assignment
        const { error } = await supabase
          .from("teacher_classes")
          .delete()
          .eq("teacher_id", teacherId)
          .eq("class_id", classId);

        if (error) throw error;
        toast.success("Tilldelning borttagen");
      } else {
        // Add assignment
        const { error } = await supabase
          .from("teacher_classes")
          .insert({
            teacher_id: teacherId,
            class_id: classId,
          });

        if (error) throw error;
        toast.success("Tilldela dig själv till klassen");
      }

      await fetchAssignedClasses(teacherId);
      // Trigger a page refresh for the header
      window.location.reload();
    } catch (error: any) {
      toast.error(error.message || "Kunde inte uppdatera tilldelning");
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Klasser</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <p>Laddar klasser...</p>
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
            <CardTitle>Klasser</CardTitle>
            <CardDescription>
              Totalt {classes.length} {classes.length === 1 ? 'klass' : 'klasser'}
            </CardDescription>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Lägg till Klass
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Lägg till Ny Klass</DialogTitle>
                <DialogDescription>
                  Fyll i klassens information
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddClass} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="className">Klassnamn</Label>
                  <Input
                    id="className"
                    value={className}
                    onChange={(e) => setClassName(e.target.value)}
                    placeholder="t.ex. Klass 9A"
                    required
                  />
                </div>
                <Button type="submit" className="w-full">
                  Lägg till
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {classes.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>Inga klasser ännu. Lägg till din första klass!</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Klassnamn</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Åtgärder</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {classes.map((cls) => (
                <TableRow key={cls.id}>
                  <TableCell className="font-medium">{cls.name}</TableCell>
                  <TableCell>
                    {assignedClasses.has(cls.id) ? (
                      <Badge variant="default">Tilldelad till dig</Badge>
                    ) : (
                      <Badge variant="outline">Inte tilldelad</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleAssignment(cls.id)}
                      >
                        {assignedClasses.has(cls.id) ? (
                          <>
                            <UserMinus className="w-4 h-4 mr-1" />
                            Ta bort
                          </>
                        ) : (
                          <>
                            <UserPlus className="w-4 h-4 mr-1" />
                            Tilldela
                          </>
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteClass(cls.id)}
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

export default ClassesView;
