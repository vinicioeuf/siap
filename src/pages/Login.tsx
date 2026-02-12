import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { School, Eye, EyeOff, BookOpen, Users, BarChart3, Shield } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

const features = [
  { icon: BookOpen, label: "Gestão Acadêmica" },
  { icon: Users, label: "Controle de Alunos" },
  { icon: BarChart3, label: "Notas e Frequência" },
  { icon: Shield, label: "Segurança de Dados" },
];

const Login = () => {
  const navigate = useNavigate();
  const { signIn, signUp, user } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  if (user) {
    navigate("/", { replace: true });
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (isSignUp) {
      const { error } = await signUp(email, password, fullName);
      if (error) {
        toast({ title: "Erro no cadastro", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Cadastro realizado!", description: "Verifique seu e-mail para confirmar a conta." });
        setIsSignUp(false);
      }
    } else {
      const { error } = await signIn(email, password);
      if (error) {
        toast({ title: "Erro no login", description: error.message, variant: "destructive" });
      } else {
        navigate("/");
      }
    }
    setIsLoading(false);
  };

  return (
    <div className="flex min-h-screen">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 gradient-primary flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.08),transparent_60%)]" />
        <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute -top-16 -left-16 h-48 w-48 rounded-full bg-white/5 blur-2xl" />

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-foreground/20 backdrop-blur-sm border border-white/10">
              <School className="h-6 w-6 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-primary-foreground tracking-tight">SIAP</h1>
          </div>
        </div>

        <div className="relative z-10 space-y-8">
          <div>
            <h2 className="text-4xl font-bold text-primary-foreground mb-4 leading-tight">
              Sistema Integrado de<br />Administração Pedagógica
            </h2>
            <p className="text-primary-foreground/70 text-lg max-w-md leading-relaxed">
              Centralize todas as operações acadêmicas em uma plataforma moderna, segura e eficiente.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 max-w-md">
            {features.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/5">
                <Icon className="h-4 w-4 text-primary-foreground/80" />
                <span className="text-sm font-medium text-primary-foreground/90">{label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 text-primary-foreground/40 text-xs">
          © 2026 SIAP. Todos os direitos reservados.
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex flex-1 items-center justify-center p-6 sm:p-8 bg-background">
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-3 mb-10 lg:hidden">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl gradient-primary shadow-lg">
              <School className="h-6 w-6 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">SIAP</h1>
          </div>

          <h2 className="text-2xl font-bold text-foreground mb-1.5 tracking-tight">
            {isSignUp ? "Criar Conta" : "Bem-vindo de volta"}
          </h2>
          <p className="text-sm text-muted-foreground mb-8">
            {isSignUp ? "Preencha os dados para se cadastrar" : "Acesse sua conta para continuar"}
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {isSignUp && (
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Nome Completo</label>
                <Input
                  type="text"
                  placeholder="Seu nome completo"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="rounded-xl h-11"
                />
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">E-mail</label>
              <Input
                type="email"
                placeholder="seu@email.edu.br"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="rounded-xl h-11"
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
                  required
                  minLength={6}
                  className="rounded-xl h-11 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            {!isSignUp && (
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                  <input type="checkbox" className="rounded border-border accent-primary" />
                  Lembrar-me
                </label>
                <a href="#" className="text-sm text-primary hover:text-primary/80 transition-colors font-medium">Esqueci a senha</a>
              </div>
            )}
            <Button type="submit" className="w-full h-11 rounded-xl text-sm font-semibold shadow-sm" disabled={isLoading}>
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Aguarde...
                </span>
              ) : isSignUp ? "Cadastrar" : "Entrar"}
            </Button>
          </form>

          <div className="mt-8 text-center">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm text-primary hover:text-primary/80 transition-colors font-medium"
            >
              {isSignUp ? "Já tem conta? Entrar" : "Não tem conta? Cadastrar"}
            </button>
          </div>

          <p className="text-xs text-center text-muted-foreground mt-8">
            Problemas para acessar? Contate a secretaria acadêmica.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
