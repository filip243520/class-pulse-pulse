import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Edit } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  student_number: string;
  card_reader_id: string | null;
}

const StudentsView = () => {
  const [open, setOpen] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [studentNumber, setStudentNumber] = useState("");
  const [cardReaderId, setCardReaderId] = useState("");

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase
        .from("students")
        .select("*")
        .order("last_name", { ascending: true });

      if (error) throw error;
      setStudents(data || []);
    } catch (error: any) {
      toast.error("Kunde inte hämta elever");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddStudent = async (e: React.FormEvent) => {
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

      const { error } = await supabase.from("students").insert({
        school_id: teacher.school_id,
        first_name: firstName,
        last_name: lastName,
        student_number: studentNumber,
        card_reader_id: cardReaderId || null,
      });

      if (error) throw error;

      toast.success("Elev tillagd");
      setOpen(false);
      setFirstName("");
      setLastName("");
      setStudentNumber("");
      setCardReaderId("");
      fetchStudents();
    } catch (error: any) {
      toast.error(error.message || "Kunde inte lägga till elev");
    }
  };

  const handleDeleteStudent = async (id: string) => {
    try {
      const { error } = await supabase.from("students").delete().eq("id", id);
      if (error) throw error;
      toast.success("Elev borttagen");
      fetchStudents();
    } catch (error: any) {
      toast.error("Kunde inte ta bort elev");
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Elever</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <p>Laddar elever...</p>
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
            <CardTitle>Elever</CardTitle>
            <CardDescription>
              Totalt {students.length} {students.length === 1 ? 'elev' : 'elever'}
            </CardDescription>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Lägg till Elev
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Lägg till Ny Elev</DialogTitle>
                <DialogDescription>
                  Fyll i elevens information
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddStudent} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Förnamn</Label>
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Efternamn</Label>
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="studentNumber">Elevnummer</Label>
                  <Input
                    id="studentNumber"
                    value={studentNumber}
                    onChange={(e) => setStudentNumber(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cardReaderId">Kort ID (valfritt)</Label>
                  <Input
                    id="cardReaderId"
                    value={cardReaderId}
                    onChange={(e) => setCardReaderId(e.target.value)}
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
        {students.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>Inga elever ännu. Lägg till din första elev!</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Namn</TableHead>
                <TableHead>Elevnummer</TableHead>
                <TableHead>Kort ID</TableHead>
                <TableHead className="text-right">Åtgärder</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((student) => (
                <TableRow key={student.id}>
                  <TableCell className="font-medium">
                    {student.first_name} {student.last_name}
                  </TableCell>
                  <TableCell>{student.student_number}</TableCell>
                  <TableCell>
                    {student.card_reader_id ? (
                      <Badge variant="outline">{student.card_reader_id}</Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">Inget kort</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteStudent(student.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
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

export default StudentsView;
