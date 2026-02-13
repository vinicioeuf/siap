import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { hasPermission, type AppRole } from "@/lib/permissions";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Alunos from "./pages/Alunos";
import Turmas from "./pages/Turmas";
import Notas from "./pages/Notas";
import Documentos from "./pages/Documentos";
import Requerimentos from "./pages/Requerimentos";
import Usuarios from "./pages/Usuarios";
import PainelAluno from "./pages/PainelAluno";
import Auditoria from "./pages/Auditoria";
import Disciplinas from "./pages/Disciplinas";
import Institutions from "./pages/Institutions";
import Platform from "./pages/Platform";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function SmartRedirect() {
  const { roles, loading, isSuperAdmin } = useAuth();
  if (loading) return null;
  const appRoles = roles as AppRole[];
  if (isSuperAdmin) {
    return <Navigate to="/platform" replace />;
  }
  if (hasPermission(appRoles, "dashboard.admin")) {
    return <Navigate to="/dashboard" replace />;
  }
  return <Navigate to="/painel-aluno" replace />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<ProtectedRoute><SmartRedirect /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute requiredPermission="dashboard.admin"><Dashboard /></ProtectedRoute>} />
            <Route path="/painel-aluno" element={<ProtectedRoute requiredPermission="dashboard.aluno"><PainelAluno /></ProtectedRoute>} />
            <Route path="/usuarios" element={<ProtectedRoute requiredPermission="users.view"><Usuarios /></ProtectedRoute>} />
            <Route path="/alunos" element={<ProtectedRoute requiredPermission="alunos.view"><Alunos /></ProtectedRoute>} />
            <Route path="/turmas" element={<ProtectedRoute requiredPermission="turmas.view"><Turmas /></ProtectedRoute>} />
            <Route path="/disciplinas" element={<ProtectedRoute requiredPermission="disciplinas.view"><Disciplinas /></ProtectedRoute>} />
            <Route path="/notas" element={<ProtectedRoute requiredPermission="notas.view"><Notas /></ProtectedRoute>} />
            <Route path="/documentos" element={<ProtectedRoute requiredPermission="documentos.view"><Documentos /></ProtectedRoute>} />
            <Route path="/requerimentos" element={<ProtectedRoute requiredPermission="requerimentos.view"><Requerimentos /></ProtectedRoute>} />
            <Route path="/auditoria" element={<ProtectedRoute requiredPermission="audit.view"><Auditoria /></ProtectedRoute>} />
            <Route path="/institutions" element={<ProtectedRoute requiredPermission="institutions.view"><Institutions /></ProtectedRoute>} />
            <Route path="/platform" element={<ProtectedRoute requiredPermission="platform.view"><Platform /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
