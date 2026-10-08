export type TextAlignment = 'left' | 'center' | 'right';

export type StandardFontName =
  | 'Helvetica'
  | 'HelveticaBold'
  | 'TimesRoman'
  | 'TimesRomanBold'
  | 'Courier'
  | 'CourierBold'
  | 'NotoSerif'
  | 'DejaVuSans'
  | 'custom';

export interface FieldBoundingBox {
  id: string;
  name: string;
  key: string;
  pageNumber: number;
  // Exact PDF point coordinates (origin bottom-left in points, 1 pt = 1/72 inch)
  x: number;
  y: number;
  width: number;
  height: number;
  // Typography & rendering settings
  fontSize: number;
  lineHeight?: number;
  fontFamily: StandardFontName | string;
  alignment: TextAlignment;
  colorHex: string;
  multiline: boolean;
  whiteoutPadding: number;
  whiteoutColorHex?: string;
}

export interface FieldValues {
  [key: string]: string;
}

export interface CalibrationPreset {
  id: string;
  name: string;
  description: string;
  documentType: string;
  pageSize: {
    width: number;
    height: number;
  };
  boxes: FieldBoundingBox[];
  defaultValues: FieldValues;
}

export interface PDFDocumentMeta {
  numPages: number;
  pageWidth: number;
  pageHeight: number;
  fileName: string;
  fileSizeBytes: number;
}

export interface CustomFontData {
  name: string;
  fileName: string;
  bytes: Uint8Array;
}

export interface ProcessPDFResult {
  pdfBytes: Uint8Array;
  blobUrl: string;
  processingTimeMs: number;
}
