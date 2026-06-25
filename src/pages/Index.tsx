import { useEffect, useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Toaster } from "sonner";
import Navbar, { type ViewKey } from "@/components/furbito/Navbar";
import HomeView from "@/components/furbito/HomeView";
import PlayerView from "@/components/furbito/PlayerView";
import AdminView from "@/components/furbito/AdminView";
import AuthModal from "@/components/furbito/AuthModal";

import { createField, createReservation, fetchFields, fetchReservations, cancelReservation, signIn, signUp, type Field, type Reservation, type ReservationPayload } from "@/lib/api";
import { toast } from "sonner";

const slotKey = (f: number, d: string, h: string) => `${f}|${d}|${h}`;

const Index = () => {
  // estado de las vistas
  // se guarda el estado de la página web, qué vista mostrar
  const [view, setView] = useState<ViewKey>("home");

  // define si se debe mostrar el apartado de admin o no,
  // dependiendo del rol del usuario
  const [isAdmin, setIsAdmin] = useState(false);

  // switch que determina si se muestra el dialogo
  // de inicio de sesión / registro
  const [authOpen, setAuthOpen] = useState(false);

  // se guarda el estado del usuario para no
  // repetir queries a la base de datos
  const [user, setUser] = useState<{ id: number; name: string; email: string, roles: string[], phone?: string } | null>(null);

  // lista de canchas disponibles en la plataforma
  const [fields, setFields] = useState<Field[]>([]);

  // lista de reservas hechas por el usuario
  const [reservations, setReservations] = useState<Reservation[]>([]);

  // estado del horario de las canchas (si está reservado o no)
  const [blockedSlots, setBlockedSlots] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set();
    try {
      const stored = localStorage.getItem("furbitoBlockedSlots");
      return new Set(stored ? JSON.parse(stored) : []);
    } catch {
      return new Set();
    }
  });

  // precios por horario configurados por el admin
  const [schedulePrices, setSchedulePrices] = useState<Record<string, number>>(() => {
    if (typeof window === "undefined") return {};
    try {
      return JSON.parse(localStorage.getItem("furbitoSchedulePrices") || "{}") as Record<string, number>;
    } catch {
      return {};
    }
  });

  // Este hook corre al inicio de la página web
  // revisa si el usuario está loggeado, e intenta obtener los datos
  // del usuario (reservas, etc)
  useEffect(() => {
    const loadData = async () => {
      try {
        // query para obtener las canchas disponibles
        const fieldsData = await fetchFields();
        setFields(fieldsData);

        const token = localStorage.getItem("token");
        if (token) {
          // query para obtener las reservas del usuario
          const reservationsData = await fetchReservations(token);
          setReservations(reservationsData);
        }
      } catch (err) {
        console.error("Failed to load initial data", err);
      }
    };

    loadData();

    // cargar la información del usuario guardada en el navegador
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      const user = JSON.parse(savedUser);
      setUser(user);
      setIsAdmin(user.roles.includes("admin"));
    }

  }, []);

  // Al momento de reservar una cancha, este hook
  // le manda la información a la base de datos
  //
  // en caso de que el usuario no esté loggeado
  // devuelve un error
  const handleReserve = useCallback(async (r: ReservationPayload) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No token");

      const res = await createReservation(r, token);
      setReservations((prev) => [...prev, res]);
    } catch (err) {
      console.log(err);
    }
  }, []);

  // Al momento de iniciar sesión / registrarse
  // se le manda la información necesaria a la base de datos
  //
  // si es inicio de sesión, se manda email y contraseña
  //
  // si es registro, se manda el nombre, email y contraseña
  const handleAuth = useCallback(async (type: 'signup' | 'signin', data: any) => {
    try {
      let result;

      if (type == 'signup') {
        // TODO: despues de registrarse, iniciar sesión automáticamente
        await signUp(data);
        setAuthOpen(false);
        return;
      } else {
        result = await signIn(data);
      }

      localStorage.setItem("user", JSON.stringify(result.user));
      localStorage.setItem("token", result.token);

      setAuthOpen(false);
      setUser(result.user);
      setIsAdmin(result.user.roles.includes("admin"));

      try {
        const userReservations = await fetchReservations(result.token);
        setReservations(userReservations);
      } catch (fetcherr) {
        console.error("Failed to fetch reservations after login:", fetcherr);
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  // Cuando se cierra sesión
  // se borra los datos guardados en el navegador
  // y la página se devuelve al inicio
  const handleLogout = useCallback(() => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setUser(null);
    setView("home");
    setIsAdmin(false);
    setReservations([]);
  }, []);


  // Cancelar reserva: llama a la API para eliminar la reserva y libera el horario
  const handleCancel = useCallback(async (id: number) => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const resv = reservations.find(r => r.id === id);

      // calcular horas hasta la reserva (para mensaje)
      let hoursUntil = Infinity;
      if (resv) {
        const dt = new Date(`${resv.date}T${resv.hour}:00`);
        const now = new Date();
        hoursUntil = (dt.getTime() - now.getTime()) / (1000 * 60 * 60);
      }

      await cancelReservation(id, token);

      // actualizar estado local para reflejar la eliminación
      setReservations(prev => prev.map(r => r.id === id ? { ...r, status: "canceled" } : r));

      if (hoursUntil >= 24) {
        toast.success("Reserva cancelada", { description: "Horario liberado sin multa." });
      } else {
        toast("Reserva cancelada. Cancelación con menos de 24h; puede aplicar multa.");
      }
    } catch (err) {
      console.error("Failed to cancel:", err);
      toast("No se pudo cancelar la reserva. Intenta nuevamente.");
    }
  }, [reservations]);

  // Hook para añadir una cancha nueva (modo admin)
  // devuelve error en caso de no haber iniciado sesión
  // devuelve error desde la base de datos en caso de no ser admin
  const handleAddField = useCallback(async (f: Omit<Field, "id" | "ownerId" | "rating" | "latitude" | "longitude">) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      // TODO: añadir funcionalidad para rellenar longitud y latitud (ubicación)
      const payload = {
        ...f,
        rating: 5,
        latitude: 0,
        longitude: 0,
      };

      const field = await createField(payload, token);
      setFields(prev => [...prev, field]);
    } catch (err) {
      console.error("Failed to add field:", err);
    }
  }, []);

  // En caso de seleccionar un bloque de horario
  // se elimina el horario de la lista disponible
  //
  // si se elimina la reserva, se vuelve a añadir el bloque de horario
  const handleToggleBlock = useCallback((fieldId: number, date: string, hour: string) => {
    setBlockedSlots((prev) => {
      const k = slotKey(fieldId, date, hour);
      const next = new Set(prev);
      next.has(k) ? next.delete(k) : next.add(k);
      
      // Guardar en localStorage
      localStorage.setItem("furbitoBlockedSlots", JSON.stringify(Array.from(next)));
      
      return next;
    });
  }, []);

  // TODO: hacer esto en backend
  // filtrar las reservas por el usuario
  const userReservations = reservations.filter((r) => !user || r.playerId === user.id);

  return (
    <div className="min-h-screen bg-background">
      <Toaster position="top-right" richColors closeButton />
      <Navbar
        active={view}
        onChange={setView}
        isAdmin={isAdmin}
        onToggleAdmin={(v) => { setIsAdmin(v); if (!v && view === "admin") setView("home"); }}
        isLoggedIn={!!user}
        userName={user?.name || ""}
        onAuthClick={() => setAuthOpen(true)}
        onLogout={handleLogout}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
          >
            {view === "home" && (
              <HomeView
                fields={fields}
                reservations={reservations}
                blockedSlots={blockedSlots}
                schedulePrices={schedulePrices}
                onReserve={handleReserve}
                isLoggedIn={!!user}
                onRequireAuth={() => setAuthOpen(true)}
              />
            )}
            {view === "player" && (
              <PlayerView
                isLoggedIn={!!user}
                userName={user?.name || ""}
                userEmail={user?.email || ""}
                userPhone={user?.phone || ""}
                reservations={userReservations}
                onCancel={handleCancel}
                onUpdateProfile={(name, email, phone) => {
                  const next = { ...(user || {}), name, email, ...(phone ? { phone } : {}) } as any;
                  setUser(next);
                  try {
                    localStorage.setItem("user", JSON.stringify(next));
                  } catch (err) {
                    console.error("Failed to persist user to localStorage", err);
                  }
                }}
                onLoginClick={() => setAuthOpen(true)}
              />
            )}
            {view === "admin" && isAdmin && (
              <AdminView
                fields={fields}
                reservations={reservations}
                blockedSlots={blockedSlots}
                schedulePrices={schedulePrices}
                onAddCourt={handleAddField}
                onToggleBlock={handleToggleBlock}
                onSetSchedulePrice={(fieldId, date, hour, price) => {
                  const key = slotKey(fieldId, date, hour);
                  setSchedulePrices((prev) => {
                    const next = { ...prev };
                    if (price === undefined) {
                      delete next[key];
                    } else {
                      next[key] = price;
                    }
                    localStorage.setItem("furbitoSchedulePrices", JSON.stringify(next));
                    return next;
                  });
                }}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      <footer className="border-t border-border mt-12 py-6 text-center text-xs text-muted-foreground">
        FurbitoApp © {new Date().getFullYear()} • MVP — Ingeniería de Software II
      </footer>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} onAuth={handleAuth} />
    </div>
  );
};

export default Index;
