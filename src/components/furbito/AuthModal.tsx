import { useState } from "react";
import { motion } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Mail, Lock, User as UserIcon } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  onAuth: (type: 'signup' | 'signin', data: any) => void;
}

// Componente de dialogo para iniciar sesión / registrarse
export default function AuthModal({ open, onClose, onAuth }: Props) {
  const [mode, setMode] = useState<'signup' | 'signin'>('signin');
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Al enviar los datos, se llama onAuth para que se envíen
  // los datos desde Index
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    onAuth(mode, { name, email, password });
    setName(""); setEmail(""); setPassword("");
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">
            {mode === 'signin' ? "Bienvenido de vuelta" : "Crea tu cuenta"}
          </DialogTitle>
        </DialogHeader>
        <motion.form
          key={mode}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={submit}
          className="space-y-4 pt-2"
        >
          {mode === 'signup' && (
            <div className="relative">
              <UserIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre completo" className="pl-9" />
            </div>
          )}
          <div className="relative">
            <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@email.com" className="pl-9" required />
          </div>
          <div className="relative">
            <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Contraseña" className="pl-9" required />
          </div>
          <Button type="submit" className="w-full gradient-hero text-primary-foreground">
            {mode === 'signin' ? "Iniciar sesión" : "Crear cuenta"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            {mode === 'signin' ? "¿No tienes cuenta?" : "¿Ya tienes cuenta?"}{" "}
            <button
              type="button"
              onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
              className="text-primary font-medium hover:underline"
            >
              {mode === 'signin' ? "Regístrate" : "Inicia sesión"}
            </button>
          </p>
        </motion.form>
      </DialogContent>
    </Dialog>
  );
}
