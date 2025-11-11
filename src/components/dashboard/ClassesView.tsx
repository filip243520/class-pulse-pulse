import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

const ClassesView = () => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Klasser</CardTitle>
            <CardDescription>Hantera dina klasser och lektioner</CardDescription>
          </div>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Lägg till Klass
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-center py-12 text-muted-foreground">
          <p>Inga klasser ännu. Lägg till din första klass!</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ClassesView;
