import React, { useCallback, useRef, useState } from 'react';
import { UploadCloud, FileImage, ZoomIn, ZoomOut } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

interface RFUploadProps {
  onImageReady: (dataUrl: string) => void;
  disabled?: boolean;
}

export const RFUpload: React.FC<RFUploadProps> = ({ onImageReady, disabled }) => {
  const [dragActive, setDragActive] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const processFile = async (file: File) => {
    if (!file) return;

    if (file.type === 'application/pdf') {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const page = await pdf.getPage(1); 
        
        const viewport = page.getViewport({ scale: 2.0 }); 
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        
        if (context) {
          canvas.height = viewport.height;
          canvas.width = viewport.width;
          
          await page.render({
            canvasContext: context,
            viewport: viewport,
            
            canvas: canvas
          }).promise;
          
          const dataUrl = canvas.toDataURL('image/png');
          setPreviewUrl(dataUrl);
          onImageReady(dataUrl);
        }
      } catch (err) {
        console.error('Error rendering PDF:', err);
        alert('Failed to render PDF. Please try uploading an image instead.');
      }
    } else if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          const dataUrl = e.target.result as string;
          setPreviewUrl(dataUrl);
          onImageReady(dataUrl);
        }
      };
      reader.readAsDataURL(file);
    } else {
      alert('Unsupported file type. Please upload a PDF or an image.');
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  }, [disabled, onImageReady]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const toggleZoom = () => setZoom(z => z === 1 ? 1.5 : 1);

  return (
    <div className="flex flex-col h-full bg-white border border-border rounded-lg overflow-hidden">
      <div className="p-4 border-b border-border flex justify-between items-center bg-gray-50">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <FileImage className="w-4 h-4 text-primary" />
          Document Preview
        </h2>
        {previewUrl && (
          <button 
            onClick={toggleZoom}
            className="p-1.5 hover:bg-gray-200 rounded text-gray-600 transition-colors"
            title="Toggle Zoom"
          >
            {zoom === 1 ? <ZoomIn className="w-4 h-4" /> : <ZoomOut className="w-4 h-4" />}
          </button>
        )}
      </div>

      <div className="flex-1 relative overflow-auto bg-gray-100 flex items-center justify-center min-h-[400px]">
        {previewUrl ? (
          <div className="p-4 w-full flex justify-center">
            <img 
              src={previewUrl} 
              alt="Document preview" 
              style={{ transform: `scale(${zoom})`, transformOrigin: 'top center', transition: 'transform 0.2s' }}
              className="max-w-full shadow-lg border border-gray-300 bg-white"
            />
          </div>
        ) : (
          <div 
            className={`w-full h-full p-8 flex items-center justify-center transition-colors ${dragActive ? 'bg-blue-50' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <div className="max-w-sm w-full border-2 border-dashed border-gray-300 rounded-xl p-8 text-center flex flex-col items-center justify-center bg-white shadow-sm">
              <UploadCloud className="w-12 h-12 text-gray-400 mb-4" />
              <p className="text-lg font-medium text-gray-700 mb-1">Drag and drop document</p>
              <p className="text-sm text-gray-500 mb-6">PDF, PNG, JPG accepted. Single page only.</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,image/*"
                onChange={handleChange}
                className="hidden"
                disabled={disabled}
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-blue-600 disabled:opacity-50 transition-colors"
              >
                Browse Files
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
