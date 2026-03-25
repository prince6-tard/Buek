import { streamText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';

// We now explicitly tell the Vercel SDK to use your specific environment variable
const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

// Simple in-memory rate limit Map
const rateLimitMap = new Map();
const LIMIT = 5;
const WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours

export async function POST(req) {
  try {
    // --- RATE LIMITING LOGIC ---
    const ip = req.headers.get('x-forwarded-for') || req.ip || 'unknown-ip';
    const now = Date.now();
    const userRateData = rateLimitMap.get(ip) || { count: 0, firstRequestTime: now };

    if (now - userRateData.firstRequestTime > WINDOW_MS) {
      // Reset after 24 hours
      userRateData.count = 1;
      userRateData.firstRequestTime = now;
    } else {
      userRateData.count += 1;
    }

    rateLimitMap.set(ip, userRateData);

    if (userRateData.count > LIMIT) {
       return new Response(JSON.stringify({ error: "Rate limit exceeded. You can only send 5 messages per day." }), { 
         status: 429, 
         headers: { 'Content-Type': 'application/json' } 
       });
    }
    // --- END RATE LIMITING LOGIC ---

    const { userQuestion, selectedText, bookContext } = await req.json();

    // SCALING OPTIMIZATION: Truncate massive incoming strings to prevent Payload Too Large (413) 
    // and to safely stay well within the AI provider's maximum token limits.
    const safeSelectedText = (selectedText || '').slice(0, 5000);
    const safeBookContext = (bookContext || '').slice(0, 20000);

    const systemPrompt = `You are an expert literary analyst.
Use the following context from the book to explain the meaning, author's intent, and essence of the selected text based on the user's question.

Book Context:
${safeBookContext || 'No context provided.'}`;

    const prompt = `Selected Text: "${safeSelectedText}"\n\nUser Question: ${userQuestion}`;

    const result = await streamText({
     
      model: google('gemini-2.5-flash'), 
      system: systemPrompt,
      prompt: prompt,
    });

    // Using toTextStreamResponse() makes it a raw text stream, which is easier to consume with a plain fetch.
    return result.toTextStreamResponse();
  } catch (error) {
    console.error("Error in chat route:", error);
    return new Response(JSON.stringify({ error: error.message || "Failed to generate reply" }), { 
      status: 500, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }
}