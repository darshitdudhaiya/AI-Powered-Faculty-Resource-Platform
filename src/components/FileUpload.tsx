import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload } from 'lucide-react';
import toast from 'react-hot-toast';

interface FileUploadProps {
  onFileUpload: (file: File) => void;
}

export function FileUpload({ onFileUpload }: FileUploadProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      if (file.type === 'application/pdf' || file.type === 'text/plain') {
        onFileUpload(file);
      } else {
        toast.error('Please upload a PDF or text file');
      }
    }
  }, [onFileUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt']
    },
    maxFiles: 1
  });

  return (
    <div
      {...getRootProps()}
      className={`p-8 border-2 border-dashed rounded-lg cursor-pointer transition-colors
        ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'}`}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center gap-4">
        <Upload className="w-12 h-12 text-gray-400" />
        <div className="text-center">
          <p className="text-lg font-medium text-gray-700">
            {isDragActive ? 'Drop the file here' : 'Drag & drop a file here'}
          </p>
          <p className="text-sm text-gray-500">or click to select a file</p>
          <p className="mt-2 text-xs text-gray-400">Supported formats: TXT</p>
        </div>
      </div>
    </div>
  );
}