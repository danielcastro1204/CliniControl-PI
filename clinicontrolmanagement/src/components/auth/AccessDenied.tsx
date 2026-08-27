import { ShieldAlert } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AccessDeniedProps {
  title?: string;
  description?: string;
  backHref?: string;
  backLabel?: string;
}

export default function AccessDenied({
  title = "Acceso restringido",
  description = "Tu rol actual no tiene permiso para entrar a este módulo.",
  backHref = "/dashboard/inventario",
  backLabel = "Volver al panel",
}: AccessDeniedProps) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center px-4">
      <Card className="w-full max-w-lg border-border/60 shadow-sm">
        <CardHeader className="items-center space-y-4 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-primary">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div className="space-y-2">
            <CardTitle className="font-display text-2xl text-secondary">{title}</CardTitle>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </CardHeader>
        <CardContent className="flex justify-center pb-6">
          <Button asChild>
            <Link to={backHref}>{backLabel}</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}