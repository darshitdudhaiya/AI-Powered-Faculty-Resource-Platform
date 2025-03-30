import { saveAs } from "file-saver"
import type { Section } from "../types"
import jsPDF from "jspdf"
import html2canvas from "html2canvas"
import html2pdf from "html2pdf.js";


/**
 * Exports content to a PDF file using an improved paging approach.
 *
 * @param content - The Markdown content to include in the PDF.
 * @param filename - The name of the output PDF file.
 * @param elementId - ID of the element containing the rendered markdown
 */
export async function exportToPDF(content: string, filename: string, elementId = "markdown-content") {
  try {
    // Find the element containing the rendered markdown
    const element = document.getElementById(elementId)

    if (!element) {
      console.error(`Element with ID "${elementId}" not found`)
      return
    }

    // Show loading indicator
    const loadingIndicator = document.createElement("div")
    loadingIndicator.className = "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    loadingIndicator.innerHTML = '<div class="bg-white p-4 rounded-lg shadow-lg">Generating PDF...</div>'
    document.body.appendChild(loadingIndicator)

    // Create a clone of the element to work with
    const clone = element.cloneNode(true) as HTMLElement
    clone.style.width = "210mm" // A4 width
    clone.style.padding = "10mm"
    clone.style.position = "absolute"
    clone.style.top = "-9999px"
    clone.style.left = "-9999px"
    document.body.appendChild(clone)

    // Create PDF with A4 dimensions
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    })

    // PDF dimensions
    const pdfWidth = pdf.internal.pageSize.getWidth()
    const pdfHeight = pdf.internal.pageSize.getHeight()

    // Get all child elements that could be logical page break points
    const children = Array.from(clone.querySelectorAll("h1, h2, h3, h4, h5, h6, p, ul, ol, table, pre, blockquote, hr, code"))

    // Function to process elements in batches for better pagination
    async function processElementBatches() {
      let currentPage = 1
      let yOffset = 10 // Starting y position
      const batchContainer = document.createElement("div")
      batchContainer.style.width = "190mm" // A4 width minus margins
      batchContainer.style.position = "absolute"
      batchContainer.style.top = "-9999px"
      batchContainer.style.left = "-9999px"
      document.body.appendChild(batchContainer)

      // Add header to first page
      pdf.setFontSize(12)
      pdf.setTextColor(100, 100, 100)
      pdf.text(`${filename.replace(".pdf", "")}`, 10, 10)

      // Process each element
      for (let i = 0; i < children.length; i++) {
        const child = children[i] as HTMLElement
        const clone = child.cloneNode(true) as HTMLElement

        // Skip empty elements
        if (!clone.textContent?.trim()) continue

        // Clear the batch container and add the current element
        batchContainer.innerHTML = ""
        batchContainer.appendChild(clone)

        // Capture this element
        const canvas = await html2canvas(batchContainer, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: "#ffffff",
        })

        // Calculate dimensions
        const imgData = canvas.toDataURL("image/png")
        const imgWidth = pdfWidth - 20 // Full width minus margins
        const imgHeight = (canvas.height * imgWidth) / canvas.width

        // Check if this element would go beyond the page
        if (yOffset + imgHeight > pdfHeight - 20) {
          // Add page number to bottom of current page
          pdf.setFontSize(10)
          pdf.setTextColor(150, 150, 150)
          pdf.text(`Page ${currentPage}`, pdfWidth / 2, pdfHeight - 10, { align: "center" })

          // Add a new page
          pdf.addPage()
          currentPage++
          yOffset = 20 // Reset y position with margin

          // Add header to new page
          pdf.setFontSize(12)
          pdf.setTextColor(100, 100, 100)
          pdf.text(`${filename.replace(".pdf", "")} (continued)`, 10, 10)
        }

        // Add the image to the PDF
        pdf.addImage(imgData, "PNG", 10, yOffset, imgWidth, imgHeight)
        yOffset += imgHeight + 5 // Add some spacing between elements

        // Special handling for tables and code blocks to ensure they don't get split
        if (child.tagName === "TABLE" || child.tagName === "PRE") {
          yOffset += 5 // Add extra space after tables and code blocks
        }
      }

      // Add page number to the last page
      pdf.setFontSize(10)
      pdf.setTextColor(150, 150, 150)
      pdf.text(`Page ${currentPage}`, pdfWidth / 2, pdfHeight - 10, { align: "center" })

      // Clean up
      document.body.removeChild(batchContainer)
    }

    // Process the elements
    await processElementBatches()

    // Clean up
    document.body.removeChild(clone)
    document.body.removeChild(loadingIndicator)

    // Save the PDF
    pdf.save(filename)
  } catch (error) {
    console.error("Error exporting PDF:", error)
    // Remove loading indicator if it exists
    const loadingIndicator = document.querySelector(".fixed.inset-0.bg-black.bg-opacity-50")
    if (loadingIndicator && loadingIndicator.parentNode) {
      loadingIndicator.parentNode.removeChild(loadingIndicator)
    }
    alert("Failed to generate PDF. Please try again.")
  }
}

/**
 * Alternative PDF export method that uses paged.js for better pagination
 * This is more suitable for large documents with complex layouts
 */
export async function exportToPDFWithPaged(content: string, filename: string, elementId = "markdown-content") {
  try {
    // Find the element containing the rendered markdown
    const element = document.getElementById(elementId)

    if (!element) {
      console.error(`Element with ID "${elementId}" not found`)
      return
    }

    // Show loading indicator
    const loadingIndicator = document.createElement("div")
    loadingIndicator.className = "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    loadingIndicator.innerHTML = '<div class="bg-white p-4 rounded-lg shadow-lg">Generating PDF...</div>'
    document.body.appendChild(loadingIndicator)

    // Create a temporary iframe to render the content for printing
    const iframe = document.createElement("iframe")
    iframe.style.position = "absolute"
    iframe.style.top = "-9999px"
    iframe.style.left = "-9999px"
    iframe.style.width = "210mm"
    iframe.style.height = "297mm"
    document.body.appendChild(iframe)

    // Wait for iframe to load
    await new Promise<void>((resolve) => {
      iframe.onload = () => resolve()

      // Set up the iframe content with proper styling for printing
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document
      if (iframeDoc) {
        iframeDoc.open()
        iframeDoc.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>${filename}</title>
            <style>
              @page {
                size: A4;
                margin: 20mm 15mm;
              }
              body {
                font-family: Arial, sans-serif;
                line-height: 1.5;
                color: #333;
              }
              h1, h2, h3, h4, h5, h6 {
                page-break-after: avoid;
                page-break-inside: avoid;
              }
              table {
                page-break-inside: avoid;
                width: 100%;
                border-collapse: collapse;
                margin: 15px 0;
              }
              table, th, td {
                border: 1px solid #ddd;
              }
              th, td {
                padding: 8px;
                text-align: left;
              }
              pre, code {
                page-break-inside: avoid;
                background-color: #f5f5f5;
                border-radius: 3px;
                padding: 10px;
                overflow-x: auto;
                font-family: monospace;
              }
              img {
                max-width: 100%;
                height: auto;
              }
              ul, ol {
                padding-left: 20px;
              }
              blockquote {
                border-left: 4px solid #ddd;
                padding-left: 15px;
                margin-left: 0;
                color: #666;
              }
              /* Add page numbers */
              @page {
                @bottom-center {
                  content: counter(page);
                }
              }
              /* Avoid page breaks inside paragraphs */
              p {
                page-break-inside: avoid;
              }
              /* Header for each page */
              .header {
                position: running(header);
                text-align: left;
                font-size: 10pt;
                color: #666;
              }
              @page {
                @top-left {
                  content: element(header);
                }
              }
            </style>
          </head>
          <body>
            <div class="header">${filename.replace(".pdf", "")}</div>
            ${element.innerHTML}
          </body>
          </html>
        `)
        iframeDoc.close()
      }
    })

    // Use html2pdf.js or similar library for better pagination
    // const { default: html2pdf } = await import("html2pdf.js")

    const options = {
      margin: [15, 15, 20, 15], // top, right, bottom, left margins in mm
      filename: filename,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        letterRendering: true,
      },
      jsPDF: {
        unit: "mm",
        format: "a4",
        orientation: "portrait",
      },
      pagebreak: {
        mode: ["avoid-all", "css", "legacy"],
        before: ["table", "pre", "blockquote"],
      },
    }

    // Generate PDF from the iframe content
    const iframeContent = iframe.contentDocument?.body || document.createElement("body")
    await html2pdf().from(iframeContent).set(options).save()

    // Clean up
    document.body.removeChild(iframe)
    document.body.removeChild(loadingIndicator)
  } catch (error) {
    console.error("Error exporting PDF with paged.js:", error)
    // Remove loading indicator if it exists
    const loadingIndicator = document.querySelector(".fixed.inset-0.bg-black.bg-opacity-50")
    if (loadingIndicator && loadingIndicator.parentNode) {
      loadingIndicator.parentNode.removeChild(loadingIndicator)
    }
    alert("Failed to generate PDF. Please try again.")
  }
}

/**
 * Exports content to a CSV file.
 * @param content - The text content in markdown format.
 * @param filename - The name of the output CSV file.
 */
export function exportToCSV(content: string, filename: string) {
  const csvLines = content
    .split("\n")
    .filter((line) => line.trim()) // Remove empty lines
    .map(
      (line) => line.replace(/[#*`]/g, "").replace(/,/g, ";"), // Remove markdown and escape commas
    )
    .join("\n")

  const blob = new Blob([csvLines], { type: "text/csv;charset=utf-8;" })
  saveAs(blob, filename)
}

/**
 * Returns available export formats for a given section.
 * @param section - The section type.
 * @returns Array of export formats.
 */
export function getExportFormats(section: Section): ("pdf" | "csv")[] {
  switch (section) {
    case "question-bank":
    case "lesson-plan":
      return ["pdf"] // Supports both PDF and CSV
    case "co-po-mapping":
    case "course-material":
      return ["pdf"]
    default:
      return ["pdf"]
  }
}

