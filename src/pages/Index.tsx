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

const Index = () => {
  // Estado de las vistas
  const [view, setView] = useState<ViewKey>("home");
  const [isAdmin, setIsAdmin] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);

  // Estado del usuario y datos globales
  const [user, setUser] = useState<{ id: number; name: string; email: string, roles: string[], phone?: string } | null>(null);
  const [fields, setFields] = useState<Field[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);

  // Token de acceso actual (lo leemos de localStorage para pasarlo a AdminView)
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  // Cargar datos iniciales
  useEffect(() => {
    const loadData = async () => {
      try {
        const fieldsData = await fetchFields();
        setFields(fieldsData);

        const currentToken = localStorage.getItem("token");
        if (currentToken) {
          const reservationsData = await fetchReservations(currentToken);
          setReservations(reservationsData);
        }
      } catch (err) {
        console.error("Failed to load initial data", err);
      }
    };

    loadData();

    // Recuperar sesión guardada
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      setIsAdmin(parsedUser.roles.includes("admin"));
    }
  }, []);

  // Manejar reserva de canchas
  const handleReserve = useCallback(async (r: ReservationPayload) => {
    try {
      const currentToken = localStorage.getItem("token");
      if (!currentToken) throw new Error("No token");

      const res = await createReservation(r, currentToken);
      setReservations((prev) => [...prev, res]);
    } catch (err) {
      console.error(err);
      throw err; // Lanzamos el error para que HomeView muestre el toast de fallo
    }
  }, []);

  // Manejar Login / Registro
  const handleAuth = useCallback(async (type: 'signup' | 'signin', data: any) => {
    try {
      let result;

      if (type === 'signup') {
        await signUp(data);
        setAuthOpen(false);
        toast.success("Cuenta creada exitosamente. Por favor, inicia sesión.");
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
    } catch (err: any) {
      toast.error(err.message || "Error de autenticación");
      console.error(err);
    }
  }, []);

  // Manejar cierre de sesión
  const handleLogout = useCallback(() => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setUser(null);
    setView("home");
    setIsAdmin(false);
    setReservations([]);
  }, []);

  // Cancelar una reserva
  const handleCancel = useCallback(async (id: number) => {
    const currentToken = localStorage.getItem("token");
    if (!currentToken) return;
    
    try {
      await cancelReservation(id, currentToken);

      // Actualizar estado local para reflejar la eliminación
      setReservations(prev => prev.map(r => r.id === id ? { ...r, status: "canceled" } : r));
    } catch (err) {
      console.error("Failed to cancel:", err);
      toast.error("No se pudo cancelar la reserva. Intenta nuevamente.");
    }
  }, []);

  // Añadir una cancha nueva (Solo Admin)
  const handleAddCourt = useCallback(async (f: Omit<Field, "id" | "ownerId" | "rating" | "latitude" | "longitude">) => {
    const currentToken = localStorage.getItem("token");
    if (!currentToken) return;

    try {
      const payload = {
        ...f,
        rating: 5.0,
        latitude: -33.4489, 
        longitude: -70.6693,
      };

      const field = await createField(payload, currentToken);
      setFields(prev => [...prev, field]);
      toast.success("Cancha registrada exitosamente");
    } catch (err) {
      console.error("Failed to add field:", err);
      toast.error("Error al registrar la cancha");
    }
  }, []);

  // Filtramos las reservas para mostrar solo las del usuario en PlayerView
  const userReservations = reservations.filter((r) => !user || r.playerId === user.id);

  return (
    <div className="min-h-screen bg-background">
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
                onReserve={handleReserve}
                isLoggedIn={!!user}
                onRequireAuth={() => setAuthOpen(true)}
              />
            )}

            {view === "player" && (
              <PlayerView
                isLoggedIn={!!user}
                userId={user?.id}
                userName={typeof user?.name === 'string' ? user.name : ""}
                userEmail={user?.email || ""}
                userPhone={user?.phone || ""}
                onUserUpdate={setUser}
                onLoginClick={() => setAuthOpen(true)}
              />
            )}
            
            {view === "admin" && isAdmin && (
              <AdminView
                token={token || ""}
                fields={fields}
                reservations={reservations}
                onAddCourt={handleAddCourt}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      <footer className="border-t border-border mt-12 py-6 text-center text-xs text-muted-foreground">
        FurbitoApp © {new Date().getFullYear()} • MVP — Ingeniería de Software II
      </footer>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} onAuth={handleAuth} />
      <Toaster position="bottom-right" />
    </div>
  );
};

export default Index;
