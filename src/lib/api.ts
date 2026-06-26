const BASE_URL = import.meta.env.VITE_API_URL;

// ==========================================
// TIPOS E INTERFACES
// ==========================================

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
  scheduleId?: number | null; 
  date: string; // YYYY-MM-DD
  hour: string; // HH:mm
  price: number;
  status: "confirmed" | "canceled" | "completed";
};

export type ScheduleStatus = "available" | "reserved" | "closed" | "maintenance";

export type Schedule = {
  schedule_id: number;
  date: string; // YYYY-MM-DD
  start_time: string; // HH:mm
  end_time: string; // HH:mm
  final_price: number;
  status: ScheduleStatus;
};

export type SchedulePayload = {
  date: string;
  startTime: string;
  endTime: string;
  price?: number | null;
  status?: ScheduleStatus;
};

export type ReservationPayload = Pick<Reservation, "fieldId" | "date" | "hour" | "price"> & { scheduleId?: number };

export type UserUpdatePayload = {
  name?: string;
  email?: string;
  phone?: string;
  password?: string;
};

// ==========================================
// AUTENTICACIÓN
// ==========================================

export const signUp = async (userData: any) => {
  const res = await fetch(`${BASE_URL}/api/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(userData),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Signup failed");
  }
  return res.json();
};

export const signIn = async (credentials: any) => {
  const res = await fetch(`${BASE_URL}/api/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });
  if (!res.ok) throw new Error("Login failed");
  return res.json();
};

// ==========================================
// USUARIOS
// ==========================================

export const updateUserProfile = async (payload: UserUpdatePayload, token: string) => {
  const res = await fetch(`${BASE_URL}/api/users/me`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify(payload),
  });
  
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || "Failed to update profile");
  }
  return res.json();
};

// ==========================================
// CANCHAS (FIELDS)
// ==========================================

export const fetchFields = async (): Promise<Field[]> => {
  const res = await fetch(`${BASE_URL}/api/fields`);
  if (!res.ok) throw new Error("Failed to fetch fields");
  return res.json();
};

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

// Exportar junto al resto de funciones de canchas en api.ts
export const deleteField = async (id: number, token: string) => {
  const res = await fetch(`${BASE_URL}/api/fields/${id}`, {
    method: "DELETE",
    headers: {
      "Authorization": `Bearer ${token}`
    },
  });
  if (!res.ok) throw new Error("Failed to delete field");
  return res.json();
};

// ==========================================
// HORARIOS (SCHEDULES)
// ==========================================

// Obtiene los horarios de una cancha (opcional: filtra por fecha "YYYY-MM-DD")
export const fetchFieldSchedules = async (fieldId: number, date?: string): Promise<Schedule[]> => {
  const url = date 
    ? `${BASE_URL}/api/fields/${fieldId}/schedules?date=${date}`
    : `${BASE_URL}/api/fields/${fieldId}/schedules`;
    
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch schedules");
  return res.json();
};

// Crea un horario manualmente (Solo Admin/Owner)
export const createSchedule = async (fieldId: number, payload: SchedulePayload, token: string) => {
  const res = await fetch(`${BASE_URL}/api/fields/${fieldId}/schedules`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to create schedule");
  return res.json();
};

// Actualiza el estado o precio de un bloque existente (Solo Admin/Owner)
export const updateSchedule = async (scheduleId: number, payload: { status?: ScheduleStatus; price?: number | null }, token: string) => {
  const res = await fetch(`${BASE_URL}/api/schedules/${scheduleId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to update schedule");
  return res.json();
};

// Elimina un bloque de horario (Solo Admin/Owner)
export const deleteSchedule = async (scheduleId: number, token: string) => {
  const res = await fetch(`${BASE_URL}/api/schedules/${scheduleId}`, {
    method: "DELETE",
    headers: {
      "Authorization": `Bearer ${token}`
    },
  });
  if (!res.ok) throw new Error("Failed to delete schedule");
  return res.json();
};

// ==========================================
// RESERVAS
// ==========================================

export const fetchReservations = async (token: string): Promise<Reservation[]> => {
  const res = await fetch(`${BASE_URL}/api/reservations`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) throw new Error("Failed to fetch reservations");
  return res.json();
};

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
};

// ==========================================
// UTILIDADES Y CONSTANTES
// ==========================================

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

// Dejamos este arreglo en el frontend por si lo necesitas para 
// armar selects o dropdowns en la UI al buscar reservas.
export const HOURS = [
  "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00",
  "16:00", "17:00", "18:00", "19:00", "20:00", "21:00", "22:00", "23:00",
];
