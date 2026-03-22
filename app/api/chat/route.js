import { streamText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req) {
  try {
    const { userQuestion, selectedText, bookContext } = await req.json();

    const systemPrompt = `You are an expert literary analyst.
Use the following context from the book to explain the meaning, author's intent, and essence of the selected text based on the user's question.

Book Context:
${bookContext || 'No context provided.'}`;

    const prompt = `Selected Text: "${selectedText}"\n\nUser Question: ${userQuestion}`;

    const result = await streamText({
      model: google('gemini-1.5-flash'), 
      system: systemPrompt,
      prompt: prompt,
    });

    // Using toTextStreamResponse() makes it a raw text stream, which is easier to consume with a plain fetch.
    return result.toTextStreamResponse();
  } catch (error) {
    console.error("Error in chat route:", error);
    return new Response(JSON.stringify({ error: "Failed to generate reply" }), { 
      status: 500, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }
}