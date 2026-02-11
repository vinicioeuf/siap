import { useEffect, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, FileText, FileImage, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const categoriaLabels: Record<string, string> = {
  historico: "Histórico",
  declaracao: "Declaração",
  ata: "Ata",
  certificado: "Certificado",
  contrato: "Contrato",
  documento_pessoal: "Doc. Pessoal",
  outro: "Outro",
};

const categoriaColors: Record<string, string> = {
  historico: "bg-primary/10 text-primary",
  declaracao: "bg-accent/10 text-accent",
  ata: "bg-warning/10 text-warning",
  certificado: "bg-success/10 text-success",
  contrato: "bg-info/10 text-info",
  documento_pessoal: "bg-muted text-muted-foreground",
  outro: "bg-muted text-muted-foreground",
};

const Documentos = () => {
  const [search, setSearch] = useState("");
  const [documentos, setDocumentos] = useState<any[]>([]);

  useEffect(() => {
    supabase
      .from("documentos")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => setDocumentos(data || []));
  }, []);

  const filtered = documentos.filter(
    (d) =>
      d.titulo.toLowerCase().includes(search.toLowerCase()) ||
      (d.categoria || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppLayout>
      <PageHeader
        title="Documentos"
        description="Gestão e organização de documentos acadêmicos"
        actions={
          <Button className="gap-2">
            <Plus className="h-4 w-4" /> Upload
          </Button>
        }
      />

      <div className="mb-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar documentos..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.length === 0 && (
          <p className="col-span-full text-center py-12 text-muted-foreground text-sm">Nenhum documento encontrado.</p>
        )}
        {filtered.map((doc) => (
          <div
            key={doc.id}
            className="bg-card rounded-xl border border-border/50 shadow-sm p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer animate-fade-in"
          >
            <div className="flex items-start gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg shrink-0 ${categoriaColors[doc.categoria] || categoriaColors.outro}`}>
                {doc.arquivo_tipo?.includes("image") ? <FileImage className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-semibold text-foreground truncate">{doc.titulo}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{categoriaLabels[doc.categoria] || doc.categoria}</p>
              </div>
            </div>
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/50">
              <span className="text-xs font-medium text-muted-foreground px-2 py-0.5 rounded bg-muted">
                {doc.arquivo_tipo || "—"}
              </span>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                <Download className="h-3.5 w-3.5" />
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground mt-2">
              Enviado em {new Date(doc.created_at).toLocaleDateString("pt-BR")}
            </p>
          </div>
        ))}
      </div>
    </AppLayout>
  );
};

export default Documentos;
