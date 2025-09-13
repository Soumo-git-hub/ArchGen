"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Brain, Zap, Settings, Layers } from "lucide-react"
import { ArchitectureCanvas } from "@/components/architecture-canvas"
import { ComponentLibrary } from "@/components/component-library"
import { AIDiagramGenerator } from "@/components/ai-diagram-generator"
import { SmartRequirementsParser } from "@/components/smart-requirements-parser"
import { ExportCollaborationPanel } from "@/components/export-collaboration-panel"

type Requirement = {
  id: string
  description: string
  priority: string
  category: string
}

interface Analysis {
  complexity: string
  estimatedTimeline: string
  estimatedCost: string
}

interface ParsedRequirements {
  requirements: Requirement[]
  analysis: Analysis
}

export default function ArchitecturePlatform() {
  const [generatedArchitecture, setGeneratedArchitecture] = useState(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [parsedRequirements, setParsedRequirements] = useState<ParsedRequirements | null>(null)
  const [activeTab, setActiveTab] = useState<"generator" | "parser">("generator")

  const handleArchitectureGenerated = (architecture: any) => {
    setGeneratedArchitecture(architecture)
    setIsGenerating(false)
  }

  const handleRequirementsParsed = (data: any) => {
    setParsedRequirements(data)
    // Auto-switch to generator tab with parsed requirements
    setActiveTab("generator")
  }

  const handleExport = (format: string, options: any) => {
    console.log("Exporting architecture:", { format, options, architecture: generatedArchitecture })
  }

  const handleShare = (shareData: any) => {
    console.log("Sharing architecture:", shareData)
  }

  return (
    <div className="min-h-screen bg-background text-foreground dark">
      {/* Header */}
      <header className="border-b border-border bg-card neomorphism">
        <div className="mx-auto w-full px-4 lg:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 neomorphism">
                <Brain className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">ArchitectAI</h1>
                <p className="text-sm text-muted-foreground">AI-Powered System Architecture Generator</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" className="neomorphism-hover bg-transparent">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full px-4 lg:px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-120px)] min-h-0">
          {/* Left Sidebar - AI Tools */}
          <div className="lg:col-span-3 space-y-6 min-h-0 overflow-auto">
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="w-full">
              <TabsList className="grid w-full grid-cols-2 neomorphism">
                <TabsTrigger value="generator">Generator</TabsTrigger>
                <TabsTrigger value="parser">Parser</TabsTrigger>
              </TabsList>

              <div className="mt-4">
                {activeTab === "generator" && (
                  <AIDiagramGenerator
                    onArchitectureGenerated={handleArchitectureGenerated}
                    parsedRequirements={parsedRequirements}
                  />
                )}
                {activeTab === "parser" && <SmartRequirementsParser onRequirementsParsed={handleRequirementsParsed} />}
              </div>
            </Tabs>

            {/* Component Library */}
            <ComponentLibrary />
          </div>

          {/* Main Canvas Area */}
          <div className="lg:col-span-6 min-h-0">
            <Card className="h-full neomorphism flex flex-col overflow-hidden">
              <div className="p-4 border-b border-border">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Layers className="h-5 w-5 text-primary" />
                    Architecture Canvas
                  </h2>

                  <div className="flex items-center gap-2">
                    <Tabs defaultValue="system" className="w-auto">
                      <TabsList className="neomorphism">
                        <TabsTrigger value="system">System View</TabsTrigger>
                        <TabsTrigger value="business">Business View</TabsTrigger>
                        <TabsTrigger value="technical">Technical View</TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>
                </div>
              </div>

              <div className="flex-1 p-4 min-h-0">
                <ArchitectureCanvas 
                  architecture={generatedArchitecture} 
                  isGenerating={isGenerating}
                  onArchitectureChange={setGeneratedArchitecture}
                />
              </div>
            </Card>
          </div>

          {/* Right Sidebar - Analysis & Export */}
          <div className="lg:col-span-3 space-y-6 min-h-0 overflow-auto">
            <ExportCollaborationPanel
              architecture={generatedArchitecture}
              onExport={handleExport}
              onShare={handleShare}
            />

            {/* Requirements Summary */}
            {parsedRequirements && (
              <Card className="p-4 neomorphism">
                <h2 className="text-lg font-semibold mb-4">Requirements Summary</h2>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Categories:</span>
                    <span className="font-medium">{parsedRequirements.requirements?.length || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Complexity:</span>
                    <span className="font-medium capitalize">{parsedRequirements.analysis?.complexity}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Timeline:</span>
                    <span className="font-medium">{parsedRequirements.analysis?.estimatedTimeline}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Est. Cost:</span>
                    <span className="font-medium">{parsedRequirements.analysis?.estimatedCost}</span>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
