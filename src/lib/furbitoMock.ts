export type Field = {
  id: number;
  ownerId: number;
  name: string;

  location: string;
  latitude: number;
  longitude: number;

  surface: "Sintética" | "Pasto natural" | "Cemento";
  price: number;
  image: string;
  rating: number;
  capacity: number;
};

export type Reservation = {
  id: number;
  fieldId: number;
  playerId: number;
  date: string; // YYYY-MM-DD
  hour: string; // "18:00"
  price: number;
  status: "confirmed" | "canceled" | "completed";
};

export const COMUNAS = [
  "Todas",
  "Providencia",
  "Las Condes",
  "Ñuñoa",
  "Santiago Centro",
  "La Florida",
  "Maipú",
  "Vitacura",
  "San Miguel",
];

export const HOURS = [
  "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00",
  "16:00", "17:00", "18:00", "19:00", "20:00", "21:00", "22:00", "23:00",
];

export const INITIAL_COURTS: Court[] = [
  {
    id: "c1",
    name: "Cancha El Maestro",
    comuna: "Ñuñoa",
    surface: "Sintética",
    pricePerHour: 35000,
    rating: 4.8,
    capacity: "Fútbol 7",
    image: "https://images.unsplash.com/photo-1551958219-acbc608c6377?w=800&q=80",
  },
  {
    id: "c2",
    name: "Complejo Providencia",
    comuna: "Providencia",
    surface: "Sintética",
    pricePerHour: 42000,
    rating: 4.7,
    capacity: "Fútbol 5",
    image: "https://images.unsplash.com/photo-1459865264687-595d652de67e?w=800&q=80",
  },
  {
    id: "c3",
    name: "Las Condes Sport",
    comuna: "Las Condes",
    surface: "Pasto natural",
    pricePerHour: 55000,
    rating: 4.9,
    capacity: "Fútbol 11",
    image: "https://images.unsplash.com/photo-1486286701208-1d58e9338013?w=800&q=80",
  },
  {
    id: "c4",
    name: "Centro Deportivo Maipú",
    comuna: "Maipú",
    surface: "Sintética",
    pricePerHour: 28000,
    rating: 4.4,
    capacity: "Fútbol 7",
    image: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&q=80",
  },
  {
    id: "c5",
    name: "La Florida Arena",
    comuna: "La Florida",
    surface: "Sintética",
    pricePerHour: 30000,
    rating: 4.5,
    capacity: "Fútbol 5",
    image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&q=80",
  },
  {
    id: "c6",
    name: "Vitacura Premium",
    comuna: "Vitacura",
    surface: "Pasto natural",
    pricePerHour: 60000,
    rating: 5.0,
    capacity: "Fútbol 7",
    image: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&q=80",
  },
];

const today = new Date();
const fmt = (d: Date) => d.toISOString().slice(0, 10);
const addDays = (d: Date, n: number) => {
  const x = new Date(d); x.setDate(x.getDate() + n); return x;
};

export const INITIAL_RESERVATIONS: Reservation[] = [
  {
    id: "r1", courtId: "c1", courtName: "Cancha El Maestro",
    date: fmt(addDays(today, 2)), hour: "19:00", price: 35000,
    playerName: "Jugador Demo", status: "Confirmada",
  },
  {
    id: "r2", courtId: "c3", courtName: "Las Condes Sport",
    date: fmt(addDays(today, 5)), hour: "21:00", price: 55000,
    playerName: "Jugador Demo", status: "Confirmada",
  },
  {
    id: "r3", courtId: "c2", courtName: "Complejo Providencia",
    date: fmt(addDays(today, -7)), hour: "20:00", price: 42000,
    playerName: "Jugador Demo", status: "Completada",
  },
  {
    id: "r4", courtId: "c4", courtName: "Centro Deportivo Maipú",
    date: fmt(addDays(today, -15)), hour: "18:00", price: 28000,
    playerName: "Jugador Demo", status: "Completada",
  },
  // Today reservations for admin
  {
    id: "r5", courtId: "c1", courtName: "Cancha El Maestro",
    date: fmt(today), hour: "17:00", price: 35000,
    playerName: "Felipe Soto", status: "Confirmada",
  },
  {
    id: "r6", courtId: "c1", courtName: "Cancha El Maestro",
    date: fmt(today), hour: "20:00", price: 35000,
    playerName: "Carla Pino", status: "Confirmada",
  },
  {
    id: "r7", courtId: "c2", courtName: "Complejo Providencia",
    date: fmt(today), hour: "19:00", price: 42000,
    playerName: "Diego Rojas", status: "Confirmada",
  },
];

export const formatCLP = (n: number) =>
  n.toLocaleString("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 });

export const todayISO = () => fmt(new Date());
