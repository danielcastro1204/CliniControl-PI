import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Building2 } from "lucide-react";
import logo from "@/assets/logo-clinicontrol.png";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    clinicName: "",
    clinicNit: "",
    clinicAddress: "",
    clinicPhone: "",
    clinicCodPrestador: "",
  });

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.firstName || !form.lastName || !form.email || !form.password || !form.clinicName) {
      setError("Complete todos los campos obligatorios");
      return;
    }
    if (form.password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    setLoading(true);
    const result = await register({
      email: form.email,
      password: form.password,
      firstName: form.firstName,
      lastName: form.lastName,
      clinicName: form.clinicName,
      clinicNit: form.clinicNit,
      clinicAddress: form.clinicAddress,
      clinicPhone: form.clinicPhone,
      clinicCodPrestador: form.clinicCodPrestador,
    });
    setLoading(false);

    if (result.success) {
      navigate("/dashboard");
    } else {
      setError(result.error || "Error en el registro");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4 py-8">
      <Card className="w-full max-w-lg shadow-lg border-border/50">
        <CardHeader className="flex flex-col items-center gap-3 pb-2 pt-8">
          <img src={logo} alt="CliniControl" className="h-16 w-auto" />
          <h1 className="text-2xl font-bold text-secondary font-display">
            Registra tu Consultorio
          </h1>
          <p className="text-sm text-muted-foreground text-center">
            Crea tu cuenta de consultorio y conviértete en el administrador
          </p>
        </CardHeader>
        <CardContent className="pt-4 pb-8">
          <form onSubmit={handleSubmit} className="space-y-6" autoComplete="off">
            {/* Clinic info */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-secondary font-semibold text-sm">
                <Building2 className="h-4 w-4" />
                Datos del Consultorio
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1 sm:col-span-2">
                  <Label htmlFor="clinicName">Nombre del consultorio *</Label>
                  <Input id="clinicName" placeholder="Ej: Consultorio Dental Sonrisa" value={form.clinicName} onChange={set("clinicName")} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="clinicNit">NIT</Label>
                  <Input id="clinicNit" placeholder="900123456" value={form.clinicNit} onChange={set("clinicNit")} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="clinicCodPrestador">Código Prestador</Label>
                  <Input id="clinicCodPrestador" placeholder="110010101301" value={form.clinicCodPrestador} onChange={set("clinicCodPrestador")} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="clinicPhone">Teléfono</Label>
                  <Input id="clinicPhone" placeholder="601 123 4567" value={form.clinicPhone} onChange={set("clinicPhone")} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="clinicAddress">Dirección</Label>
                  <Input id="clinicAddress" placeholder="Calle 123 #45-67" value={form.clinicAddress} onChange={set("clinicAddress")} />
                </div>
              </div>
            </div>

            {/* User info */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-secondary font-semibold text-sm">
                👤 Datos del Administrador
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="firstName">Nombre *</Label>
                  <Input id="firstName" placeholder="Carlos" value={form.firstName} onChange={set("firstName")} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="lastName">Apellido *</Label>
                  <Input id="lastName" placeholder="García" value={form.lastName} onChange={set("lastName")} />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input id="email" type="email" placeholder="doctor@clinica.com" value={form.email} onChange={set("email")} autoComplete="off" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="password">Contraseña *</Label>
                  <Input id="password" type="password" placeholder="Mínimo 6 caracteres" value={form.password} onChange={set("password")} autoComplete="new-password" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="confirmPassword">Confirmar contraseña *</Label>
                  <Input id="confirmPassword" type="password" placeholder="••••••••" value={form.confirmPassword} onChange={set("confirmPassword")} autoComplete="new-password" />
                </div>
              </div>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creando consultorio..." : "Crear mi consultorio"}
            </Button>

            <p className="text-sm text-muted-foreground text-center">
              ¿Ya tienes cuenta?{" "}
              <Link to="/login" className="text-primary hover:underline font-medium">
                Inicia sesión
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
