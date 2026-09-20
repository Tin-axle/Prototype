import { NextResponse } from 'next/server';
import vision from '@google-cloud/vision';
import { parseRFText, calculateCompleteness } from '@/lib/rfParser';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { image } = body;

    if (!image) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    // Extract base64 part
    let base64Image = image;
    if (image.startsWith('data:image')) {
      base64Image = image.split(',')[1];
    }

    const client = new vision.ImageAnnotatorClient();

    const [result] = await client.documentTextDetection({
      image: { content: base64Image },
    });

    const fullTextAnnotation = result.fullTextAnnotation;
    const rawText = fullTextAnnotation?.text || '';

    const parsedData = parseRFText(rawText);
    const { percentage, warnings } = calculateCompleteness(parsedData);

    return NextResponse.json({
      rawText,
      parsedData,
      completeness: percentage,
      warnings
    });

  } catch (error: any) {
    console.error('Vision API Error:', error);
    return NextResponse.json({ error: error.message || 'Error processing image' }, { status: 500 });
  }
}
