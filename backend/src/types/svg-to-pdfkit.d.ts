declare module "svg-to-pdfkit" {
  import type PDFDocument from "pdfkit";

  const svgToPdf: (
    doc: PDFDocument,
    svg: string,
    x: number,
    y: number,
    options?: Record<string, unknown>,
  ) => void;

  export default svgToPdf;
}
