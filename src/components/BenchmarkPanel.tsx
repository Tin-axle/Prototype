import React from 'react';
import type { BenchmarkMetrics, OCRResult } from '../types/rf';
import { Zap, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import clsx from 'clsx';

interface BenchmarkPanelProps {
  metrics: BenchmarkMetrics;
}

export const BenchmarkPanel: React.FC<BenchmarkPanelProps> = ({ metrics }) => {
  if (!metrics.tesseract && !metrics.cloudVision) {
    return null;
  }

  return (
    <div className="bg-white border border-border rounded-lg overflow-hidden flex flex-col h-full">
      <div className="bg-slate-800 text-white p-4 flex items-center gap-2">
        <Zap className="w-5 h-5 text-yellow-400" />
        <h2 className="font-semibold">Dual Run Benchmark Comparison</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-gray-200 flex-1">
        <ResultColumn title="Tesseract.js (Local)" result={metrics.tesseract} />
        <ResultColumn title="Google Cloud Vision (API)" result={metrics.cloudVision} />
      </div>
    </div>
  );
};

const ResultColumn = ({ title, result }: { title: string; result: OCRResult | null }) => {
  if (!result) {
    return (
      <div className="bg-white p-6 flex flex-col items-center justify-center text-gray-400 text-center min-h-[300px]">
        <Clock className="w-8 h-8 mb-2 opacity-20" />
        <p>Waiting for result...</p>
      </div>
    );
  }

  const { processingTimeMs, completeness, warnings, parsedData } = result;
  
  return (
    <div className="bg-white p-6 flex flex-col gap-6 h-full overflow-auto">
      <h3 className="font-bold text-lg text-gray-800 border-b pb-2">{title}</h3>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 flex flex-col items-center justify-center text-center">
          <span className="text-xs text-gray-500 font-medium mb-1 uppercase tracking-wider">Processing Time</span>
          <span className="text-2xl font-bold text-blue-600">{processingTimeMs} <span className="text-sm font-normal text-gray-500">ms</span></span>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 flex flex-col items-center justify-center text-center">
          <span className="text-xs text-gray-500 font-medium mb-1 uppercase tracking-wider">Completeness</span>
          <span className={clsx(
            "text-2xl font-bold",
            completeness >= 80 ? "text-green-600" : completeness >= 50 ? "text-yellow-600" : "text-red-600"
          )}>
            {completeness}%
          </span>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-2">Extraction Summary</h4>
        <div className="space-y-2 text-sm">
          <SummaryRow label="Student Name" extracted={!!parsedData.studentName} />
          <SummaryRow label="Student ID" extracted={!!parsedData.studentId} />
          <SummaryRow label="Program/Course" extracted={!!parsedData.program} />
          <SummaryRow label="Subjects Count" extracted={!!parsedData.subjects?.length} value={parsedData.subjects?.length?.toString()} />
          <SummaryRow label="Total Amount" extracted={!!parsedData.totalAmount} />
        </div>
      </div>

      {warnings.length > 0 && (
        <div className="mt-auto">
          <h4 className="text-sm font-semibold text-red-700 flex items-center gap-1 mb-2">
            <AlertTriangle className="w-4 h-4" /> Warnings ({warnings.length})
          </h4>
          <ul className="text-xs text-red-600 bg-red-50 p-3 rounded border border-red-100 space-y-1">
            {warnings.map((w, i) => <li key={i}>• {w}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
};

const SummaryRow = ({ label, extracted, value }: { label: string; extracted: boolean; value?: string }) => (
  <div className="flex items-center justify-between py-1 border-b border-gray-50 last:border-0">
    <span className="text-gray-600">{label}</span>
    <div className="flex items-center gap-2">
      {value && <span className="text-gray-900 font-medium">{value}</span>}
      {extracted ? (
        <CheckCircle className="w-4 h-4 text-green-500" />
      ) : (
        <AlertTriangle className="w-4 h-4 text-red-400" />
      )}
    </div>
  </div>
);
