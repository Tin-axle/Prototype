import React, { useState, useEffect } from 'react';
import { Settings, Play, Database, SplitSquareHorizontal } from 'lucide-react';
import { RFUpload } from './components/RFUpload';
import { RFDashboard } from './components/RFDashboard';
import { BenchmarkPanel } from './components/BenchmarkPanel';
import { runTesseractOCR, runCloudVisionOCR } from './services/ocrService';
import type { OCRProgressCallback } from './services/ocrService';
import type { OCRResult, BenchmarkMetrics } from './types/rf';

type EngineMode = 'TESSERACT' | 'CLOUD_VISION' | 'DUAL';

function App() {
  const [mode, setMode] = useState<EngineMode>('TESSERACT');
  const [apiKey, setApiKey] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressStatus, setProgressStatus] = useState('');
  const [progressPercent, setProgressPercent] = useState(0);
  
  const [result, setResult] = useState<OCRResult | null>(null);
  const [benchmarkMetrics, setBenchmarkMetrics] = useState<BenchmarkMetrics>({ tesseract: null, cloudVision: null });

  useEffect(() => {
    const savedKey = localStorage.getItem('GCP_VISION_API_KEY');
    if (savedKey) setApiKey(savedKey);
  }, []);

  const handleSaveApiKey = (key: string) => {
    setApiKey(key);
    localStorage.setItem('GCP_VISION_API_KEY', key);
    setShowSettings(false);
  };

  const loadSampleData = () => {
    // Generate a simple canvas with mock RF text
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 1000;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = 'black';
      ctx.font = '24px monospace';
      ctx.fillText('University of San Agustin, Inc.', 50, 50);
      ctx.fillText('Student Name: ABOGADIL, RIZZA MIA CALDERON', 50, 100);
      ctx.fillText('ID: 0107-2009-23', 50, 140);
      ctx.fillText('Program: Bachelor of Science Computer Science', 50, 180);
      ctx.fillText('Year Level: Y4S1', 50, 220);
      ctx.fillText('Email: rabogadil@usa.edu.ph', 50, 260);
      
      ctx.fillText('CS 411 Information Assurance & Security 3.0 0.0 3.0 1500.00 Wed 11:00 AM-02:00 PM', 50, 350);
      ctx.fillText('CS 412 Software Engineering 2 2.0 1.0 3.0 1500.00 Thu 09:00 AM-12:00 PM', 50, 390);
      
      ctx.fillText('Total Amount: ₱51,803.00', 50, 500);
      
      const dataUrl = canvas.toDataURL('image/png');
      setImageUrl(dataUrl);
    }
  };

  const handleProgress: OCRProgressCallback = (status, pct) => {
    setProgressStatus(status);
    setProgressPercent(Math.round(pct * 100));
  };

  const runOCR = async () => {
    if (!imageUrl) {
      alert("Please upload a document first.");
      return;
    }

    if ((mode === 'CLOUD_VISION' || mode === 'DUAL') && !apiKey) {
      alert("Please configure your Google Cloud Vision API key in settings.");
      setShowSettings(true);
      return;
    }

    setIsProcessing(true);
    setResult(null);
    setBenchmarkMetrics({ tesseract: null, cloudVision: null });

    try {
      if (mode === 'TESSERACT') {
        const res = await runTesseractOCR(imageUrl, handleProgress);
        setResult(res);
      } else if (mode === 'CLOUD_VISION') {
        const res = await runCloudVisionOCR(imageUrl, apiKey, handleProgress);
        setResult(res);
      } else if (mode === 'DUAL') {
        setProgressStatus('Running Tesseract...');
        const tessRes = await runTesseractOCR(imageUrl);
        setBenchmarkMetrics(prev => ({ ...prev, tesseract: tessRes }));
        
        setProgressStatus('Running Cloud Vision...');
        const cvRes = await runCloudVisionOCR(imageUrl, apiKey);
        setBenchmarkMetrics(prev => ({ ...prev, cloudVision: cvRes }));
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
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="bg-primary text-white p-2 rounded-lg">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-gray-900 leading-tight">USA RF Extractor</h1>
            <p className="text-xs text-gray-500">Document Intelligence OCR Prototype</p>
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
          
          <button onClick={() => setShowSettings(true)} className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-full transition">
            <Settings className="w-5 h-5" />
          </button>

          <button 
            onClick={runOCR}
            disabled={isProcessing || !imageUrl}
            className="flex items-center gap-2 bg-primary text-white px-5 py-2 rounded-md font-medium text-sm hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
          >
            <Play className="w-4 h-4" fill="currentColor" />
            {isProcessing ? 'Processing...' : 'Run Extraction'}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-[1600px] mx-auto w-full">
        {/* Left Column: Upload */}
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
                  className="bg-primary h-2.5 rounded-full transition-all duration-300" 
                  style={{ width: `${Math.max(5, progressPercent)}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Dashboard or Benchmark */}
        <div className="h-full">
          {mode === 'DUAL' ? (
            <BenchmarkPanel metrics={benchmarkMetrics} />
          ) : (
            <RFDashboard result={result} />
          )}
        </div>
      </main>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">Configuration</h2>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Google Cloud Vision API Key
              </label>
              <input 
                type="password"
                defaultValue={apiKey}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                placeholder="AIzaSy..."
                id="apiKeyInput"
              />
              <p className="text-xs text-gray-500 mt-2">
                Required for Cloud Vision and Dual Run modes. Stored locally in your browser.
              </p>
            </div>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setShowSettings(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  const val = (document.getElementById('apiKeyInput') as HTMLInputElement).value;
                  handleSaveApiKey(val);
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-blue-600 rounded-md transition"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const ModeButton = ({ active, onClick, children, icon }: { active: boolean, onClick: () => void, children: React.ReactNode, icon?: React.ReactNode }) => (
  <button
    onClick={onClick}
    className={`px-3 py-1.5 text-xs font-medium rounded-md transition flex items-center ${
      active ? 'bg-white text-gray-900 shadow-sm border border-gray-200' : 'text-gray-500 hover:text-gray-700'
    }`}
  >
    {icon}
    {children}
  </button>
);

export default App;
