import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Calendar, Clock, Trash2, History, User as UserIcon, Mail, Phone, Save, AlertCircle, Lock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { formatCLP, todayISO, updateUserProfile, fetchReservations, cancelReservation, type Reservation } from "@/lib/api";
import { toast } from "sonner";

interface Props {
  isLoggedIn: boolean;
  userId?: number; // Añadimos el ID para filtrar las reservas
  userName: string;
  userEmail: string;
  userPhone?: string;
  onUserUpdate: (user: any) => void;
  onLoginClick: () => void;
}

type Tab = "upcoming" | "history" | "profile";

export default function PlayerView({ isLoggedIn, userId, userName, userEmail, userPhone, onUserUpdate, onLoginClick }: Props) {
  const [tab, setTab] = useState<Tab>("upcoming");
  const [confirming, setConfirming] = useState<number | null>(null);
  
  // Estado local para las reservas del jugador
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoadingReservations, setIsLoadingReservations] = useState(true);

  // Estados del perfil
  const [name, setName] = useState(userName);
  const [email, setEmail] = useState(userEmail);
  const [phone, setPhone] = useState(userPhone || "");
  const [phoneError, setPhoneError] = useState("");
  const [password, setPassword] = useState("");

  // Cargar reservas cada vez que el usuario entra a esta vista
  useEffect(() => {
    if (!isLoggedIn || !userId) return;

    const loadReservations = async () => {
      setIsLoadingReservations(true);
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const data = await fetchReservations(token);
        // Filtramos solo las reservas de este usuario específico
        setReservations(data.filter(r => r.playerId === userId));
      } catch (error) {
        toast.error("No se pudieron cargar tus reservas.");
      } finally {
        setIsLoadingReservations(false);
      }
    };

    loadReservations();
  }, [isLoggedIn, userId]);

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

  const upcoming = reservations
    .filter((r) => r.status === "confirmed" && r.date >= today)
    .sort((a, b) => (a.date + a.hour).localeCompare(b.date + b.hour));

  const history = reservations
    .filter((r) => r.status !== "confirmed" || r.date < today)
    .sort((a, b) => (b.date + b.hour).localeCompare(a.date + a.hour));

  const tabs: { key: Tab; label: string; icon: any }[] = [
    { key: "upcoming", label: "Mis reservas", icon: Calendar },
    { key: "history", label: "Historial", icon: History },
    { key: "profile", label: "Mi perfil", icon: UserIcon },
  ];

  const validatePhone = (value: string) => {
    const cleanPhone = value.replace(/\s/g, '');
    if (!cleanPhone) {
      setPhoneError('El teléfono es obligatorio.');
      return false;
    }
    const phoneRegex = /^(\+?56)?9\d{8}$/;
    if (!phoneRegex.test(cleanPhone)) {
      setPhoneError('Formato inválido. Ejemplo: +56 9 1234 5678');
      return false;
    }
    setPhoneError('');
    return true;
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("El nombre no puede estar vacío");
      return;
    }
    if (!validatePhone(phone)) return;

    if (password && password.length < 6) {
      toast.error("La nueva contraseña debe tener al menos 6 caracteres");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const payload: any = { name, email, phone };
      if (password) payload.password = password;

      const updatedData = await updateUserProfile(payload, token);

      const storedUser = localStorage.getItem("user");
      const currentUser = storedUser ? JSON.parse(storedUser) : {};
      const nextUser = { ...currentUser, ...updatedData };
      
      localStorage.setItem("user", JSON.stringify(nextUser));
      onUserUpdate(nextUser);
      
      setPassword("");
      toast.success("Perfil actualizado correctamente");
    } catch (err: any) {
      toast.error(err.message || "Error al actualizar el perfil");
    }
  };

  const handleCancelReservation = async (id: number) => {
    const token = localStorage.getItem("token");
    if (!token) return;
    
    try {
      await cancelReservation(id, token);
      // Actualizamos el estado local instantáneamente
      setReservations(prev => prev.map(r => r.id === id ? { ...r, status: "canceled" } : r));
      toast.success("Reserva cancelada", { description: "El cupo ha sido liberado exitosamente." });
    } catch (err) {
      toast.error("No se pudo cancelar la reserva. Intenta nuevamente.");
    }
    setConfirming(null);
  };

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
            className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t.key 
                ? "text-primary font-bold shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab === t.key && (
              <motion.div layoutId="playerTab" className="absolute inset-0 bg-background rounded-lg border border-border -z-10" />
            )}
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>

      {isLoadingReservations && tab !== "profile" ? (
        <div className="py-16 flex flex-col items-center justify-center text-muted-foreground">
          <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
          <p>Cargando tus reservas...</p>
        </div>
      ) : (
        <>
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
            <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-card overflow-x-auto">
              <table className="w-full text-sm min-w-[500px]">
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
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          r.status === "completed" ? "bg-primary/10 text-primary" :
                          r.status === "canceled" ? "bg-destructive/10 text-destructive" :
                          "bg-muted text-muted-foreground"
                        }`}>
                          {r.status === "completed" ? "Completada" : r.status === "canceled" ? "Cancelada" : r.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {tab === "profile" && (
        <form
          onSubmit={handleUpdateProfile}
          className="bg-card border border-border rounded-2xl p-6 max-w-xl space-y-6 shadow-card"
        >
          <div className="space-y-4">
            <h3 className="font-display font-semibold text-lg border-b border-border pb-2">Datos de contacto</h3>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Nombre completo</label>
              <div className="relative">
                <UserIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  className="pl-9" 
                  placeholder="Tu nombre"
                />
              </div>
            </div>
            
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Correo electrónico</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  className="pl-9" 
                  placeholder="tu@email.com"
                />
              </div>
            </div>
            
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Teléfono</label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input 
                  type="tel"
                  value={phone} 
                  onChange={(e) => {
                    setPhone(e.target.value);
                    if (phoneError) setPhoneError('');
                  }} 
                  onBlur={() => validatePhone(phone)}
                  className={`pl-9 ${phoneError ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                  placeholder="+56 9 1234 5678"
                />
              </div>
              {phoneError && <p className="text-xs text-destructive mt-1 ml-1">{phoneError}</p>}
            </div>
          </div>

          <div className="space-y-4 pt-2">
            <h3 className="font-display font-semibold text-lg border-b border-border pb-2">Seguridad</h3>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Nueva contraseña (Opcional)</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input 
                  type="password"
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  className="pl-9" 
                  placeholder="Dejar en blanco para mantener la actual"
                />
              </div>
            </div>
          </div>

          <Button type="submit" className="gradient-hero text-primary-foreground mt-4 w-full sm:w-auto">
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
                  handleCancelReservation(confirming);
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
