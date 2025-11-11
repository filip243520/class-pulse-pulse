import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScanLine } from "lucide-react";

const AttendanceView = () => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Närvaro</CardTitle>
            <CardDescription>Markera närvaro för dagens lektioner</CardDescription>
          </div>
          <Button>
            <ScanLine className="w-4 h-4 mr-2" />
            Skanna Kort
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-center py-12 text-muted-foreground">
          <p>Inga lektioner planerade för idag</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default AttendanceView;
