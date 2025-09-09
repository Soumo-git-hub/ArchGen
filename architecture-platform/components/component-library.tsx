"use client"

import type React from "react"

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
  const handleDragStart = (e: React.DragEvent, component: any) => {
    e.dataTransfer.setData("application/json", JSON.stringify(component))
    e.dataTransfer.effectAllowed = "copy"
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
                  className="flex items-center gap-3 p-3 bg-card rounded-lg border border-border cursor-grab hover:bg-accent/50 transition-colors neomorphism-hover"
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
          Drag components to canvas
        </Badge>
      </div>
    </Card>
  )
}
