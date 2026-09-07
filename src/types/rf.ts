export interface Installment {
  date: string;
  percent: number;
  amount: number;
  status: 'PAID' | 'PENDING' | 'UNKNOWN';
}

export interface Subject {
  code: string;
  title: string;
  lecUnits: number;
  labUnits: number;
  totalCredits: number;
  fee: number;
  scheduleAndRoom: string;
}

export interface USAEnrollmentForm {
  institution: string;
  academicYearTerm: string;
  enrollmentDate: string;
  
  studentName: string;
  studentId: string;
  college: string;
  program: string;
  yearLevel: string;
  email: string;
  contactNumber: string;

  subjects: Subject[];

  lectureFee: number;
  labFees: number;
  miscellaneousFee: number;
  totalAmount: number;
  downPaymentAmount: number;
  downPaymentStatus: 'PAID' | 'PENDING' | 'UNKNOWN';
  installmentBreakdown: Installment[];
}

export interface OCRResult {
  rawText: string;
  parsedData: Partial<USAEnrollmentForm>;
  processingTimeMs: number;
  engine: 'TESSERACT' | 'CLOUD_VISION';
  completeness: number; // percentage 0-100
  warnings: string[];
}

export interface BenchmarkMetrics {
  tesseract: OCRResult | null;
  cloudVision: OCRResult | null;
}
