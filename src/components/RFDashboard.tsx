import React, { useState } from 'react';
import type { OCRResult } from '../types/rf';
import { User, BookOpen, Receipt, FileJson, AlertCircle, Copy, Check } from 'lucide-react';
import clsx from 'clsx';

interface RFDashboardProps {
  result: OCRResult | null;
}

export const RFDashboard: React.FC<RFDashboardProps> = ({ result }) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'subjects' | 'json'>('profile');
  const [copied, setCopied] = useState(false);

  if (!result) {
    return (
      <div className="flex flex-col h-full bg-white border border-border rounded-lg items-center justify-center text-gray-500 p-8 text-center min-h-[400px]">
        <BookOpen className="w-12 h-12 mb-4 text-gray-300" />
        <p className="text-lg font-medium">No Data Available</p>
        <p className="text-sm mt-2">Upload a document and run OCR to see the parsed results here.</p>
      </div>
    );
  }

  const { parsedData, rawText, processingTimeMs, engine, completeness, warnings } = result;

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(parsedData, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const tabs = [
    { id: 'profile', label: 'Profile & Assessment', icon: User },
    { id: 'subjects', label: 'Enrolled Subjects', icon: BookOpen },
    { id: 'json', label: 'Raw Data & JSON', icon: FileJson },
  ] as const;

  return (
    <div className="flex flex-col h-full bg-white border border-border rounded-lg overflow-hidden">
      
      <div className="p-4 border-b border-border bg-gray-50 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex gap-4 items-center text-sm">
          <span className="font-semibold text-gray-700">Engine: <span className="font-normal">{engine}</span></span>
          <span className="text-gray-300">|</span>
          <span className="font-semibold text-gray-700">Time: <span className="font-normal">{processingTimeMs}ms</span></span>
          <span className="text-gray-300">|</span>
          <span className="font-semibold text-gray-700 flex items-center gap-1">
            Completeness: 
            <span className={clsx("font-medium px-2 py-0.5 rounded text-xs", 
              completeness >= 80 ? "bg-green-100 text-green-700" :
              completeness >= 50 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"
            )}>
              {completeness}%
            </span>
          </span>
        </div>
      </div>

      {warnings.length > 0 && (
        <div className="bg-yellow-50 border-b border-yellow-200 p-3 flex items-start gap-2 text-sm text-yellow-800">
          <AlertCircle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">Extraction Warnings:</span>
            <ul className="list-disc pl-5 mt-1">
              {warnings.map((w, i) => <li key={i}>{w}</li>)}
            </ul>
          </div>
        </div>
      )}

      <div className="flex border-b border-border px-2">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors",
                activeTab === tab.id 
                  ? "border-primary text-primary" 
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              )}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      <div className="flex-1 overflow-auto p-4 bg-gray-50">
        
        {activeTab === 'profile' && (
          <div className="space-y-6">
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-blue-50 border-b border-gray-200 px-4 py-3 flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-gray-800">Student Profile</h3>
              </div>
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <DataField label="Student Name" value={parsedData.studentName} />
                <DataField label="Student ID" value={parsedData.studentId} />
                <DataField label="Program / Course" value={parsedData.program} />
                <DataField label="Year & Term" value={parsedData.yearLevel} />
                <DataField label="Email" value={parsedData.email} />
                <DataField label="Contact Number" value={parsedData.contactNumber} />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-green-50 border-b border-gray-200 px-4 py-3 flex items-center gap-2">
                <Receipt className="w-5 h-5 text-green-600" />
                <h3 className="font-semibold text-gray-800">Financial Assessment</h3>
              </div>
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <DataField label="Total Amount" value={parsedData.totalAmount ? `₱${parsedData.totalAmount.toLocaleString()}` : undefined} />
                
              </div>
            </div>
          </div>
        )}

        {activeTab === 'subjects' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-600 border-b border-gray-200 uppercase text-xs">
                  <tr>
                    <th className="px-4 py-3">Code</th>
                    <th className="px-4 py-3">Title</th>
                    <th className="px-4 py-3 text-right">Lec</th>
                    <th className="px-4 py-3 text-right">Lab</th>
                    <th className="px-4 py-3 text-right">Credits</th>
                    <th className="px-4 py-3 text-right">Fee (₱)</th>
                    <th className="px-4 py-3">Schedule & Room</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {parsedData.subjects && parsedData.subjects.length > 0 ? (
                    parsedData.subjects.map((subject, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900"><input type="text" className="bg-transparent w-full border-b border-transparent focus:border-primary focus:outline-none" defaultValue={subject.code} /></td>
                        <td className="px-4 py-3"><input type="text" className="bg-transparent w-full border-b border-transparent focus:border-primary focus:outline-none" defaultValue={subject.title} /></td>
                        <td className="px-4 py-3 text-right"><input type="number" className="bg-transparent w-12 text-right border-b border-transparent focus:border-primary focus:outline-none" defaultValue={subject.lecUnits} /></td>
                        <td className="px-4 py-3 text-right"><input type="number" className="bg-transparent w-12 text-right border-b border-transparent focus:border-primary focus:outline-none" defaultValue={subject.labUnits} /></td>
                        <td className="px-4 py-3 text-right"><input type="number" className="bg-transparent w-12 text-right border-b border-transparent focus:border-primary focus:outline-none" defaultValue={subject.totalCredits} /></td>
                        <td className="px-4 py-3 text-right"><input type="number" className="bg-transparent w-20 text-right border-b border-transparent focus:border-primary focus:outline-none" defaultValue={subject.fee} /></td>
                        <td className="px-4 py-3"><input type="text" className="bg-transparent w-full border-b border-transparent focus:border-primary focus:outline-none text-xs" defaultValue={subject.scheduleAndRoom} /></td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-gray-500">No subjects extracted. Check the OCR raw output.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'json' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
            <div className="bg-gray-900 rounded-lg overflow-hidden flex flex-col">
              <div className="px-4 py-2 bg-gray-800 text-gray-200 text-xs font-mono flex justify-between items-center">
                <span>Structured JSON Output</span>
                <button 
                  onClick={handleCopyJson}
                  className="p-1 hover:bg-gray-700 rounded transition-colors flex items-center gap-1"
                >
                  {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
              <pre className="p-4 text-green-400 font-mono text-xs overflow-auto flex-1 whitespace-pre-wrap">
                {JSON.stringify(parsedData, null, 2)}
              </pre>
            </div>
            
            <div className="bg-gray-100 rounded-lg border border-gray-300 overflow-hidden flex flex-col">
              <div className="px-4 py-2 bg-gray-200 text-gray-700 text-xs font-mono font-bold border-b border-gray-300">
                Raw OCR Text Dump
              </div>
              <pre className="p-4 text-gray-800 font-mono text-xs overflow-auto flex-1 whitespace-pre-wrap">
                {rawText}
              </pre>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

const DataField = ({ label, value }: { label: string; value?: string | number }) => (
  <div>
    <span className="block text-xs font-medium text-gray-500 mb-1">{label}</span>
    {value ? (
      <span className="block text-sm font-medium text-gray-900 bg-gray-50 px-3 py-2 rounded border border-gray-100">{value}</span>
    ) : (
      <span className="block text-sm text-gray-400 bg-gray-50 px-3 py-2 rounded border border-gray-100 italic border-dashed">Not detected</span>
    )}
  </div>
);
