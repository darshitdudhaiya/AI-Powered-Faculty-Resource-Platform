import React, { useState, useEffect } from "react";
import { FileUpload } from "./components/FileUpload";
import {
  GraduationCap,
  FileText,
  BookOpen,
  ListChecks,
  Presentation,
  AlertCircle,
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

    console.log(value)
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
  }; // Modified handleSectionSelect function
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <Toaster position="top-right" />

      {/* Header */}
      <header
        className="
        bg-gradient-to-r 
        from-blue-500 
        to-purple-600 
        shadow-2xl 
        border-b-4 
        border-blue-200
      "
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <GraduationCap className="w-10 h-10 text-white" />
            <h1
              className="
              text-3xl 
              font-extrabold 
              text-white 
              tracking-wide 
              bg-clip-text 
              text-transparent 
              bg-gradient-to-r 
              from-white 
              to-blue-100
            "
            >
              Faculty Resource Platform
            </h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* File Upload Section */}
          <section
            className="
            bg-white 
            rounded-xl 
            shadow-2xl 
            overflow-hidden 
            border-2 
            border-blue-100 
            animate-fade-in
          "
          >
            <div
              className="
              text-transparent 
              bg-clip-text 
              bg-gradient-to-r 
              from-blue-500 
              to-purple-600 
              border-2 
              border-blue-500 
              rounded-t-xl
              p-4
            "
            >
              <h2 className="text-xl font-bold tracking-wide">
                Upload Syllabus
              </h2>
            </div>
            <div className="p-6">
              <FileUpload onFileUpload={handleFileUpload} />
            </div>
          </section>

          {/* Subject Details */}
          {subjectDetails && (
            <section
              className="
              bg-white 
              rounded-xl 
              shadow-2xl 
              overflow-hidden 
              border-2 
              border-blue-100 
              animate-fade-in
            "
            >
              <div
                className="
                text-transparent 
              bg-clip-text 
              bg-gradient-to-r 
              from-blue-500 
              to-purple-600 
              border-2 
              border-blue-500 
              rounded-t-xl
              p-4
              "
              >
                <h3 className="text-xl font-bold tracking-wide">
                  Subject Details
                </h3>
              </div>
              <div className="p-6 space-y-2">
                <p>
                  <span className="font-bold text-blue-700">Code:</span>{" "}
                  <span className="text-gray-800">{subjectDetails.code}</span>
                </p>
                <p>
                  <span className="font-bold text-blue-700">Name:</span>{" "}
                  <span className="text-gray-800">{subjectDetails.name}</span>
                </p>
              </div>
            </section>
          )}

          {/* Tabbed Sections */}
          {subjectDetails && (
            <div
              className="
              bg-white 
              rounded-xl 
              shadow-2xl 
              overflow-hidden 
              border-2 
              border-blue-100 
              animate-fade-in
            "
            >
              {/* Tab Navigation */}
              <div
                className="
                bg-gradient-to-r 
                from-blue-500 
                to-purple-600 
                border-b-4 
                border-blue-200
              "
              >
                <nav className="-mb-px flex" aria-label="Tabs">
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
                        py-4 
                        px-6 
                        text-sm 
                        font-bold 
                        tracking-wide 
                        transition-all 
                        transform 
                        hover:scale-105
                        ${
                          selectedSection?.id === section.id
                            ? "text-white bg-white bg-opacity-20"
                            : "text-blue-100 hover:text-white"
                        }
                      `}
                      >
                        <Icon
                          className={`
                          -ml-0.5 
                          mr-2 
                          h-5 
                          w-5 
                          ${
                            selectedSection?.id === section.id
                              ? "text-white"
                              : "text-blue-200 group-hover:text-white"
                          }
                        `}
                          aria-hidden="true"
                        />
                        <span>{section.label}</span>
                      </button>
                    );
                  })}
                </nav>
              </div>
              {selectedSection?.id === "lesson-plan" && (
                <>
                  <div className="p-6 space-y-4">
                    <h3 className="text-lg font-semibold">
                      Lesson Plan Details
                    </h3>

                    {/* Validation Errors Display */}
                    {lessonPlanValidation.errors.length > 0 && (
                      <div className="bg-red-50 border border-red-200 p-4 rounded">
                        <div className="flex items-center text-red-700 mb-2">
                          <AlertCircle className="mr-2 h-5 w-5" />
                          <span className="font-semibold">
                            Validation Errors
                          </span>
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
                          className={`p-2 border rounded w-full ${
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
                          className={`p-2 border rounded w-full ${
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
                          Start Date
                        </label>
                        <input
                          type="date"
                          name="startDate"
                          value={lessonPlan.startDate}
                          onChange={handleLessonPlanChange}
                          placeholder="Choose Start Date"
                          className={`p-2 border rounded w-full ${
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
                          End Date
                        </label>
                        <input
                          type="date"
                          name="endDate"
                          value={lessonPlan.endDate}
                          onChange={handleLessonPlanChange}
                          placeholder="Choose End Date"
                          className={`p-2 border rounded w-full ${
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
                          className={`p-2 border rounded w-full ${
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

                  <div className="flex justify-center">
                    {/* Generate Button */}
                    <button
                      onClick={handleGenerateLessonPlan}
                      disabled={!lessonPlanValidation.isValid}
                      className={`
                    py-2 rounded transition-colors px-10 m-5
                    ${
                      lessonPlanValidation.isValid
                        ? "bg-blue-500 text-white hover:bg-blue-600"
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
                <div className="p-6">
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
                    <p>
                      Please select a section to view its content.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Loading State */}
          {isLoading && <LoadingComponent isLoading={isLoading} />}
        </div>
      </main>
    </div>
  );
};

export default App;
