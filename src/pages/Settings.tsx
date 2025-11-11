import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import logo from "@/assets/logo.png";

interface School {
  id: string;
  name: string;
}

const Settings = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [schools, setSchools] = useState<School[]>([]);
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>("");
  const [skola24Url, setSkola24Url] = useState("");
  const [teacherId, setTeacherId] = useState<string>("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch all schools
      const { data: schoolsData } = await supabase
        .from("schools")
        .select("*")
        .order("name");

      if (schoolsData) {
        setSchools(schoolsData);
      }

      // Fetch current teacher info
      const { data: teacher } = await supabase
        .from("teachers")
        .select("id, school_id, skola24_schedule_url")
        .single();

      if (teacher) {
        setTeacherId(teacher.id);
        setSelectedSchoolId(teacher.school_id || "");
        setSkola24Url(teacher.skola24_schedule_url || "");
      }
    } catch (error: any) {
      toast.error("Kunde inte ladda inställningar");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const { error } = await supabase
        .from("teachers")
        .update({
          school_id: selectedSchoolId || null,
          skola24_schedule_url: skola24Url || null,
        })
        .eq("id", teacherId);

      if (error) throw error;

      toast.success("Inställningar sparade");
      navigate("/dashboard");
    } catch (error: any) {
      toast.error(error.message || "Kunde inte spara inställningar");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Laddar...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <img src={logo} alt="PresencePoint" className="w-10 h-10 rounded-full object-cover" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">PresencePoint</h1>
              <p className="text-sm text-muted-foreground">Inställningar</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Button
          variant="ghost"
          onClick={() => navigate("/dashboard")}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Tillbaka till Dashboard
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Lärarinställningar</CardTitle>
            <CardDescription>
              Hantera din profil och integration med Skola24
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="school">Skola</Label>
                <Select value={selectedSchoolId} onValueChange={setSelectedSchoolId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Välj en skola" />
                  </SelectTrigger>
                  <SelectContent>
                    {schools.map((school) => (
                      <SelectItem key={school.id} value={school.id}>
                        {school.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Välj vilken skola du är kopplad till
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="skola24">Skola24 Schema-länk</Label>
                <Input
                  id="skola24"
                  type="url"
                  value={skola24Url}
                  onChange={(e) => setSkola24Url(e.target.value)}
                  placeholder="https://web.skola24.se/..."
                />
                <p className="text-sm text-muted-foreground">
                  Klistra in länken till ditt personliga schema från Skola24
                </p>
              </div>

              {skola24Url && (
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm font-medium mb-2">Förhandsvisning:</p>
                  <a
                    href={skola24Url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline"
                  >
                    Öppna mitt schema i Skola24 →
                  </a>
                </div>
              )}

              <Button type="submit" disabled={saving} className="w-full">
                <Save className="w-4 h-4 mr-2" />
                {saving ? "Sparar..." : "Spara Inställningar"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Settings;
