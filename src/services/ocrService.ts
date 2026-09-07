import { createWorker } from 'tesseract.js';
import type { OCRResult } from '../types/rf';
import { parseRFText, calculateCompleteness } from '../utils/rfParser';

export type OCRProgressCallback = (status: string, progress: number) => void;

export async function runTesseractOCR(
  imageUrl: string, 
  onProgress?: OCRProgressCallback
): Promise<OCRResult> {
  const startTime = performance.now();
  
  onProgress?.('Initializing Tesseract worker', 0);
  const worker = await createWorker('eng', 1, {
    logger: m => {
      if (m.status === 'recognizing text') {
        onProgress?.('Recognizing text', m.progress);
      } else {
        onProgress?.(m.status, 0);
      }
    }
  });

  onProgress?.('Running OCR', 0.5);
  const { data: { text } } = await worker.recognize(imageUrl);
  await worker.terminate();

  const processingTimeMs = Math.round(performance.now() - startTime);
  
  onProgress?.('Parsing extracted text', 1);
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
}

export async function runCloudVisionOCR(
  imageUrl: string,
  apiKey: string,
  onProgress?: OCRProgressCallback
): Promise<OCRResult> {
  const startTime = performance.now();
  onProgress?.('Sending image to Cloud Vision', 0.5);

  let base64Image = imageUrl;
  if (imageUrl.startsWith('data:image')) {
    base64Image = imageUrl.split(',')[1];
  }

  const payload = {
    requests: [
      {
        image: {
          content: base64Image
        },
        features: [
          {
            type: 'DOCUMENT_TEXT_DETECTION'
          }
        ]
      }
    ]
  };

  try {
    const response = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Failed to call Cloud Vision API');
    }

    const data = await response.json();
    const text = data.responses[0]?.fullTextAnnotation?.text || '';

    const processingTimeMs = Math.round(performance.now() - startTime);
    onProgress?.('Parsing extracted text', 1);

    const parsedData = parseRFText(text);
    const { percentage, warnings } = calculateCompleteness(parsedData);

    return {
      rawText: text,
      parsedData,
      processingTimeMs,
      engine: 'CLOUD_VISION',
      completeness: percentage,
      warnings
    };
  } catch (error: any) {
    throw new Error(`Cloud Vision Error: ${error.message}`);
  }
}
