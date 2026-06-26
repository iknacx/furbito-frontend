import { useState } from "react";
import { motion } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Mail, Lock, User as UserIcon, Phone as PhoneIcon } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  onAuth: (type: 'signup' | 'signin', data: any) => void;
}

export default function AuthModal({ open, onClose, onAuth }: Props) {
  const [mode, setMode] = useState<'signup' | 'signin'>('signin');
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  
  // Estado para manejar el error del teléfono
  const [phoneError, setPhoneError] = useState("");

  const validatePhone = (value: string) => {
    if (mode === 'signin') return true; // No validamos teléfono en login
    
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

  const handlePhoneBlur = () => {
    if (mode === 'signup') {
      validatePhone(phone);
    }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) return;
    
    if (mode === 'signup') {
      if (!name) return; // Validación básica de nombre
      if (!validatePhone(phone)) return; // Detiene el submit si el teléfono es inválido
    }

    onAuth(mode, { name, email, phone, password });
    
    // Limpieza después de enviar
    setName(""); 
    setEmail(""); 
    setPhone(""); 
    setPassword("");
    setPhoneError("");
  };

  // Función para cambiar de modo limpiando los errores
  const toggleMode = () => {
    setMode(mode === 'signin' ? 'signup' : 'signin');
    setPhoneError("");
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
            <>
              <div className="relative">
                <UserIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  placeholder="Nombre completo" 
                  className="pl-9" 
                  required 
                />
              </div>
              <div>
                <div className="relative">
                  <PhoneIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input 
                    type="tel" 
                    value={phone} 
                    onChange={(e) => {
                      setPhone(e.target.value);
                      if (phoneError) setPhoneError('');
                    }} 
                    onBlur={handlePhoneBlur}
                    placeholder="+56 9 1234 5678" 
                    className={`pl-9 ${phoneError ? 'border-destructive focus-visible:ring-destructive' : ''}`} 
                    required 
                  />
                </div>
                {phoneError && (
                  <p className="text-xs text-destructive mt-1 ml-1">{phoneError}</p>
                )}
              </div>
            </>
          )}
          <div className="relative">
            <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              placeholder="tu@email.com" 
              className="pl-9" 
              required 
            />
          </div>
          <div className="relative">
            <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              placeholder="Contraseña" 
              className="pl-9" 
              required 
            />
          </div>
          <Button type="submit" className="w-full gradient-hero text-primary-foreground">
            {mode === 'signin' ? "Iniciar sesión" : "Crear cuenta"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            {mode === 'signin' ? "¿No tienes cuenta?" : "¿Ya tienes cuenta?"}{" "}
            <button
              type="button"
              onClick={toggleMode}
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
