import React, { useState } from 'react';
import { FileUpload } from './components/FileUpload';
import { SectionSelector } from './components/SectionSelector';
import { ContentDisplay } from './components/ContentDisplay';
import { Section, SubjectDetails } from './types';
import { Toaster } from 'react-hot-toast';
import { GraduationCap } from 'lucide-react';
import { processFile } from './lib/fileProcessor';
import { generateContent } from './lib/googleai';
import { contentCache } from './lib/contentCache';
import toast from 'react-hot-toast';

function App() {
  const [subjectDetails, setSubjectDetails] = useState<SubjectDetails | null>(null);
  const [selectedSection, setSelectedSection] = useState<Section | null>(null);
  const [generatedContent, setGeneratedContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleFileUpload = async (file: File) => {
    setIsLoading(true);
    try {
      const result = await processFile(file);
      if (result.success && result.data) {
        setSubjectDetails(result.data);
        contentCache.clear(); // Clear cache when new file is uploaded
        toast.success('File processed successfully');
      } else {
        toast.error(result.error || 'Failed to process file');
      }
    } catch (error) {
      toast.error('An error occurred while processing the file');
    }
    setIsLoading(false);
  };

  const handleSectionSelect = async (section: Section) => {
    setSelectedSection(section);
    if (!subjectDetails) return;

    // Check cache first
    const cacheKey = `${subjectDetails.code}-${section}`;
    const cachedContent = contentCache.get(cacheKey);
    
    if (cachedContent) {
      setGeneratedContent(cachedContent);
      return;
    }

    setIsLoading(true);
    try {
      const result = await generateContent(section, subjectDetails);
      if (result.success && result.data) {
        setGeneratedContent(result.data);
        contentCache.set(cacheKey, result.data);
        toast.success('Content generated successfully');
      } else {
        toast.error(result.error || 'Failed to generate content');
      }
    } catch (error) {
      toast.error('An error occurred while generating content');
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />
      
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-3">
            <GraduationCap className="w-8 h-8 text-blue-500" />
            <h1 className="text-2xl font-bold text-gray-900">
              Faculty Resource Platform
            </h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* File Upload Section */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Upload Syllabus
            </h2>
            <FileUpload onFileUpload={handleFileUpload} />
          </section>

          {/* Subject Details */}
          {subjectDetails && (
            <section className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Subject Details
              </h3>
              <div className="space-y-2">
                <p><span className="font-medium">Code:</span> {subjectDetails.code}</p>
                <p><span className="font-medium">Name:</span> {subjectDetails.name}</p>
              </div>
            </section>
          )}

          {/* Section Selector */}
          {subjectDetails && (
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Select Resource Type
              </h2>
              <SectionSelector
                selectedSection={selectedSection}
                onSectionSelect={handleSectionSelect}
              />
            </section>
          )}

          {/* Generated Content */}
          {generatedContent && selectedSection && (
            <ContentDisplay content={generatedContent} section={selectedSection} />
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-lg shadow-lg">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-4 text-center text-gray-700">Processing...</p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;