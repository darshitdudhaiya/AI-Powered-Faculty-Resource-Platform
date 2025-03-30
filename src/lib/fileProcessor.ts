import * as pdfjsLib from 'pdfjs-dist';

export async function extractTextFromPDF(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let fullText = '';

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(' ');
    fullText += pageText + '\n';
  }

  return fullText;
}

export async function extractSubjectDetails(content: string) {
  // Regex patterns for subject details
  const codePattern = /(?:Course|Subject)\s+Code\s*:?\s*([\dA-Z]+)/i;
  const namePattern = /(?:Course|Subject)\s+(?:Name|Title)\s*:?\s*([^\n]+)/i;

  const codeMatch = content.match(codePattern);
  const nameMatch = content.match(namePattern);

  // Extract all units dynamically
  const unitPattern = /(Unit[\s\-_:]*[IVXLCDM1-9]+)[\s]*(.*?)(?=(Unit[\s\-_:]*[IVXLCDM1-9]+|$))/gis;
  let syllabus: Record<string, string> = {};

  let match;
  while ((match = unitPattern.exec(content)) !== null) {
    const unitTitle = match[1].trim(); // Extract unit title (e.g., "Unit I", "Unit-1")
    const unitContent = match[2].trim(); // Extract content between units
    syllabus[unitTitle] = unitContent;
  }

  return {
    code: codeMatch?.[1]?.trim() || '',
    name: nameMatch?.[1]?.trim() || '',
    syllabus
  };
}



export async function processFile(file: File) {
  try {
    let content = '';
    
    if (file.type === 'application/pdf') {
      content = await extractTextFromPDF(file);
    } else {
      content = await file.text();
    }

    const subjectDetails = await extractSubjectDetails(content);
    return {
      success: true,
      data: subjectDetails
    };
  } catch (error) {
    console.error('Error processing file:', error);
    return {
      success: false,
      error: 'Failed to process file. Please try again.'
    };
  }
}