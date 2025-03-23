import jsPDF from 'jspdf';
import pdfMake from 'pdfmake/build/pdfmake';
import htmlToPdfmake from 'html-to-pdfmake';
import { Section } from '../types';

export function exportToPDF(content: string, filename: string) {
  const html = document.createElement('div');
  html.innerHTML = content;
  
  const pdfContent = htmlToPdfmake(html.innerHTML);
  
  pdfMake.createPdf({ content: pdfContent }).download(filename);
}

export function exportToCSV(content: string, filename: string) {
  // Convert markdown content to CSV format
  const lines = content.split('\n');
  const csvContent = lines
    .filter(line => line.trim())
    .map(line => {
      // Remove markdown symbols and escape commas
      return line.replace(/[#*`]/g, '').replace(/,/g, ';');
    })
    .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
}

export function getExportFormats(section: Section): ('pdf' | 'csv')[] {
  switch (section) {
    case 'question-bank':
    case 'co-po-mapping':
      return ['pdf', 'csv'];
    case 'lesson-plan':
    case 'course-material':
      return ['pdf'];
    default:
      return ['pdf'];
  }
}