"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Brain, FileText, Zap } from "lucide-react"

interface ParsedRequirement {
  category: string
  items: string[]
  priority: "high" | "medium" | "low"
}

export function BusinessRequirementsParser() {
  const [rawText, setRawText] = useState("")
  const [parsedRequirements, setParsedRequirements] = useState<ParsedRequirement[]>([])
  const [isProcessing, setIsProcessing] = useState(false)

  const parseRequirements = async () => {
    if (!rawText.trim()) return

    setIsProcessing(true)
    try {
      const response = await fetch("/api/parse-requirements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: rawText }),
      })

      const parsed = await response.json()
      setParsedRequirements(parsed.requirements || [])
    } catch (error) {
      console.error("Failed to parse requirements:", error)
    } finally {
      setIsProcessing(false)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-500"
      case "medium":
        return "bg-yellow-500"
      case "low":
        return "bg-green-500"
      default:
        return "bg-gray-500"
    }
  }

  return (
    <Card className="p-4 neomorphism">
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <FileText className="h-5 w-5 text-primary" />
        Requirements Parser
      </h2>

      <div className="space-y-4">
        <Textarea
          placeholder="Paste your business requirements, user stories, or project documentation here. The AI will automatically categorize and prioritize them..."
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          className="min-h-[120px] neomorphism-inset"
        />

        <Button
          onClick={parseRequirements}
          disabled={!rawText.trim() || isProcessing}
          className="w-full neomorphism-hover"
        >
          {isProcessing ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Processing...
            </>
          ) : (
            <>
              <Brain className="h-4 w-4 mr-2" />
              Parse Requirements
            </>
          )}
        </Button>

        {parsedRequirements.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-medium flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              Parsed Requirements
            </h3>

            {parsedRequirements.map((req, index) => (
              <div key={index} className="p-3 bg-muted/50 rounded-lg neomorphism-inset">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-sm">{req.category}</h4>
                  <Badge
                    variant="outline"
                    className={`text-xs ${getPriorityColor(req.priority)} text-white border-none`}
                  >
                    {req.priority}
                  </Badge>
                </div>
                <ul className="space-y-1">
                  {req.items.map((item, itemIndex) => (
                    <li key={itemIndex} className="text-xs text-muted-foreground flex items-start gap-2">
                      <span className="w-1 h-1 bg-primary rounded-full mt-2 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  )
}
