import React from 'react';
import type { BenchmarkMetrics, OCRResult } from '@/types/rf';
import { ArrowRightLeft, Clock, CheckCircle2, XCircle } from 'lucide-react';
import clsx from 'clsx';

interface BenchmarkPanelProps {
  metrics: BenchmarkMetrics;
}

export const BenchmarkPanel: React.FC<BenchmarkPanelProps> = ({ metrics }) => {
  const { tesseract, cloudVision } = metrics;

  return (
    <div className="flex flex-col h-full bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="p-4 border-b border-gray-200 flex items-center gap-2 bg-gray-50">
        <ArrowRightLeft className="w-5 h-5 text-gray-500" />
        <h2 className="text-sm font-semibold">Engine Benchmark Comparison</h2>
      </div>

      <div className="flex-1 overflow-auto p-4 flex flex-col md:flex-row gap-4">
        <EngineResultCard title="Tesseract.js (Local)" result={tesseract} />
        <EngineResultCard title="Google Cloud Vision (Server)" result={cloudVision} highlight />
      </div>
    </div>
  );
};

const EngineResultCard = ({ title, result, highlight = false }: { title: string, result: OCRResult | null, highlight?: boolean }) => {
  if (!result) {
    return (
      <div className={clsx(
        "flex-1 rounded-xl p-6 border-2 border-dashed flex items-center justify-center text-center",
        highlight ? "border-blue-200 bg-blue-50/50" : "border-gray-200 bg-gray-50/50"
      )}>
        <p className="text-gray-400 text-sm">Waiting for extraction...</p>
      </div>
    );
  }

  const { parsedData, processingTimeMs, completeness, warnings } = result;

  return (
    <div className={clsx(
      "flex-1 rounded-xl border p-5 flex flex-col h-full",
      highlight ? "border-blue-200 bg-blue-50/20 shadow-sm" : "border-gray-200 bg-white shadow-sm"
    )}>
      <h3 className="font-semibold text-gray-800 mb-4 pb-3 border-b">{title}</h3>
      
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 flex flex-col items-center justify-center">
          <Clock className="w-5 h-5 text-gray-400 mb-1" />
          <span className="text-sm text-gray-500">Latency</span>
          <span className="text-lg font-bold text-gray-900">{processingTimeMs} <span className="text-xs font-normal">ms</span></span>
        </div>
        <div className={clsx(
          "p-3 rounded-lg border flex flex-col items-center justify-center",
          completeness >= 80 ? "bg-green-50 border-green-100" :
          completeness >= 50 ? "bg-yellow-50 border-yellow-100" : "bg-red-50 border-red-100"
        )}>
          <CheckCircle2 className={clsx("w-5 h-5 mb-1", 
            completeness >= 80 ? "text-green-500" :
            completeness >= 50 ? "text-yellow-500" : "text-red-500"
          )} />
          <span className="text-sm text-gray-500">Completeness</span>
          <span className="text-lg font-bold text-gray-900">{completeness}%</span>
        </div>
      </div>

      <div className="flex-1 min-h-[300px]">
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Extraction Accuracy</h4>
        <div className="space-y-2">
          <AccuracyRow label="Student Name" extracted={!!parsedData.studentName} value={parsedData.studentName} />
          <AccuracyRow label="Student ID" extracted={!!parsedData.studentId} value={parsedData.studentId} />
          <AccuracyRow label="Year & Term" extracted={!!parsedData.yearLevel} value={parsedData.yearLevel} />
          <AccuracyRow label="Total Amount" extracted={!!parsedData.totalAmount} value={parsedData.totalAmount ? `₱${parsedData.totalAmount.toLocaleString()}` : ''} />
          <AccuracyRow label="Subjects Count" extracted={(parsedData.subjects?.length || 0) > 0} value={`${parsedData.subjects?.length || 0} subjects found`} />
        </div>

        {warnings.length > 0 && (
          <div className="mt-6">
            <h4 className="text-xs font-semibold text-yellow-600 uppercase tracking-wider mb-2">Warnings ({warnings.length})</h4>
            <ul className="text-xs text-gray-600 space-y-1">
              {warnings.map((w, i) => <li key={i} className="flex gap-1.5"><XCircle className="w-3.5 h-3.5 text-yellow-500 shrink-0" /> {w}</li>)}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

const AccuracyRow = ({ label, extracted, value }: { label: string, extracted: boolean, value?: string }) => (
  <div className="flex items-center justify-between p-2 rounded bg-gray-50 text-sm">
    <span className="text-gray-600">{label}</span>
    <div className="flex items-center gap-2">
      {value && <span className="text-xs font-mono text-gray-500 max-w-[120px] truncate" title={value}>{value}</span>}
      {extracted ? (
        <CheckCircle2 className="w-4 h-4 text-green-500" />
      ) : (
        <XCircle className="w-4 h-4 text-red-400" />
      )}
    </div>
  </div>
);
