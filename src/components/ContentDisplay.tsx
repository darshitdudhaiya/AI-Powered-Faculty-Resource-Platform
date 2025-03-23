import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Download } from 'lucide-react';
import { Section } from '../types';
import { exportToPDF, exportToCSV, getExportFormats } from '../lib/export';

interface ContentDisplayProps {
  content: string;
  section: Section;
}

export function ContentDisplay({ content, section }: ContentDisplayProps) {
  const exportFormats = getExportFormats(section);

  const handleExport = (format: 'pdf' | 'csv') => {
    const filename = `${section}-${new Date().toISOString().split('T')[0]}`;
    
    switch (format) {
      case 'pdf':
        exportToPDF(content, `${filename}.pdf`);
        break;
      case 'csv':
        exportToCSV(content, `${filename}.csv`);
        break;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="border-b border-gray-200 p-4 flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Generated Content</h3>
        <div className="flex gap-2">
          {exportFormats.map((format) => (
            <button
              key={format}
              onClick={() => handleExport(format)}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Download className="h-4 w-4 mr-1" />
              Export {format.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
      <div className="p-6 prose max-w-none">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
      </div>
    </div>
  );
}