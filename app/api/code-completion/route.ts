import { NextRequest, NextResponse } from "next/server"

interface CodeSuggestionRequest {
  fileContent: string
  cursorLine: number
  cursorColumn: number
  suggestionType: string
  fileName?: string
}

export async function POST(request: NextRequest) {
  try {
    const body: CodeSuggestionRequest = await request.json()
    const { fileContent, cursorLine, cursorColumn, suggestionType, fileName } = body

    if (
      typeof fileContent !== "string" ||
      typeof cursorLine !== "number" ||
      typeof cursorColumn !== "number" ||
      typeof suggestionType !== "string"
    ) {
      return NextResponse.json({ suggestion: "" })
    }

    const prompt = buildPrompt(
      fileContent,
      cursorLine,
      cursorColumn,
      suggestionType,
      fileName
    )

    const suggestion = await generateSuggestion(prompt)

    return NextResponse.json({
      suggestion: suggestion || "",
    })
  } catch (error) {
    console.error("Code completion API error:", error)
    return NextResponse.json({ suggestion: "" })
  }
}

function buildPrompt(
  content: string,
  line: number,
  column: number,
  suggestionType: string,
  fileName?: string
): string {
  const lines = content.split("\n")
  const currentLine = lines[line] ?? ""

  return `You are an AI code completion engine.

Task: ${suggestionType}
File: ${fileName ?? "unknown"}

Code context:
${lines.slice(Math.max(0, line - 10), line).join("\n")}
${currentLine.slice(0, column)}|CURSOR|${currentLine.slice(column)}
${lines.slice(line + 1, line + 10).join("\n")}

Rules:
- Return only code
- No markdown
- No explanations
- Match indentation

Output:`
}
async function generateSuggestion(prompt: string): Promise<string> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 45000)

    const response = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        model: "gemma:2b",
        prompt,
        stream: false,
        options: {
          temperature: 0.6,
          num_predict: 120,
        },
      }),
    })

    clearTimeout(timeout)

    if (!response.ok) return ""

    const data = await response.json()
    let text = typeof data?.response === "string" ? data.response : ""

    if (text.includes("```")) {
      const match = text.match(/```[\w]*\n?([\s\S]*?)```/)
      text = match ? match[1] : text
    }

    console.log("AI suggestion:", response)

    return text.trim()
  } catch {
    return ""
  }
}

