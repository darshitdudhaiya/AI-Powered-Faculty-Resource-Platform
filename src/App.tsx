"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { FileUpload } from "./components/FileUpload";
import {
  GraduationCap,
  FileText,
  BookOpen,
  ListChecks,
  Presentation,
  AlertCircle,
  Github,
  X,
  Menu,
  Linkedin,
  Twitter,
} from "lucide-react";
import { processFile } from "./lib/fileProcessor";
import { generateContent, generateLessonPlan } from "./lib/googleai";
import { contentCache } from "./lib/contentCache";
import toast, { Toaster } from "react-hot-toast";
import { ContentDisplay } from "./components/ContentDisplay";
import LoadingComponent from "./components/LoadingIndicator";

// Enhanced interfaces with more robust typing
interface SubjectDetails {
  code: string;
  name: string;
  syllabus?: Record<string, string>;
}

interface Section {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface LessonPlanDetails {
  subjectCode: string;
  subjectName: string;
  facultyName: string;
  semester: string;
  startDate: string;
  endDate: string;
  lecturesPerWeek: number;
  syllabus: Record<string, string>;
}

// Define sections with icons and labels
const SECTIONS: Section[] = [
  { id: "question-bank", label: "Question Bank", icon: FileText },
  { id: "lesson-plan", label: "Lesson Plan", icon: BookOpen },
  { id: "co-po-mapping", label: "CO-PO Mapping", icon: ListChecks },
  { id: "course-material", label: "Course Material", icon: Presentation },
];

const App: React.FC = () => {
  const [subjectDetails, setSubjectDetails] = useState<SubjectDetails | null>(
    null
  );
  const [selectedSection, setSelectedSection] = useState<Section | null>(null);
  const [generatedContent, setGeneratedContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isOpen, setIsOpen] = useState(false);

  const [generatedContents, setGeneratedContents] = useState<{
    [key: string]: string | null;
  }>({});
  // Enhanced lesson plan state with validation
  const [lessonPlan, setLessonPlan] = useState<LessonPlanDetails>({
    subjectCode: "",
    subjectName: "",
    facultyName: "",
    semester: "",
    startDate: "",
    endDate: "",
    lecturesPerWeek: 0,
    syllabus: {},
  });

  // Validation state for lesson plan
  const [lessonPlanValidation, setLessonPlanValidation] = useState({
    isValid: false,
    errors: [] as string[],
  });

  // Validate lesson plan details
  const validateLessonPlan = () => {
    const errors: string[] = [];
    if (!lessonPlan.facultyName.trim()) {
      errors.push("Faculty Name is required");
    }
    if (!lessonPlan.semester.trim()) {
      errors.push("Semester is required");
    }
    if (!lessonPlan.startDate) {
      errors.push("Start Date is required");
    }
    if (!lessonPlan.endDate) {
      errors.push("End Date is required");
    }
    if (
      lessonPlan.startDate &&
      lessonPlan.endDate &&
      new Date(lessonPlan.startDate) >= new Date(lessonPlan.endDate)
    ) {
      errors.push("End Date must be after Start Date");
    }
    if (lessonPlan.lecturesPerWeek <= 0) {
      errors.push("Lectures per Week must be greater than 0");
    }
    if (!lessonPlan.syllabus) {
      errors.push("Syllabus content is required");
    }

    setLessonPlanValidation({
      isValid: errors.length === 0,
      errors,
    });

    return errors.length === 0;
  };

  // Handle input changes with real-time validation
  const handleLessonPlanChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setLessonPlan((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Trigger validation
    validateLessonPlan();
  };

  // Modified handleGenerateLessonPlan function
  const handleGenerateLessonPlan = async () => {
    // Validate before generation
    if (!validateLessonPlan()) {
      toast.error("Please fix the errors before generating the lesson plan");
      return;
    }

    if (!subjectDetails) {
      toast.error("Please upload a syllabus first");
      return;
    }

    const cacheKey = `lesson-plan-${subjectDetails.code}`;
    const cachedContent = contentCache.get(cacheKey);

    if (cachedContent) {
      // Update the specific section's content
      setGeneratedContents((prev) => ({
        ...prev,
        "lesson-plan": cachedContent,
      }));

      // Ensure the lesson plan section is selected
      setSelectedSection(SECTIONS.find((s) => s.id === "lesson-plan") || null);
      return;
    }

    setIsLoading(true);
    try {
      const result = await generateLessonPlan({
        ...lessonPlan,
        syllabus: lessonPlan.syllabus,
      });
      if (result.success && result.data) {
        // Update the specific section's content
        setGeneratedContents((prev) => ({
          ...prev,
          "lesson-plan": result.data,
        }));

        contentCache.set(cacheKey, result.data);
        toast.success("Lesson Plan generated successfully");

        // Explicitly set the selected section to lesson plan
        setSelectedSection(
          SECTIONS.find((s) => s.id === "lesson-plan") || null
        );
      } else {
        toast.error(result.error || "Failed to generate lesson plan");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Modified handleSectionSelect function
  const handleSectionSelect = async (section: Section) => {
    if (!subjectDetails) return;

    // Special handling for lesson plan
    if (section.id === "lesson-plan") {
      setSelectedSection(section);
      return;
    }

    const cacheKey = `${subjectDetails.code}-${section.id}`;
    const cachedContent = contentCache.get(cacheKey);

    if (cachedContent) {
      // Update the specific section's content
      setGeneratedContents((prev) => ({
        ...prev,
        [section.id]: cachedContent,
      }));
      setSelectedSection(section);
      return;
    }

    setIsLoading(true);
    try {
      const result = await generateContent(section.id, {
        ...subjectDetails,
      });
      if (result.success && result.data) {
        // Update the specific section's content
        setGeneratedContents((prev) => ({
          ...prev,
          [section.id]: result.data,
        }));

        contentCache.set(cacheKey, result.data);
        toast.success("Content generated successfully");
        setSelectedSection(section);
      } else {
        toast.error(result.error || "Failed to generate content");
      }
    } catch (error) {
      toast.error("An error occurred while generating content");
    }
    setIsLoading(false);
  };

  const handleFileUpload = async (file: File) => {
    setIsLoading(true);
    try {
      const result = await processFile(file);
      if (result.success && result.data) {
        setSubjectDetails(result.data as SubjectDetails);
        setLessonPlan({
          ...lessonPlan,
          syllabus: result.data.syllabus,
          subjectName: result.data.name,
          subjectCode: result.data.code,
        });

        contentCache.clear();
        toast.success("File processed successfully");
      } else {
        toast.error(result.error || "Failed to process file");
      }
    } catch (error) {
      toast.error("An error occurred while processing the file");
    }
    setIsLoading(false);
  };

  // Auto-populate lesson plan when syllabus is uploaded
  useEffect(() => {
    if (subjectDetails) {
      setLessonPlan((prev) => ({
        ...prev,
        subjectCode: subjectDetails.code,
        subjectName: subjectDetails.name,
        syllabus:
          typeof subjectDetails.syllabus === "object"
            ? subjectDetails.syllabus
            : {},
      }));
    }
  }, [subjectDetails]);

  return (
    <div className="min-h-screen bg-white">
      <Toaster position="top-right" />

      {/* Navigation Bar */}
      <nav className="fixed top-0 left-0 w-full z-50 border-b border-black bg-white py-3 px-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="bg-[#ff4500] rounded-md p-1">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg">LearnGen</span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex gap-4">
            <a
              href="https://www.producthunt.com/posts/learngen?embed=true&utm_source=badge-featured&utm_medium=badge&utm_souce=badge-learngen"
              target="_blank"
            >
              <img
                src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=947579&theme=light&t=1743375825777"
                alt="LearnGen - AI&#0032;Powered&#0032;Faculty&#0032;Resource&#0032;Platform | Product Hunt"
                style={{ width: "250px", height: "45px" }}
                width="250"
                height="25"
              />
            </a>
            <a
              href="https://github.com/darshitdudhaiya/AI-Powered-Faculty-Resource-Platform?utm_source=learngen.vercel.app"
              className="flex items-center gap-1 px-3 py-1 text-sm font-medium rounded-full bg-gray-100"
            >
              <Github />
              <span>GitHub</span>
            </a>
          </div>

          {/* Mobile Menu Button */}
          <button className="md:hidden" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        {isOpen && (
          <div className="md:hidden absolute top-full left-0 w-full bg-white border-t border-black shadow-lg py-2 ">
            <div className="flex flex-col items-center gap-3 justify-center">
              <a
                href="https://www.producthunt.com/posts/learngen?embed=true&utm_source=badge-featured&utm_medium=badge&utm_souce=badge-learngen"
                target="_blank"
                className=" py-2 w-full text-center hover:bg-gray-200"
              >
                <img
                  src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=947579&theme=light&t=1743375825777"
                  alt="LearnGen - AI&#0032;Powered&#0032;Faculty&#0032;Resource&#0032;Platform | Product Hunt"
                  style={{ width: "250px", height: "45px" }}
                  width="250"
                  height="25"
                />{" "}
              </a>
              
              <a
                href="https://github.com/darshitdudhaiya/AI-Powered-Faculty-Resource-Platform?utm_source=learngen.vercel.app"
                className="flex items-center gap-2 px-6 py-2 w-full text-center hover:bg-gray-200"
              >
                <Github />
                <span>GitHub</span>
              </a>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <div className="max-w-4xl mx-auto px-4 py-12 text-center mt-10">
        <div className="border-2 border-black border-b-4 border-r-4 rounded-lg p-4 mb-4">
          <h1 className="text-4xl font-bold">
            LearnGen: AI Powered Faculty Resource Platform
          </h1>
        </div>
        <div className="bg-[#ff4500] text-white p-4 border-2 border-black border-b-4 border-r-4 rounded-lg mb-8">
          <p className="font-medium">
            A revolutionary approach to modern education. Built with
            cutting-edge AI technology.
          </p>
        </div>
        <div className="flex justify-center gap-4 mb-12">
          <a
            href="#demo"
            className="cursor-pointer px-6 py-2 bg-[#00ffb3] text-black font-medium rounded-md border-2 border-black border-b-4 border-r-4 hover:border-t-4 hover:border-l-4 hover:bg-opacity-90 hover:border-b-2 hover:border-r-2 transition-all"
          >
            Try Demo
          </a>
          <a
            href="#instruction"
            className="px-6 py-2 bg-white text-black font-medium rounded-md border-2 border-black border-b-4 border-r-4 hover:border-b-2 hover:border-r-2 hover:border-t-4 hover:border-l-4  hover:bg-gray-50 transition-all"
          >
            Learn More
          </a>
        </div>
      </div>

      {/* Instructions Section */}
      <div className="max-w-4xl mx-auto px-4 mb-12" id="instruction">
        <div className="border-2 border-black rounded-lg overflow-hidden">
          <div className="bg-black text-white p-4">
            <h2 className="text-xl font-bold">File Format Instructions</h2>
          </div>
          <div className="p-6 bg-white">
            <div className="mb-4">
              <h3 className="text-lg font-bold border-l-4 border-[#ff4500] pl-3 mb-3">
                Required Format
              </h3>
              <p className="mb-3">
                To ensure optimal results, please format your syllabus text
                files according to these guidelines:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li className="font-medium">
                  <span className="text-[#ff4500] font-bold">File Type:</span>{" "}
                  Plain text (.txt) files only
                </li>
                <li className="font-medium">
                  <span className="text-[#ff4500] font-bold">Structure:</span>{" "}
                  The file should begin with the subject code and name clearly
                  identified
                </li>
                <li className="font-medium">
                  <span className="text-[#ff4500] font-bold">Content:</span>{" "}
                  Include a clear syllabus section with topics organized by
                  units or modules
                </li>
                <li className="font-medium">
                  <span className="text-[#ff4500] font-bold">Size Limit:</span>{" "}
                  Maximum file size of 5MB
                </li>
              </ul>
            </div>

            <div className="mb-4">
              <h3 className="text-lg font-bold border-l-4 border-[#ff4500] pl-3 mb-3">
                Example Format
              </h3>
              <div className="bg-gray-100 p-4 rounded-lg border-2 border-black font-mono text-sm">
                <p>
                  <strong>Subject Code:</strong> CS101
                </p>
                <p>
                  <strong>Subject Name:</strong> Introduction to Computer
                  Science
                </p>
                <p>
                  <strong>Syllabus:</strong>
                </p>
                <p>Unit 1: Introduction to Computing</p>
                <p>- History of computers</p>
                <p>- Basic computer architecture</p>
                <p>- Introduction to algorithms</p>
                <p>Unit 2: Programming Fundamentals</p>
                <p>- Variables and data types</p>
                <p>- Control structures</p>
                <p>- Functions and procedures</p>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold border-l-4 border-[#ff4500] pl-3 mb-3">
                Tips for Best Results
              </h3>
              <ul className="list-disc pl-6 space-y-2">
                <li className="font-medium">
                  Ensure clear section headings for each unit or module
                </li>
                <li className="font-medium">
                  Use consistent formatting throughout the document
                </li>
                <li className="font-medium">
                  Include detailed topic descriptions for more comprehensive
                  generated content
                </li>
                <li className="font-medium">
                  Remove any unnecessary headers, footers, or page numbers
                </li>
              </ul>
            </div>
          </div>
          <div className="bg-[#00ffb3] p-3 border-t-2 border-black">
            <p className="text-center font-bold">
              Following these guidelines will help our AI generate more accurate
              and useful content for your course
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 pb-16" id="demo">
        <div className="bg-[#00ffb3] rounded-xl p-8 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <div className="bg-[#ff9d42] text-black font-bold text-xl p-3 rounded-lg mb-4 inline-block">
                The Solution
              </div>
              <div className="bg-white p-4 rounded-lg">
                <h3 className="text-lg font-bold mb-4">Upload Syllabus</h3>
                <FileUpload onFileUpload={handleFileUpload} />
              </div>
            </div>

            {subjectDetails && (
              <div className="bg-white p-6 rounded-lg">
                <h3 className="text-xl font-bold mb-4">Subject Details</h3>
                <div className="space-y-2">
                  <p>
                    <span className="font-bold text-black">Code:</span>{" "}
                    <span className="text-gray-800">{subjectDetails.code}</span>
                  </p>
                  <p>
                    <span className="font-bold text-black">Name:</span>{" "}
                    <span className="text-gray-800">{subjectDetails.name}</span>
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tabbed Sections */}
        {subjectDetails && (
          <div className="bg-white border-2 border-black rounded-xl overflow-hidden">
            {/* Tab Navigation */}
            <div className="bg-black text-white">
              <nav className="flex" aria-label="Tabs">
                {SECTIONS.map((section) => {
                  const Icon = section.icon;
                  return (
                    <button
                      key={section.id}
                      onClick={() => {
                        setSelectedSection(section);
                        if (section.id !== "lesson-plan") {
                          handleSectionSelect(section);
                        }
                      }}
                      className={`
                      group 
                      inline-flex 
                      items-center 
                      py-3 
                      px-6 
                      text-sm 
                      font-bold 
                      transition-all
                      ${
                        selectedSection?.id === section.id
                          ? "bg-[#ff4500] text-white"
                          : "text-white hover:bg-gray-800"
                      }
                    `}
                    >
                      <Icon className="mr-2 h-5 w-5" aria-hidden="true" />
                      <span>{section.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            {selectedSection?.id === "lesson-plan" && (
              <>
                <div className="p-6 space-y-4">
                  <h3 className="text-lg font-bold">Lesson Plan Details</h3>

                  {/* Validation Errors Display */}
                  {lessonPlanValidation.errors.length > 0 && (
                    <div className="bg-red-50 border border-red-200 p-4 rounded">
                      <div className="flex items-center text-red-700 mb-2">
                        <AlertCircle className="mr-2 h-5 w-5" />
                        <span className="font-semibold">Validation Errors</span>
                      </div>
                      <ul className="list-disc list-inside text-red-600">
                        {lessonPlanValidation.errors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block mb-2 text-sm font-medium">
                        Faculty Name
                      </label>
                      <input
                        type="text"
                        name="facultyName"
                        value={lessonPlan.facultyName}
                        onChange={handleLessonPlanChange}
                        placeholder="Enter Faculty Name"
                        className={`p-2 border-2 border-black rounded w-full ${
                          lessonPlanValidation.errors.some((e) =>
                            e.includes("Faculty Name")
                          )
                            ? "border-red-500"
                            : ""
                        }`}
                      />
                    </div>

                    <div>
                      <label className="block mb-2 text-sm font-medium">
                        Semester
                      </label>
                      <input
                        type="text"
                        name="semester"
                        value={lessonPlan.semester}
                        onChange={handleLessonPlanChange}
                        placeholder="Enter Semester"
                        className={`p-2 border-2 border-black rounded w-full ${
                          lessonPlanValidation.errors.some((e) =>
                            e.includes("Semester")
                          )
                            ? "border-red-500"
                            : ""
                        }`}
                      />
                    </div>

                    <div>
                      <label className="block mb-2 text-sm font-medium">
                        Course Start Date
                      </label>
                      <input
                        type="date"
                        name="startDate"
                        value={lessonPlan.startDate}
                        onChange={handleLessonPlanChange}
                        placeholder="Choose Start Date"
                        className={`p-2 border-2 border-black rounded w-full ${
                          lessonPlanValidation.errors.some((e) =>
                            e.includes("Start Date")
                          )
                            ? "border-red-500"
                            : ""
                        }`}
                      />
                    </div>

                    <div>
                      <label className="block mb-2 text-sm font-medium">
                        Course End Date
                      </label>
                      <input
                        type="date"
                        name="endDate"
                        value={lessonPlan.endDate}
                        onChange={handleLessonPlanChange}
                        placeholder="Choose End Date"
                        className={`p-2 border-2 border-black rounded w-full ${
                          lessonPlanValidation.errors.some((e) =>
                            e.includes("End date")
                          )
                            ? "border-red-500"
                            : ""
                        }`}
                      />
                    </div>

                    <div>
                      <label className="block mb-2 text-sm font-medium">
                        Lectures Per Week
                      </label>
                      <input
                        type="number"
                        name="lecturesPerWeek"
                        value={lessonPlan.lecturesPerWeek}
                        onChange={handleLessonPlanChange}
                        placeholder="Enter Lectures Per Week"
                        className={`p-2 border-2 border-black rounded w-full ${
                          lessonPlanValidation.errors.some((e) =>
                            e.includes("Lectures Per Week")
                          )
                            ? "border-red-500"
                            : ""
                        }`}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-center pb-6">
                  {/* Generate Button */}
                  <button
                    onClick={handleGenerateLessonPlan}
                    disabled={!lessonPlanValidation.isValid}
                    className={`
                    py-2 rounded-md transition-colors px-10
                    ${
                      lessonPlanValidation.isValid
                        ? "bg-[#00ffb3] text-black font-bold border-2 border-black hover:bg-opacity-90"
                        : "bg-gray-300 text-gray-500 cursor-not-allowed"
                    }
                  `}
                  >
                    Generate Lesson Plan
                  </button>
                </div>
              </>
            )}

            {/* Content Display */}
            {selectedSection && generatedContents[selectedSection.id] && (
              <div className="p-6 border-t-2 border-black">
                <div className="prose max-w-none">
                  <ContentDisplay
                    content={generatedContents[selectedSection.id]!}
                    section={selectedSection.id}
                  />
                </div>
              </div>
            )}

            {!selectedSection && (
              <div className="p-6">
                <div className="prose max-w-none">
                  <p>Please select a section to view its content.</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Loading State */}
        {isLoading && <LoadingComponent isLoading={isLoading} />}
      </main>
      <footer className="bg-gray-100 border-t border-black py-6 px-4 mt-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center text-center md:text-left">
          {/* Left Section - Copyright */}
          <div className="text-sm text-gray-700 mb-4 md:mb-0">
            © {new Date().getFullYear()} LearnGen. All Rights Reserved.
          </div>

          {/* Right Section - Social Links */}
          <div className="flex gap-4">
            <a
              href="https://github.com/darshitdudhaiya"
              target="_blank"
              className="p-2 border border-black rounded-full hover:bg-black hover:text-white transition"
            >
              <Github className="w-5 h-5" />
            </a>
            <a
              href="https://www.linkedin.com/in/darshitdudhaiya"
              target="_blank"
              className="p-2 border border-black rounded-full hover:bg-blue-600 hover:text-white transition"
            >
              <Linkedin className="w-5 h-5" />
            </a>
            <a
              href="https://x.com/DarshitDudhaiya"
              target="_blank"
              className="p-2 border border-black rounded-full hover:bg-blue-400 hover:text-white transition"
            >
              <Twitter className="w-5 h-5" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
