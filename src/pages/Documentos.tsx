import { useEffect, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, FileText, FileImage, Download, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

const categoriaLabels: Record<string, string> = {
  historico: "Histórico", declaracao: "Declaração", ata: "Ata", certificado: "Certificado",
  contrato: "Contrato", documento_pessoal: "Doc. Pessoal", outro: "Outro",
};

const categoriaColors: Record<string, string> = {
  historico: "bg-primary/10 text-primary", declaracao: "bg-accent/10 text-accent",
  ata: "bg-warning/10 text-warning", certificado: "bg-success/10 text-success",
  contrato: "bg-info/10 text-info", documento_pessoal: "bg-muted text-muted-foreground",
  outro: "bg-muted text-muted-foreground",
};

const Documentos = () => {
  const [search, setSearch] = useState("");
  const [documentos, setDocumentos] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { user, hasRole } = useAuth();
  const canManage = hasRole("admin") || hasRole("secretaria");

  const [form, setForm] = useState({ titulo: "", descricao: "", categoria: "outro" });
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchDocumentos = async () => {
    const { data } = await supabase.from("documentos").select("*").order("created_at", { ascending: false });
    setDocumentos(data || []);
  };

  useEffect(() => { fetchDocumentos(); }, []);

  const handleUpload = async () => {
    if (!form.titulo || !file) {
      toast({ title: "Título e arquivo são obrigatórios", variant: "destructive" });
      return;
    }
    setSaving(true);

    // Upload file to storage
    const filePath = `${user!.id}/${Date.now()}_${file.name}`;
    const { error: uploadError } = await supabase.storage.from("documentos").upload(filePath, file);
    if (uploadError) {
      toast({ title: "Erro no upload", description: uploadError.message, variant: "destructive" });
      setSaving(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("documentos").getPublicUrl(filePath);

    const { error } = await supabase.from("documentos").insert({
      titulo: form.titulo,
      descricao: form.descricao || null,
      categoria: form.categoria,
      arquivo_url: urlData.publicUrl,
      arquivo_nome: file.name,
      arquivo_tipo: file.type,
      uploaded_by: user!.id,
    });

    if (error) {
      toast({ title: "Erro ao salvar documento", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Documento enviado!" });
      setForm({ titulo: "", descricao: "", categoria: "outro" });
      setFile(null);
      setDialogOpen(false);
      fetchDocumentos();
    }
    setSaving(false);
  };

  const filtered = documentos.filter(
    (d) => d.titulo.toLowerCase().includes(search.toLowerCase()) || (d.categoria || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppLayout>
      <PageHeader
        title="Documentos"
        description="Gestão e organização de documentos acadêmicos"
        actions={
          canManage ? (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2"><Upload className="h-4 w-4" /> Upload</Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader><DialogTitle>Enviar Documento</DialogTitle></DialogHeader>
                <div className="space-y-3 mt-2">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">Título *</label>
                    <Input value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} placeholder="Nome do documento" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">Descrição</label>
                    <Input value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">Categoria</label>
                    <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })}>
                      {Object.entries(categoriaLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">Arquivo *</label>
                    <Input type="file" accept=".pdf,.docx,.doc,.jpg,.jpeg,.png" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                  </div>
                  <Button onClick={handleUpload} disabled={saving} className="w-full">{saving ? "Enviando..." : "Enviar Documento"}</Button>
                </div>
              </DialogContent>
            </Dialog>
          ) : undefined
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
          <div key={doc.id} className="bg-card rounded-xl border border-border/50 shadow-sm p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer animate-fade-in">
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
                {doc.arquivo_nome || "—"}
              </span>
              {doc.arquivo_url && (
                <a href={doc.arquivo_url} target="_blank" rel="noopener noreferrer">
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0"><Download className="h-3.5 w-3.5" /></Button>
                </a>
              )}
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
