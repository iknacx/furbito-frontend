import { useState } from "react";
import { motion } from "framer-motion";
import { Calendar, Clock, MapPin, Trash2, History, User as UserIcon, Mail, Phone, Save, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { formatCLP, todayISO, type Reservation } from "@/lib/api";
import { toast } from "sonner";

interface Props {
  isLoggedIn: boolean;
  userName: string;
  userEmail: string;
  userPhone?: string;
  reservations: Reservation[];
  onCancel: (id: number) => void;
  onUpdateProfile: (name: string, email: string, phone: string) => void;
  onLoginClick: () => void;
}

type Tab = "upcoming" | "history" | "profile";

// Apartado de "Mi perfil"
// se muestran las reservas proximas, además del historial y la configuración de perfil
export default function PlayerView({ isLoggedIn, userName, userEmail, userPhone, reservations, onCancel, onUpdateProfile, onLoginClick }: Props) {
  const [tab, setTab] = useState<Tab>("upcoming");
  const [confirming, setConfirming] = useState<number | null>(null);
  const [name, setName] = useState(userName);
  const [email, setEmail] = useState(userEmail);
  const [phone, setPhone] = useState(userPhone || "+56 9 ");

  if (!isLoggedIn) {
    return (
      <div className="max-w-md mx-auto text-center py-24">
        <div className="w-16 h-16 rounded-2xl gradient-hero mx-auto flex items-center justify-center mb-6 shadow-glow">
          <UserIcon className="w-8 h-8 text-primary-foreground" />
        </div>
        <h2 className="font-display text-2xl font-bold mb-2">Inicia sesión</h2>
        <p className="text-muted-foreground mb-6">Accede a tu cuenta para ver tus reservas y gestionar tu perfil.</p>
        <Button onClick={onLoginClick} className="gradient-hero text-primary-foreground">Ingresar a mi cuenta</Button>
      </div>
    );
  }

  const today = todayISO();

  // filtro de reservas próximas
  // se ordena por fecha
  const upcoming = reservations
    .filter((r) => r.status === "confirmed" && r.date >= today)
    .sort((a, b) => (a.date + a.hour).localeCompare(b.date + b.hour));

  // filtro de historial de reservas
  // se ordena por fecha 
  const history = reservations
    .filter((r) => r.status !== "confirmed" || r.date < today)
    .sort((a, b) => (b.date + b.hour).localeCompare(a.date + a.hour));

  const tabs: { key: Tab; label: string; icon: any }[] = [
    { key: "upcoming", label: "Mis reservas", icon: Calendar },
    { key: "history", label: "Historial", icon: History },
    { key: "profile", label: "Mi perfil", icon: UserIcon },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-card border border-border rounded-2xl p-5 shadow-card flex items-center gap-4">
        <div className="w-14 h-14 rounded-full gradient-hero flex items-center justify-center text-primary-foreground font-display font-bold text-xl shadow-glow">
          {userName.charAt(0).toUpperCase()}
        </div>
        <div>
          <h2 className="font-display font-bold text-xl">Hola, {userName} 👋</h2>
          <p className="text-sm text-muted-foreground">{upcoming.length} reservas próximas</p>
        </div>
      </div>

      <div className="flex gap-1 bg-secondary p-1 rounded-xl w-fit">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t.key ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
          >
            {tab === t.key && (
              <motion.div layoutId="playerTab" className="absolute inset-0 gradient-hero rounded-lg -z-10" />
            )}
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>

      {tab === "upcoming" && (
        <div className="space-y-3">
          {upcoming.length === 0 && (
            <div className="text-center py-12 bg-card border border-border rounded-2xl">
              <AlertCircle className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No tienes reservas próximas. ¡Reserva una cancha y juega!</p>
            </div>
          )}
          {upcoming.map((r) => (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-card border border-border rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-card hover:shadow-glow transition-shadow"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <Calendar className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-display font-semibold">{r.fieldName}</h3>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground mt-1">
                    <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {r.date}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {r.hour} hrs</span>
                    <span className="font-medium text-primary">{formatCLP(r.price)}</span>
                  </div>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => setConfirming(r.id)} className="text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/30">
                <Trash2 className="w-4 h-4 mr-1" /> Cancelar
              </Button>
            </motion.div>
          ))}
        </div>
      )}

      {tab === "history" && (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-secondary text-xs uppercase text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3">Cancha</th>
                <th className="text-left px-4 py-3">Fecha</th>
                <th className="text-left px-4 py-3">Hora</th>
                <th className="text-left px-4 py-3">Precio</th>
                <th className="text-left px-4 py-3">Estado</th>
              </tr>
            </thead>
            <tbody>
              {history.length === 0 && (
                <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">Sin historial todavía.</td></tr>
              )}
              {history.map((r) => (
                <tr key={r.id} className="border-t border-border hover:bg-secondary/50">
                  <td className="px-4 py-3 font-medium">{r.fieldName}</td>
                  <td className="px-4 py-3">{r.date}</td>
                  <td className="px-4 py-3">{r.hour}</td>
                  <td className="px-4 py-3 text-primary font-semibold">{formatCLP(r.price)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${r.status === "completed" ? "bg-primary/10 text-primary" :
                      r.status === "completed" ? "bg-destructive/10 text-destructive" :
                        "bg-muted text-muted-foreground"
                      }`}>{r.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "profile" && (
        <form
          onSubmit={(e) => { e.preventDefault(); onUpdateProfile(name, email, phone); toast.success("Perfil actualizado"); }}
          className="bg-card border border-border rounded-2xl p-6 max-w-xl space-y-4 shadow-card"
        >
          <h3 className="font-display font-semibold text-lg">Datos de contacto</h3>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Nombre completo</label>
            <div className="relative">
              <UserIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input value={name} onChange={(e) => setName(e.target.value)} className="pl-9" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Correo</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-9" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Teléfono</label>
            <div className="relative">
              <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="pl-9" />
            </div>
          </div>
          <Button type="submit" className="gradient-hero text-primary-foreground">
            <Save className="w-4 h-4 mr-1" /> Guardar cambios
          </Button>
        </form>
      )}

      <AlertDialog open={!!confirming} onOpenChange={(o) => !o && setConfirming(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Cancelar reserva?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción liberará el bloque horario y no se puede deshacer. Se aplicarán los términos de la política de cancelación.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Volver</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirming) {
                  onCancel(confirming);
                  toast.success("Reserva cancelada", { description: "El cupo ha sido liberado." });
                  setConfirming(null);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Sí, cancelar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
