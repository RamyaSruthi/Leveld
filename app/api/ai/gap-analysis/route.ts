import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Truncate note to ~2000 words to keep token costs predictable
function truncateToWords(text: string, maxWords = 2000): string {
  const words = text.trim().split(/\s+/);
  if (words.length <= maxWords) return text;
  return words.slice(0, maxWords).join(" ") + "\n\n[Note truncated for analysis]";
}

export async function POST(request: Request) {
  const { noteId, userId, content } = await request.json();

  if (!noteId || !userId || !content?.trim()) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Fetch topic for context
  const supabase = await createClient();
  const { data: note } = await supabase
    .from("notes")
    .select("topic_id")
    .eq("id", noteId)
    .single();

  let topicTitle = "";
  let pillar = "";
  if (note) {
    const { data: topic } = await supabase
      .from("topics")
      .select("title, pillar")
      .eq("id", note.topic_id)
      .single();
    topicTitle = topic?.title ?? "";
    pillar = topic?.pillar ?? "";
  }

  const truncated = truncateToWords(content);
  const isExcerpt = truncated.includes("[Note truncated");

  const prompt = `You are an expert technical interviewer at a top-tier Big Tech company (Google, Amazon, Microsoft, Meta).
You are reviewing a senior software engineer's (4–7 years experience) study notes on the topic: "${topicTitle}" (category: ${pillar}).

${isExcerpt ? "The following is an excerpt of their notes (may be truncated):\n" : "Here are their notes:\n"}
<notes>
${truncated}
</notes>

Analyse these notes and respond with ONLY valid JSON in exactly this format (no markdown, no explanation):
{
  "gaps": ["gap 1", "gap 2", ...],
  "expected_questions": ["question 1", "question 2", ...],
  "next_topics": ["topic 1", "topic 2", ...]
}

Rules:
- "gaps": Max 8 specific concepts the engineer missed, explained poorly, or needs to deepen. Be precise — name the exact concept, not vague feedback. Focus on what a senior Big Tech interviewer would probe.
- "expected_questions": Exactly 5 likely interview questions at senior level for this topic. Make them specific and challenging.
- "next_topics": 2–3 recommended follow-up topics from a standard interview curriculum that logically follow from this topic.`;

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }],
    });

    const raw = message.content[0].type === "text" ? message.content[0].text : "";

    let parsed;
    try {
      // Strip any accidental markdown code blocks
      const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
    }

    // Store in DB
    const { data: review, error } = await supabase
      .from("ai_reviews")
      .insert({
        note_id: noteId,
        user_id: userId,
        gaps: parsed.gaps ?? [],
        expected_questions: parsed.expected_questions ?? [],
        next_topics: parsed.next_topics ?? [],
        raw_response: raw,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(review);
  } catch (err) {
    console.error("Gap analysis error:", err);
    return NextResponse.json({ error: "AI service unavailable" }, { status: 503 });
  }
}
