import { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Star, Search, CalendarDays, Users, ArrowRight, Clock, CreditCard, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { COMUNAS, formatCLP, todayISO, fetchFieldSchedules, type Field, type ReservationPayload, type Schedule } from "@/lib/api";

interface Props {
  fields: Field[];
  // NOTA: Puedes eliminar reservations, blockedSlots y schedulePrices de los Props en tu componente Padre,
  // ya que ahora la disponibilidad se consulta directamente a la API por cancha.
  onReserve: (r: ReservationPayload) => Promise<void>;
  isLoggedIn: boolean;
  onRequireAuth: () => void;
}

export default function HomeView({ fields, onReserve, isLoggedIn, onRequireAuth }: Props) {
  const [date, setDate] = useState(todayISO());
  const [location, setLocation] = useState("Todas");
  const [query, setQuery] = useState("");

  // Estados para el manejo del modal y la disponibilidad
  const [selectedField, setSelectedField] = useState<Field | null>(null);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [isLoadingSchedules, setIsLoadingSchedules] = useState(false);
  
  // Ahora selectedSlot guarda el objeto Schedule completo, no solo un string
  const [selectedSlot, setSelectedSlot] = useState<Schedule | null>(null);

  // Filtro de canchas según criterio de busqueda
  const filtered = useMemo(() => {
    return fields.filter((f) => {
      const matchLocation = location === "Todas" || f.location === location;
      const matchQuery = !query || f.name.toLowerCase().includes(query.toLowerCase());
      return matchLocation && matchQuery;
    });
  }, [fields, location, query]);

  // Cargar los horarios desde el backend cuando se selecciona una cancha o cambia la fecha en el modal
  useEffect(() => {
    if (selectedField) {
      setIsLoadingSchedules(true);
      setSelectedSlot(null); // Resetea la selección si cambias de día
      fetchFieldSchedules(selectedField.id, date)
        .then(data => setSchedules(data))
        .catch(() => toast.error("Error al cargar la disponibilidad"))
        .finally(() => setIsLoadingSchedules(false));
    }
  }, [selectedField, date]);

  const handleConfirm = async () => {
    if (!selectedField || !selectedSlot) return;
    if (!isLoggedIn) { onRequireAuth(); return; }
    
    try {
      await onReserve({
        fieldId: selectedField.id,
        scheduleId: selectedSlot.schedule_id, // Enviamos el ID del horario a la DB
        date,
        hour: selectedSlot.start_time,
        price: selectedSlot.final_price,
      });

      toast.success("¡Reserva confirmada!", {
        description: `${selectedField.name} • ${date} ${selectedSlot.start_time} hrs. Comprobante enviado a tu correo.`,
        icon: <CheckCircle2 className="w-4 h-4" />,
      });

      // Cerramos el modal
      setSelectedSlot(null);
      setSelectedField(null);
    } catch (err) {
      toast.error("Hubo un error al procesar tu reserva. Intenta de nuevo.");
    }
  };

  return (
    <div className="space-y-12">
      {/* Banner */}
      <section className="relative overflow-hidden rounded-3xl field-pattern text-white shadow-soft">
        <div className="absolute inset-0 bg-linear-to-br from-black/30 via-transparent to-black/40" />
        <div className="relative px-6 py-14 sm:px-12 sm:py-20 max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <span className="inline-block px-3 py-1 text-xs font-semibold bg-white/15 backdrop-blur-sm rounded-full mb-4 border border-white/20">
              ⚽ Reservas en tiempo real
            </span>
            <h1 className="font-display text-3xl sm:text-5xl font-bold leading-tight mb-4">
              Asegura tu cancha, evita los dobles cobros y juega sin preocupaciones.
            </h1>
            <p className="text-white/90 text-base sm:text-lg max-w-xl">
              Encuentra y reserva canchas de fútbol amateur en Santiago. Pago seguro, confirmación instantánea.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Filtros */}
      <section className="bg-card shadow-card rounded-2xl p-4 sm:p-6 -mt-6 relative z-10 mx-2 sm:mx-6 border border-border">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="md:col-span-2">
            <label className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5" /> Buscar cancha
            </label>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ej: Cancha El Maestro"
              className="w-full h-11 px-3 rounded-xl bg-secondary border border-border text-sm focus:outline-hidden focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">
              <CalendarDays className="w-3.5 h-3.5" /> Fecha
            </label>
            <input
              type="date"
              value={date}
              min={todayISO()}
              onChange={(e) => setDate(e.target.value)}
              className="w-full h-11 px-3 rounded-xl bg-secondary border border-border text-sm focus:outline-hidden focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" /> Comuna
            </label>
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full h-11 px-3 rounded-xl bg-secondary border border-border text-sm focus:outline-hidden focus:ring-2 focus:ring-primary/40"
            >
              {COMUNAS.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>
      </section>

      {/* Cuadrícula de canchas */}
      <section className="space-y-4">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold">Canchas disponibles</h2>
            <p className="text-sm text-muted-foreground">{filtered.length} resultados para el {date}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((c, i) => (
            <motion.article
              key={c.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="bg-card border border-border rounded-2xl overflow-hidden shadow-card hover:shadow-glow hover:-translate-y-1 transition-all flex flex-col"
            >
              <div className="relative h-44 overflow-hidden shrink-0">
                <img src={c.image} alt={c.name} className="w-full h-full object-cover" loading="lazy" />
                <div className="absolute top-3 left-3 flex gap-2">
                  <span className="px-2.5 py-1 text-xs font-medium bg-background/90 backdrop-blur-sm rounded-full">
                    {c.surface}
                  </span>
                </div>
                <div className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 bg-background/90 backdrop-blur-sm rounded-full text-xs font-semibold">
                  <Star className="w-3 h-3 fill-accent text-accent" /> {c.rating}
                </div>
              </div>
              <div className="p-4 flex flex-col grow justify-between space-y-4">
                <div>
                  <h3 className="font-display font-semibold text-lg leading-tight">{c.name}</h3>
                  <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                    <MapPin className="w-3.5 h-3.5" /> {c.location}
                  </p>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm gap-2">
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Users className="w-3.5 h-3.5" /> {c.capacity} jugadores
                    </span>
                    <div className="text-right">
                      <span className="text-xs text-muted-foreground mr-1">Desde</span>
                      <span className="font-bold text-primary">{formatCLP(c.price)}<span className="text-xs text-muted-foreground font-normal">/hr</span></span>
                    </div>
                  </div>
                  <Button onClick={() => setSelectedField(c)} className="w-full gradient-hero text-primary-foreground group">
                    Ver disponibilidad
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </div>
            </motion.article>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            No encontramos canchas para esos filtros.
          </div>
        )}
      </section>

      {/* Dialogo de disponibilidad */}
      <Dialog open={!!selectedField} onOpenChange={(o) => { if (!o) { setSelectedField(null); setSelectedSlot(null); } }}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedField && (
            <>
              <DialogHeader>
                <DialogTitle className="font-display text-2xl flex items-center gap-2">
                  {selectedField.name}
                </DialogTitle>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" /> {selectedField.location} • {selectedField.surface}
                </p>
              </DialogHeader>

              <div className="space-y-5 pt-2">
                <div className="flex items-center justify-between bg-secondary rounded-xl p-3 border border-border">
                  <div className="flex items-center gap-2 text-sm">
                    <CalendarDays className="w-4 h-4 text-primary" />
                    <span className="font-medium">Fecha:</span>
                    <input
                      type="date"
                      value={date}
                      min={todayISO()}
                      onChange={(e) => { setDate(e.target.value); setSelectedSlot(null); }}
                      className="bg-card border border-border rounded-md px-2 py-1 text-sm focus:ring-2 focus:ring-primary/40 focus:outline-hidden"
                    />
                  </div>
                  {selectedSlot && (
                    <span className="text-sm font-bold text-primary">{formatCLP(selectedSlot.final_price)}/hr</span>
                  )}
                </div>

                <div>
                  <p className="text-sm font-medium mb-3 flex items-center gap-1.5">
                    <Clock className="w-4 h-4" /> Bloques horarios
                  </p>
                  
                  {isLoadingSchedules ? (
                    <div className="py-8 flex flex-col items-center justify-center text-muted-foreground">
                      <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
                      <p className="text-sm">Buscando disponibilidad...</p>
                    </div>
                  ) : schedules.length === 0 ? (
                    <div className="py-8 text-center bg-secondary/50 rounded-xl border border-border border-dashed">
                      <p className="text-muted-foreground text-sm">El dueño no ha habilitado horarios para este día.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                      {schedules.map((s) => {
                        const isSelected = selectedSlot?.schedule_id === s.schedule_id;
                        const isAvailable = s.status === 'available';
                        const isReserved = s.status === 'reserved';
                        const isBlocked = s.status === 'maintenance' || s.status === 'closed';

                        return (
                          <button
                            key={s.schedule_id}
                            disabled={!isAvailable}
                            onClick={() => setSelectedSlot(s)}
                            className={`relative h-12 rounded-lg text-sm font-medium border transition-all ${
                              isSelected
                                ? "bg-primary text-primary-foreground border-primary shadow-glow"
                                : isAvailable
                                  ? "bg-primary/10 text-primary border-primary/30 hover:bg-primary/20"
                                  : isReserved
                                    ? "bg-muted text-muted-foreground border-border line-through cursor-not-allowed opacity-60"
                                    : "bg-destructive/10 text-destructive border-destructive/30 cursor-not-allowed"
                            }`}
                          >
                            <div className="flex flex-col items-center gap-1">
                              <span>{s.start_time}</span>
                              <span className={`text-[11px] ${isSelected ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                                {formatCLP(s.final_price)}
                              </span>
                            </div>
                            {isBlocked && (
                              <span className="absolute -top-1 -right-1 text-[9px] bg-destructive text-destructive-foreground px-1 rounded">M</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-primary/10 border border-primary/30" /> Disponible</span>
                    <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-muted border border-border" /> Reservado</span>
                    <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-destructive/10 border border-destructive/30" /> Mantención</span>
                  </div>
                </div>

                <AnimatePresence>
                  {selectedSlot && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="bg-linear-to-br from-primary/10 to-accent/10 border border-primary/20 rounded-2xl p-5 space-y-3"
                    >
                      <h4 className="font-display font-semibold flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-primary" /> Resumen de tu reserva
                      </h4>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div><span className="text-muted-foreground">Cancha:</span><br /><span className="font-medium">{selectedField.name}</span></div>
                        <div><span className="text-muted-foreground">Fecha:</span><br /><span className="font-medium">{date}</span></div>
                        <div><span className="text-muted-foreground">Hora:</span><br /><span className="font-medium">{selectedSlot.start_time} hrs</span></div>
                        <div><span className="text-muted-foreground">Total:</span><br /><span className="font-bold text-primary text-lg">{formatCLP(selectedSlot.final_price)}</span></div>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground bg-background/60 rounded-lg p-2 border border-border">
                        <CreditCard className="w-3.5 h-3.5" /> Pago seguro al confirmar (Webpay / MercadoPago)
                      </div>
                      <Button onClick={handleConfirm} className="w-full gradient-hero text-primary-foreground h-11 text-base">
                        Confirmar reserva
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
