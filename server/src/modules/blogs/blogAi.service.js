const { generateContent, isGeminiConfigured } = require("../../config/geminiClient");
const { Groq } = require("groq-sdk");

/**
 * Fallback local structured generator if AI API keys are unavailable.
 */
function generateStructuredBlogFallback(topic, notes = "", category = "Healthcare") {
  const cleanTopic = (topic || "Healthcare & Medicine Guide").trim();
  const title = cleanTopic.charAt(0).toUpperCase() + cleanTopic.slice(1);
  const words = cleanTopic.toLowerCase().split(/\s+/);
  const tags = words.filter((w) => w.length > 3).slice(0, 5);

  return {
    title,
    summary: `A comprehensive clinical guide explaining ${cleanTopic.toLowerCase()} with actionable recommendations, milestone charts, and pharmacist-verified safety advice for Pakistani families.`,
    categoryName: category || "General Health",
    readTimeMinutes: 4,
    author: "Dr. Ayesha Siddiqui, Pediatrician (FCPS)",
    authorTitle: "Licensed Clinician & Medical Reviewer",
    tags: tags.length ? tags : ["Healthcare", "Medicine", "Pakistan"],
    relatedProductTags: tags.length ? tags : ["vitamins", "pain relief", "first aid"],
    contentBlocks: [
      {
        type: "paragraph",
        text: `Understanding ${cleanTopic.toLowerCase()} is vital for maintaining proactive wellness. In Pakistan, health literacy regarding proper dosage, genuine pharmaceuticals, and balanced lifestyle habits plays an indispensable role in preventing common acute complications.`,
      },
      {
        type: "heading",
        level: 2,
        text: "Clinical Overview & Key Principles",
      },
      {
        type: "paragraph",
        text: notes && notes.trim()
          ? `Based on recent clinical observations: ${notes.trim()}`
          : `Patients and caregivers should always adhere strictly to certified healthcare guidelines. Whether managing seasonal ailments or everyday nutrition, evidence-based practices ensure steady health outcomes.`,
      },
      {
        type: "table",
        text: "Structured Comparison & Clinical Guidelines",
        tableData: {
          headers: ["Clinical Category", "Key Indicator / Requirement", "Best Practice Guideline", "Frequency / Caution"],
          rows: [
            ["Phase 1: Initial Assessment", "Symptom onset & vitals check", "Verify temperature, hydration & pulse", "Immediate baseline check"],
            ["Phase 2: Active Management", "Prescribed regimen adherence", "Take authentic DRAP-approved medicines", "As directed by physician"],
            ["Phase 3: Prevention & Diet", "Hydration & wholesome nutrition", "Incorporate clean, nutrient-dense foods", "Daily routine maintenance"],
          ],
        },
      },
      {
        type: "callout",
        text: "Licensed Pharmacist Note: Always verify the DRAP (Drug Regulatory Authority of Pakistan) registration number on product packaging and check expiration dates prior to administration.",
      },
      {
        type: "heading",
        level: 2,
        text: "Frequently Asked Questions (FAQ)",
      },
      {
        type: "faq",
        faqItems: [
          {
            question: `How quickly can results or improvements be expected with ${cleanTopic.toLowerCase()}?`,
            answer: "Most acute symptoms demonstrate noticeable improvement within 48 to 72 hours when adhering to verified medical protocols. If symptoms persist beyond this timeframe, consult your physician.",
          },
          {
            question: "Are there any dietary adjustments recommended during this period?",
            answer: "Maintaining adequate hydration with electrolyte-balanced fluids (e.g. ORS, fresh water) and consuming light, easily digestible home-cooked meals is strongly advised.",
          },
        ],
      },
      {
        type: "disclaimer",
        text: "Medical Disclaimer: This article is strictly for educational purposes and does not replace professional medical consultation, diagnosis, or personalized prescription therapy. Always seek the advice of a registered physician or licensed pharmacist in Pakistan.",
      },
    ],
    metaTitle: `${title} | Medikart Health Guide`,
    metaDescription: `Read expert medical guidance on ${cleanTopic.toLowerCase()}. Verified clinical insights, structured charts, and pharmacist safety tips on Medikart.`,
  };
}

/**
 * Generates structured blog content using Google Gemini (with fallback to Groq or rule-based template).
 */
async function generateStructuredBlogContent({ topic, notes = "", category = "" }) {
  if (!topic || !topic.trim()) {
    throw new Error("Blog topic is required for AI content generation");
  }

  // 1. Try Google Gemini API
  if (isGeminiConfigured()) {
    try {
      const systemInstruction = `You are an expert Pakistani medical doctor, clinical pharmacist, and health journalist writing for Medikart (Pakistan's trusted online pharmacy).
Your task is to generate a comprehensive, highly structured, evidence-based healthcare article.

CRITICAL INSTRUCTIONS:
1. Return ONLY a valid JSON object (no markdown code blocks, no backticks, no wrapping text).
2. Structure the article into typed content blocks:
   - "paragraph": Clean informative text.
   - "heading": Level 2 or 3 subheadings.
   - "table": A relevant comparison or food/dosage chart with "headers" array and "rows" 2D array.
   - "callout": Important medical highlight or pharmacist tip.
   - "faq": An array of 3-4 "faqItems" with "question" and "answer".
   - "disclaimer": Standard medical disclaimer for Pakistani patients.
3. Include Pakistani context where relevant (DRAP compliance, local climate/diet, boiling drinking water, authentic medicines).
4. Extract 4-6 product keywords for "relatedProductTags" (e.g. ["brufen", "panadol", "cerelac", "lactogen"]).
5. Ensure JSON adheres exactly to the required schema.`;

      const prompt = `Generate a complete structured blog article about:
Topic: "${topic}"
Category: "${category || "Healthcare"}"
Author Notes/Key Points: "${notes || "None provided"}"

JSON Schema:
{
  "title": "string",
  "summary": "string (1-2 sentences)",
  "categoryName": "string",
  "readTimeMinutes": number,
  "author": "string (e.g. Dr. Ayesha Siddiqui, Pediatrician (FCPS))",
  "authorTitle": "string",
  "tags": ["string"],
  "relatedProductTags": ["string"],
  "contentBlocks": [
    { "type": "paragraph", "text": "string" },
    { "type": "heading", "level": 2, "text": "string" },
    { "type": "paragraph", "text": "string" },
    { "type": "table", "text": "string", "tableData": { "headers": ["Col 1", "Col 2"], "rows": [["val 1", "val 2"]] } },
    { "type": "callout", "text": "string" },
    { "type": "heading", "level": 2, "text": "Frequently Asked Questions (FAQ)" },
    { "type": "faq", "faqItems": [{ "question": "string", "answer": "string" }] },
    { "type": "disclaimer", "text": "string" }
  ],
  "metaTitle": "string",
  "metaDescription": "string"
}`;

      const rawResponse = await generateContent([{ role: "user", content: prompt }], systemInstruction);
      const cleanJson = rawResponse.replace(/^\s*```json/i, "").replace(/^\s*```/i, "").replace(/```\s*$/i, "").trim();
      const parsed = JSON.parse(cleanJson);
      if (parsed && parsed.title && Array.isArray(parsed.contentBlocks)) {
        return parsed;
      }
    } catch (geminiErr) {
      console.warn("[BlogAI] Gemini generation failed, checking Groq fallback:", geminiErr.message);
    }
  }

  // 2. Try Groq SDK fallback if GROQ_API_KEY is present
  if (process.env.GROQ_API_KEY && !process.env.GROQ_API_KEY.includes("your_groq_api_key")) {
    try {
      const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
      const completion = await groq.chat.completions.create({
        model: "llama-3.1-8b-instant",
        messages: [
          {
            role: "system",
            content: "You are a medical journalist for Medikart pharmacy in Pakistan. Return strictly valid raw JSON without markdown backticks matching the requested contentBlocks schema.",
          },
          {
            role: "user",
            content: `Write a structured healthcare blog for topic: "${topic}", category: "${category}", notes: "${notes}". Return JSON with title, summary, readTimeMinutes, author, tags, relatedProductTags, contentBlocks (paragraph, heading, table with headers/rows, faq with question/answer, disclaimer), metaTitle, metaDescription.`,
          },
        ],
        temperature: 0.3,
        response_format: { type: "json_object" },
      });

      const parsed = JSON.parse(completion.choices[0]?.message?.content || "{}");
      if (parsed && parsed.title && Array.isArray(parsed.contentBlocks)) {
        return parsed;
      }
    } catch (groqErr) {
      console.warn("[BlogAI] Groq fallback failed:", groqErr.message);
    }
  }

  // 3. Graceful template fallback
  return generateStructuredBlogFallback(topic, notes, category);
}

module.exports = {
  generateStructuredBlogContent,
  generateStructuredBlogFallback,
};
