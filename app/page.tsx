"use client";

import React, { useState } from 'react';
import { Database, Play, SplitSquareHorizontal } from 'lucide-react';
import { createWorker } from 'tesseract.js';
import { RFUpload } from '@/components/RFUpload';
import { RFDashboard } from '@/components/RFDashboard';
import { BenchmarkPanel } from '@/components/BenchmarkPanel';
import type { OCRResult, BenchmarkMetrics } from '@/types/rf';
import { parseRFText, calculateCompleteness } from '@/lib/rfParser';
import clsx from 'clsx';

type EngineMode = 'TESSERACT' | 'CLOUD_VISION' | 'DUAL';

export default function Home() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [mode, setMode] = useState<EngineMode>('CLOUD_VISION');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressStatus, setProgressStatus] = useState<string>('');
  const [progressPercent, setProgressPercent] = useState<number>(0);
  
  const [result, setResult] = useState<OCRResult | null>(null);
  const [benchmarkMetrics, setBenchmarkMetrics] = useState<BenchmarkMetrics>({
    tesseract: null,
    cloudVision: null
  });

  const runTesseractOCR = async (image: string): Promise<OCRResult> => {
    const start = performance.now();
    setProgressStatus('Initializing Tesseract worker...');
    
    const worker = await createWorker('eng', 1, {
      logger: m => {
        if (m.status === 'recognizing text') {
          setProgressStatus('Recognizing text locally...');
          setProgressPercent(Math.round(m.progress * 100));
        }
      }
    });

    setProgressStatus('Extracting text...');
    const { data: { text } } = await worker.recognize(image);
    await worker.terminate();

    const processingTimeMs = Math.round(performance.now() - start);
    const parsedData = parseRFText(text);
    const { percentage, warnings } = calculateCompleteness(parsedData);

    return {
      rawText: text,
      parsedData,
      processingTimeMs,
      engine: 'TESSERACT',
      completeness: percentage,
      warnings
    };
  };

  const runCloudVisionOCR = async (image: string): Promise<OCRResult> => {
    const start = performance.now();
    setProgressStatus('Sending to Google Cloud Vision API...');
    setProgressPercent(40);
    
    const response = await fetch('/api/ocr', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Cloud Vision API failed');
    }

    const data = await response.json();
    const processingTimeMs = Math.round(performance.now() - start);
    
    setProgressPercent(100);

    return {
      rawText: data.rawText,
      parsedData: data.parsedData,
      processingTimeMs,
      engine: 'CLOUD_VISION',
      completeness: data.completeness,
      warnings: data.warnings
    };
  };

  const loadSampleData = () => {
    // Generate a simple canvas with mock RF text
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 1000;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 20px Arial';
    ctx.fillText('University of San Agustin, Inc.', 50, 50);
    ctx.font = '16px Arial';
    ctx.fillText('Name: ABOGADIL, RIZZA MIA CALDERON', 50, 100);
    ctx.fillText('Student ID: 0107-2009-23', 50, 130);
    ctx.fillText('Course: BS Computer Science', 50, 160);
    ctx.fillText('Y4S1', 50, 190);
    ctx.fillText('Email: rizzamia@usa.edu.ph', 50, 220);
    ctx.fillText('09123456789', 50, 250);

    ctx.fillText('CS 411 Information Assurance & Security 3.0 0.0 3.0 1500.00 Wed 11:00 AM-02:00 PM', 50, 300);
    ctx.fillText('CS 412 Software Engineering 3.0 3.0 6.0 2000.00 Thu 09:00 AM-12:00 PM', 50, 330);

    ctx.fillText('Total Amount: 3500.00', 50, 400);

    const dataUrl = canvas.toDataURL('image/png');
    setImageUrl(dataUrl);
  };

  const runOCR = async () => {
    if (!imageUrl) return;
    setIsProcessing(true);
    setProgressPercent(0);
    setResult(null);
    setBenchmarkMetrics({ tesseract: null, cloudVision: null });

    try {
      if (mode === 'TESSERACT') {
        const res = await runTesseractOCR(imageUrl);
        setResult(res);
      } else if (mode === 'CLOUD_VISION') {
        const res = await runCloudVisionOCR(imageUrl);
        setResult(res);
      } else if (mode === 'DUAL') {
        // Run both for benchmarking
        setProgressStatus('Running Dual Benchmark (Tesseract + GCP)...');
        
        // Start both simultaneously
        const tessPromise = runTesseractOCR(imageUrl).catch(e => {
          console.error("Tesseract failed:", e);
          return null;
        });
        
        const cvPromise = runCloudVisionOCR(imageUrl).catch(e => {
          console.error("Cloud Vision failed:", e);
          return null;
        });

        const [tessRes, cvRes] = await Promise.all([tessPromise, cvPromise]);
        
        setBenchmarkMetrics({
          tesseract: tessRes,
          cloudVision: cvRes
        });
      }
    } catch (err: any) {
      alert(`OCR Error: ${err.message}`);
    } finally {
      setIsProcessing(false);
      setProgressStatus('');
      setProgressPercent(0);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col font-sans">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 text-white p-2 rounded-lg">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-gray-900 leading-tight">USA RF Extractor</h1>
            <p className="text-xs text-gray-500">Next.js Document Intelligence Prototype</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="bg-gray-100 p-1 rounded-lg inline-flex">
            <ModeButton active={mode === 'TESSERACT'} onClick={() => setMode('TESSERACT')}>Tesseract</ModeButton>
            <ModeButton active={mode === 'CLOUD_VISION'} onClick={() => setMode('CLOUD_VISION')}>Cloud Vision</ModeButton>
            <ModeButton active={mode === 'DUAL'} onClick={() => setMode('DUAL')} icon={<SplitSquareHorizontal className="w-3 h-3 mr-1" />}>Dual Run</ModeButton>
          </div>

          <button onClick={loadSampleData} className="text-sm font-medium text-gray-600 hover:text-gray-900 px-3 py-1.5 rounded bg-gray-100 hover:bg-gray-200 transition">
            Load Sample
          </button>

          <button 
            onClick={runOCR}
            disabled={isProcessing || !imageUrl}
            className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2 rounded-md font-medium text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
          >
            <Play className="w-4 h-4" fill="currentColor" />
            {isProcessing ? 'Processing...' : 'Run Extraction'}
          </button>
        </div>
      </header>

      <main className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-[1600px] mx-auto w-full">
        <div className="flex flex-col h-full gap-4">
          <RFUpload onImageReady={setImageUrl} disabled={isProcessing} />
          
          {isProcessing && (
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm animate-pulse">
              <div className="flex justify-between text-sm mb-2 font-medium text-gray-700">
                <span>{progressStatus || 'Processing...'}</span>
                {progressPercent > 0 && <span>{progressPercent}%</span>}
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
                  style={{ width: `${Math.max(5, progressPercent)}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>

        <div className="h-full">
          {mode === 'DUAL' ? (
            <BenchmarkPanel metrics={benchmarkMetrics} />
          ) : (
            <RFDashboard result={result} />
          )}
        </div>
      </main>
    </div>
  );
}

const ModeButton = ({ active, onClick, children, icon }: { active: boolean, onClick: () => void, children: React.ReactNode, icon?: React.ReactNode }) => (
  <button
    onClick={onClick}
    className={clsx(
      "px-3 py-1.5 text-xs font-medium rounded-md transition flex items-center",
      active 
        ? "bg-white text-gray-900 shadow-sm border border-gray-200" 
        : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50"
    )}
  >
    {icon}
    {children}
  </button>
);
