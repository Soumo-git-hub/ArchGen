import { type NextRequest, NextResponse } from "next/server"

const GEMINI_API_KEY = "AIzaSyDr2BmHYOoVQGu8cm5pbhqNomfCtjLOEzE"
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { requirements, projectName, template, complexity, userLoad, budget, timeline, customRequirements } = body

    let prompt = ""

    if (template) {
      // Template-based generation
      prompt = `
You are an expert system architect. Generate a comprehensive system architecture based on the following template and specifications:

Template: ${template.name}
Description: ${template.description}
Project Name: ${projectName}
Complexity Level: ${complexity}
Expected User Load: ${userLoad || "Not specified"}
Budget Range: ${budget || "Not specified"}
Timeline: ${timeline || "Not specified"}
Additional Requirements: ${customRequirements || "None"}

Template Components: ${template.components.join(", ")}

Please provide a detailed JSON response with the following structure:
{
  "components": [
    {
      "id": "unique_id",
      "type": "database|api|microservice|cloud|mobile|web|cache|auth|payment|email|search|cdn|loadbalancer|queue|monitoring",
      "label": "Component Name",
      "x": 100,
      "y": 100,
      "width": 120,
      "height": 80,
      "description": "Brief description of what this component does",
      "technologies": ["tech1", "tech2"],
      "category": "frontend|backend|database|infrastructure|external"
    }
  ],
  "connections": [
    {
      "id": "unique_connection_id",
      "from": {"x": 180, "y": 140, "componentId": "source_component_id"},
      "to": {"x": 300, "y": 200, "componentId": "target_component_id"},
      "type": "data|async|sync|event",
      "label": "Connection description",
      "protocol": "HTTP|WebSocket|gRPC|Message Queue"
    }
  ],
  "technologies": ["React", "Node.js", "PostgreSQL", "Redis", "AWS", "Docker"],
  "architecture_notes": "Key architectural decisions and rationale",
  "scalability_considerations": "How this architecture scales with user load",
  "security_considerations": "Security measures and best practices implemented",
  "estimated_cost": "Monthly cost estimate based on user load",
  "deployment_complexity": "simple|medium|complex",
  "maintenance_requirements": "Ongoing maintenance considerations"
}
`
    } else {
      // Requirements-based generation
      prompt = `
You are an expert system architect. Based on the following business requirements, generate a comprehensive system architecture.

Project: ${projectName}
Requirements: ${requirements}
Complexity Level: ${complexity}
Expected User Load: ${userLoad || "Not specified"}
Budget Range: ${budget || "Not specified"}
Timeline: ${timeline || "Not specified"}

Please provide a detailed JSON response with the following structure:
{
  "components": [
    {
      "id": "unique_id",
      "type": "database|api|microservice|cloud|mobile|web|cache|auth|payment|email|search|cdn|loadbalancer|queue|monitoring",
      "label": "Component Name",
      "x": 100,
      "y": 100,
      "width": 120,
      "height": 80,
      "description": "Brief description of what this component does",
      "technologies": ["tech1", "tech2"],
      "category": "frontend|backend|database|infrastructure|external"
    }
  ],
  "connections": [
    {
      "id": "unique_connection_id",
      "from": {"x": 180, "y": 140, "componentId": "source_component_id"},
      "to": {"x": 300, "y": 200, "componentId": "target_component_id"},
      "type": "data|async|sync|event",
      "label": "Connection description",
      "protocol": "HTTP|WebSocket|gRPC|Message Queue"
    }
  ],
  "technologies": ["React", "Node.js", "PostgreSQL", "Redis", "AWS", "Docker"],
  "architecture_notes": "Key architectural decisions and rationale",
  "scalability_considerations": "How this architecture scales with user load",
  "security_considerations": "Security measures and best practices implemented",
  "estimated_cost": "Monthly cost estimate based on user load",
  "deployment_complexity": "simple|medium|complex",
  "maintenance_requirements": "Ongoing maintenance considerations"
}
`
    }

    prompt += `

IMPORTANT GUIDELINES:
1. Position components logically (frontend at top, databases at bottom, APIs in middle)
2. Use realistic coordinates that create a clear, readable layout
3. Include proper component spacing (at least 150px between components)
4. Select appropriate technologies based on complexity level and requirements
5. Ensure all connections reference actual component IDs in both from and to objects
6. Connection coordinates should match component center positions (x + width/2, y + height/2)
7. Include security, scalability, and cost considerations
8. Make the architecture production-ready and follow industry best practices
9. Consider the specified user load for scaling decisions
10. Include monitoring and logging components for production systems
11. Add appropriate caching layers for performance
12. CRITICAL: Always include componentId references in connections to ensure proper linking

Focus on creating a practical, implementable architecture that addresses all requirements.
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
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 4096,
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

    const architecture = JSON.parse(jsonMatch[0])

    // Validate and enhance the architecture
    if (!architecture.components) architecture.components = []
    if (!architecture.connections) architecture.connections = []
    if (!architecture.technologies) architecture.technologies = []

    return NextResponse.json(architecture)
  } catch (error: any) {
    console.error("Architecture generation error:", error)
    return NextResponse.json(
      {
        error: "Failed to generate architecture",
        details: error?.message || "Unknown error",
      },
      { status: 500 },
    )
  }
}
