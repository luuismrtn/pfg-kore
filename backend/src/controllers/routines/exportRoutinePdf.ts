import type { Request, Response } from "express";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import PDFDocument from "pdfkit";
type PDFDoc = InstanceType<typeof PDFDocument>;
import SVGtoPDF from "svg-to-pdfkit";
import type {
  RoutineDay,
  RoutineExercise,
  RoutinePdfRequest,
  RoutineRequest,
} from "@backend/types/routine";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOGO_PATH = path.resolve(__dirname, "../../assets/kore-v2.svg");
const MAX_LINE_WIDTH = 500;
const TABLE_CELL_PADDING = 6;
const TABLE_HEADER_HEIGHT = 24;
const TABLE_ROW_MIN_HEIGHT = 22;
const WATERMARK_OPACITY = 0.25;

function applySvgOpacity(svg: string, opacity: number): string {
  const svgTagIndex = svg.indexOf("<svg");
  if (svgTagIndex === -1) {
    return svg;
  }

  const tagEndIndex = svg.indexOf(">", svgTagIndex);
  if (tagEndIndex === -1) {
    return svg;
  }

  const tagSlice = svg.slice(svgTagIndex, tagEndIndex);
  const opacityAttribute = `opacity=\"${opacity}\"`;

  if (tagSlice.includes("opacity=")) {
    return svg.replace(/opacity=\"[^\"]*\"/, opacityAttribute);
  }

  return (
    svg.slice(0, tagEndIndex) + ` ${opacityAttribute}` + svg.slice(tagEndIndex)
  );
}

function formatValue(value: unknown, suffix = ""): string {
  if (typeof value === "number" && Number.isFinite(value)) {
    return `${value}${suffix}`.trim();
  }

  if (typeof value === "string" && value.trim().length > 0) {
    return `${value}${suffix}`.trim();
  }

  return "";
}

function formatList(values: string[] | undefined): string {
  if (!values || values.length === 0) {
    return "";
  }

  return values.join(", ");
}

function ensureSpace(doc: PDFDoc, neededHeight = 60): void {
  const bottom = doc.page.height - doc.page.margins.bottom;
  if (doc.y + neededHeight > bottom) {
    doc.addPage();
  }
}

function appendProfileLine(doc: PDFDoc, label: string, value: string): void {
  if (!value) {
    return;
  }

  doc
    .fontSize(10)
    .fillColor("#1f2937")
    .text(`${label}: `, { continued: true })
    .font("Helvetica-Bold")
    .text(value, { continued: false })
    .font("Helvetica");
}

function renderProfileSummary(
  doc: PDFDoc,
  profile?: Partial<RoutineRequest>,
): void {
  if (!profile) {
    return;
  }

  const name = formatValue(profile.name);
  const sport = formatValue(profile.sport);
  const level = formatValue(profile.level);
  const gender = formatValue(profile.gender);
  const age = formatValue(profile.age, " anos");
  const weight = formatValue(profile.weightKg, " kg");
  const height = formatValue(profile.heightCm, " cm");
  const duration = formatValue(profile.averageDurationMinutes, " min");
  const availableDays = formatValue(profile.availableDays, " dias");
  const equipment = formatList(profile.equipment);
  const injuries = formatList(profile.injuries);

  const hasAnyValue =
    name ||
    sport ||
    level ||
    gender ||
    age ||
    weight ||
    height ||
    duration ||
    availableDays ||
    equipment ||
    injuries;

  if (!hasAnyValue) {
    return;
  }

  doc
    .moveDown(0.5)
    .fontSize(12)
    .fillColor("#111827")
    .font("Helvetica-Bold")
    .text("Resumen del perfil")
    .font("Helvetica");

  appendProfileLine(doc, "Nombre", name);
  appendProfileLine(doc, "Deporte", sport);
  appendProfileLine(doc, "Nivel", level);
  appendProfileLine(doc, "Genero", gender);
  appendProfileLine(doc, "Edad", age);
  appendProfileLine(doc, "Peso", weight);
  appendProfileLine(doc, "Altura", height);
  appendProfileLine(doc, "Dias disponibles", availableDays);
  appendProfileLine(doc, "Duracion promedio", duration);
  appendProfileLine(doc, "Equipamiento", equipment);
  appendProfileLine(doc, "Lesiones", injuries);
}

type TableColumn = {
  label: string;
  width: number;
  align?: "left" | "center" | "right";
};

function getTableColumns(doc: PDFDoc): TableColumn[] {
  const availableWidth =
    doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const nameWidth = Math.round(availableWidth * 0.42);
  const setsWidth = Math.round(availableWidth * 0.12);
  const repsWidth = Math.round(availableWidth * 0.16);
  const restWidth = Math.round(availableWidth * 0.16);
  const intensityWidth =
    availableWidth - (nameWidth + setsWidth + repsWidth + restWidth);

  return [
    { label: "Ejercicio", width: nameWidth, align: "left" },
    { label: "Series", width: setsWidth, align: "center" },
    { label: "Reps", width: repsWidth, align: "center" },
    { label: "Descanso", width: restWidth, align: "center" },
    { label: "Intensidad", width: intensityWidth, align: "center" },
  ];
}

function drawTableHeader(doc: PDFDoc, columns: TableColumn[]): void {
  ensureSpace(doc, TABLE_HEADER_HEIGHT + 4);

  const startX = doc.page.margins.left;
  const startY = doc.y;
  const tableWidth = columns.reduce((sum, col) => sum + col.width, 0);

  doc.rect(startX, startY, tableWidth, TABLE_HEADER_HEIGHT).fill("#e5f6ed");

  doc.fontSize(10).fillColor("#065f46").font("Helvetica-Bold");

  let currentX = startX;
  columns.forEach((column) => {
    doc.text(column.label, currentX + TABLE_CELL_PADDING, startY + 6, {
      width: column.width - TABLE_CELL_PADDING * 2,
      align: column.align ?? "left",
      ellipsis: true,
    });
    currentX += column.width;
  });

  doc
    .rect(startX, startY, tableWidth, TABLE_HEADER_HEIGHT)
    .strokeColor("#bbf7d0")
    .lineWidth(1)
    .stroke();

  doc.font("Helvetica");
  doc.y = startY + TABLE_HEADER_HEIGHT;
}

function getRowHeight(
  doc: PDFDoc,
  columns: TableColumn[],
  exerciseName: string,
): number {
  const nameColumn = columns[0];
  if (!nameColumn) {
    return TABLE_ROW_MIN_HEIGHT;
  }
  const textHeight = doc.heightOfString(exerciseName, {
    width: nameColumn.width - TABLE_CELL_PADDING * 2,
  });

  return Math.max(TABLE_ROW_MIN_HEIGHT, textHeight + TABLE_CELL_PADDING * 2);
}

function drawTableRow(
  doc: PDFDoc,
  columns: TableColumn[],
  exercise: RoutineExercise,
): void {
  const rowHeight = getRowHeight(doc, columns, exercise.name);
  const startX = doc.page.margins.left;
  const rowY = doc.y;
  const tableWidth = columns.reduce((sum, col) => sum + col.width, 0);
  const bottom = doc.page.height - doc.page.margins.bottom;

  if (rowY + rowHeight > bottom) {
    doc.addPage();
    drawTableHeader(doc, columns);
  }

  const values = [
    exercise.name,
    formatValue(exercise.sets),
    formatValue(exercise.reps),
    formatValue(exercise.restSeconds, " s"),
    formatValue(exercise.intensity * 10, "%"),
  ];

  doc.fontSize(10).fillColor("#111827").font("Helvetica");

  let currentX = startX;
  columns.forEach((column, index) => {
    doc.text(values[index] ?? "", currentX + TABLE_CELL_PADDING, rowY + 6, {
      width: column.width - TABLE_CELL_PADDING * 2,
      align: column.align ?? "left",
    });

    doc
      .rect(currentX, rowY, column.width, rowHeight)
      .strokeColor("#e5e7eb")
      .lineWidth(0.8)
      .stroke();

    currentX += column.width;
  });

  doc
    .rect(startX, rowY, tableWidth, rowHeight)
    .strokeColor("#e5e7eb")
    .lineWidth(0.8)
    .stroke();

  doc.y = rowY + rowHeight;
}

function renderExerciseNotes(doc: PDFDoc, exercises: RoutineExercise[]): void {
  const notes = exercises
    .map((exercise) => ({
      name: exercise.name,
      note: exercise.note?.trim() ?? "",
    }))
    .filter((entry) => entry.note.length > 0);

  if (notes.length === 0) {
    return;
  }

  ensureSpace(doc, 50);

  doc.x = doc.page.margins.left;
  doc
    .moveDown(0.6)
    .fontSize(11)
    .fillColor("#111827")
    .font("Helvetica-Bold")
    .text("Notas")
    .font("Helvetica");

  notes.forEach((entry) => {
    ensureSpace(doc, 22);
    doc
      .fontSize(9)
      .fillColor("#4b5563")
      .text(`• ${entry.name}: ${entry.note}`, {
        width: MAX_LINE_WIDTH,
      });
  });
}

function renderRoutineDay(doc: PDFDoc, day: RoutineDay): void {
  ensureSpace(doc, 70);

  doc
    .moveDown(0.8)
    .fontSize(13)
    .fillColor("#111827")
    .font("Helvetica-Bold")
    .text(day.day || "Dia", { width: MAX_LINE_WIDTH })
    .font("Helvetica");

  if (!day.exercises || day.exercises.length === 0) {
    doc
      .fontSize(10)
      .fillColor("#6b7280")
      .text("Sin ejercicios asignados.", { indent: 10 });
    return;
  }

  const columns = getTableColumns(doc);
  drawTableHeader(doc, columns);

  day.exercises.forEach((exercise) => {
    drawTableRow(doc, columns, exercise);
  });

  doc.moveDown(0.4);
  renderExerciseNotes(doc, day.exercises);
}

function renderWatermark(doc: PDFDoc): void {
  if (!fs.existsSync(LOGO_PATH)) {
    return;
  }

  const svg = fs.readFileSync(LOGO_PATH, "utf8");
  const adjustedSvg = applySvgOpacity(svg, WATERMARK_OPACITY);
  const pageWidth = doc.page.width;
  const pageHeight = doc.page.height;
  const contentWidth =
    pageWidth - doc.page.margins.left - doc.page.margins.right;
  const contentHeight =
    pageHeight - doc.page.margins.top - doc.page.margins.bottom;
  const logoWidth = Math.min(contentWidth * 0.7, contentHeight * 0.7, 360);
  const logoHeight = logoWidth;
  const logoX = doc.page.margins.left + (contentWidth - logoWidth) / 2;
  const logoY = doc.page.margins.top + (contentHeight - logoHeight) / 2;

  doc.save();
  SVGtoPDF(doc, adjustedSvg, logoX, logoY, {
    width: logoWidth,
    height: logoHeight,
  });
  doc.restore();
}

export const exportRoutinePdf = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const payload = req.body as RoutinePdfRequest | undefined;

    if (!payload?.routine?.routine || !Array.isArray(payload.routine.routine)) {
      res.status(400).json({ error: "Missing routine data." });
      return;
    }

    const fileDate = new Date().toISOString().slice(0, 10);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="rutina-${fileDate}.pdf"`,
    );

    const doc = new PDFDocument({
      size: "A4",
      margin: 50,
      info: {
        Title: "Rutina de entrenamiento",
        Author: "Kore",
      },
    });

    doc.pipe(res);

    doc.on("pageAdded", () => {
      renderWatermark(doc);
    });

    renderWatermark(doc);

    doc
      .fontSize(20)
      .fillColor("#111827")
      .font("Helvetica-Bold")
      .text("Rutina de entrenamiento", { width: MAX_LINE_WIDTH })
      .font("Helvetica")
      .moveDown(0.3);

    doc
      .fontSize(10)
      .fillColor("#6b7280")
      .text(`Generado: ${new Date().toLocaleDateString("es-ES")}`);

    renderProfileSummary(doc, payload.profile);

    doc
      .moveDown(0.8)
      .fontSize(12)
      .fillColor("#111827")
      .font("Helvetica-Bold")
      .text("Plan semanal")
      .font("Helvetica");

    payload.routine.routine.forEach((day) => {
      renderRoutineDay(doc, day);
    });

    doc.end();
  } catch (error) {
    console.error("Error exporting routine PDF:", error);
    res.status(500).json({ error: "Failed to generate routine PDF." });
  }
};
