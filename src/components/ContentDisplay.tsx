"use client";

import { useRef, useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Download, Settings } from "lucide-react";
import type { Section } from "../types";
import {
  exportToPDF,
  exportToPDFWithPaged,
  exportToCSV,
  getExportFormats,
} from "../lib/export";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { tomorrow } from "react-syntax-highlighter/dist/esm/styles/prism";
import {
  enhanceMarkdownTables,
  containsMetricFormTables,
} from "../lib/markdown-parser";

interface ContentDisplayProps {
  content: string;
  section: Section;
}

export function ContentDisplay({ content, section }: ContentDisplayProps) {
  const markdownRef = useRef<HTMLDivElement>(null);
  const exportFormats = getExportFormats(section);
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [exportMethod, setExportMethod] = useState<"standard" | "paged">(
    "paged"
  );
  const [pageSize, setPageSize] = useState<"a4" | "letter">("a4");
  const [orientation, setOrientation] = useState<"portrait" | "landscape">(
    "portrait"
  );
  const [processedContent, setProcessedContent] = useState(content);
  const [hasMetricTables, setHasMetricTables] = useState(false);

  const preprocessContent = (rawContent: string) => {
    // If the content starts and ends with code block markers, and looks like a markdown table
    if (
      section === "lesson-plan" || section === "question-bank"
    ) {
      // Remove the first and last lines (code block markers)
      return rawContent.replace(/^.*\n|\n$/g, "");
    }
    return rawContent;
  };
  // Process content when it changes or section changes
  useEffect(() => {
    // Check if content contains metric form tables
    const hasMetricTables = containsMetricFormTables(content);
    setHasMetricTables(hasMetricTables);

    const processedRawContent = preprocessContent(content);

    // If this is a lesson plan and contains metric tables, enhance the markdown
    if (section === "lesson-plan" && hasMetricTables) {
      const enhanced = enhanceMarkdownTables(processedRawContent, section);
      setProcessedContent(enhanced);
    } else {
      setProcessedContent(processedRawContent);
    }
  }, [content, section]);

  // Add effect to ensure tables are properly rendered in lesson-plan section
  useEffect(() => {
    // Add specific styling for lesson plan tables
    if (section === "lesson-plan" && markdownRef.current) {
      // Force table rendering by slightly modifying the DOM
      const tables = markdownRef.current.querySelectorAll("table");
      tables.forEach((table) => {
        if (!table.classList.contains("min-w-full")) {
          table.classList.add(
            "min-w-full",
            "border-collapse",
            "border",
            "border-gray-300"
          );

          // Add data attribute to help with styling
          table.setAttribute("data-type", "metric-form");
          table.classList.add("metric-form-table");
        }
      });

      // Also ensure all table cells have proper styling
      const cells = markdownRef.current.querySelectorAll("th, td");
      cells.forEach((cell) => {
        if (!cell.classList.contains("border")) {
          cell.classList.add("border", "border-gray-300", "px-4", "py-2");
        }
      });
    }
  }, [processedContent, section]);

  const handleExport = (format: "pdf" | "csv") => {
    const filename = `${section}-${new Date().toISOString().split("T")[0]}`;

    switch (format) {
      case "pdf":
        if (exportMethod === "paged") {
          exportToPDFWithPaged(
            processedContent,
            `${filename}.pdf`,
            "markdown-content"
          );
        } else {
          exportToPDF(processedContent, `${filename}.pdf`, "markdown-content");
        }
        break;
      case "csv":
        exportToCSV(processedContent, `${filename}.csv`);
        break;
    }
  };

  // Enhanced components with specific handling for lesson-plan tables
  const components = {
    code({ node, inline, className, children, ...props }: any) {
      const match = /language-(\w+)/.exec(className || "");
      return !inline && match ? (
        <SyntaxHighlighter
          style={tomorrow}
          language={match[1]}
          PreTag="div"
          className="rounded-lg shadow-md"
          {...props}
        >
          {String(children).replace(/\n$/, "")}
        </SyntaxHighlighter>
      ) : (
        <code
          className={`
            ${className} 
            text-purple-800 
            px-2 py-1 
            rounded-md 
            text-sm 
            font-mono
          `}
          {...props}
        >
          {children}
        </code>
      );
    },
    h1: (props: any) => (
      <h1
        className="
          text-4xl 
          font-extrabold 
          mb-6 
          pb-2 
          bg-gradient-to-r 
          from-blue-500 
          to-purple-600 
          bg-clip-text 
          text-transparent 
          border-b-4 
          border-blue-300
        "
        {...props}
      />
    ),
    h2: (props: any) => (
      <h2
        className="
          text-3xl 
          font-bold 
          mt-6 
          mb-4 
          text-blue-700 
          border-l-4 
          border-green-500 
          pl-4
        "
        {...props}
      />
    ),
    h3: (props: any) => (
      <h3
        className="
          text-2xl 
          font-semibold 
          mt-4 
          mb-3 
          text-purple-600 
          border-b 
          border-purple-200 
          pb-2
        "
        {...props}
      />
    ),
    table: ({ node, className, children, ...props }: any) => {
      const isMetricTable = section === "lesson-plan" && hasMetricTables;
      const tableClass = isMetricTable
        ? "w-full border-collapse rounded-lg overflow-hidden shadow-lg"
        : "w-full border-collapse rounded-lg overflow-hidden shadow-md";

      return (
        <div className="overflow-x-auto my-6 transform transition-all hover:scale-[1.01]">
          <table
            className={`
              ${tableClass} 
              bg-white 
              text-gray-800 
              border-2 
              border-blue-100
              hover:shadow-xl
            `}
            data-type={isMetricTable ? "metric-form" : "standard"}
            {...props}
          >
            {children}
          </table>
        </div>
      );
    },
    thead: ({ children, ...props }: any) => (
      <thead
        className="
          bg-gradient-to-r 
          from-blue-400 
          to-purple-500 
          text-white
        "
        {...props}
      >
        {children}
      </thead>
    ),
    tbody: ({ children, ...props }: any) => (
      <tbody
        className="
          divide-y 
          divide-blue-100 
          hover:bg-blue-50 
          border-sky-100
          transition-colors
        "
        {...props}
      >
        {children}
      </tbody>
    ),
    th: ({ children, ...props }: any) => (
      <th
        className="
          px-2 
          py-3 
          text-left 
          text-xs 
          font-bold 
          uppercase 
          tracking-wider
        "
        {...props}
      >
        {children}
      </th>
    ),
    td: ({ children, ...props }: any) => (
      <td
        className="
          px-2 
          py-3 
          text-sm 
          text-gray-700
          hover:bg-blue-100 
          border-l-sky-100
          transition-colors
        "
        {...props}
      >
        {children}
      </td>
    ),
  };

  return (
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
      <div
        className="
          bg-gradient-to-r 
          from-blue-500 
          to-purple-600 
          p-4 
          flex 
          justify-between 
          items-center
        "
      >
        <h3
          className="
            text-xl 
            font-bold 
            text-white 
            tracking-wide
          "
        >
          Generated Content
        </h3>
        <div className="flex gap-2">
          {exportFormats.map((format) => (
            <button
              key={format}
              onClick={() => handleExport(format)}
              className="
                inline-flex 
                items-center 
                px-4 
                py-2 
                bg-white 
                text-blue-600 
                rounded-full 
                shadow-md 
                hover:bg-blue-50 
                transition-all 
                transform 
                hover:scale-105
              "
            >
              <Download className="h-4 w-4 mr-2" />
              Export {format.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div
        id="markdown-content"
        ref={markdownRef}
        className="
          p-8 
          prose 
          max-w-none 
          bg-gray-50 
          bg-opacity-50 
          min-h-[300px]
        "
      >
        <ReactMarkdown
          components={components}
          remarkPlugins={[remarkGfm]}
          key={`${section}-${processedContent.substring(0, 50)}`}
        >
          {processedContent}
        </ReactMarkdown>
      </div>
    </div>
  );
}
