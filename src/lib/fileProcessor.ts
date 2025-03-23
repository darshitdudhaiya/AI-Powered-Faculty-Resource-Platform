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
  // Basic regex patterns for subject code and name
  const codePattern = /(?:Subject|Course)\s+Code\s*:?\s*([A-Z0-9]+)/i;
  const namePattern = /(?:Subject|Course)\s+(?:Title|Name)\s*:?\s*([^\n]+)/i;

  const codeMatch = content.match(codePattern);
  const nameMatch = content.match(namePattern);

  // Extract syllabus content (everything after subject details)
  const syllabusContent = content
    .split(/Unit[- ][1I]/i)[1] // Split at first unit
    ?.trim() || content; // Fallback to full content if no units found

  return {
    code: codeMatch?.[1]?.trim() || '',
    name: nameMatch?.[1]?.trim() || '',
    syllabus: syllabusContent
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