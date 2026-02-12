import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// =============================================
// SIAP - Geração de Documentos Acadêmicos PDF
// =============================================

const INSTITUTION_NAME = "SIAP - Sistema Integrado de Administração Pedagógica";
const INSTITUTION_SUBTITLE = "Secretaria Acadêmica";

function generateValidationCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const segments = [4, 4, 4, 4];
  return segments
    .map((len) =>
      Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join("")
    )
    .join("-");
}

function addHeader(doc: jsPDF, title: string) {
  const pageWidth = doc.internal.pageSize.getWidth();

  // Top blue bar
  doc.setFillColor(30, 58, 138); // primary blue
  doc.rect(0, 0, pageWidth, 28, "F");

  // Institution icon placeholder (shield)
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(14, 5, 18, 18, 3, 3, "F");
  doc.setFontSize(11);
  doc.setTextColor(30, 58, 138);
  doc.setFont("helvetica", "bold");
  doc.text("SIAP", 15.5, 16.5);

  // Institution name
  doc.setFontSize(13);
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.text(INSTITUTION_NAME, 38, 12);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(INSTITUTION_SUBTITLE, 38, 19);

  // Title bar
  doc.setFillColor(241, 245, 249); // light gray
  doc.rect(0, 28, pageWidth, 14, "F");
  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  doc.setFont("helvetica", "bold");
  doc.text(title.toUpperCase(), pageWidth / 2, 37, { align: "center" });

  return 50; // return the Y position after header
}

function addFooter(doc: jsPDF, validationCode: string, signedBy: string) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const now = format(new Date(), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR });

  // Separator
  doc.setDrawColor(203, 213, 225);
  doc.line(20, pageHeight - 52, pageWidth - 20, pageHeight - 52);

  // Signature
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.setFont("helvetica", "normal");

  doc.setDrawColor(30, 58, 138);
  doc.line(pageWidth / 2 - 45, pageHeight - 40, pageWidth / 2 + 45, pageHeight - 40);
  doc.setFont("helvetica", "bold");
  doc.text(signedBy, pageWidth / 2, pageHeight - 35, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.text("Assinatura Digital Autorizada", pageWidth / 2, pageHeight - 31, { align: "center" });

  // Footer bar
  doc.setFillColor(248, 250, 252);
  doc.rect(0, pageHeight - 24, pageWidth, 24, "F");
  doc.setDrawColor(203, 213, 225);
  doc.line(0, pageHeight - 24, pageWidth, pageHeight - 24);

  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(`Documento gerado em ${now}`, 20, pageHeight - 15);
  doc.text(`Código de Validação: ${validationCode}`, 20, pageHeight - 10);
  doc.text(
    "Este documento tem validade institucional e pode ser verificado pelo código acima.",
    pageWidth - 20,
    pageHeight - 15,
    { align: "right" }
  );
  doc.text(
    `Página ${doc.getCurrentPageInfo().pageNumber}`,
    pageWidth - 20,
    pageHeight - 10,
    { align: "right" }
  );
}

function addInfoBlock(doc: jsPDF, y: number, fields: { label: string; value: string }[]) {
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFillColor(248, 250, 252);
  doc.roundedRect(20, y, pageWidth - 40, fields.length * 10 + 8, 3, 3, "F");
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(20, y, pageWidth - 40, fields.length * 10 + 8, 3, 3, "S");

  let currentY = y + 8;
  fields.forEach((field) => {
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.setFont("helvetica", "normal");
    doc.text(field.label + ":", 28, currentY);

    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.text(field.value, 80, currentY);
    currentY += 10;
  });

  return currentY + 4;
}

// ---- Document Generators ----

export interface StudentInfo {
  name: string;
  matricula: string;
  cpf?: string;
  curso?: string;
  turma?: string;
  semestre?: string;
  status?: string;
  data_ingresso?: string;
}

export function generateDeclaracaoMatricula(
  student: StudentInfo,
  signedBy: string
): { doc: jsPDF; validationCode: string } {
  const doc = new jsPDF();
  const validationCode = generateValidationCode();
  const now = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });

  let y = addHeader(doc, "Declaração de Matrícula");

  y = addInfoBlock(doc, y, [
    { label: "Aluno(a)", value: student.name },
    { label: "Matrícula", value: student.matricula },
    { label: "CPF", value: student.cpf || "Não informado" },
    { label: "Curso", value: student.curso || "—" },
    { label: "Turma", value: student.turma || "—" },
    { label: "Semestre", value: student.semestre || "—" },
  ]);

  y += 10;

  // Body text
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  doc.setFont("helvetica", "normal");

  const text = `Declaramos, para os devidos fins, que ${student.name}, portador(a) do CPF ${student.cpf || "não informado"}, registro de matrícula nº ${student.matricula}, encontra-se regularmente matriculado(a) nesta instituição de ensino, no curso de ${student.curso || "—"}, turma ${student.turma || "—"}, no período letivo vigente.`;

  const splitText = doc.splitTextToSize(text, 155);
  doc.text(splitText, 28, y);
  y += splitText.length * 6 + 10;

  const text2 = "Esta declaração é válida pelo período de 90 (noventa) dias a partir da data de emissão.";
  doc.text(text2, 28, y);
  y += 10;

  doc.text(`Emitido em ${now}.`, 28, y + 5);

  addFooter(doc, validationCode, signedBy);
  return { doc, validationCode };
}

export function generateHistoricoEscolar(
  student: StudentInfo,
  grades: Array<{
    disciplina: string;
    carga_horaria: number;
    nota1?: number | null;
    nota2?: number | null;
    nota3?: number | null;
    nota4?: number | null;
    media?: number | null;
    status: string;
  }>,
  signedBy: string
): { doc: jsPDF; validationCode: string } {
  const doc = new jsPDF();
  const validationCode = generateValidationCode();

  let y = addHeader(doc, "Histórico Escolar");

  y = addInfoBlock(doc, y, [
    { label: "Aluno(a)", value: student.name },
    { label: "Matrícula", value: student.matricula },
    { label: "Curso", value: student.curso || "—" },
    { label: "Data Ingresso", value: student.data_ingresso || "—" },
    { label: "Situação", value: student.status || "Ativo" },
  ]);

  y += 6;

  autoTable(doc, {
    startY: y,
    head: [["Disciplina", "C.H.", "P1", "P2", "P3", "P4", "Média", "Situação"]],
    body: grades.map((g) => [
      g.disciplina,
      `${g.carga_horaria}h`,
      g.nota1 != null ? g.nota1.toFixed(1) : "—",
      g.nota2 != null ? g.nota2.toFixed(1) : "—",
      g.nota3 != null ? g.nota3.toFixed(1) : "—",
      g.nota4 != null ? g.nota4.toFixed(1) : "—",
      g.media != null ? g.media.toFixed(1) : "—",
      g.status.charAt(0).toUpperCase() + g.status.slice(1),
    ]),
    theme: "grid",
    styles: { fontSize: 8, cellPadding: 3, textColor: [30, 41, 59] },
    headStyles: {
      fillColor: [30, 58, 138],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8,
    },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 20, right: 20 },
  });

  addFooter(doc, validationCode, signedBy);
  return { doc, validationCode };
}

export function generateBoletim(
  student: StudentInfo,
  grades: Array<{
    disciplina: string;
    nota1?: number | null;
    nota2?: number | null;
    nota3?: number | null;
    nota4?: number | null;
    media?: number | null;
    status: string;
  }>,
  signedBy: string
): { doc: jsPDF; validationCode: string } {
  const doc = new jsPDF();
  const validationCode = generateValidationCode();

  let y = addHeader(doc, "Boletim Escolar");

  y = addInfoBlock(doc, y, [
    { label: "Aluno(a)", value: student.name },
    { label: "Matrícula", value: student.matricula },
    { label: "Curso", value: student.curso || "—" },
    { label: "Turma", value: student.turma || "—" },
    { label: "Semestre", value: student.semestre || "—" },
  ]);

  y += 6;

  autoTable(doc, {
    startY: y,
    head: [["Disciplina", "1ª Avaliação", "2ª Avaliação", "3ª Avaliação", "4ª Avaliação", "Média Final", "Situação"]],
    body: grades.map((g) => [
      g.disciplina,
      g.nota1 != null ? g.nota1.toFixed(1) : "—",
      g.nota2 != null ? g.nota2.toFixed(1) : "—",
      g.nota3 != null ? g.nota3.toFixed(1) : "—",
      g.nota4 != null ? g.nota4.toFixed(1) : "—",
      g.media != null ? g.media.toFixed(1) : "—",
      g.status.charAt(0).toUpperCase() + g.status.slice(1),
    ]),
    theme: "grid",
    styles: { fontSize: 8, cellPadding: 3, textColor: [30, 41, 59] },
    headStyles: {
      fillColor: [30, 58, 138],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8,
    },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 20, right: 20 },
  });

  addFooter(doc, validationCode, signedBy);
  return { doc, validationCode };
}

export function generateListaPresenca(
  turma: string,
  disciplina: string,
  professor: string,
  students: Array<{ name: string; matricula: string }>,
  signedBy: string
): { doc: jsPDF; validationCode: string } {
  const doc = new jsPDF("landscape");
  const validationCode = generateValidationCode();
  const now = format(new Date(), "dd/MM/yyyy");

  let y = addHeader(doc, "Lista de Presença");

  const pageWidth = doc.internal.pageSize.getWidth();
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(20, y, pageWidth - 40, 28, 3, 3, "FD");

  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.setFont("helvetica", "normal");
  doc.text("Turma:", 28, y + 8);
  doc.text("Disciplina:", 28, y + 18);
  doc.text("Professor:", pageWidth / 2, y + 8);
  doc.text("Data:", pageWidth / 2, y + 18);

  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text(turma, 55, y + 8);
  doc.text(disciplina, 55, y + 18);
  doc.text(professor, pageWidth / 2 + 30, y + 8);
  doc.text(now, pageWidth / 2 + 30, y + 18);

  y += 35;

  autoTable(doc, {
    startY: y,
    head: [["Nº", "Nome do Aluno", "Matrícula", "Assinatura"]],
    body: students.map((s, i) => [
      String(i + 1),
      s.name,
      s.matricula,
      "",
    ]),
    theme: "grid",
    styles: { fontSize: 8, cellPadding: 4, textColor: [30, 41, 59], minCellHeight: 12 },
    headStyles: {
      fillColor: [30, 58, 138],
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    columnStyles: {
      0: { cellWidth: 15, halign: "center" },
      1: { cellWidth: 100 },
      2: { cellWidth: 40 },
      3: { cellWidth: "auto" },
    },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 20, right: 20 },
  });

  addFooter(doc, validationCode, signedBy);
  return { doc, validationCode };
}

export function generateDiarioClasse(
  turma: string,
  disciplina: string,
  professor: string,
  students: Array<{
    name: string;
    matricula: string;
    notas: (number | null)[];
    media: number | null;
    faltas: number;
  }>,
  signedBy: string
): { doc: jsPDF; validationCode: string } {
  const doc = new jsPDF("landscape");
  const validationCode = generateValidationCode();

  let y = addHeader(doc, "Diário de Classe");

  const pageWidth = doc.internal.pageSize.getWidth();
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(20, y, pageWidth - 40, 18, 3, 3, "FD");

  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text("Turma:", 28, y + 10);
  doc.text("Disciplina:", 80, y + 10);
  doc.text("Professor:", 170, y + 10);

  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text(turma, 48, y + 10);
  doc.text(disciplina, 105, y + 10);
  doc.text(professor, 198, y + 10);

  y += 25;

  autoTable(doc, {
    startY: y,
    head: [["Nº", "Nome", "Matrícula", "P1", "P2", "P3", "P4", "Média", "Faltas"]],
    body: students.map((s, i) => [
      String(i + 1),
      s.name,
      s.matricula,
      s.notas[0] != null ? s.notas[0].toFixed(1) : "—",
      s.notas[1] != null ? s.notas[1].toFixed(1) : "—",
      s.notas[2] != null ? s.notas[2].toFixed(1) : "—",
      s.notas[3] != null ? s.notas[3].toFixed(1) : "—",
      s.media != null ? s.media.toFixed(1) : "—",
      String(s.faltas),
    ]),
    theme: "grid",
    styles: { fontSize: 8, cellPadding: 3, textColor: [30, 41, 59] },
    headStyles: {
      fillColor: [30, 58, 138],
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 20, right: 20 },
  });

  addFooter(doc, validationCode, signedBy);
  return { doc, validationCode };
}
