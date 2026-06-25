import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { CalendarDays, DollarSign, MapPin, Plus, Trophy, Ban, Activity, Clock, User as UserIcon, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { COMUNAS, HOURS, formatCLP, todayISO, type Field, type Reservation } from "@/lib/api";
import { toast } from "sonner";

interface Props {
  fields: Field[];
  reservations: Reservation[];
  blockedSlots: Set<string>;
  schedulePrices: Record<string, number>;
  onAddCourt: (c: Omit<Field, "id" | "ownerId" | "ownerName" | "rating" | "latitude" | "longitude">) => void;
  onToggleBlock: (fieldId: number, date: string, hour: string) => void;
  onSetSchedulePrice: (fieldId: number, date: string, hour: string, price?: number) => void;
}

const slotKey = (fId: number, date: string, hour: string) => `${fId}|${date}|${hour}`;

export default function AdminView({ fields, reservations, blockedSlots, schedulePrices, onAddCourt, onToggleBlock, onSetSchedulePrice }: Props) {
  const [addOpen, setAddOpen] = useState(false);

  // campos para configurar los bloques de horario de las respectivas canchas
  const [scheduleDate, setScheduleDate] = useState(todayISO());
  const [scheduleField, setScheduleField] = useState(fields[0]?.id || 0);
  const [priceInputs, setPriceInputs] = useState<Record<string, string>>({});

  const selectedField = fields.find((field) => field.id === scheduleField);

  useEffect(() => {
    const basePrice = selectedField?.price ?? 0;
    setPriceInputs(Object.fromEntries(HOURS.map((hour) => [hour, String(schedulePrices[slotKey(scheduleField, scheduleDate, hour)] ?? basePrice)])));
  }, [selectedField, scheduleDate, scheduleField, schedulePrices]);

  const today = todayISO();

  // filtrar todas las reservas que se han confirmado para hoy
  const todayReservations = useMemo(
    () => reservations.filter((r) => r.date === today && r.status === "confirmed")
      .sort((a, b) => a.hour.localeCompare(b.hour)),
    [reservations, today]
  );

  // cantidad de dinero que se ha ganado durante el día
  const todayIncome = todayReservations.reduce((s, r) => s + r.price, 0);

  return (
    <div className="space-y-8">
      {/* Cabecera */}
      <div>
        <h1 className="font-display text-3xl font-bold">Panel de administración</h1>
        <p className="text-muted-foreground">Gestiona tus canchas, reservas y horarios.</p>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Reservas de hoy", value: todayReservations.length, icon: CalendarDays, color: "from-primary to-primary-glow" },
          { label: "Ingresos del día", value: formatCLP(todayIncome), icon: DollarSign, color: "from-accent to-orange-400" },
          { label: "Canchas activas", value: fields.length, icon: Trophy, color: "from-emerald-500 to-teal-500" },
        ].map((m, i) => (
          <motion.div
            key={m.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="bg-card border border-border rounded-2xl p-5 shadow-card hover:shadow-glow transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{m.label}</p>
                <p className="font-display font-bold text-2xl mt-1">{m.value}</p>
              </div>
              <div className={`w-12 h-12 rounded-xl bg-linear-to-br ${m.color} flex items-center justify-center text-white`}>
                <m.icon className="w-6 h-6" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Manejo de canchas */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-bold flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary" /> Mis canchas
          </h2>
          <Button onClick={() => setAddOpen(true)} className="gradient-hero text-primary-foreground">
            <Plus className="w-4 h-4 mr-1" /> Añadir nueva cancha
          </Button>
        </div>

        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-card">
          <table className="w-full text-sm">
            <thead className="bg-secondary text-xs uppercase text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3">Cancha</th>
                <th className="text-left px-4 py-3">Comuna</th>
                <th className="text-left px-4 py-3">Superficie</th>
                <th className="text-left px-4 py-3">Precio</th>
                <th className="text-left px-4 py-3">Estado</th>
              </tr>
            </thead>
            <tbody>
              {fields.map((c) => (
                <tr key={c.id} className="border-t border-border hover:bg-secondary/40">
                  <td className="px-4 py-3 font-medium flex items-center gap-3">
                    <img src={c.image} alt="" className="w-10 h-10 rounded-lg object-cover" />
                    {c.name}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground"><MapPin className="w-3.5 h-3.5 inline mr-1" />{c.location}</td>
                  <td className="px-4 py-3">{c.surface}</td>
                  <td className="px-4 py-3 font-semibold text-primary">{formatCLP(c.price)}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary flex items-center gap-1 w-fit">
                      <Activity className="w-3 h-3" /> Activa
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Agenda del día */}
      <section className="space-y-4">
        <h2 className="font-display text-xl font-bold flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" /> Agenda de hoy ({today})
        </h2>
        <div className="bg-card border border-border rounded-2xl divide-y divide-border shadow-card">
          {todayReservations.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">No hay reservas para hoy.</div>
          )}
          {todayReservations.map((r) => (
            <div key={r.id} className="p-4 flex items-center justify-between hover:bg-secondary/30 transition-colors">
              <div className="flex items-center gap-4">
                <div className="font-display font-bold text-lg w-16 text-primary">{r.hour}</div>
                <div>
                  <p className="font-medium">{r.fieldName}</p>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <UserIcon className="w-3.5 h-3.5" /> {r.playerName}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-semibold text-primary">{formatCLP(r.price)}</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                  {r.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Configuración de horarios */}
      <section className="space-y-4">
        <h2 className="font-display text-xl font-bold flex items-center gap-2">
          <Wrench className="w-5 h-5 text-accent" /> Configuración de horarios
        </h2>
        <div className="bg-card border border-border rounded-2xl p-5 shadow-card space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Cancha</label>
              <select
                value={scheduleField}
                onChange={(e) => setScheduleField(+e.target.value)}
                className="w-full h-10 px-3 rounded-lg bg-secondary border border-border text-sm"
              >
                {fields.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Fecha</label>
              <input
                type="date"
                value={scheduleDate}
                min={today}
                onChange={(e) => setScheduleDate(e.target.value)}
                className="w-full h-10 px-3 rounded-lg bg-secondary border border-border text-sm"
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Haz clic en un bloque para bloquearlo/desbloquearlo por mantención.</p>
          <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-8 gap-2">
            {HOURS.map((h) => {
              const blocked = blockedSlots.has(slotKey(scheduleField, scheduleDate, h));
              const taken = reservations.some((r) => r.fieldId === scheduleField && r.date === scheduleDate && r.hour === h && r.status === "confirmed");
              return (
                <button
                  key={h}
                  disabled={taken}
                  onClick={() => {
                    onToggleBlock(scheduleField, scheduleDate, h);
                    toast.success(blocked ? "Bloque liberado" : "Bloque marcado en mantención");
                  }}
                  className={`h-12 rounded-lg text-sm font-medium border transition-all flex items-center justify-center gap-1 ${taken ? "bg-muted text-muted-foreground border-border cursor-not-allowed opacity-60" :
                    blocked ? "bg-orange-500/20 text-orange-600 dark:text-orange-400 border-orange-500/50 font-semibold shadow-md" :
                      "bg-primary/10 text-primary border-primary/30 hover:bg-primary/20"
                    }`}
                  title={taken ? "Horario ocupado" : blocked ? "Hacer clic para liberar" : "Hacer clic para bloquear"}
                >
                  {h}
                  {blocked && <Wrench className="w-3.5 h-3.5" />}
                </button>
              );
            })}
          </div>

          <div className="bg-card border border-border rounded-2xl p-4 shadow-card">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <div>
                <p className="text-sm text-muted-foreground">Precio base estándar</p>
                <p className="text-xl font-semibold">{selectedField ? formatCLP(selectedField.price) : "$0"}</p>
              </div>
              <p className="text-sm text-muted-foreground">Modifica el precio por hora para esta cancha y fecha.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
              {HOURS.map((h) => {
                const currentKey = slotKey(scheduleField, scheduleDate, h);
                const currentPrice = selectedField ? schedulePrices[currentKey] ?? selectedField.price : 0;
                const overridden = schedulePrices[currentKey] !== undefined;
                return (
                  <div key={h} className="rounded-3xl border border-border bg-secondary p-3">
                    <div className="flex items-center justify-between mb-2 text-sm text-muted-foreground">
                      <span>{h}</span>
                      {overridden && <span className="rounded-full bg-primary/10 text-primary px-2 py-0.5 text-[11px]">modificado</span>}
                    </div>
                    <Input
                      type="number"
                      min={0}
                      value={priceInputs[h] ?? ""}
                      onChange={(e) => setPriceInputs((prev) => ({ ...prev, [h]: e.target.value }))}
                      onBlur={() => {
                        const parsed = Number(priceInputs[h]);
                        if (Number.isNaN(parsed) || parsed < 0) return;

                        if (selectedField) {
                          const basePrice = selectedField.price;
                          if (parsed === basePrice) {
                            onSetSchedulePrice(scheduleField, scheduleDate, h, undefined);
                            toast.success("Precio restaurado", { description: `${h} hereda el precio base ${formatCLP(basePrice)}` });
                          } else {
                            onSetSchedulePrice(scheduleField, scheduleDate, h, parsed);
                            toast.success("Precio actualizado", { description: `${h} ahora cuesta ${formatCLP(parsed)}` });
                          }
                        }
                      }}
                      className="w-full"
                    />
                    <p className="mt-2 text-xs text-muted-foreground">Actual: {formatCLP(currentPrice)}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <AddFieldDialog open={addOpen} onClose={() => setAddOpen(false)} onAdd={onAddCourt} />
    </div>
  );
}

// Al apretar el botón para añadir cancha, se abre este dialogo
// para introducir la información de la cancha
function AddFieldDialog({ open, onClose, onAdd }: { open: boolean; onClose: () => void; onAdd: (c: Omit<Field, "id" | "ownerId" | "ownerName" | "rating" | "latitude" | "longitude">) => void }) {
  const [name, setName] = useState("");
  const [location, setLocation] = useState("Providencia");
  const [surface, setSurface] = useState<Field["surface"]>("Sintética");
  const [price, setPrice] = useState(30000);
  const [capacity, setCapacity] = useState(7);
  const [image, setImage] = useState("https://images.unsplash.com/photo-1551958219-acbc608c6377?w=800&q=80");

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">Añadir nueva cancha</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!name) return;
            onAdd({ name, location, surface, price, capacity, image });
            toast.success("Cancha registrada");
            setName("");
            onClose();
          }}
          className="space-y-3 pt-2"
        >
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre de la cancha" required />
          <select value={location} onChange={(e) => setLocation(e.target.value)} className="w-full h-10 px-3 rounded-lg bg-secondary border border-border text-sm">
            {COMUNAS.filter((c) => c !== "Todas").map((c) => <option key={c}>{c}</option>)}
          </select>
          <div className="grid grid-cols-2 gap-3">
            <select value={surface} onChange={(e) => setSurface(e.target.value as Field["surface"])} className="h-10 px-3 rounded-lg bg-secondary border border-border text-sm">
              <option>Sintética</option><option>Pasto natural</option><option>Cemento</option>
            </select>
            <select value={capacity} onChange={(e) => setCapacity(+e.target.value)} className="h-10 px-3 rounded-lg bg-secondary border border-border text-sm">
              <option>5</option><option>7</option><option>11</option>
            </select>
          </div>
          <Input type="number" value={price} onChange={(e) => setPrice(Number(e.target.value))} placeholder="Precio por hora (CLP)" />
          <Input value={image} onChange={(e) => setImage(e.target.value)} placeholder="URL de imagen" />
          <Button type="submit" className="w-full gradient-hero text-primary-foreground">Registrar cancha</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
