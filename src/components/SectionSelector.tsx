import React from 'react';
import { FileText, BookOpen, GitBranch, Book } from 'lucide-react';
import { Section } from '../types';

interface SectionSelectorProps {
  selectedSection: Section | null;
  onSectionSelect: (section: Section) => void;
}

const sections = [
  {
    id: 'question-bank' as Section,
    name: 'Question Bank',
    icon: FileText,
    description: 'Generate MCQs, short and long questions'
  },
  {
    id: 'lesson-plan' as Section,
    name: 'Lesson Plan',
    icon: BookOpen,
    description: 'Create structured unit-wise lesson plans'
  },
  {
    id: 'co-po-mapping' as Section,
    name: 'CO-PO Mapping',
    icon: GitBranch,
    description: 'Generate Course Outcome to Program Outcome mapping'
  },
  {
    id: 'course-material' as Section,
    name: 'Course Material',
    icon: Book,
    description: 'Create detailed study materials and resources'
  }
];

export function SectionSelector({ selectedSection, onSectionSelect }: SectionSelectorProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {sections.map((section) => {
        const Icon = section.icon;
        return (
          <button
            key={section.id}
            onClick={() => onSectionSelect(section.id)}
            className={`p-6 rounded-lg border transition-all
              ${selectedSection === section.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-blue-200 hover:bg-gray-50'
              }`}
          >
            <div className="flex items-start gap-4">
              <Icon className="w-6 h-6 text-blue-500" />
              <div className="text-left">
                <h3 className="font-medium text-gray-900">{section.name}</h3>
                <p className="mt-1 text-sm text-gray-500">{section.description}</p>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}