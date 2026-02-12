import { useEffect, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { SearchInput } from "@/components/SearchInput";
import { SkeletonCard } from "@/components/Skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, FileText, FileImage, Download, Upload, Printer, GraduationCap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { createAuditLog } from "@/lib/audit";
import { hasPermission, type AppRole } from "@/lib/permissions";
import {
  generateDeclaracaoMatricula,
  generateHistoricoEscolar,
  generateBoletim,
  generateListaPresenca,
  generateDiarioClasse,
  type StudentInfo,
} from "@/lib/pdf-generator";

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
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { user, hasRole, roles, profile } = useAuth();
  const canManage = hasRole("admin") || hasRole("secretaria");
  const canGenerate = hasPermission(roles as AppRole[], "documentos.generate");

  const [form, setForm] = useState({ titulo: "", descricao: "", categoria: "outro" });
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const [generateType, setGenerateType] = useState("declaracao_matricula");
  const [alunos, setAlunos] = useState<any[]>([]);
  const [selectedAlunoId, setSelectedAlunoId] = useState("");
  const [generating, setGenerating] = useState(false);

  const fetchDocumentos = async () => {
    setLoading(true);
    const { data } = await supabase.from("documentos").select("*").order("created_at", { ascending: false });
    setDocumentos(data || []);

    // Fetch alunos for document generation
    const { data: alunosData } = await supabase.from("alunos").select("id, user_id, matricula");
    if (alunosData) {
      const userIds = alunosData.map((a) => a.user_id);
      const { data: profiles } = await supabase.from("profiles").select("user_id, full_name");
      const profileMap = new Map();
      profiles?.forEach((p) => profileMap.set(p.user_id, p));
      setAlunos(alunosData.map((a) => ({ ...a, profile: profileMap.get(a.user_id) })));
    }

    setLoading(false);
  };

  useEffect(() => { fetchDocumentos(); }, []);

  const handleUpload = async () => {
    if (!form.titulo || !file) {
      toast({ title: "Título e arquivo são obrigatórios", variant: "destructive" });
      return;
    }
    setSaving(true);

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
      await createAuditLog({
        action: "create",
        entity_type: "documento",
        entity_name: form.titulo,
        details: { categoria: form.categoria, arquivo: file.name },
      });
      toast({ title: "Documento enviado!" });
      setForm({ titulo: "", descricao: "", categoria: "outro" });
      setFile(null);
      setDialogOpen(false);
      fetchDocumentos();
    }
    setSaving(false);
  };

  const handleGenerateDocument = async () => {
    if (!selectedAlunoId) {
      toast({ title: "Selecione um aluno", variant: "destructive" });
      return;
    }
    setGenerating(true);

    const aluno = alunos.find((a) => a.id === selectedAlunoId);
    if (!aluno) { setGenerating(false); return; }

    // Fetch full student data
    const { data: alunoFull } = await supabase
      .from("alunos")
      .select("*, matriculas(*, turmas(*, cursos(nome)))")
      .eq("id", selectedAlunoId)
      .single();

    const turma = alunoFull?.matriculas?.[0]?.turmas;
    const studentInfo: StudentInfo = {
      name: aluno.profile?.full_name || "—",
      matricula: aluno.matricula,
      cpf: alunoFull?.cpf || undefined,
      curso: turma?.cursos?.nome || "—",
      turma: turma?.nome || "—",
      semestre: turma ? `${turma.ano}/${turma.semestre}` : "—",
      status: alunoFull?.status || "ativo",
      data_ingresso: alunoFull?.data_ingresso
        ? new Date(alunoFull.data_ingresso).toLocaleDateString("pt-BR")
        : "—",
    };

    const signedBy = profile?.full_name || "Administração - SIAP";

    let doc: any;
    let validationCode: string;
    let filename: string;

    if (generateType === "declaracao_matricula") {
      const result = generateDeclaracaoMatricula(studentInfo, signedBy);
      doc = result.doc;
      validationCode = result.validationCode;
      filename = `declaracao_matricula_${aluno.matricula}.pdf`;
    } else if (generateType === "historico_escolar") {
      const { data: notas } = await supabase
        .from("notas")
        .select("*, disciplinas(nome, carga_horaria)")
        .eq("aluno_id", selectedAlunoId);

      const grades = (notas || []).map((n: any) => ({
        disciplina: n.disciplinas?.nome || "—",
        carga_horaria: n.disciplinas?.carga_horaria || 0,
        nota1: n.nota1, nota2: n.nota2, nota3: n.nota3, nota4: n.nota4,
        media: n.media,
        status: n.status || "cursando",
      }));

      const result = generateHistoricoEscolar(studentInfo, grades, signedBy);
      doc = result.doc;
      validationCode = result.validationCode;
      filename = `historico_escolar_${aluno.matricula}.pdf`;
    } else {
      const { data: notas } = await supabase
        .from("notas")
        .select("*, disciplinas(nome)")
        .eq("aluno_id", selectedAlunoId);

      const grades = (notas || []).map((n: any) => ({
        disciplina: n.disciplinas?.nome || "—",
        nota1: n.nota1, nota2: n.nota2, nota3: n.nota3, nota4: n.nota4,
        media: n.media,
        status: n.status || "cursando",
      }));

      const result = generateBoletim(studentInfo, grades, signedBy);
      doc = result.doc;
      validationCode = result.validationCode;
      filename = `boletim_${aluno.matricula}.pdf`;
    }

    doc.save(filename);

    await supabase.from("generated_documents").insert({
      tipo: generateType,
      aluno_id: selectedAlunoId,
      numero_validacao: validationCode,
      generated_by: user!.id,
      generated_by_name: signedBy,
    });

    await createAuditLog({
      action: "generate_document",
      entity_type: "generated_document",
      entity_name: `${generateType} - ${studentInfo.name}`,
      details: { validation: validationCode },
    });

    toast({ title: "Documento gerado com sucesso!" });
    setGenerateDialogOpen(false);
    setGenerating(false);
  };

  const filtered = documentos.filter(
    (d) => d.titulo.toLowerCase().includes(search.toLowerCase()) || (d.categoria || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppLayout>
      <PageHeader
        title="Documentos"
        description="Gestão e organização de documentos acadêmicos"
        breadcrumbs={[{ label: "Documentos" }]}
        actions={
          <div className="flex gap-2">
            {canGenerate && (
              <Dialog open={generateDialogOpen} onOpenChange={setGenerateDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="gap-2 rounded-xl">
                    <Printer className="h-4 w-4" /> Gerar Documento
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md rounded-xl">
                  <DialogHeader><DialogTitle className="text-lg">Gerar Documento Oficial</DialogTitle></DialogHeader>
                  <div className="space-y-4 mt-2">
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">Tipo de Documento</label>
                      <select
                        className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/30"
                        value={generateType}
                        onChange={(e) => setGenerateType(e.target.value)}
                      >
                        <option value="declaracao_matricula">Declaração de Matrícula</option>
                        <option value="historico_escolar">Histórico Escolar</option>
                        <option value="boletim">Boletim Escolar</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">Aluno *</label>
                      <select
                        className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/30"
                        value={selectedAlunoId}
                        onChange={(e) => setSelectedAlunoId(e.target.value)}
                      >
                        <option value="">Selecione um aluno...</option>
                        {alunos.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.profile?.full_name || "—"} ({a.matricula})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="p-3 bg-info/5 border border-info/20 rounded-xl">
                      <div className="flex items-start gap-2">
                        <GraduationCap className="h-4 w-4 text-info mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs font-medium text-info">Documento Oficial</p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            O PDF será gerado com layout institucional, assinatura digital e código de validação.
                          </p>
                        </div>
                      </div>
                    </div>
                    <Button onClick={handleGenerateDocument} disabled={generating} className="w-full rounded-xl h-11">
                      {generating ? "Gerando..." : "Gerar e Baixar PDF"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
            {canManage && (
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2 rounded-xl shadow-sm"><Upload className="h-4 w-4" /> Upload</Button>
                </DialogTrigger>
              <DialogContent className="max-w-md rounded-xl">
                <DialogHeader><DialogTitle className="text-lg">Enviar Documento</DialogTitle></DialogHeader>
                <div className="space-y-4 mt-2">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Título *</label>
                    <Input value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} placeholder="Nome do documento" className="rounded-xl" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Descrição</label>
                    <Input value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} className="rounded-xl" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Categoria</label>
                    <select
                      className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/30"
                      value={form.categoria}
                      onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                    >
                      {Object.entries(categoriaLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Arquivo *</label>
                    <Input type="file" accept=".pdf,.docx,.doc,.jpg,.jpeg,.png" onChange={(e) => setFile(e.target.files?.[0] || null)} className="rounded-xl" />
                  </div>
                  <Button onClick={handleUpload} disabled={saving} className="w-full rounded-xl h-11">{saving ? "Enviando..." : "Enviar Documento"}</Button>
                </div>
              </DialogContent>
            </Dialog>
            )}
          </div>
        }
      />

      <div className="mb-6">
        <SearchInput
          placeholder="Buscar documentos..."
          value={search}
          onChange={setSearch}
          className="max-w-sm"
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          variant={search ? "search" : "folder"}
          title={search ? "Nenhum documento encontrado" : "Nenhum documento"}
          description={search ? `Sem resultados para "${search}"` : "Os documentos enviados aparecerão aqui"}
          action={
            canManage && !search ? (
              <Button onClick={() => setDialogOpen(true)} className="gap-2 rounded-xl">
                <Upload className="h-4 w-4" /> Enviar Documento
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((doc, index) => (
            <div
              key={doc.id}
              className="bg-card rounded-xl border border-border/50 shadow-sm p-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer group animate-fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-start gap-4">
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl shrink-0 transition-transform duration-300 group-hover:scale-110 ${categoriaColors[doc.categoria] || categoriaColors.outro}`}>
                  {doc.arquivo_tipo?.includes("image") ? <FileImage className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">{doc.titulo}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{categoriaLabels[doc.categoria] || doc.categoria}</p>
                </div>
              </div>
              <div className="flex items-center justify-between mt-5 pt-4 border-t border-border/50">
                <span className="text-xs font-medium text-muted-foreground px-2 py-0.5 rounded-md bg-muted/50 truncate max-w-[150px]">
                  {doc.arquivo_nome || "—"}
                </span>
                {doc.arquivo_url && (
                  <a href={doc.arquivo_url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg hover:bg-primary/10 hover:text-primary">
                      <Download className="h-4 w-4" />
                    </Button>
                  </a>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground mt-2">
                Enviado em {new Date(doc.created_at).toLocaleDateString("pt-BR")}
              </p>
            </div>
          ))}
        </div>
      )}
    </AppLayout>
  );
};

export default Documentos;
