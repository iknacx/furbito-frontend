const BASE_URL = import.meta.env.VITE_API_URL;

export type Field = {
  id: number;
  name: string;
  ownerId: number;
  ownerName: string;

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
  fieldName: string;
  playerId: number;
  playerName: string;
  date: string; // YYYY-MM-DD
  hour: string; // "18:00"
  price: number;
  status: "confirmed" | "canceled" | "completed";
};


export type ReservationPayload = Pick<Reservation, "fieldId" | "date" | "hour" | "price">;

export const signUp = async (userData: any) => {
  const res = await fetch(`${BASE_URL}/api/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(userData),
  });

  if (!res.ok) throw new Error("Signup failed");
  return res.json();
}

export const signIn = async (credentials: any) => {
  const res = await fetch(`${BASE_URL}/api/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });

  if (!res.ok) throw new Error("Login failed");
  return res.json();
};

export const fetchFields = async (): Promise<Field[]> => {
  console.log(`${BASE_URL}/api/fields`)
  const res = await fetch(`${BASE_URL}/api/fields`);
  if (!res.ok) throw new Error("Failed to fetch fields");

  // console.log(await res.bytes());

  return res.json();
}

export const createField = async (field: Omit<Field, 'id' | 'ownerId' | 'rating'>, token: string) => {
  const res = await fetch(`${BASE_URL}/api/fields`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify(field),
  });

  if (!res.ok) throw new Error("Failed to create field");
  return res.json();
};

export const fetchReservations = async (token: string): Promise<Reservation[]> => {
  const res = await fetch(`${BASE_URL}/api/reservations`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) throw new Error("Failed to fetch reservations");
  return res.json();

}

export const createReservation = async (reservation: ReservationPayload, token: string) => {
  const res = await fetch(`${BASE_URL}/api/reservations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify(reservation),
  });

  if (!res.ok) throw new Error("Failed to create reservation");
  return res.json();
}

export const toggleBlockedSlot = async (fieldId: number, date: string, hour: string, token: string) => {
  const res = await fetch(`${BASE_URL}/api/fields/${fieldId}/blocked-slots`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({ date, hour }),
  });

  if (!res.ok) throw new Error("Failed to toggle blocked slot");
  return res.json();
};

export const fetchBlockedSlots = async (token: string): Promise<Set<string>> => {
  try {
    const res = await fetch(`${BASE_URL}/api/blocked-slots`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error("Failed to fetch blocked slots");
    const data = await res.json();
    return new Set(data);
  } catch (err) {
    console.error("Failed to fetch blocked slots:", err);
    return new Set();
  }
};

export const cancelReservation = async (id: number, token: string) => {
  const res = await fetch(`${BASE_URL}/api/reservations/${id}`, {
    method: "DELETE",
    headers: {
      "Authorization": `Bearer ${token}`,
    },
  });

  if (!res.ok) throw new Error("Failed to cancel reservation");
  return res.json();
}

export const formatCLP = (n: number) =>
  n.toLocaleString("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 });

const fmt = (d: Date) => d.toISOString().slice(0, 10);
export const todayISO = () => fmt(new Date());


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
