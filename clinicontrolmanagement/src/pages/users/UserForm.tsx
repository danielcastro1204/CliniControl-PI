import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/integrations/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";


export default function UserForm() {
  const { role } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const canManageUsers = role === "admin" || role === "system_admin";
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    email: "",
    password: "",
    first_name: "",
    last_name: "",
    identification: "",
    phone: "",
  });

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.first_name || !form.last_name || !form.email || !form.password) {
      toast({ variant: "destructive", title: "Error", description: "Complete los campos obligatorios" });
      return;
    }

    if (form.password.length < 6) {
      toast({ variant: "destructive", title: "Error", description: "La contraseña debe tener al menos 6 caracteres" });
      return;
    }

    setLoading(true);

    const { data, error } = await api.functions.invoke("create-clinic-user", {
      body: {
        email: form.email,
        password: form.password,
        first_name: form.first_name,
        last_name: form.last_name,
        identification: form.identification,
        phone: form.phone,
      },
    });

    setLoading(false);

    if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
      return;
    }

    if (data?.error) {
      toast({ variant: "destructive", title: "Error", description: data.error });
      return;
    }

    toast({ title: "Usuario creado exitosamente" });
    navigate("/dashboard/usuarios");
  };

  if (!canManageUsers) {
    return (
      <div className="flex items-center justify-center h-64">
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">No tienes permisos para acceder a este módulo.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard/usuarios")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-secondary font-display">Crear Usuario Clínico</h1>
          <p className="text-sm text-muted-foreground">El usuario se creará con rol Clínico en tu consultorio</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Datos del usuario</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">Nombre *</Label>
                <Input id="first_name" placeholder="María" value={form.first_name} onChange={set("first_name")} autoComplete="off" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Apellido *</Label>
                <Input id="last_name" placeholder="López" value={form.last_name} onChange={set("last_name")} autoComplete="off" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="identification">Número de identificación</Label>
                <Input id="identification" placeholder="1020304050" value={form.identification} onChange={set("identification")} autoComplete="off" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input id="phone" placeholder="300 123 4567" value={form.phone} onChange={set("phone")} autoComplete="off" />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="email">Email *</Label>
                <Input id="email" type="email" placeholder="clinico@consultorio.com" value={form.email} onChange={set("email")} autoComplete="off" />
              </div>
              <div className="space-y-2">

                <Label htmlFor="password">Contraseña *</Label>
                <Input id="password" type="password" placeholder="Mínimo 6 caracteres" value={form.password} onChange={set("password")} autoComplete="new-password" />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => navigate("/dashboard/usuarios")}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Creando..." : "Crear usuario"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
