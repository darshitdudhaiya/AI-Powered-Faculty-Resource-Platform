import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GOOGLE_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

const formatInstructions = `
Format the response using proper markdown syntax with:
- Clear headings using # for main sections and ## for subsections
- Proper spacing between sections using line breaks
- Section separators using ---
- Bold text for emphasis using **text**
- Italics for terminology using *text*
- Code blocks with triple backticks
- Tables using proper markdown syntax
- Bullet points and numbered lists where appropriate
`;

export async function generateContent(
  section: string,
  subjectDetails: { code: string; name: string; syllabus: string }
) {
  const prompts = {
    'question-bank': `${formatInstructions}

Generate a comprehensive question bank for ${subjectDetails.name} (${subjectDetails.code}) following this structure:

# Question Bank - ${subjectDetails.name}

## Multiple Choice Questions
[Generate 10 MCQs with options and answers]

## Short Answer Questions
[Generate 5 questions with brief answers]

## Long Answer Questions
[Generate 3 questions with detailed answers]

Base the questions on this syllabus:
${subjectDetails.syllabus}`,

    'lesson-plan': `${formatInstructions}

Create a detailed lesson plan for ${subjectDetails.name} (${subjectDetails.code}) following this structure:

# Lesson Plan - ${subjectDetails.name}

## Course Overview
[Brief description of the course]

## Unit-wise Plan
[For each unit from the syllabus, create sections with:]
- Learning Objectives
- Teaching Methods
- Time Allocation
- Assessment Strategy
- Required Resources

Base the plan on this syllabus:
${subjectDetails.syllabus}`,

    'co-po-mapping': `${formatInstructions}

Create a CO-PO mapping for ${subjectDetails.name} (${subjectDetails.code}) following this structure:

# CO-PO Mapping - ${subjectDetails.name}

## Course Outcomes (COs)
[List 5-6 course outcomes]

## Program Outcomes (POs)
[List relevant program outcomes]

## Mapping Matrix
[Create a mapping table showing relationships]

## Justification
[Provide detailed justification for each mapping]

Base the mapping on this syllabus:
${subjectDetails.syllabus}`,

    'course-material': `${formatInstructions}

Generate comprehensive study material for ${subjectDetails.name} (${subjectDetails.code}) following this structure:

# Course Material - ${subjectDetails.name}

## Course Introduction
[Overview of the course]

## Unit-wise Content
[For each unit from the syllabus, include:]
### Key Concepts
[List and explain main concepts]

### Detailed Explanations
[In-depth coverage of topics]

### Examples & Applications
[Real-world examples and use cases]

### Practice Problems
[Sample problems with solutions]

### Additional Resources
[References and supplementary materials]

Base the content on this syllabus:
${subjectDetails.syllabus}`
  };

  try {
    const prompt = prompts[section as keyof typeof prompts];
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return {
      success: true,
      data: text
    };
  } catch (error) {
    console.error('Error generating content:', error);
    return {
      success: false,
      error: 'Failed to generate content. Please try again.'
    };
  }
}