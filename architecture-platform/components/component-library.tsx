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
} from "lucide-react"

const componentCategories = [
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

export function ComponentLibrary() {
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

  return (
    <Card className="p-4 neomorphism h-full flex flex-col overflow-hidden">
      <h2 className="text-lg font-semibold mb-4">Component Library</h2>

      <div className="space-y-4 overflow-auto flex-1">
        {componentCategories.map((category) => (
          <div key={category.name}>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">{category.name}</h3>
            <div className="space-y-2">
              {category.components.map((component) => (
                <div
                  key={component.type}
                  draggable
                  onDragStart={(e) => handleDragStart(e, component)}
                  onDragEnd={handleDragEnd}
                  className={`flex items-center gap-3 p-3 bg-card rounded-lg border border-border cursor-grab transition-all duration-200 select-none ${
                    draggedComponent === component.type
                      ? "opacity-40 scale-95 bg-primary/10 border-primary cursor-grabbing"
                      : "hover:bg-accent/50 hover:scale-[1.02] hover:shadow-md neomorphism-hover active:scale-95"
                  }`}
                  title={`Drag ${component.label} to canvas`}
                >
                  <div className={`p-2 rounded-md ${component.color}`}>
                    <component.icon className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{component.label}</div>
                    <div className="text-xs text-muted-foreground">{component.type}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-border">
        <Badge variant="outline" className="text-xs">
          {draggedComponent ? `Dragging: ${draggedComponent}` : "Drag components to canvas"}
        </Badge>
      </div>
    </Card>
  )
}
