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
    const body = await request.json()
    const { requirements, projectName, template, complexity, userLoad, budget, timeline, customRequirements, viewType = 'system' } = body

    // Create a simpler, more focused prompt to avoid API errors
    let prompt = ""
    
    if (viewType === 'business') {
      prompt = `Generate a business architecture diagram as JSON.

Project: ${projectName || 'ArchGen Business Architecture'}
Requirements: ${requirements || 'Basic business processes'}
Complexity: ${complexity || 'medium'}

Return a JSON object with components and connections:

{
  "components": [
    {
      "id": "comp1",
      "type": "customer_onboarding",
      "label": "Customer Onboarding",
      "x": 100,
      "y": 100,
      "width": 140,
      "height": 100,
      "category": "process"
    },
    {
      "id": "comp2", 
      "type": "order_process",
      "label": "Order Processing",
      "x": 300,
      "y": 200,
      "width": 140,
      "height": 100,
      "category": "process"
    }
  ],
  "connections": [
    {
      "id": "conn1",
      "from": {"x": 170, "y": 150, "componentId": "comp1"},
      "to": {"x": 370, "y": 250, "componentId": "comp2"},
      "type": "workflow",
      "label": "Process Flow"
    }
  ]
}

Create 4-6 business components with proper positioning and connections.`
    } else {
      prompt = `Generate a system architecture diagram as JSON.

Project: ${projectName || 'ArchGen System Architecture'}
Requirements: ${requirements || 'Basic web application'}
Complexity: ${complexity || 'medium'}

Return a JSON object with components and connections:

{
  "components": [
    {
      "id": "comp1",
      "type": "api",
      "label": "API Gateway",
      "x": 100,
      "y": 100,
      "width": 120,
      "height": 80,
      "category": "backend"
    },
    {
      "id": "comp2",
      "type": "database", 
      "label": "Database",
      "x": 300,
      "y": 200,
      "width": 120,
      "height": 80,
      "category": "database"
    }
  ],
  "connections": [
    {
      "id": "conn1",
      "from": {"x": 160, "y": 140, "componentId": "comp1"},
      "to": {"x": 360, "y": 240, "componentId": "comp2"},
      "type": "data",
      "label": "API Call"
    }
  ]
}

Create 4-6 system components with proper positioning and connections.`
    }

    console.log('Sending request to Gemini API, prompt length:', prompt.length)

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
          maxOutputTokens: 2048,
        },
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Gemini API error details:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
        promptLength: prompt.length
      })
      throw new Error(`Gemini API error: ${response.statusText} - ${errorText}`)
    }

    const data = await response.json()
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text

    if (!generatedText) {
      throw new Error("No response from Gemini API")
    }

    console.log('Received response from Gemini API:', generatedText.substring(0, 200) + '...')

    // Extract JSON from the response
    const jsonMatch = generatedText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.error('No valid JSON found in response:', generatedText)
      throw new Error("No valid JSON found in response")
    }

    const architecture = JSON.parse(jsonMatch[0])

    // Validate and enhance the architecture with better positioning
    if (!architecture.components) architecture.components = []
    if (!architecture.connections) architecture.connections = []
    if (!architecture.technologies) architecture.technologies = []

    // Enhanced component positioning for better layout
    if (architecture.components.length > 0) {
      // Apply smart grid layout to prevent overlapping
      const gridCols = Math.ceil(Math.sqrt(architecture.components.length))
      const baseWidth = 140
      const baseHeight = 100
      const spacing = 80
      
      architecture.components.forEach((comp: any, index: number) => {
        const row = Math.floor(index / gridCols)
        const col = index % gridCols
        
        // Enhanced positioning with better spacing
        comp.x = col * (baseWidth + spacing) + 100
        comp.y = row * (baseHeight + spacing) + 100
        comp.width = comp.width || baseWidth
        comp.height = comp.height || baseHeight
        
        // Ensure component has proper ID
        if (!comp.id) {
          comp.id = `comp-${index}`
        }
      })
      
      // Update connection positions to match component centers
      architecture.connections.forEach((conn: any, index: number) => {
        if (!conn.id) {
          conn.id = `conn-${index}`
        }
        
        // Find source and target components
        const fromComp = architecture.components.find((c: any) => c.id === conn.from?.componentId)
        const toComp = architecture.components.find((c: any) => c.id === conn.to?.componentId)
        
        if (fromComp) {
          conn.from.x = fromComp.x + fromComp.width / 2
          conn.from.y = fromComp.y + fromComp.height / 2
        }
        
        if (toComp) {
          conn.to.x = toComp.x + toComp.width / 2
          conn.to.y = toComp.y + toComp.height / 2
        }
      })
    }

    console.log('Successfully generated architecture with', architecture.components.length, 'components')

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
