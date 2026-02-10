import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Alunos from "./pages/Alunos";
import Turmas from "./pages/Turmas";
import Notas from "./pages/Notas";
import Documentos from "./pages/Documentos";
import Requerimentos from "./pages/Requerimentos";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/login" element={<Login />} />
          <Route path="/alunos" element={<Alunos />} />
          <Route path="/turmas" element={<Turmas />} />
          <Route path="/notas" element={<Notas />} />
          <Route path="/documentos" element={<Documentos />} />
          <Route path="/requerimentos" element={<Requerimentos />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
