"use client"

import type React from "react"

import { useEffect, useRef, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Move,
  MousePointer,
  Hand,
  Edit3,
  Trash2,
  Copy,
  Link,
  Settings,
  Eye,
  EyeOff,
} from "lucide-react"

interface Component {
  id: string
  type: string
  label: string
  x: number
  y: number
  width: number
  height: number
  description?: string
  technologies?: string[]
  category?: string
  selected?: boolean
}

interface Connection {
  id: string
  from: { x: number; y: number; componentId?: string }
  to: { x: number; y: number; componentId?: string }
  type: string
  label?: string
  protocol?: string
  selected?: boolean
}

interface ArchitectureCanvasProps {
  architecture: any
  isGenerating: boolean
  onArchitectureChange?: (architecture: any) => void
}

export function ArchitectureCanvas({ architecture, isGenerating, onArchitectureChange }: ArchitectureCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [tool, setTool] = useState<"select" | "pan" | "connect">("select")
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [selectedComponent, setSelectedComponent] = useState<Component | null>(null)
  const [selectedConnection, setSelectedConnection] = useState<Connection | null>(null)
  const [components, setComponents] = useState<Component[]>([])
  const [connections, setConnections] = useState<Connection[]>([])
  const [isConnecting, setIsConnecting] = useState(false)
  const [connectionStart, setConnectionStart] = useState<{ x: number; y: number; componentId: string } | null>(null)
  const [hoveredComponent, setHoveredComponent] = useState<string | null>(null)
  const [showLabels, setShowLabels] = useState(true)
  const [showConnections, setShowConnections] = useState(true)

  useEffect(() => {
    if (architecture?.components) {
      const enhancedComponents = architecture.components.map((comp: any, index: number) => ({
        ...comp,
        id: comp.id || `comp-${index}`,
        width: comp.width || 120,
        height: comp.height || 80,
        selected: false,
      }))
      setComponents(enhancedComponents)
    }

    if (architecture?.connections) {
      const enhancedConnections = architecture.connections.map((conn: any, index: number) => ({
        ...conn,
        id: conn.id || `conn-${index}`,
        selected: false,
      }))
      setConnections(enhancedConnections)
    }
  }, [architecture])

  const drawCanvas = useCallback(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas size with device pixel ratio for crisp rendering
    const rect = canvas.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)

    // Clear canvas
    ctx.clearRect(0, 0, rect.width, rect.height)

    // Apply zoom and pan transformations
    ctx.save()
    ctx.translate(pan.x, pan.y)
    ctx.scale(zoom, zoom)

    // Draw grid background
    drawGrid(ctx, rect.width, rect.height)

    // Draw connections first (behind components)
    if (showConnections) {
      connections.forEach((connection) => {
        drawConnection(ctx, connection)
      })
    }

    // Draw components
    components.forEach((component) => {
      drawComponent(ctx, component)
    })

    // Draw connection preview when connecting
    if (isConnecting && connectionStart) {
      drawConnectionPreview(ctx)
    }

    ctx.restore()
  }, [components, connections, zoom, pan, isConnecting, connectionStart, hoveredComponent, showLabels, showConnections])

  useEffect(() => {
    drawCanvas()
  }, [drawCanvas])

  const drawGrid = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const gridSize = 20
    ctx.strokeStyle = "rgba(107, 114, 128, 0.1)"
    ctx.lineWidth = 1

    // Vertical lines
    for (let x = 0; x < width / zoom; x += gridSize) {
      ctx.beginPath()
      ctx.moveTo(x - pan.x / zoom, -pan.y / zoom)
      ctx.lineTo(x - pan.x / zoom, height / zoom - pan.y / zoom)
      ctx.stroke()
    }

    // Horizontal lines
    for (let y = 0; y < height / zoom; y += gridSize) {
      ctx.beginPath()
      ctx.moveTo(-pan.x / zoom, y - pan.y / zoom)
      ctx.lineTo(width / zoom - pan.x / zoom, y - pan.y / zoom)
      ctx.stroke()
    }
  }

  const drawComponent = (ctx: CanvasRenderingContext2D, component: Component) => {
    const { x, y, width, height, type, label, selected } = component
    const isHovered = hoveredComponent === component.id

    // Component shadow for neomorphism effect
    ctx.shadowColor = "rgba(0, 0, 0, 0.3)"
    ctx.shadowBlur = selected ? 12 : isHovered ? 10 : 8
    ctx.shadowOffsetX = selected ? 6 : isHovered ? 5 : 4
    ctx.shadowOffsetY = selected ? 6 : isHovered ? 5 : 4

    // Component background
    ctx.fillStyle = selected ? "#4c1d95" : isHovered ? "#3730a3" : "#374151"
    ctx.fillRect(x, y, width, height)

    // Inner highlight for neomorphism
    ctx.shadowColor = "rgba(255, 255, 255, 0.05)"
    ctx.shadowOffsetX = -2
    ctx.shadowOffsetY = -2
    ctx.shadowBlur = 4
    ctx.fillStyle = selected ? "#5b21b6" : isHovered ? "#4338ca" : "#4b5563"
    ctx.fillRect(x + 2, y + 2, width - 4, height - 4)

    // Reset shadow
    ctx.shadowColor = "transparent"
    ctx.shadowBlur = 0
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 0

    // Component border
    ctx.strokeStyle = selected ? "#8b5cf6" : isHovered ? "#7c3aed" : "#6b7280"
    ctx.lineWidth = selected ? 3 : isHovered ? 2 : 1
    ctx.strokeRect(x, y, width, height)

    // Component icon area
    const iconSize = 24
    ctx.fillStyle = "#8b5cf6"
    ctx.fillRect(x + 8, y + 8, iconSize, iconSize)

    // Component type indicator
    ctx.fillStyle = "#ffffff"
    ctx.font = "8px sans-serif"
    ctx.textAlign = "center"
    ctx.fillText(type.charAt(0).toUpperCase(), x + 8 + iconSize / 2, y + 8 + iconSize / 2 + 3)

    if (showLabels) {
      // Component label
      ctx.fillStyle = "#f1f5f9"
      ctx.font = "12px sans-serif"
      ctx.textAlign = "center"
      ctx.fillText(label || type, x + width / 2, y + height - 20)

      // Component type
      ctx.fillStyle = "#9ca3af"
      ctx.font = "10px sans-serif"
      ctx.fillText(type.toUpperCase(), x + width / 2, y + height - 8)
    }

    // Selection handles
    if (selected) {
      drawSelectionHandles(ctx, x, y, width, height)
    }
  }

  const drawSelectionHandles = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number) => {
    const handleSize = 6
    ctx.fillStyle = "#8b5cf6"
    ctx.strokeStyle = "#ffffff"
    ctx.lineWidth = 2

    const handles = [
      { x: x - handleSize / 2, y: y - handleSize / 2 }, // Top-left
      { x: x + width - handleSize / 2, y: y - handleSize / 2 }, // Top-right
      { x: x - handleSize / 2, y: y + height - handleSize / 2 }, // Bottom-left
      { x: x + width - handleSize / 2, y: y + height - handleSize / 2 }, // Bottom-right
    ]

    handles.forEach((handle) => {
      ctx.fillRect(handle.x, handle.y, handleSize, handleSize)
      ctx.strokeRect(handle.x, handle.y, handleSize, handleSize)
    })
  }

  const drawConnection = (ctx: CanvasRenderingContext2D, connection: Connection) => {
    const { from, to, type = "data", selected, label } = connection

    // Connection style based on type
    const styles = {
      data: { color: "#8b5cf6", width: 2, dash: [] },
      async: { color: "#22c55e", width: 2, dash: [5, 5] },
      sync: { color: "#3b82f6", width: 3, dash: [] },
      event: { color: "#f59e0b", width: 2, dash: [3, 3] },
    }

    const style = styles[type as keyof typeof styles] || styles.data

    ctx.strokeStyle = selected ? "#ef4444" : style.color
    ctx.lineWidth = selected ? style.width + 1 : style.width
    ctx.setLineDash(style.dash)

    // Draw connection line
    ctx.beginPath()
    ctx.moveTo(from.x, from.y)
    ctx.lineTo(to.x, to.y)
    ctx.stroke()

    // Draw arrow head
    const angle = Math.atan2(to.y - from.y, to.x - from.x)
    const arrowLength = 12
    const arrowAngle = Math.PI / 6

    ctx.beginPath()
    ctx.moveTo(to.x, to.y)
    ctx.lineTo(to.x - arrowLength * Math.cos(angle - arrowAngle), to.y - arrowLength * Math.sin(angle - arrowAngle))
    ctx.moveTo(to.x, to.y)
    ctx.lineTo(to.x - arrowLength * Math.cos(angle + arrowAngle), to.y - arrowLength * Math.sin(angle + arrowAngle))
    ctx.stroke()

    // Draw connection label
    if (showLabels && label) {
      const midX = (from.x + to.x) / 2
      const midY = (from.y + to.y) / 2

      ctx.fillStyle = "#1f2937"
      ctx.fillRect(midX - 20, midY - 8, 40, 16)
      ctx.fillStyle = "#f1f5f9"
      ctx.font = "10px sans-serif"
      ctx.textAlign = "center"
      ctx.fillText(label, midX, midY + 3)
    }

    ctx.setLineDash([])
  }

  const drawConnectionPreview = (ctx: CanvasRenderingContext2D) => {
    if (!connectionStart) return

    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return

    // Get mouse position relative to canvas
    const mouseX = (dragStart.x - rect.left - pan.x) / zoom
    const mouseY = (dragStart.y - rect.top - pan.y) / zoom

    ctx.strokeStyle = "#8b5cf6"
    ctx.lineWidth = 2
    ctx.setLineDash([5, 5])

    ctx.beginPath()
    ctx.moveTo(connectionStart.x, connectionStart.y)
    ctx.lineTo(mouseX, mouseY)
    ctx.stroke()

    ctx.setLineDash([])
  }

  const getComponentAt = (x: number, y: number): Component | null => {
    const canvasX = (x - pan.x) / zoom
    const canvasY = (y - pan.y) / zoom

    return (
      components.find(
        (comp) =>
          canvasX >= comp.x && canvasX <= comp.x + comp.width && canvasY >= comp.y && canvasY <= comp.y + comp.height,
      ) || null
    )
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return

    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    setDragStart({ x: e.clientX, y: e.clientY })

    const component = getComponentAt(x, y)

    if (tool === "select") {
      if (component) {
        // Select component
        setSelectedComponent(component)
        setComponents((prev) => prev.map((c) => ({ ...c, selected: c.id === component.id })))
        setSelectedConnection(null)
        setConnections((prev) => prev.map((c) => ({ ...c, selected: false })))
      } else {
        // Deselect all
        setSelectedComponent(null)
        setSelectedConnection(null)
        setComponents((prev) => prev.map((c) => ({ ...c, selected: false })))
        setConnections((prev) => prev.map((c) => ({ ...c, selected: false })))
      }
      setIsDragging(true)
    } else if (tool === "pan") {
      setIsDragging(true)
    } else if (tool === "connect") {
      if (component) {
        setIsConnecting(true)
        setConnectionStart({
          x: component.x + component.width / 2,
          y: component.y + component.height / 2,
          componentId: component.id,
        })
      }
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return

    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // Update hover state
    const component = getComponentAt(x, y)
    setHoveredComponent(component?.id || null)

    if (isDragging) {
      if (tool === "pan") {
        setPan({
          x: e.clientX - dragStart.x + pan.x,
          y: e.clientY - dragStart.y + pan.y,
        })
        setDragStart({ x: e.clientX, y: e.clientY })
      } else if (tool === "select" && selectedComponent) {
        // Move selected component
        const deltaX = (e.clientX - dragStart.x) / zoom
        const deltaY = (e.clientY - dragStart.y) / zoom

        setComponents((prev) =>
          prev.map((comp) =>
            comp.id === selectedComponent.id ? { ...comp, x: comp.x + deltaX, y: comp.y + deltaY } : comp,
          ),
        )
        setDragStart({ x: e.clientX, y: e.clientY })
      }
    }

    if (isConnecting) {
      drawCanvas() // Redraw to show connection preview
    }
  }

  const handleMouseUp = (e: React.MouseEvent) => {
    if (isConnecting && connectionStart) {
      const rect = canvasRef.current?.getBoundingClientRect()
      if (!rect) return

      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      const targetComponent = getComponentAt(x, y)

      if (targetComponent && targetComponent.id !== connectionStart.componentId) {
        // Create new connection
        const newConnection: Connection = {
          id: `conn-${Date.now()}`,
          from: {
            x: connectionStart.x,
            y: connectionStart.y,
            componentId: connectionStart.componentId,
          },
          to: {
            x: targetComponent.x + targetComponent.width / 2,
            y: targetComponent.y + targetComponent.height / 2,
            componentId: targetComponent.id,
          },
          type: "data",
          label: "Data Flow",
          selected: false,
        }

        setConnections((prev) => [...prev, newConnection])

        // Notify parent of architecture change
        if (onArchitectureChange) {
          onArchitectureChange({
            components,
            connections: [...connections, newConnection],
          })
        }
      }

      setIsConnecting(false)
      setConnectionStart(null)
      setTool("select")
    }

    setIsDragging(false)
  }

  const duplicateComponent = () => {
    if (!selectedComponent) return

    const newComponent: Component = {
      ...selectedComponent,
      id: `comp-${Date.now()}`,
      x: selectedComponent.x + 20,
      y: selectedComponent.y + 20,
      selected: false,
    }

    setComponents((prev) => [...prev, newComponent])
  }

  const deleteComponent = () => {
    if (!selectedComponent) return

    setComponents((prev) => prev.filter((c) => c.id !== selectedComponent.id))
    setConnections((prev) =>
      prev.filter((c) => c.from.componentId !== selectedComponent.id && c.to.componentId !== selectedComponent.id),
    )
    setSelectedComponent(null)
  }

  const handleZoomIn = () => setZoom((prev) => Math.min(prev * 1.2, 3))
  const handleZoomOut = () => setZoom((prev) => Math.max(prev / 1.2, 0.3))
  const handleReset = () => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }

  return (
    <div className="relative h-full bg-muted/20 rounded-lg overflow-hidden neomorphism-inset">
      {/* Canvas Controls */}
      <div className="absolute top-4 left-4 z-10 flex gap-2">
        <div className="flex bg-card rounded-lg p-1 neomorphism">
          <Button
            variant={tool === "select" ? "default" : "ghost"}
            size="sm"
            onClick={() => setTool("select")}
            className="h-8 w-8 p-0"
            title="Select Tool"
          >
            <MousePointer className="h-4 w-4" />
          </Button>
          <Button
            variant={tool === "pan" ? "default" : "ghost"}
            size="sm"
            onClick={() => setTool("pan")}
            className="h-8 w-8 p-0"
            title="Pan Tool"
          >
            <Hand className="h-4 w-4" />
          </Button>
          <Button
            variant={tool === "connect" ? "default" : "ghost"}
            size="sm"
            onClick={() => setTool("connect")}
            className="h-8 w-8 p-0"
            title="Connect Tool"
          >
            <Link className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex bg-card rounded-lg p-1 neomorphism">
          <Button variant="ghost" size="sm" onClick={handleZoomOut} className="h-8 w-8 p-0" title="Zoom Out">
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={handleZoomIn} className="h-8 w-8 p-0" title="Zoom In">
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={handleReset} className="h-8 w-8 p-0" title="Reset View">
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>

        {/* View Options */}
        <div className="flex bg-card rounded-lg p-1 neomorphism">
          <Button
            variant={showLabels ? "default" : "ghost"}
            size="sm"
            onClick={() => setShowLabels(!showLabels)}
            className="h-8 w-8 p-0"
            title="Toggle Labels"
          >
            {showLabels ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          </Button>
          <Button
            variant={showConnections ? "default" : "ghost"}
            size="sm"
            onClick={() => setShowConnections(!showConnections)}
            className="h-8 w-8 p-0"
            title="Toggle Connections"
          >
            <Link className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Component Actions */}
      {selectedComponent && (
        <div className="absolute top-4 right-4 z-10 flex gap-2">
          <div className="flex bg-card rounded-lg p-1 neomorphism">
            <Button variant="ghost" size="sm" onClick={duplicateComponent} className="h-8 w-8 p-0" title="Duplicate">
              <Copy className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={deleteComponent} className="h-8 w-8 p-0" title="Delete">
              <Trash2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Edit Properties">
              <Edit3 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Zoom indicator */}
      <div className="absolute bottom-4 right-4 z-10 bg-card px-3 py-1 rounded-lg text-sm neomorphism">
        {Math.round(zoom * 100)}%
      </div>

      {/* Tool indicator */}
      <div className="absolute bottom-4 left-4 z-10 bg-card px-3 py-1 rounded-lg text-sm neomorphism capitalize">
        {tool} Mode
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{
          cursor: tool === "pan" ? "grab" : tool === "connect" ? "crosshair" : "default",
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => {
          setIsDragging(false)
          setIsConnecting(false)
          setHoveredComponent(null)
        }}
      />

      {/* Loading State */}
      {isGenerating && (
        <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
            <p className="text-lg font-medium">Generating Architecture...</p>
            <p className="text-sm text-muted-foreground">AI is analyzing your requirements</p>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!components.length && !isGenerating && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center mx-auto mb-4 neomorphism">
              <Move className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-lg font-medium mb-2">Ready to Generate</p>
            <p className="text-sm text-muted-foreground max-w-sm">
              Enter your business requirements and click "Generate Architecture" to create your system design
            </p>
          </div>
        </div>
      )}

      {/* Component Properties Panel */}
      {selectedComponent && (
        <Card className="absolute top-16 right-4 w-64 p-4 neomorphism z-20">
          <h3 className="font-medium mb-3 flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Component Properties
          </h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground">Label</label>
              <Input
                value={selectedComponent.label}
                onChange={(e) => {
                  setComponents((prev) =>
                    prev.map((c) => (c.id === selectedComponent.id ? { ...c, label: e.target.value } : c)),
                  )
                  setSelectedComponent({ ...selectedComponent, label: e.target.value })
                }}
                className="h-8 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Type</label>
              <Input
                value={selectedComponent.type}
                onChange={(e) => {
                  setComponents((prev) =>
                    prev.map((c) => (c.id === selectedComponent.id ? { ...c, type: e.target.value } : c)),
                  )
                  setSelectedComponent({ ...selectedComponent, type: e.target.value })
                }}
                className="h-8 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Description</label>
              <Textarea
                value={selectedComponent.description || ""}
                onChange={(e) => {
                  setComponents((prev) =>
                    prev.map((c) => (c.id === selectedComponent.id ? { ...c, description: e.target.value } : c)),
                  )
                  setSelectedComponent({ ...selectedComponent, description: e.target.value })
                }}
                className="h-16 text-sm resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-muted-foreground">Width</label>
                <Input
                  type="number"
                  value={selectedComponent.width}
                  onChange={(e) => {
                    const width = Number.parseInt(e.target.value) || 120
                    setComponents((prev) => prev.map((c) => (c.id === selectedComponent.id ? { ...c, width } : c)))
                    setSelectedComponent({ ...selectedComponent, width })
                  }}
                  className="h-8 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Height</label>
                <Input
                  type="number"
                  value={selectedComponent.height}
                  onChange={(e) => {
                    const height = Number.parseInt(e.target.value) || 80
                    setComponents((prev) => prev.map((c) => (c.id === selectedComponent.id ? { ...c, height } : c)))
                    setSelectedComponent({ ...selectedComponent, height })
                  }}
                  className="h-8 text-sm"
                />
              </div>
            </div>
            {selectedComponent.technologies && (
              <div>
                <label className="text-xs text-muted-foreground">Technologies</label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {selectedComponent.technologies.map((tech, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {tech}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  )
}
