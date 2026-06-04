import { motion } from "framer-motion";
import { Trophy, Calendar, User, ShieldCheck, LogIn, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export type ViewKey = "home" | "player" | "admin";

interface Props {
  active: ViewKey;
  onChange: (v: ViewKey) => void;
  isAdmin: boolean;
  onToggleAdmin: (v: boolean) => void;
  isLoggedIn: boolean;
  userName: string;
  onAuthClick: () => void;
  onLogout: () => void;
}

const NavBtn = ({ active, onClick, icon: Icon, label }: any) => (
  <button
    onClick={onClick}
    className={`relative flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${active ? "text-primary" : "text-muted-foreground hover:text-foreground"
      }`}
  >
    <Icon className="w-4 h-4" />
    <span className="hidden sm:inline">{label}</span>
    {active && (
      <motion.div
        layoutId="navIndicator"
        className="absolute inset-0 bg-primary/10 rounded-lg -z-10"
        transition={{ type: "spring", stiffness: 380, damping: 30 }}
      />
    )}
  </button>
);


// Barra de navegación
export default function Navbar({ active, onChange, isAdmin, onToggleAdmin, isLoggedIn, userName, onAuthClick, onLogout }: Props) {
  return (
    <header className="sticky top-0 z-40 bg-background/85 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl gradient-hero flex items-center justify-center shadow-glow">
            <Trophy className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-display font-bold text-lg">
            Furbito<span className="text-primary">App</span>
          </span>
        </div>

        <nav className="flex items-center gap-1">
          <NavBtn active={active === "home"} onClick={() => onChange("home")} icon={Calendar} label="Canchas" />
          <NavBtn active={active === "player"} onClick={() => onChange("player")} icon={User} label="Mi perfil" />
          {isAdmin && (
            <NavBtn active={active === "admin"} onClick={() => onChange("admin")} icon={ShieldCheck} label="Admin" />
          )}
        </nav>

        <div className="flex items-center gap-3">
          <label className="hidden md:flex items-center gap-2 text-xs text-muted-foreground cursor-pointer select-none">
            <span>Admin</span>
            <span className="relative">
              <input
                type="checkbox"
                checked={isAdmin}
                onChange={(e) => onToggleAdmin(e.target.checked)}
                className="sr-only peer"
              />
              <span className="block w-9 h-5 bg-muted rounded-full peer-checked:bg-primary transition-colors" />
              <span className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-4 shadow-sm" />
            </span>
          </label>
          {isLoggedIn ? (
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline text-sm font-medium">{userName}</span>
              <Button variant="outline" size="sm" onClick={onLogout}>
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <Button size="sm" onClick={onAuthClick} className="gradient-hero text-primary-foreground">
              <LogIn className="w-4 h-4 mr-1" /> Ingresar
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
