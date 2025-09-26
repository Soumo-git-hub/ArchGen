import { type NextRequest, NextResponse } from "next/server"

const GEMINI_API_KEY = process.env.API_KEY
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent"

export async function POST(request: NextRequest) {
  // Validate API key is configured
  if (!GEMINI_API_KEY) {
    console.error('Missing API_KEY environment variable')
    return NextResponse.json(
      { error: 'Server configuration error: API key not configured' },
      { status: 500 }
    )
  }

  try {
    const { text } = await request.json()

    const prompt = `
Analyze the following business requirements and categorize them into structured format:

Requirements Text: ${text}

Please provide a JSON response with the following structure:
{
  "requirements": [
    {
      "category": "Authentication & Security",
      "items": ["User login/logout", "Password reset", "Role-based access"],
      "priority": "high"
    },
    {
      "category": "Core Features",
      "items": ["Feature 1", "Feature 2"],
      "priority": "high"
    },
    {
      "category": "User Interface",
      "items": ["Responsive design", "Mobile app"],
      "priority": "medium"
    },
    {
      "category": "Integrations",
      "items": ["Payment gateway", "Email service"],
      "priority": "medium"
    },
    {
      "category": "Performance & Scalability",
      "items": ["Handle 10k users", "Fast response times"],
      "priority": "high"
    },
    {
      "category": "Nice to Have",
      "items": ["Advanced analytics", "AI features"],
      "priority": "low"
    }
  ]
}

Categories should include:
- Authentication & Security
- Core Features  
- User Interface
- Data Management
- Integrations
- Performance & Scalability
- Analytics & Reporting
- Nice to Have

Priority levels: "high", "medium", "low"
`

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.3,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        },
      }),
    })

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`)
    }

    const data = await response.json()
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text

    if (!generatedText) {
      throw new Error("No response from Gemini API")
    }

    // Extract JSON from the response
    const jsonMatch = generatedText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error("No valid JSON found in response")
    }

    const parsed = JSON.parse(jsonMatch[0])

    return NextResponse.json(parsed)
  } catch (error) {
    console.error("Requirements parsing error:", error)
    return NextResponse.json({ error: "Failed to parse requirements" }, { status: 500 })
  }
}
