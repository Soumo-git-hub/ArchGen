"use client"

import type React from "react"
import { useState } from "react"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Database,
  Server,
  Cloud,
  Smartphone,
  Globe,
  Shield,
  Zap,
  CreditCard,
  Mail,
  Search,
  BarChart3,
  // Business View Icons
  Users,
  Briefcase,
  Activity,
  FileText,
  Calendar,
  ArrowRight,
  Building2,
  UserCheck,
  TrendingUp,
  Settings2,
  Workflow,
  Target,
} from "lucide-react"

// System View Components
const systemComponentCategories = [
  {
    name: "Data Layer",
    components: [
      { type: "database", label: "Database", icon: Database, color: "bg-blue-500" },
      { type: "cache", label: "Cache", icon: Zap, color: "bg-orange-500" },
      { type: "search", label: "Search Engine", icon: Search, color: "bg-green-500" },
    ],
  },
  {
    name: "Application Layer",
    components: [
      { type: "api", label: "API Gateway", icon: Server, color: "bg-purple-500" },
      { type: "microservice", label: "Microservice", icon: Globe, color: "bg-indigo-500" },
      { type: "auth", label: "Authentication", icon: Shield, color: "bg-red-500" },
    ],
  },
  {
    name: "Infrastructure",
    components: [
      { type: "cloud", label: "Cloud Service", icon: Cloud, color: "bg-cyan-500" },
      { type: "cdn", label: "CDN", icon: Globe, color: "bg-teal-500" },
      { type: "loadbalancer", label: "Load Balancer", icon: BarChart3, color: "bg-yellow-500" },
    ],
  },
  {
    name: "External Services",
    components: [
      { type: "payment", label: "Payment Gateway", icon: CreditCard, color: "bg-emerald-500" },
      { type: "email", label: "Email Service", icon: Mail, color: "bg-pink-500" },
      { type: "mobile", label: "Mobile App", icon: Smartphone, color: "bg-violet-500" },
    ],
  },
]

// Business View Components
const businessComponentCategories = [
  {
    name: "Business Processes",
    components: [
      { type: "order_process", label: "Order Processing", icon: Workflow, color: "bg-blue-600" },
      { type: "customer_onboarding", label: "Customer Onboarding", icon: UserCheck, color: "bg-green-600" },
      { type: "payment_process", label: "Payment Processing", icon: CreditCard, color: "bg-purple-600" },
      { type: "inventory_mgmt", label: "Inventory Management", icon: Settings2, color: "bg-orange-600" },
    ],
  },
  {
    name: "Business Actors",
    components: [
      { type: "customer", label: "Customer", icon: Users, color: "bg-indigo-600" },
      { type: "admin", label: "Administrator", icon: UserCheck, color: "bg-red-600" },
      { type: "partner", label: "Business Partner", icon: Briefcase, color: "bg-cyan-600" },
      { type: "supplier", label: "Supplier", icon: Building2, color: "bg-teal-600" },
    ],
  },
  {
    name: "Business Data",
    components: [
      { type: "customer_data", label: "Customer Data", icon: FileText, color: "bg-emerald-600" },
      { type: "product_catalog", label: "Product Catalog", icon: Database, color: "bg-yellow-600" },
      { type: "order_data", label: "Order Data", icon: Activity, color: "bg-pink-600" },
      { type: "analytics_data", label: "Analytics Data", icon: TrendingUp, color: "bg-violet-600" },
    ],
  },
  {
    name: "Business Events",
    components: [
      { type: "order_placed", label: "Order Placed", icon: Calendar, color: "bg-lime-600" },
      { type: "payment_completed", label: "Payment Completed", icon: Target, color: "bg-rose-600" },
      { type: "user_registered", label: "User Registered", icon: Users, color: "bg-sky-600" },
      { type: "inventory_updated", label: "Inventory Updated", icon: ArrowRight, color: "bg-amber-600" },
    ],
  },
]

interface ComponentLibraryProps {
  viewType?: 'system' | 'business' | 'technical'
}

export function ComponentLibrary({ viewType = 'system' }: ComponentLibraryProps) {
  const [draggedComponent, setDraggedComponent] = useState<string | null>(null)

  const handleDragStart = (e: React.DragEvent, component: any) => {
    console.log("Drag start:", component)
    
    // Set up drag data with proper MIME type and ensure clean transfer
    const componentData = JSON.stringify(component)
    e.dataTransfer.setData("application/json", componentData)
    e.dataTransfer.effectAllowed = "copy"
    
    // Add visual feedback immediately
    setDraggedComponent(component.type)
    
    // Optimize drag image for smoother experience
    try {
      const dragImage = e.currentTarget.cloneNode(true) as HTMLElement
      dragImage.style.transform = 'rotate(2deg)' // Subtle rotation
      dragImage.style.opacity = '0.9'
      dragImage.style.pointerEvents = 'none' // Ensure no interference
      e.dataTransfer.setDragImage(dragImage, 75, 50)
    } catch (error) {
      console.log('Using default drag image')
    }
  }

  const handleDragEnd = (e: React.DragEvent) => {
    console.log("Drag end - cleaning up")
    
    // Clean up drag state immediately for responsive feedback
    setDraggedComponent(null)
    
    // Ensure data transfer is properly cleared
    try {
      e.dataTransfer.clearData()
    } catch (error) {
      // Some browsers may not allow clearing data on drag end
      console.log('DataTransfer clearData not available')
    }
  }

  // Get the appropriate component categories based on view type
  const componentCategories = viewType === 'business' ? businessComponentCategories : systemComponentCategories

  return (
    <Card className="p-3 neomorphism h-full flex flex-col overflow-hidden">
      <h2 className="text-base font-semibold mb-3">
        {viewType === 'business' ? 'Business Components' : 'Component Library'}
      </h2>

      <div className="space-y-3 overflow-auto flex-1">
        {componentCategories.map((category) => (
          <div key={category.name}>
            <h3 className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">{category.name}</h3>
            <div className="space-y-1.5">
              {category.components.map((component) => (
                <div
                  key={component.type}
                  draggable
                  onDragStart={(e) => handleDragStart(e, component)}
                  onDragEnd={handleDragEnd}
                  className={`flex items-center gap-2 p-2 bg-card rounded-md border border-border cursor-grab transition-all duration-200 select-none ${
                    draggedComponent === component.type
                      ? "opacity-40 scale-95 bg-primary/10 border-primary cursor-grabbing"
                      : "hover:bg-accent/50 hover:scale-[1.02] hover:shadow-md neomorphism-hover active:scale-95"
                  }`}
                  title={`Drag ${component.label} to canvas`}
                >
                  <div className={`p-1.5 rounded ${component.color}`}>
                    <component.icon className="h-3 w-3 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium truncate">{component.label}</div>
                    <div className="text-xs text-muted-foreground truncate">{component.type}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 pt-3 border-t border-border">
        <Badge variant="outline" className="text-xs">
          {draggedComponent ? `Dragging: ${draggedComponent}` : "Drag to canvas"}
        </Badge>
      </div>
    </Card>
  )
}
