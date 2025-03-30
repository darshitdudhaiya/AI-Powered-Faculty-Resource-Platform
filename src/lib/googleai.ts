import { GoogleGenerativeAI } from "@google/generative-ai";
const API_KEYS = [
  import.meta.env.VITE_GOOGLE_API_KEY_1,
  import.meta.env.VITE_GOOGLE_API_KEY_2,
  import.meta.env.VITE_GOOGLE_API_KEY_3,
];

let currentKeyIndex = 0;
async function generateAIResponse(prompt: string) {
  while (currentKeyIndex < API_KEYS.length) {
    try {
      const genAI = new GoogleGenerativeAI(API_KEYS[currentKeyIndex]);
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

      const result = await model.generateContent(prompt);
      const response = await result.response;
      return {
        success: true,
        data: response.text(),
      };
    } catch (error: any) {
      console.error("Error generating content:", error);

      if (error.message.includes("limit exceeded")) {
        console.warn(
          `API key ${API_KEYS[currentKeyIndex]} exceeded limit. Switching to next key.`
        );
        currentKeyIndex++;
      } else {
        return {
          success: false,
          error: "Failed to generate content. Please try again.",
        };
      }
    }
  }

  return { success: false, error: "All API keys have reached their limit." };
}

const formatInstructions = `
Format the response using proper markdown syntax with:
- Clear headings using # for main sections and ## for subsections
- Proper spacing between sections using line breaks
- Section separators using ---
- **Bold text** for emphasis
- *Italics* for terminology
- Code blocks with triple backticks
- Tables using proper markdown syntax
- Bullet points and numbered lists where appropriate
`;

export async function generateContent(
  section: "question-bank" | "co-po-mapping" | "course-material",
  subjectDetails: {
    syllabus: Record<string, string>;
    code: string;
    name: string;
  }
) {
  // Convert syllabus object into structured markdown format
  const formattedSyllabus = Object.entries(subjectDetails.syllabus)
    .map(([unit, content]) => `## ${unit}\n${content}`)
    .join("\n\n---\n\n");

  const prompts = {
    "question-bank": `Generate a Question Bank strictly following this template:
    - Subject Code: ${subjectDetails.code}
    - Subject Name: ${subjectDetails.name}
    
    The question bank must include:
    1. Questions mapped to Bloom's Taxonomy levels
    2. Specify whether it's a one-mark or long question
    3. Cover multiple units with increasing complexity
    
    ## **Subject Code**: [Subject Code] **Subject Name**: [Subject Name]
    Generate the exact table with these columns:
    | Sr No | Unit | Question | Bloom's Taxonomy | One Marks Question | Long Question |
    | --- | --- | --- | --- | --- | --- |
    | 1 | 1. [Unit Name] | [Question] | [Bloom's Taxonomy] | [Yes/No] | [Yes/No] |
    | 2 | 1. [Unit Name] | [Question] | [Bloom's Taxonomy] | [Yes/No] | [Yes/No] |
    | 3 | 2. [Unit Name] | [Question] | [Bloom's Taxonomy] | [Yes/No] | [Yes/No] |

    **Instructions:**
    - **Follow the exact table format** without missing columns.
    - **Use real questions from the syllabus** instead of placeholders.
    - **Ensure questions are mapped** to Bloom’s Taxonomy categories.
    - **Specify if each question is a "One Mark" or "Long Question".**
    - **No additional explanations or formatting changes**—return only the table, Subject Name and Subject Code  . 

    
    **Syllabus Context:**
    ${formattedSyllabus}`,

    "co-po-mapping": `${formatInstructions}

# CO-PO Mapping - ${subjectDetails.name}

## Course Outcomes (COs)
[List 5-6 course outcomes relevant to the subject]

## Program Outcomes (POs)
- PO1: (Foundation Knowledge):Apply knowledge of mathematics, programming logic and coding fundamentals for solution architecture and problem solving.
- PO2:(Problem Analysis):Identify, review, formulate and analyze problems for primarily focusing on customer requirements using critical thinking frameworks.
- PO3: (Development of Solutions): Design, develop and investigate problems with as an innovative approach for solutions incorporating ESG/SDG goals.
- PO4: (Modern Tool Usage): Select, adapt and apply modern computational tools such as development of algorithms with an understanding of the limitations including human biases.
- PO5: (Individual and Teamwork): Function and communicate effectively as an individual or a team leader in diverse and multidisciplinary groups. Use methodologies such as agile.
- PO6: (Project Management and Finance): Use the principles of project management such as scheduling, work breakdown structure and be conversant with the principles of Finance for profitable project management.
- PO7: (Ethics): Commit to professional ethics in managing software projects with financial aspects. Learn to use new technologies for cyber security and insulate customers from malware.
- PO8: (Life-long learning): Change management skills and the ability to learn, keep up with contemporary technologies and ways of working

## Mapping Matrix
| CO | PO1 | PO2 | PO3 | PO4 | PO5 | PO6 | PO7 | PO8 |
|----|----|----|----|----|----|----|----|----|
| CO1 | X  | X  |    |    |    |    |    |    |
| CO2 |    | X  | X  |    |    |    |    |    |
| CO3 |    |    | X  | X  |    |    |    |    |

## Justification
[Explain why each CO is mapped to its corresponding POs]

---

below is the syllabus that should not be included in the generated content:
**Syllabus Context:**
${formattedSyllabus}`,

    "course-material": `${formatInstructions}

    # Course Material - ${subjectDetails.name}

    ## Course Introduction
    [Give an overview of the subject, its importance, and applications.]
    
    ## Topics Covered

    Identify key topics within ${formattedSyllabus} and generate structured content for each. 

    ### Topic 1: [Automatically Identify a Core Concept]
    - **What is it?**
      - [Explain fundamental concepts]
    - **How does it work?**
      - [Break down principles and processes]
    - **Why is it important?**
      - [Explain relevance and impact]
    - **Examples & Applications**
      - [Provide real-world use cases]
    - **Practice Problems**
      - [List exercises with solutions]

    ### Topic 2: [Next Key Concept]
    [Repeat structure for each identified topic]
    
    ---
    
    Ensure all topics are covered clearly and concisely based on the syllabus:
    ${formattedSyllabus}`,
  };

  return generateAIResponse(prompts[section]);
}

export async function generateLessonPlan(details: {
  subjectName: string;
  subjectCode: string;
  lecturesPerWeek: number;
  startDate: string;
  endDate: string;
  syllabus: Record<string, string>;
}) {
  // Convert syllabus object into structured markdown format
  const formattedSyllabus = Object.entries(details.syllabus)
    .map(([unit, content]) => `## ${unit}\n${content}`)
    .join("\n\n---\n\n");

  const prompt = `Generate a structured lesson plan for ${details.subjectName} (${details.subjectCode}) following this format:

  | Sr No | Week | Day | Unit-No | Unit-Name | Topics to be Covered |
  | --- | --- | --- | --- | --- | --- |
  | 1 | 1 | 1 | Unit-1 | [Unit Name] | [Topics] |
  | 2 | 1 | 2 | Unit-1 | [Unit Name] | [Topics] |
  | 3 | 1 | 3 | Unit-2 | [Unit Name] | [Topics] |
  | 4 | 2 | 1 | - | - | - |

  
  **Instructions:**
  - **Do NOT modify the table structure.**
  - **Use real syllabus topics** in the "Topics to be Covered" column.
  - **Ensure each unit is covered across multiple weeks/days.**
  - **Do not add extra text—return only the table.**

**Guidelines:**
- **Total Lectures per Week:** ${details.lecturesPerWeek}
- **Semester Duration:** ${details.startDate} to ${details.endDate}
- **Cover the full syllabus logically**
- **Account for breaks and revisions**

---

**Syllabus Context:**
${formattedSyllabus}`;

  return generateAIResponse(prompt);
}
