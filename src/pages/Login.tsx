import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { School, Eye, EyeOff } from "lucide-react";

const Login = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    navigate("/");
  };

  return (
    <div className="flex min-h-screen">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 gradient-primary flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.08),transparent_60%)]" />
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-foreground/20 backdrop-blur-sm">
              <School className="h-6 w-6 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold text-primary-foreground">EduGestão</h1>
          </div>
        </div>
        <div className="relative z-10">
          <h2 className="text-3xl font-bold text-primary-foreground mb-3">
            Sistema de Gestão Acadêmica
          </h2>
          <p className="text-primary-foreground/70 text-base max-w-md">
            Centralize todas as operações escolares e acadêmicas em uma única plataforma moderna e segura.
          </p>
        </div>
        <div className="relative z-10 text-primary-foreground/40 text-xs">
          © 2024 EduGestão. Todos os direitos reservados.
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex flex-1 items-center justify-center p-6 bg-background">
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg gradient-primary">
              <School className="h-6 w-6 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold text-foreground">EduGestão</h1>
          </div>

          <h2 className="text-2xl font-bold text-foreground mb-1">Entrar</h2>
          <p className="text-sm text-muted-foreground mb-8">
            Acesse sua conta para continuar
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">E-mail</label>
              <Input
                type="email"
                placeholder="seu@email.edu.br"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Senha</label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                <input type="checkbox" className="rounded border-border" />
                Lembrar-me
              </label>
              <a href="#" className="text-sm text-primary hover:underline">Esqueci a senha</a>
            </div>
            <Button type="submit" className="w-full">
              Entrar
            </Button>
          </form>

          <p className="text-xs text-center text-muted-foreground mt-8">
            Problemas para acessar? Contate a secretaria acadêmica.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
