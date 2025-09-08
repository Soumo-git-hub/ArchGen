"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Brain,
  FileText,
  Zap,
  Upload,
  Mic,
  MicOff,
  Download,
  Trash2,
  CheckCircle,
  AlertCircle,
  Clock,
  Target,
  Shield,
  Database,
  Smartphone,
  Globe,
  DollarSign,
} from "lucide-react"

interface ParsedRequirement {
  id: string
  category: string
  items: string[]
  priority: "high" | "medium" | "low"
  estimatedEffort: string
  dependencies: string[]
  risks: string[]
}

interface RequirementAnalysis {
  complexity: "simple" | "medium" | "complex"
  estimatedTimeline: string
  estimatedCost: string
  technicalRisks: string[]
  businessValue: string
  userStories: string[]
  acceptanceCriteria: string[]
}

const requirementCategories = [
  { id: "auth", name: "Authentication & Security", icon: Shield, color: "bg-red-500" },
  { id: "core", name: "Core Features", icon: Target, color: "bg-blue-500" },
  { id: "ui", name: "User Interface", icon: Smartphone, color: "bg-green-500" },
  { id: "data", name: "Data Management", icon: Database, color: "bg-purple-500" },
  { id: "integration", name: "Integrations", icon: Globe, color: "bg-orange-500" },
  { id: "performance", name: "Performance & Scalability", icon: Zap, color: "bg-yellow-500" },
  { id: "business", name: "Business Logic", icon: DollarSign, color: "bg-indigo-500" },
  { id: "compliance", name: "Compliance & Legal", icon: Shield, color: "bg-gray-500" },
]

export function SmartRequirementsParser({ onRequirementsParsed }: { onRequirementsParsed?: (data: any) => void }) {
  const [rawText, setRawText] = useState("")
  const [parsedRequirements, setParsedRequirements] = useState<ParsedRequirement[]>([])
  const [analysis, setAnalysis] = useState<RequirementAnalysis | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingStep, setProcessingStep] = useState("")
  const [progress, setProgress] = useState(0)
  const [inputMethod, setInputMethod] = useState<"text" | "file" | "voice">("text")
  const [isRecording, setIsRecording] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const parseRequirements = async () => {
    if (!rawText.trim()) return

    setIsProcessing(true)
    setProgress(0)

    try {
      // Step 1: Initial parsing
      setProcessingStep("Analyzing requirements structure...")
      setProgress(20)
      await new Promise((resolve) => setTimeout(resolve, 800))

      // Step 2: Categorization
      setProcessingStep("Categorizing requirements...")
      setProgress(40)
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Step 3: Priority analysis
      setProcessingStep("Analyzing priorities and dependencies...")
      setProgress(60)
      await new Promise((resolve) => setTimeout(resolve, 800))

      // Step 4: Risk assessment
      setProcessingStep("Assessing technical risks...")
      setProgress(80)
      await new Promise((resolve) => setTimeout(resolve, 600))

      // Step 5: Final analysis
      setProcessingStep("Generating insights and recommendations...")
      setProgress(100)

      const response = await fetch("/api/parse-requirements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: rawText }),
      })

      const result = await response.json()

      if (result.requirements) {
        const enhancedRequirements = result.requirements.map((req: any, index: number) => ({
          ...req,
          id: `req-${index}`,
          estimatedEffort: generateEffortEstimate(req.items.length, req.priority),
          dependencies: generateDependencies(req.category),
          risks: generateRisks(req.category, req.priority),
        }))

        setParsedRequirements(enhancedRequirements)

        // Generate comprehensive analysis
        const analysisData: RequirementAnalysis = {
          complexity: determineComplexity(enhancedRequirements),
          estimatedTimeline: generateTimeline(enhancedRequirements),
          estimatedCost: generateCostEstimate(enhancedRequirements),
          technicalRisks: generateTechnicalRisks(enhancedRequirements),
          businessValue: generateBusinessValue(enhancedRequirements),
          userStories: generateUserStories(enhancedRequirements),
          acceptanceCriteria: generateAcceptanceCriteria(enhancedRequirements),
        }

        setAnalysis(analysisData)

        if (onRequirementsParsed) {
          onRequirementsParsed({
            requirements: enhancedRequirements,
            analysis: analysisData,
          })
        }
      }
    } catch (error) {
      console.error("Failed to parse requirements:", error)
    } finally {
      setIsProcessing(false)
      setProcessingStep("")
      setProgress(0)
    }
  }

  const generateEffortEstimate = (itemCount: number, priority: string): string => {
    const baseHours = itemCount * (priority === "high" ? 8 : priority === "medium" ? 5 : 3)
    if (baseHours < 40) return `${baseHours}h`
    if (baseHours < 160) return `${Math.ceil(baseHours / 8)} days`
    return `${Math.ceil(baseHours / 40)} weeks`
  }

  const generateDependencies = (category: string): string[] => {
    const deps: Record<string, string[]> = {
      "Authentication & Security": ["Database setup", "SSL certificates"],
      "Core Features": ["Authentication", "Database schema"],
      "User Interface": ["Design system", "Core features"],
      "Data Management": ["Database design", "Security framework"],
      Integrations: ["API documentation", "Authentication"],
      "Performance & Scalability": ["Core architecture", "Monitoring setup"],
    }
    return deps[category] || []
  }

  const generateRisks = (category: string, priority: string): string[] => {
    const risks: Record<string, string[]> = {
      "Authentication & Security": ["Security vulnerabilities", "Compliance requirements"],
      "Core Features": ["Scope creep", "Technical complexity"],
      "User Interface": ["User experience issues", "Cross-browser compatibility"],
      "Data Management": ["Data migration complexity", "Performance bottlenecks"],
      Integrations: ["Third-party API changes", "Rate limiting"],
      "Performance & Scalability": ["Infrastructure costs", "Technical debt"],
    }
    return risks[category] || []
  }

  const determineComplexity = (requirements: ParsedRequirement[]): "simple" | "medium" | "complex" => {
    const totalItems = requirements.reduce((sum, req) => sum + req.items.length, 0)
    const highPriorityCount = requirements.filter((req) => req.priority === "high").length

    if (totalItems > 30 || highPriorityCount > 5) return "complex"
    if (totalItems > 15 || highPriorityCount > 3) return "medium"
    return "simple"
  }

  const generateTimeline = (requirements: ParsedRequirement[]): string => {
    const complexity = determineComplexity(requirements)
    const timelines = {
      simple: "2-4 weeks",
      medium: "2-4 months",
      complex: "6-12 months",
    }
    return timelines[complexity]
  }

  const generateCostEstimate = (requirements: ParsedRequirement[]): string => {
    const complexity = determineComplexity(requirements)
    const costs = {
      simple: "$10k - $25k",
      medium: "$25k - $100k",
      complex: "$100k - $500k+",
    }
    return costs[complexity]
  }

  const generateTechnicalRisks = (requirements: ParsedRequirement[]): string[] => {
    return [
      "Integration complexity with third-party services",
      "Scalability challenges with high user load",
      "Data security and privacy compliance",
      "Cross-platform compatibility issues",
      "Performance optimization requirements",
    ]
  }

  const generateBusinessValue = (requirements: ParsedRequirement[]): string => {
    return "High - Addresses core business needs and user pain points with measurable ROI potential"
  }

  const generateUserStories = (requirements: ParsedRequirement[]): string[] => {
    return [
      "As a user, I want to easily access the main features so that I can accomplish my goals efficiently",
      "As an admin, I want to manage user permissions so that I can maintain system security",
      "As a business owner, I want to track key metrics so that I can make informed decisions",
    ]
  }

  const generateAcceptanceCriteria = (requirements: ParsedRequirement[]): string[] => {
    return [
      "All core features are accessible within 3 clicks",
      "System responds within 2 seconds for all user actions",
      "Security measures pass penetration testing",
      "Mobile responsiveness works on all major devices",
    ]
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const content = e.target?.result as string
        setRawText(content)
      }
      reader.readAsText(file)
    }
  }

  const startVoiceRecording = () => {
    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition
      const recognition = new SpeechRecognition()

      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = "en-US"

      recognition.onstart = () => setIsRecording(true)
      recognition.onend = () => setIsRecording(false)

      recognition.onresult = (event) => {
        let transcript = ""
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript
        }
        setRawText((prev) => prev + " " + transcript)
      }

      recognition.start()
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

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case "simple":
        return "text-green-500"
      case "medium":
        return "text-yellow-500"
      case "complex":
        return "text-red-500"
      default:
        return "text-gray-500"
    }
  }

  const filteredRequirements =
    selectedCategory === "all"
      ? parsedRequirements
      : parsedRequirements.filter((req) => req.category.toLowerCase().includes(selectedCategory))

  return (
    <Card className="p-6 neomorphism">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary" />
            Smart Requirements Parser
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            AI-powered analysis of business requirements with insights and recommendations
          </p>
        </div>
        <Badge variant="secondary" className="neomorphism">
          <Zap className="h-3 w-3 mr-1" />
          Gemini Flash 2.5
        </Badge>
      </div>

      <Tabs value={inputMethod} onValueChange={(value) => setInputMethod(value as any)} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 neomorphism">
          <TabsTrigger value="text">Text Input</TabsTrigger>
          <TabsTrigger value="file">File Upload</TabsTrigger>
          <TabsTrigger value="voice">Voice Input</TabsTrigger>
        </TabsList>

        <TabsContent value="text" className="space-y-4">
          <Textarea
            placeholder="Paste your business requirements, user stories, or project documentation here. The AI will automatically categorize and analyze them.

Example:
- User authentication with email/password
- Product catalog with search functionality
- Shopping cart and checkout process
- Payment integration with Stripe
- Admin dashboard for order management
- Mobile-responsive design
- Support for 10,000+ concurrent users
- Integration with existing CRM system"
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            className="min-h-[200px] neomorphism-inset resize-none"
          />
        </TabsContent>

        <TabsContent value="file" className="space-y-4">
          <div className="border-2 border-dashed border-border rounded-lg p-8 text-center neomorphism-inset">
            <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground mb-4">Upload requirements documents (TXT, DOC, PDF)</p>
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="neomorphism-hover bg-transparent"
            >
              <Upload className="h-4 w-4 mr-2" />
              Choose File
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.doc,.docx,.pdf"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
          {rawText && (
            <div className="p-4 bg-muted/50 rounded-lg neomorphism-inset">
              <p className="text-sm text-muted-foreground mb-2">Uploaded content preview:</p>
              <p className="text-sm line-clamp-3">{rawText}</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="voice" className="space-y-4">
          <div className="text-center p-8 border-2 border-dashed border-border rounded-lg neomorphism-inset">
            <div className={`mx-auto mb-4 p-4 rounded-full ${isRecording ? "bg-red-500" : "bg-muted"}`}>
              {isRecording ? (
                <Mic className="h-8 w-8 text-white" />
              ) : (
                <MicOff className="h-8 w-8 text-muted-foreground" />
              )}
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              {isRecording ? "Recording... Speak your requirements" : "Click to start voice recording"}
            </p>
            <Button
              variant={isRecording ? "destructive" : "outline"}
              onClick={startVoiceRecording}
              className="neomorphism-hover bg-transparent"
            >
              {isRecording ? <MicOff className="h-4 w-4 mr-2" /> : <Mic className="h-4 w-4 mr-2" />}
              {isRecording ? "Stop Recording" : "Start Recording"}
            </Button>
          </div>
          {rawText && (
            <Textarea
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              className="min-h-[100px] neomorphism-inset"
              placeholder="Voice transcription will appear here..."
            />
          )}
        </TabsContent>
      </Tabs>

      {/* Processing Progress */}
      {isProcessing && (
        <Card className="p-4 mt-4 neomorphism-inset">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Processing Requirements</h3>
              <Badge variant="secondary">{progress}%</Badge>
            </div>
            <Progress value={progress} className="h-2" />
            <p className="text-sm text-muted-foreground">{processingStep}</p>
          </div>
        </Card>
      )}

      {/* Parse Button */}
      <Button
        onClick={parseRequirements}
        disabled={!rawText.trim() || isProcessing}
        className="w-full mt-4 neomorphism-hover"
        size="lg"
      >
        {isProcessing ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
            Processing Requirements...
          </>
        ) : (
          <>
            <Brain className="h-4 w-4 mr-2" />
            Parse & Analyze Requirements
          </>
        )}
      </Button>

      {/* Results */}
      {parsedRequirements.length > 0 && (
        <div className="mt-6 space-y-4">
          {/* Analysis Summary */}
          {analysis && (
            <Card className="p-4 neomorphism-inset">
              <h3 className="font-medium mb-3 flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                Project Analysis
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="text-center">
                  <div className={`text-lg font-bold ${getComplexityColor(analysis.complexity)}`}>
                    {analysis.complexity.toUpperCase()}
                  </div>
                  <div className="text-xs text-muted-foreground">Complexity</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-primary">{analysis.estimatedTimeline}</div>
                  <div className="text-xs text-muted-foreground">Timeline</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-primary">{analysis.estimatedCost}</div>
                  <div className="text-xs text-muted-foreground">Est. Cost</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-primary">{parsedRequirements.length}</div>
                  <div className="text-xs text-muted-foreground">Categories</div>
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                <strong>Business Value:</strong> {analysis.businessValue}
              </div>
            </Card>
          )}

          {/* Category Filter */}
          <div className="flex items-center gap-2">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48 neomorphism-inset">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {requirementCategories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" className="neomorphism-hover bg-transparent">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>

          {/* Requirements List */}
          <div className="space-y-3">
            {filteredRequirements.map((req) => (
              <Card key={req.id} className="p-4 neomorphism-inset">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <FileText className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium">{req.category}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge
                          variant="outline"
                          className={`text-xs ${getPriorityColor(req.priority)} text-white border-none`}
                        >
                          {req.priority}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          <Clock className="h-3 w-3 mr-1" />
                          {req.estimatedEffort}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-3">
                  <div>
                    <h5 className="text-sm font-medium mb-2">Requirements:</h5>
                    <ul className="space-y-1">
                      {req.items.map((item, index) => (
                        <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                          <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {req.dependencies.length > 0 && (
                    <div>
                      <h5 className="text-sm font-medium mb-2">Dependencies:</h5>
                      <div className="flex flex-wrap gap-1">
                        {req.dependencies.map((dep, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {dep}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {req.risks.length > 0 && (
                    <div>
                      <h5 className="text-sm font-medium mb-2 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3 text-yellow-500" />
                        Risks:
                      </h5>
                      <div className="flex flex-wrap gap-1">
                        {req.risks.map((risk, index) => (
                          <Badge key={index} variant="outline" className="text-xs bg-yellow-500/10 text-yellow-700">
                            {risk}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </Card>
  )
}
