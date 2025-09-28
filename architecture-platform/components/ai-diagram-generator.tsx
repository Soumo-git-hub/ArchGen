"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Brain, Wand2, Zap, Lightbulb, TrendingUp, Shield, Database, Cloud, Smartphone, Globe } from "lucide-react"

interface GenerationStep {
  id: string
  name: string
  description: string
  status: "pending" | "processing" | "completed" | "error"
  progress: number
}

interface ArchitectureTemplate {
  id: string
  name: string
  description: string
  icon: any
  estimatedTime: string
  components: string[]
}

const systemArchitectureTemplates: ArchitectureTemplate[] = [
  {
    id: "ecommerce",
    name: "E-commerce Platform",
    description: "Full-featured online store with payments, inventory, and user management",
    icon: Globe,
    estimatedTime: "3-5 minutes",
    components: [
      "Web Frontend",
      "API Gateway",
      "User Service",
      "Product Service",
      "Payment Gateway",
      "Database",
      "CDN",
      "Cache",
    ],
  },
  {
    id: "mobile-backend",
    name: "Mobile App Backend",
    description: "Scalable backend for mobile applications with real-time features",
    icon: Smartphone,
    estimatedTime: "2-3 minutes",
    components: ["API Gateway", "Authentication", "Push Notifications", "Database", "File Storage", "Analytics"],
  },
  {
    id: "microservices",
    name: "Microservices Architecture",
    description: "Distributed system with independent services and event-driven communication",
    icon: Database,
    estimatedTime: "4-6 minutes",
    components: [
      "Service Mesh",
      "API Gateway",
      "Multiple Services",
      "Message Queue",
      "Service Discovery",
      "Monitoring",
    ],
  },
  {
    id: "data-platform",
    name: "Data Analytics Platform",
    description: "Big data processing and analytics with real-time dashboards",
    icon: TrendingUp,
    estimatedTime: "3-4 minutes",
    components: ["Data Ingestion", "Data Lake", "Processing Engine", "Analytics DB", "Dashboard", "ML Pipeline"],
  },
  {
    id: "saas-app",
    name: "SaaS Application",
    description: "Multi-tenant SaaS platform with subscription management",
    icon: Cloud,
    estimatedTime: "2-4 minutes",
    components: ["Frontend", "API", "Multi-tenant DB", "Billing Service", "Authentication", "Monitoring"],
  },
  {
    id: "enterprise-system",
    name: "Enterprise System",
    description: "Secure enterprise application with compliance and audit features",
    icon: Shield,
    estimatedTime: "4-5 minutes",
    components: ["Web Portal", "API Gateway", "Identity Provider", "Audit Service", "Database", "Security Layer"],
  },
]

const businessArchitectureTemplates: ArchitectureTemplate[] = [
  {
    id: "customer-journey",
    name: "Customer Journey",
    description: "End-to-end customer experience from awareness to retention",
    icon: Globe,
    estimatedTime: "2-3 minutes",
    components: [
      "Customer Acquisition",
      "Customer Onboarding",
      "Order Processing",
      "Customer Support",
      "Customer Retention",
    ],
  },
  {
    id: "order-fulfillment",
    name: "Order Fulfillment Process",
    description: "Complete order processing from placement to delivery",
    icon: TrendingUp,
    estimatedTime: "2-4 minutes",
    components: [
      "Order Placement",
      "Payment Processing",
      "Inventory Check",
      "Fulfillment",
      "Shipping",
      "Delivery Tracking",
    ],
  },
  {
    id: "supply-chain",
    name: "Supply Chain Management",
    description: "End-to-end supply chain from suppliers to customers",
    icon: Database,
    estimatedTime: "3-5 minutes",
    components: [
      "Supplier Management",
      "Procurement",
      "Inventory Management",
      "Quality Control",
      "Distribution",
      "Customer Delivery",
    ],
  },
  {
    id: "product-development",
    name: "Product Development Lifecycle",
    description: "Product ideation, development, and market launch process",
    icon: Lightbulb,
    estimatedTime: "3-4 minutes",
    components: [
      "Market Research",
      "Product Design",
      "Development",
      "Testing & QA",
      "Marketing",
      "Product Launch",
    ],
  },
  {
    id: "financial-operations",
    name: "Financial Operations",
    description: "Financial planning, budgeting, and reporting processes",
    icon: TrendingUp,
    estimatedTime: "2-3 minutes",
    components: [
      "Budget Planning",
      "Financial Analysis",
      "Accounts Payable",
      "Accounts Receivable",
      "Financial Reporting",
      "Compliance",
    ],
  },
  {
    id: "hr-processes",
    name: "Human Resources",
    description: "Employee lifecycle from recruitment to offboarding",
    icon: Shield,
    estimatedTime: "2-4 minutes",
    components: [
      "Recruitment",
      "Employee Onboarding",
      "Performance Management",
      "Training & Development",
      "Employee Relations",
      "Offboarding",
    ],
  },
]

export function AIDiagramGenerator({
  onArchitectureGenerated,
  parsedRequirements,
  viewType = 'system'
}: {
  onArchitectureGenerated: (architecture: any) => void
  parsedRequirements?: any
  viewType?: 'system' | 'business' | 'technical'
}) {
  // Get templates based on view type
  const getArchitectureTemplates = () => {
    return viewType === 'business' ? businessArchitectureTemplates : systemArchitectureTemplates
  }

  const architectureTemplates = getArchitectureTemplates()

  const [requirements, setRequirements] = useState("")
  const [projectName, setProjectName] = useState("")
  const [selectedTemplate, setSelectedTemplate] = useState<string>("")
  const [complexity, setComplexity] = useState<"simple" | "medium" | "complex">("medium")
  const [userLoad, setUserLoad] = useState("")
  const [budget, setBudget] = useState("")
  const [timeline, setTimeline] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationSteps, setGenerationSteps] = useState<GenerationStep[]>([])
  const [currentStep, setCurrentStep] = useState(0)
  const [generationMode, setGenerationMode] = useState<"requirements" | "template">("requirements")

  useEffect(() => {
    if (parsedRequirements?.requirements) {
      const requirementsText = parsedRequirements.requirements
        .map((req: any) => `${req.category}:\n${req.items.map((item: string) => `• ${item}`).join("\n")}`)
        .join("\n\n")

      setRequirements(requirementsText)
      setComplexity(parsedRequirements.analysis?.complexity || "medium")
      setProjectName(parsedRequirements.analysis?.projectName || "ArchGen Project")
    }
  }, [parsedRequirements])

  const initializeGenerationSteps = () => {
    const steps: GenerationStep[] = [
      {
        id: "analyze",
        name: "Analyzing Requirements",
        description: "AI is understanding your business needs and technical requirements",
        status: "pending",
        progress: 0,
      },
      {
        id: "design",
        name: "Designing Architecture",
        description: "Creating optimal system architecture based on best practices",
        status: "pending",
        progress: 0,
      },
      {
        id: "optimize",
        name: "Optimizing Components",
        description: "Selecting appropriate technologies and optimizing for scale",
        status: "pending",
        progress: 0,
      },
      {
        id: "validate",
        name: "Validating Design",
        description: "Ensuring architecture meets security and performance standards",
        status: "pending",
        progress: 0,
      },
      {
        id: "finalize",
        name: "Finalizing Diagram",
        description: "Generating interactive diagram with all components and connections",
        status: "pending",
        progress: 0,
      },
    ]
    setGenerationSteps(steps)
    return steps
  }

  const updateStepProgress = (stepIndex: number, progress: number, status: GenerationStep["status"]) => {
    setGenerationSteps((prev) =>
      prev.map((step, index) => (index === stepIndex ? { ...step, progress, status } : step)),
    )
  }

  const simulateGenerationProgress = async () => {
    const steps = initializeGenerationSteps()

    for (let i = 0; i < steps.length; i++) {
      setCurrentStep(i)
      updateStepProgress(i, 0, "processing")

      // Simulate progress for each step
      for (let progress = 0; progress <= 100; progress += 10) {
        await new Promise((resolve) => setTimeout(resolve, 100))
        updateStepProgress(i, progress, "processing")
      }

      updateStepProgress(i, 100, "completed")
      await new Promise((resolve) => setTimeout(resolve, 200))
    }
  }

  const handleGenerateArchitecture = async () => {
    if (generationMode === "requirements" && !requirements.trim()) return
    if (generationMode === "template" && !selectedTemplate) return

    setIsGenerating(true)

    try {
      // Start progress simulation
      simulateGenerationProgress()

      let requestBody
      if (generationMode === "template") {
        const template = architectureTemplates.find((t) => t.id === selectedTemplate)
        requestBody = {
          template: template,
          projectName: projectName || template?.name || "ArchGen Project",
          complexity,
          userLoad,
          budget,
          timeline,
          customRequirements: requirements,
          viewType, // Add viewType to the request
        }
      } else {
        requestBody = {
          requirements,
          projectName: projectName || "ArchGen Project",
          complexity,
          userLoad,
          budget,
          timeline,
          viewType, // Add viewType to the request
        }
      }

      const response = await fetch("/api/generate-architecture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      })

      const architecture = await response.json()

      // Wait for progress simulation to complete
      await new Promise((resolve) => setTimeout(resolve, 1000))

      onArchitectureGenerated(architecture)
    } catch (error) {
      console.error("Failed to generate architecture:", error)
      // Update current step to error status
      updateStepProgress(currentStep, 0, "error")
    } finally {
      setIsGenerating(false)
    }
  }

  const loadTemplate = (templateId: string) => {
    const template = architectureTemplates.find((t) => t.id === templateId)
    if (template) {
      setSelectedTemplate(templateId)
      setProjectName(template.name)
      setRequirements(
        `Generate a ${template.name.toLowerCase()} with the following components: ${template.components.join(", ")}`,
      )
    }
  }

  return (
    <Card className="p-6 neomorphism">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary" />
            Architecture Generator
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Generate production-ready system architectures
          </p>
        </div>
      </div>

      <Tabs value={generationMode} onValueChange={(value) => setGenerationMode(value as any)} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 neomorphism">
          <TabsTrigger value="requirements">From Requirements</TabsTrigger>
          <TabsTrigger value="template">From Template</TabsTrigger>
        </TabsList>

        <TabsContent value="requirements" className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <Input
              placeholder="Project Name"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="neomorphism-inset"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Input
              placeholder="Expected Users (e.g., 10k)"
              value={userLoad}
              onChange={(e) => setUserLoad(e.target.value)}
              className="neomorphism-inset"
            />
            <Input
              placeholder="Budget Range"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              className="neomorphism-inset"
            />
            <Input
              placeholder="Timeline"
              value={timeline}
              onChange={(e) => setTimeline(e.target.value)}
              className="neomorphism-inset"
            />
          </div>

          <Textarea
            placeholder="Describe your project requirements in detail. Include:
• Core features and functionality
• User types and roles
• Integration requirements
• Performance expectations
• Security requirements
• Compliance needs

Example: 'Build an e-commerce platform with user authentication, product catalog, shopping cart, payment processing, order management, and admin dashboard. Need to support 50,000+ concurrent users with real-time inventory updates.'"
            value={requirements}
            onChange={(e) => setRequirements(e.target.value)}
            className="min-h-[200px] neomorphism-inset resize-none"
          />
        </TabsContent>

        <TabsContent value="template" className="space-y-4">
          <div className="grid grid-cols-1 gap-3">
            {architectureTemplates.map((template) => (
              <div
                key={template.id}
                className={`p-4 border rounded-lg cursor-pointer transition-all neomorphism-hover ${
                  selectedTemplate === template.id ? "border-primary bg-primary/5" : "border-border"
                }`}
                onClick={() => loadTemplate(template.id)}
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <template.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">{template.name}</h3>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {template.estimatedTime}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{template.description}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {template.components.slice(0, 4).map((component, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {component}
                        </Badge>
                      ))}
                      {template.components.length > 4 && (
                        <Badge variant="outline" className="text-xs">
                          +{template.components.length - 4} more
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {selectedTemplate && (
            <Textarea
              placeholder="Add any custom requirements or modifications to the selected template..."
              value={requirements}
              onChange={(e) => setRequirements(e.target.value)}
              className="min-h-[100px] neomorphism-inset resize-none"
            />
          )}
        </TabsContent>
      </Tabs>

      {/* Generation Progress */}
      {isGenerating && (
        <Card className="p-4 mt-4 neomorphism-inset">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Generating Architecture</h3>
              <Badge variant="secondary">
                Step {currentStep + 1} of {generationSteps.length}
              </Badge>
            </div>

            <div className="space-y-3">
              {generationSteps.map((step, index) => (
                <div key={step.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {step.status === "completed" && <div className="w-2 h-2 bg-green-500 rounded-full" />}
                      {step.status === "processing" && (
                        <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                      )}
                      {step.status === "pending" && <div className="w-2 h-2 bg-muted rounded-full" />}
                      {step.status === "error" && <div className="w-2 h-2 bg-red-500 rounded-full" />}
                      <span className="text-sm font-medium">{step.name}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{step.progress}%</span>
                  </div>
                  <p className="text-xs text-muted-foreground ml-4">{step.description}</p>
                  {(step.status === "processing" || step.status === "completed") && (
                    <Progress value={step.progress} className="ml-4 h-1" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Generate Button */}
      <Button
        onClick={handleGenerateArchitecture}
        disabled={
          isGenerating ||
          (generationMode === "requirements" && !requirements.trim()) ||
          (generationMode === "template" && !selectedTemplate)
        }
        className="w-full mt-4 neomorphism-hover"
        size="lg"
      >
        {isGenerating ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
            Generating Architecture...
          </>
        ) : (
          <>
            <Wand2 className="h-4 w-4 mr-2" />
            Generate Architecture
          </>
        )}
      </Button>

      {/* AI Tips */}
      <Card className="p-3 mt-4 bg-primary/5 border-primary/20 neomorphism-inset">
        <div className="flex items-start gap-2">
          <Lightbulb className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
          <div className="text-xs text-muted-foreground">
            <strong className="text-primary">AI Tips:</strong> Be specific about your requirements. Mention user load,
            integrations, security needs, and performance expectations for better results.
          </div>
        </div>
      </Card>
    </Card>
  )
}
