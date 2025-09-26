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
  HelpCircle,
  Undo,
  Redo,
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
  icon?: any // Lucide React icon component
  color?: string // Icon background color
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
  viewType?: 'system' | 'business' | 'technical'
}

export function ArchitectureCanvas({ architecture, isGenerating, onArchitectureChange, viewType = 'system' }: ArchitectureCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [tool, setTool] = useState<"select" | "pan" | "connect">("select")
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [isDraggingComponent, setIsDraggingComponent] = useState(false)
  const [selectedComponent, setSelectedComponent] = useState<Component | null>(null)
  const [selectedConnection, setSelectedConnection] = useState<Connection | null>(null)
  const [components, setComponents] = useState<Component[]>([])
  const [connections, setConnections] = useState<Connection[]>([])
  const [isConnecting, setIsConnecting] = useState(false)
  const [connectionStart, setConnectionStart] = useState<{ x: number; y: number; componentId: string } | null>(null)
  const [hoveredComponent, setHoveredComponent] = useState<string | null>(null)
  const [hoveredConnection, setHoveredConnection] = useState<string | null>(null)
  const [showLabels, setShowLabels] = useState(true)
  const [showConnections, setShowConnections] = useState(true)
  const [isDragOver, setIsDragOver] = useState(false)
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false)
  const [editingConnectionLabel, setEditingConnectionLabel] = useState<string | null>(null)
  const [tempConnectionLabel, setTempConnectionLabel] = useState("")
  const [lastClickTime, setLastClickTime] = useState(0)
  const [lastClickedConnection, setLastClickedConnection] = useState<string | null>(null)
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; type: 'connection' | 'component' | null; target: any }>({ x: 0, y: 0, type: null, target: null })
  const [isInputFocused, setIsInputFocused] = useState(false)
  
  // Undo/Redo state management
  const [history, setHistory] = useState<Array<{ components: Component[], connections: Connection[] }>>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [isPerformingHistoryAction, setIsPerformingHistoryAction] = useState(false)
  
  // Save current state to history
  const saveToHistory = useCallback(() => {
    if (isPerformingHistoryAction) return // Don't save when performing undo/redo
    
    const currentState = {
      components: JSON.parse(JSON.stringify(components)),
      connections: JSON.parse(JSON.stringify(connections))
    }
    
    setHistory(prev => {
      // Remove any history after current index (when new action is performed after undo)
      const newHistory = prev.slice(0, historyIndex + 1)
      newHistory.push(currentState)
      
      // Limit history to 50 states to prevent memory issues
      if (newHistory.length > 50) {
        newHistory.shift()
        return newHistory
      }
      
      return newHistory
    })
    
    setHistoryIndex(prev => {
      const newIndex = prev + 1
      return newIndex >= 50 ? 49 : newIndex
    })
  }, [components, connections, historyIndex, isPerformingHistoryAction])
  
  // Undo function
  const undo = useCallback(() => {
    if (historyIndex <= 0) return
    
    setIsPerformingHistoryAction(true)
    const previousState = history[historyIndex - 1]
    
    setComponents(previousState.components)
    setConnections(previousState.connections)
    setHistoryIndex(prev => prev - 1)
    
    // Clear selections when undoing
    setSelectedComponent(null)
    setSelectedConnection(null)
    
    // Notify parent of change
    if (onArchitectureChange) {
      onArchitectureChange({
        components: previousState.components,
        connections: previousState.connections
      })
    }
    
    setTimeout(() => setIsPerformingHistoryAction(false), 100)
  }, [history, historyIndex, onArchitectureChange])
  
  // Redo function
  const redo = useCallback(() => {
    if (historyIndex >= history.length - 1) return
    
    setIsPerformingHistoryAction(true)
    const nextState = history[historyIndex + 1]
    
    setComponents(nextState.components)
    setConnections(nextState.connections)
    setHistoryIndex(prev => prev + 1)
    
    // Clear selections when redoing
    setSelectedComponent(null)
    setSelectedConnection(null)
    
    // Notify parent of change
    if (onArchitectureChange) {
      onArchitectureChange({
        components: nextState.components,
        connections: nextState.connections
      })
    }
    
    setTimeout(() => setIsPerformingHistoryAction(false), 100)
  }, [history, historyIndex, onArchitectureChange])
  
  // Check if undo/redo is available
  const canUndo = historyIndex > 0
  const canRedo = historyIndex < history.length - 1
  
  // Helper function to get category color based on view type
  const getCategoryColor = (component: Component, colorType: 'base' | 'hover' | 'selected' | 'border' | 'highlight' | 'icon') => {
    // Business View Color Schemes
    const businessCategoryColors = {
      // Business Processes
      process: {
        base: "#1e40af",
        hover: "#1d4ed8",
        selected: "#1e3a8a",
        border: "#3b82f6",
        highlight: "#60a5fa",
        icon: "#dbeafe"
      },
      // Business Actors
      actor: {
        base: "#7c3aed",
        hover: "#8b5cf6",
        selected: "#6d28d9",
        border: "#a855f7",
        highlight: "#c4b5fd",
        icon: "#ede9fe"
      },
      // Business Data
      data: {
        base: "#059669",
        hover: "#10b981",
        selected: "#047857",
        border: "#34d399",
        highlight: "#6ee7b7",
        icon: "#d1fae5"
      },
      // Business Events
      event: {
        base: "#dc2626",
        hover: "#ef4444",
        selected: "#b91c1c",
        border: "#f87171",
        highlight: "#fca5a5",
        icon: "#fee2e2"
      },
      default: {
        base: "#374151",
        hover: "#4b5563",
        selected: "#1f2937",
        border: "#6b7280",
        highlight: "#4b5563",
        icon: "#8b5cf6"
      }
    }
    
    // System View Color Schemes (existing)
    const systemCategoryColors = {
      infrastructure: {
        base: "#374151",
        hover: "#4b5563",
        selected: "#1f2937",
        border: "#6b7280",
        highlight: "#4b5563",
        icon: "#8b5cf6"
      },
      application: {
        base: "#4b5563",
        hover: "#6b7280",
        selected: "#111827",
        border: "#9ca3af",
        highlight: "#6b7280",
        icon: "#3b82f6"
      },
      database: {
        base: "#44403c",
        hover: "#5c5753",
        selected: "#1c1917",
        border: "#78716c",
        highlight: "#5c5753",
        icon: "#f59e0b"
      },
      service: {
        base: "#4c1d95",
        hover: "#5b21b6",
        selected: "#1e1b4b",
        border: "#8b5cf6",
        highlight: "#5b21b6",
        icon: "#c084fc"
      },
      default: {
        base: "#374151",
        hover: "#4b5563",
        selected: "#1f2937",
        border: "#6b7280",
        highlight: "#4b5563",
        icon: "#8b5cf6"
      }
    }
    
    // Auto-categorize business components based on type
    const getBusinessCategory = (type: string) => {
      if (type.includes('process') || type.includes('mgmt') || type.includes('workflow')) return 'process'
      if (type.includes('customer') || type.includes('admin') || type.includes('partner') || type.includes('supplier')) return 'actor'
      if (type.includes('data') || type.includes('catalog') || type.includes('analytics')) return 'data'
      if (type.includes('placed') || type.includes('completed') || type.includes('registered') || type.includes('updated')) return 'event'
      return 'default'
    }
    
    const categoryColors = viewType === 'business' ? businessCategoryColors : systemCategoryColors
    
    let categoryKey = component.category
    if (viewType === 'business' && !categoryKey) {
      categoryKey = getBusinessCategory(component.type)
    }
    
    const colors = categoryKey && categoryColors[categoryKey as keyof typeof categoryColors] 
      ? categoryColors[categoryKey as keyof typeof categoryColors] 
      : categoryColors.default
      
    return colors[colorType as keyof typeof colors]
  }

  useEffect(() => {
    if (architecture?.components) {
      const enhancedComponents = architecture.components.map((comp: any, index: number) => ({
        ...comp,
        id: comp.id || `comp-${index}`,
        width: comp.width || 140, // Increased default width
        height: comp.height || 100, // Increased default height
        selected: false,
      }))
      
      // Apply auto-layout with better spacing
      const layoutComponents = applyAutoLayout(enhancedComponents)
      setComponents(layoutComponents)

      // Process connections after components are set to properly link them
      if (architecture?.connections) {
        const enhancedConnections = architecture.connections.map((conn: any, index: number) => {
          const connectionWithId = {
            ...conn,
            id: conn.id || `conn-${index}`,
            selected: false,
          }
          
          // Find source and target components based on coordinates
          const sourceComponent = findNearestComponent(layoutComponents, conn.from.x, conn.from.y)
          const targetComponent = findNearestComponent(layoutComponents, conn.to.x, conn.to.y)
          
          // Link connections to components if found
          if (sourceComponent) {
            connectionWithId.from = {
              ...connectionWithId.from,
              componentId: sourceComponent.id,
              x: sourceComponent.x + sourceComponent.width / 2,
              y: sourceComponent.y + sourceComponent.height / 2
            }
          }
          
          if (targetComponent) {
            connectionWithId.to = {
              ...connectionWithId.to,
              componentId: targetComponent.id,
              x: targetComponent.x + targetComponent.width / 2,
              y: targetComponent.y + targetComponent.height / 2
            }
          }
          
          console.log('Enhanced connection:', {
            id: connectionWithId.id,
            from: connectionWithId.from,
            to: connectionWithId.to,
            sourceComponent: sourceComponent?.label,
            targetComponent: targetComponent?.label
          })
          
          return connectionWithId
        })
        
        setConnections(enhancedConnections)
      }
    } else {
      // Start with empty canvas - no test components
      setComponents([])
      setConnections([])
      
      // Initialize history for empty state immediately
      setTimeout(() => {
        if (history.length === 0) {
          setHistory([{ components: [], connections: [] }])
          setHistoryIndex(0)
        }
      }, 0)
    }
  }, [architecture])
  
  // Helper function to find the nearest component to given coordinates
  const findNearestComponent = (components: Component[], x: number, y: number): Component | null => {
    let nearestComponent: Component | null = null
    let minDistance = Infinity
    
    components.forEach(comp => {
      const centerX = comp.x + comp.width / 2
      const centerY = comp.y + comp.height / 2
      const distance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2))
      
      // Consider a component as a match if the connection point is within reasonable range
      const maxDistance = Math.max(comp.width, comp.height) + 80 // Increased tolerance to 80px
      
      if (distance < maxDistance && distance < minDistance) {
        minDistance = distance
        nearestComponent = comp
      }
    })
    
    return nearestComponent
  }

  // Auto-layout function to prevent component overlap
  const applyAutoLayout = (components: Component[]) => {
    if (components.length === 0) return components
    
    const minSpacing = 60 // Minimum spacing between components
    const gridSize = 40 // Grid size for alignment
    
    return components.map((comp, index) => {
      // Calculate position with proper spacing
      const cols = Math.ceil(Math.sqrt(components.length))
      const row = Math.floor(index / cols)
      const col = index % cols
      
      const baseX = col * (comp.width + minSpacing) + 100
      const baseY = row * (comp.height + minSpacing) + 100
      
      // Snap to grid
      const x = Math.round(baseX / gridSize) * gridSize
      const y = Math.round(baseY / gridSize) * gridSize
      
      return {
        ...comp,
        x: comp.x || x,
        y: comp.y || y
      }
    })
  }

  const drawCanvas = useCallback(() => {
    if (!canvasRef.current) {
      console.warn("Canvas ref not available")
      return
    }

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) {
      console.warn("Canvas context not available")
      return
    }

    console.log("Drawing canvas with components:", components.length)

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
    console.log("Drawing", components.length, "components")
    components.forEach((component, index) => {
      console.log(`Drawing component ${index}:`, component.label, "at", component.x, component.y)
      drawComponent(ctx, component)
    })

    // Draw connection preview when connecting
    if (isConnecting && connectionStart) {
      drawConnectionPreview(ctx)
    }

    ctx.restore()
  }, [components, connections, zoom, pan, isConnecting, connectionStart, hoveredComponent, showLabels, showConnections, isDraggingComponent])

  useEffect(() => {
    drawCanvas()
  }, [drawCanvas])

  // Redraw canvas when dragging state changes for immediate visual feedback
  useEffect(() => {
    if (isDraggingComponent) {
      drawCanvas()
    }
  }, [isDraggingComponent, drawCanvas])

  // Initialize history with first state (including empty state)
  useEffect(() => {
    if (history.length === 0) {
      const initialState = {
        components: JSON.parse(JSON.stringify(components)),
        connections: JSON.parse(JSON.stringify(connections))
      }
      setHistory([initialState])
      setHistoryIndex(0)
    }
  }, [components, connections, history.length])

  // Text input handler for connection label editing
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (editingConnectionLabel && e.key.length === 1) {
        e.preventDefault()
        setTempConnectionLabel(prev => prev + e.key)
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (editingConnectionLabel && e.key === 'Backspace') {
        e.preventDefault()
        setTempConnectionLabel(prev => prev.slice(0, -1))
      }
    }

    window.addEventListener('keypress', handleKeyPress)
    window.addEventListener('keydown', handleKeyDown)
    
    return () => {
      window.removeEventListener('keypress', handleKeyPress)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [editingConnectionLabel])

  // Track input focus state to prevent keyboard shortcuts from interfering
  useEffect(() => {
    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true') {
        setIsInputFocused(true)
        console.log('Input focused, disabling keyboard shortcuts')
      }
    }
    
    const handleFocusOut = (e: FocusEvent) => {
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true') {
        setIsInputFocused(false)
        console.log('Input unfocused, enabling keyboard shortcuts')
      }
    }
    
    document.addEventListener('focusin', handleFocusIn)
    document.addEventListener('focusout', handleFocusOut)
    
    return () => {
      document.removeEventListener('focusin', handleFocusIn)
      document.removeEventListener('focusout', handleFocusOut)
    }
  }, [])

  // Keyboard shortcuts handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if user is currently editing any input field (using both methods for reliability)
      const isEditingInput = isInputFocused || 
                            (e.target as HTMLElement)?.tagName === 'INPUT' || 
                            (e.target as HTMLElement)?.tagName === 'TEXTAREA' ||
                            (e.target as HTMLElement)?.contentEditable === 'true' ||
                            editingConnectionLabel
      
      console.log('Keyboard event:', {
        key: e.key,
        isInputFocused,
        targetTag: (e.target as HTMLElement)?.tagName,
        isEditingInput,
        editingConnectionLabel
      })
      
      // Delete selected component or connection (but not when editing any input field)
      if ((e.key === 'Delete' || e.key === 'Backspace') && (selectedComponent || selectedConnection) && !isEditingInput) {
        e.preventDefault()
        console.log('Deleting component/connection via keyboard')
        if (selectedComponent) {
          deleteComponent()
        } else if (selectedConnection) {
          deleteConnection()
        }
      }
      
      // Only process other shortcuts if not editing input fields
      if (isEditingInput) {
        // Allow normal text editing behavior in input fields
        console.log('Skipping keyboard shortcuts - input is focused')
        return
      }
      
      // Duplicate selected component (Ctrl+D)
      if (e.ctrlKey && e.key === 'd' && selectedComponent) {
        e.preventDefault()
        duplicateComponent()
      }
      
      // Select all components (Ctrl+A)
      if (e.ctrlKey && e.key === 'a') {
        e.preventDefault()
        setComponents(prev => prev.map(c => ({ ...c, selected: true })))
      }
      
      // Undo (Ctrl+Z)
      if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        undo()
      }
      
      // Redo (Ctrl+Y or Ctrl+Shift+Z)
      if ((e.ctrlKey && e.key === 'y') || (e.ctrlKey && e.shiftKey && e.key === 'z')) {
        e.preventDefault()
        redo()
      }
      
      // Start editing selected connection label (F2 or Enter)
      if ((e.key === 'F2' || e.key === 'Enter') && selectedConnection && !editingConnectionLabel) {
        e.preventDefault()
        setEditingConnectionLabel(selectedConnection.id)
        setTempConnectionLabel(selectedConnection.label || "")
      }
      
      // Arrow key movement for selected component (only when not editing inputs)
      if (selectedComponent && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault()
        
        saveToHistory() // Save state before movement
        
        const step = e.shiftKey ? 40 : 10 // Larger steps with Shift
        let deltaX = 0
        let deltaY = 0
        
        switch (e.key) {
          case 'ArrowUp': deltaY = -step; break
          case 'ArrowDown': deltaY = step; break
          case 'ArrowLeft': deltaX = -step; break
          case 'ArrowRight': deltaX = step; break
        }
        
        const newX = selectedComponent.x + deltaX
        const newY = selectedComponent.y + deltaY
        
        // Check for collisions
        const nearbyComponents = components.filter(comp => comp.id !== selectedComponent.id)
        const wouldCollide = nearbyComponents.some((comp) => {
          const distanceX = Math.abs((newX + selectedComponent.width/2) - (comp.x + comp.width/2))
          const distanceY = Math.abs((newY + selectedComponent.height/2) - (comp.y + comp.height/2))
          return distanceX < (selectedComponent.width + comp.width)/2 + 60 &&
                 distanceY < (selectedComponent.height + comp.height)/2 + 60
        })
        
        if (!wouldCollide) {
          setComponents(prev => 
            prev.map(comp => 
              comp.id === selectedComponent.id 
                ? { ...comp, x: newX, y: newY }
                : comp
            )
          )
          setSelectedComponent({ ...selectedComponent, x: newX, y: newY })
          
          // Update connected relationships
          setConnections(prev =>
            prev.map(conn => {
              if (conn.from.componentId === selectedComponent.id) {
                return {
                  ...conn,
                  from: {
                    ...conn.from,
                    x: newX + selectedComponent.width / 2,
                    y: newY + selectedComponent.height / 2
                  }
                }
              }
              if (conn.to.componentId === selectedComponent.id) {
                return {
                  ...conn,
                  to: {
                    ...conn.to,
                    x: newX + selectedComponent.width / 2,
                    y: newY + selectedComponent.height / 2
                  }
                }
              }
              return conn
            })
          )
        }
      }
      
      // Tool switching shortcuts (only when not editing inputs)
      if (e.key === 'v' || e.key === 'V') {
        e.preventDefault()
        setTool('select')
      }
      if (e.key === 'h' || e.key === 'H') {
        e.preventDefault()
        setTool('pan')
      }
      if (e.key === 'c' || e.key === 'C') {
        e.preventDefault()
        setTool('connect')
      }
      
      // Help key binding (only when not editing inputs)
      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault()
        setShowKeyboardShortcuts(!showKeyboardShortcuts)
      }
      
      // Handle connection label editing (when in special editing mode)
      if (editingConnectionLabel) {
        if (e.key === 'Enter') {
          e.preventDefault()
          // Save the label
          setConnections(prev => 
            prev.map(conn => 
              conn.id === editingConnectionLabel 
                ? { ...conn, label: tempConnectionLabel }
                : conn
            )
          )
          setEditingConnectionLabel(null)
          setTempConnectionLabel("")
        } else if (e.key === 'Escape') {
          e.preventDefault()
          // Cancel editing
          setEditingConnectionLabel(null)
          setTempConnectionLabel("")
        }
        return // Don't process other shortcuts while in connection label editing mode
      }
      
      // Escape to deselect (only when not editing regular inputs)
      if (e.key === 'Escape') {
        setSelectedComponent(null)
        setSelectedConnection(null)
        setComponents(prev => prev.map(c => ({ ...c, selected: false })))
        setConnections(prev => prev.map(c => ({ ...c, selected: false })))
        setEditingConnectionLabel(null)
        setTool('select')
        setIsConnecting(false)
        setShowKeyboardShortcuts(false)
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedComponent, selectedConnection, components, connections, showKeyboardShortcuts, undo, redo, saveToHistory, editingConnectionLabel, tempConnectionLabel, isInputFocused])

  const drawGrid = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const gridSize = 20
    
    // Draw major grid lines
    ctx.lineWidth = 1.5
    ctx.strokeStyle = "rgba(107, 114, 128, 0.15)"
    
    // Vertical lines
    for (let x = 0; x < width / zoom; x += gridSize * 5) {
      ctx.beginPath()
      ctx.moveTo(x - pan.x / zoom, -pan.y / zoom)
      ctx.lineTo(x - pan.x / zoom, height / zoom - pan.y / zoom)
      ctx.stroke()
    }

    // Horizontal lines
    for (let y = 0; y < height / zoom; y += gridSize * 5) {
      ctx.beginPath()
      ctx.moveTo(-pan.x / zoom, y - pan.y / zoom)
      ctx.lineTo(width / zoom - pan.x / zoom, y - pan.y / zoom)
      ctx.stroke()
    }
    
    // Draw minor grid lines
    ctx.lineWidth = 0.5
    ctx.strokeStyle = "rgba(107, 114, 128, 0.08)"
    
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
    const { x, y, width, height, type, label, selected, category, icon, color } = component
    const isHovered = hoveredComponent === component.id
    const isBeingDragged = isDraggingComponent && selected
    
    // Use the updated getCategoryColor function to get colors based on view type
    const baseColor = getCategoryColor(component, 'base')
    const hoverColor = getCategoryColor(component, 'hover')
    const selectedColor = getCategoryColor(component, 'selected')
    const borderColor = getCategoryColor(component, 'border')
    const highlightColor = getCategoryColor(component, 'highlight')
    const iconColor = getCategoryColor(component, 'icon')

    // Enhanced shadow for dragging state
    const shadowBlur = isBeingDragged ? 20 : selected ? 12 : isHovered ? 10 : 8
    const shadowOffset = isBeingDragged ? 8 : selected ? 6 : isHovered ? 5 : 4
    const shadowOpacity = isBeingDragged ? 0.4 : 0.3
    
    // Component shadow for neomorphism effect
    ctx.shadowColor = `rgba(0, 0, 0, ${shadowOpacity})`
    ctx.shadowBlur = shadowBlur
    ctx.shadowOffsetX = shadowOffset
    ctx.shadowOffsetY = shadowOffset

    // Slight elevation effect when dragging
    const offsetX = isBeingDragged ? 2 : 0
    const offsetY = isBeingDragged ? 2 : 0

    // Component background with elevation offset - different shapes for business view
    if (viewType === 'business') {
      // Business components use different shapes
      const getBusinessShape = (componentType: string) => {
        if (componentType.includes('process') || componentType.includes('mgmt') || componentType.includes('workflow')) {
          return 'roundedRect' // Processes - rounded rectangles
        }
        if (componentType.includes('customer') || componentType.includes('admin') || componentType.includes('partner') || componentType.includes('supplier')) {
          return 'oval' // Actors - ovals
        }
        if (componentType.includes('data') || componentType.includes('catalog') || componentType.includes('analytics')) {
          return 'parallelogram' // Data - parallelograms
        }
        if (componentType.includes('placed') || componentType.includes('completed') || componentType.includes('registered') || componentType.includes('updated')) {
          return 'hexagon' // Events - hexagons
        }
        return 'rect' // Default rectangle
      }
      
      const shape = getBusinessShape(type)
      
      ctx.fillStyle = selected ? selectedColor : isHovered ? hoverColor : baseColor
      
      if (shape === 'oval') {
        // Draw oval for actors
        ctx.beginPath()
        ctx.ellipse(x + width/2 + offsetX, y + height/2 + offsetY, width/2, height/2, 0, 0, 2 * Math.PI)
        ctx.fill()
      } else if (shape === 'roundedRect') {
        // Draw rounded rectangle for processes
        ctx.beginPath()
        ctx.roundRect(x + offsetX, y + offsetY, width, height, 12)
        ctx.fill()
      } else if (shape === 'parallelogram') {
        // Draw parallelogram for data
        const skew = 15
        ctx.beginPath()
        ctx.moveTo(x + skew + offsetX, y + offsetY)
        ctx.lineTo(x + width + offsetX, y + offsetY)
        ctx.lineTo(x + width - skew + offsetX, y + height + offsetY)
        ctx.lineTo(x + offsetX, y + height + offsetY)
        ctx.closePath()
        ctx.fill()
      } else if (shape === 'hexagon') {
        // Draw hexagon for events
        const hexSize = Math.min(width, height) / 2
        const centerX = x + width/2 + offsetX
        const centerY = y + height/2 + offsetY
        ctx.beginPath()
        for (let i = 0; i < 6; i++) {
          const angle = (Math.PI / 3) * i
          const hx = centerX + hexSize * Math.cos(angle)
          const hy = centerY + hexSize * Math.sin(angle)
          if (i === 0) ctx.moveTo(hx, hy)
          else ctx.lineTo(hx, hy)
        }
        ctx.closePath()
        ctx.fill()
      } else {
        // Default rectangle
        ctx.fillRect(x + offsetX, y + offsetY, width, height)
      }
    } else {
      // System view - standard rectangles
      ctx.fillStyle = selected ? selectedColor : isHovered ? hoverColor : baseColor
      ctx.fillRect(x + offsetX, y + offsetY, width, height)
    }

    // Inner highlight for neomorphism with elevation - match shape for business view
    ctx.shadowColor = "rgba(255, 255, 255, 0.05)"
    ctx.shadowOffsetX = -2
    ctx.shadowOffsetY = -2
    ctx.shadowBlur = 4
    ctx.fillStyle = selected ? highlightColor : isHovered ? highlightColor : baseColor
    
    if (viewType === 'business') {
      const getBusinessShape = (componentType: string) => {
        if (componentType.includes('process') || componentType.includes('mgmt') || componentType.includes('workflow')) return 'roundedRect'
        if (componentType.includes('customer') || componentType.includes('admin') || componentType.includes('partner') || componentType.includes('supplier')) return 'oval'
        if (componentType.includes('data') || componentType.includes('catalog') || componentType.includes('analytics')) return 'parallelogram'
        if (componentType.includes('placed') || componentType.includes('completed') || componentType.includes('registered') || componentType.includes('updated')) return 'hexagon'
        return 'rect'
      }
      
      const shape = getBusinessShape(type)
      
      if (shape === 'oval') {
        ctx.beginPath()
        ctx.ellipse(x + width/2 + offsetX, y + height/2 + offsetY, width/2 - 2, height/2 - 2, 0, 0, 2 * Math.PI)
        ctx.fill()
      } else if (shape === 'roundedRect') {
        ctx.beginPath()
        ctx.roundRect(x + 2 + offsetX, y + 2 + offsetY, width - 4, height - 4, 10)
        ctx.fill()
      } else if (shape === 'parallelogram') {
        const skew = 15
        ctx.beginPath()
        ctx.moveTo(x + skew + 2 + offsetX, y + 2 + offsetY)
        ctx.lineTo(x + width - 2 + offsetX, y + 2 + offsetY)
        ctx.lineTo(x + width - skew - 2 + offsetX, y + height - 2 + offsetY)
        ctx.lineTo(x + 2 + offsetX, y + height - 2 + offsetY)
        ctx.closePath()
        ctx.fill()
      } else if (shape === 'hexagon') {
        const hexSize = Math.min(width, height) / 2 - 2
        const centerX = x + width/2 + offsetX
        const centerY = y + height/2 + offsetY
        ctx.beginPath()
        for (let i = 0; i < 6; i++) {
          const angle = (Math.PI / 3) * i
          const hx = centerX + hexSize * Math.cos(angle)
          const hy = centerY + hexSize * Math.sin(angle)
          if (i === 0) ctx.moveTo(hx, hy)
          else ctx.lineTo(hx, hy)
        }
        ctx.closePath()
        ctx.fill()
      } else {
        ctx.fillRect(x + 2 + offsetX, y + 2 + offsetY, width - 4, height - 4)
      }
    } else {
      ctx.fillRect(x + 2 + offsetX, y + 2 + offsetY, width - 4, height - 4)
    }

    // Reset shadow
    ctx.shadowColor = "transparent"
    ctx.shadowBlur = 0
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 0

    // Component border with enhanced visibility when dragging - match shape for business view
    ctx.strokeStyle = isBeingDragged ? "#8b5cf6" : selected ? borderColor : isHovered ? borderColor : "#6b7280"
    ctx.lineWidth = isBeingDragged ? 4 : selected ? 3 : isHovered ? 2 : 1
    
    if (viewType === 'business') {
      const getBusinessShape = (componentType: string) => {
        if (componentType.includes('process') || componentType.includes('mgmt') || componentType.includes('workflow')) return 'roundedRect'
        if (componentType.includes('customer') || componentType.includes('admin') || componentType.includes('partner') || componentType.includes('supplier')) return 'oval'
        if (componentType.includes('data') || componentType.includes('catalog') || componentType.includes('analytics')) return 'parallelogram'
        if (componentType.includes('placed') || componentType.includes('completed') || componentType.includes('registered') || componentType.includes('updated')) return 'hexagon'
        return 'rect'
      }
      
      const shape = getBusinessShape(type)
      
      if (shape === 'oval') {
        ctx.beginPath()
        ctx.ellipse(x + width/2 + offsetX, y + height/2 + offsetY, width/2, height/2, 0, 0, 2 * Math.PI)
        ctx.stroke()
      } else if (shape === 'roundedRect') {
        ctx.beginPath()
        ctx.roundRect(x + offsetX, y + offsetY, width, height, 12)
        ctx.stroke()
      } else if (shape === 'parallelogram') {
        const skew = 15
        ctx.beginPath()
        ctx.moveTo(x + skew + offsetX, y + offsetY)
        ctx.lineTo(x + width + offsetX, y + offsetY)
        ctx.lineTo(x + width - skew + offsetX, y + height + offsetY)
        ctx.lineTo(x + offsetX, y + height + offsetY)
        ctx.closePath()
        ctx.stroke()
      } else if (shape === 'hexagon') {
        const hexSize = Math.min(width, height) / 2
        const centerX = x + width/2 + offsetX
        const centerY = y + height/2 + offsetY
        ctx.beginPath()
        for (let i = 0; i < 6; i++) {
          const angle = (Math.PI / 3) * i
          const hx = centerX + hexSize * Math.cos(angle)
          const hy = centerY + hexSize * Math.sin(angle)
          if (i === 0) ctx.moveTo(hx, hy)
          else ctx.lineTo(hx, hy)
        }
        ctx.closePath()
        ctx.stroke()
      } else {
        ctx.strokeRect(x + offsetX, y + offsetY, width, height)
      }
    } else {
      ctx.strokeRect(x + offsetX, y + offsetY, width, height)
    }

    // Component icon area with elevation
    const iconSize = 24
    const iconX = x + 8 + offsetX
    const iconY = y + 8 + offsetY
    
    // Use component's color if available, otherwise use category color
    const iconBgColor = color ? getColorFromTailwind(color) : iconColor
    ctx.fillStyle = iconBgColor
    ctx.fillRect(iconX, iconY, iconSize, iconSize)

    // Always try to draw SVG-like icon first, then fallback to emoji/text
    try {
      // Draw SVG-like icon on canvas
      drawIconOnCanvas(ctx, type, iconX, iconY, iconSize)
    } catch (error) {
      // Fallback to emoji symbol or first letter if SVG drawing fails
      ctx.fillStyle = "#ffffff"
      ctx.font = "12px sans-serif"
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      
      // Try emoji first, then fallback to first letter
      const iconSymbol = getIconSymbol(type)
      if (iconSymbol.length === 1) {
        // Single character, use larger font
        ctx.font = "16px sans-serif"
        ctx.fillText(iconSymbol, iconX + iconSize / 2, iconY + iconSize / 2)
      } else {
        // Emoji, use smaller font
        ctx.font = "12px sans-serif"
        ctx.fillText(iconSymbol, iconX + iconSize / 2, iconY + iconSize / 2)
      }
    }

    if (showLabels) {
      // Component label with elevation
      ctx.fillStyle = "#f1f5f9"
      ctx.font = "12px sans-serif"
      ctx.textAlign = "center"
      ctx.fillText(label || type, x + width / 2 + offsetX, y + height - 20 + offsetY)

      // Component type with elevation
      ctx.fillStyle = "#9ca3af"
      ctx.font = "10px sans-serif"
      ctx.fillText(type.toUpperCase(), x + width / 2 + offsetX, y + height - 8 + offsetY)
    }

    // Selection handles with elevation
    if (selected) {
      drawSelectionHandles(ctx, x + offsetX, y + offsetY, width, height)
    }

    // Dragging indicator - subtle pulse effect
    if (isBeingDragged) {
      const pulseRadius = 6 + Math.sin(Date.now() * 0.01) * 2
      ctx.fillStyle = "rgba(139, 92, 246, 0.6)"
      ctx.beginPath()
      ctx.arc(x + width - 12 + offsetX, y + 12 + offsetY, pulseRadius, 0, Math.PI * 2)
      ctx.fill()
      
      ctx.fillStyle = "rgba(255, 255, 255, 0.9)"
      ctx.font = "10px sans-serif"
      ctx.textAlign = "center"
      ctx.fillText("●", x + width - 12 + offsetX, y + 16 + offsetY)
    }
  }

  const drawSelectionHandles = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number) => {
    const handleSize = 8
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
      // Add subtle shadow for better visibility
      ctx.shadowColor = "rgba(0, 0, 0, 0.3)"
      ctx.shadowBlur = 4
      ctx.shadowOffsetX = 2
      ctx.shadowOffsetY = 2
      
      ctx.beginPath()
      ctx.roundRect(handle.x, handle.y, handleSize, handleSize, 3)
      ctx.fill()
      ctx.stroke()
      
      // Reset shadow
      ctx.shadowColor = "transparent"
      ctx.shadowBlur = 0
      ctx.shadowOffsetX = 0
      ctx.shadowOffsetY = 0
    })
    
    // Add center alignment guides
    ctx.fillStyle = "#8b5cf6"
    ctx.beginPath()
    ctx.roundRect(x + width/2 - 4, y - 6, 8, 4, 2) // Top center
    ctx.fill()
    
    ctx.beginPath()
    ctx.roundRect(x + width/2 - 4, y + height, 8, 4, 2) // Bottom center
    ctx.fill()
    
    ctx.beginPath()
    ctx.roundRect(x - 6, y + height/2 - 4, 4, 8, 2) // Left center
    ctx.fill()
    
    ctx.beginPath()
    ctx.roundRect(x + width, y + height/2 - 4, 4, 8, 2) // Right center
    ctx.fill()
  }

  const drawConnection = (ctx: CanvasRenderingContext2D, connection: Connection) => {
    const { from, to, type = "data", selected, label } = connection
    const isEditing = editingConnectionLabel === connection.id
    const displayLabel = isEditing ? tempConnectionLabel : label
    const isHovered = hoveredConnection === connection.id

    // Connection styles based on view type and connection type
    const getConnectionStyles = () => {
      if (viewType === 'business') {
        return {
          workflow: { color: "#3b82f6", width: 3, dash: [] },
          dataflow: { color: "#10b981", width: 2, dash: [] },
          interaction: { color: "#8b5cf6", width: 2, dash: [3, 3] },
          triggers: { color: "#f59e0b", width: 2, dash: [5, 5] },
          dependency: { color: "#ef4444", width: 2, dash: [4, 4] },
          communication: { color: "#06b6d4", width: 2, dash: [2, 4] },
          default: { color: "#6b7280", width: 2, dash: [] }
        }
      } else {
        return {
          data: { color: "#8b5cf6", width: 2, dash: [] },
          async: { color: "#22c55e", width: 2, dash: [5, 5] },
          sync: { color: "#3b82f6", width: 3, dash: [] },
          event: { color: "#f59e0b", width: 2, dash: [3, 3] },
          dependency: { color: "#ec4899", width: 2, dash: [4, 4] },
          api: { color: "#0ea5e9", width: 2, dash: [] },
          message: { color: "#fbbf24", width: 2, dash: [2, 2] },
          default: { color: "#6b7280", width: 2, dash: [] }
        }
      }
    }

    const styles = getConnectionStyles()
    const style = styles[type as keyof typeof styles] || styles.default

    ctx.strokeStyle = selected ? "#ef4444" : style.color
    ctx.lineWidth = selected ? style.width + 1 : style.width
    ctx.setLineDash(style.dash)

    // Calculate control points for smooth curve
    const dx = to.x - from.x
    const dy = to.y - from.y
    const distance = Math.sqrt(dx * dx + dy * dy)
    
    // Dynamic control point distance based on connection length
    const controlDistance = Math.min(distance * 0.3, 100) // Max control point distance of 100
    
    // Calculate control points for Bezier curve
    const angle = Math.atan2(dy, dx)
    const control1X = from.x + controlDistance * Math.cos(angle)
    const control1Y = from.y + controlDistance * Math.sin(angle)
    const control2X = to.x - controlDistance * Math.cos(angle)
    const control2Y = to.y - controlDistance * Math.sin(angle)
    
    // Draw curved connection line
    ctx.beginPath()
    ctx.moveTo(from.x, from.y)
    ctx.bezierCurveTo(control1X, control1Y, control2X, control2Y, to.x, to.y)
    ctx.stroke()

    // Calculate arrow position at the end of the curve with offset
    const arrowLength = 18
    const arrowAngle = Math.PI / 6 // Reduced angle for smoother appearance
    
    // Calculate tangent at the end point
    const tangentX = to.x - control2X
    const tangentY = to.y - control2Y
    const tangentAngle = Math.atan2(tangentY, tangentX)
    
    // Calculate arrow points with slight offset from the end
    const tipOffset = 6 // Offset from the endpoint
    const tipX = to.x - tipOffset * Math.cos(tangentAngle)
    const tipY = to.y - tipOffset * Math.sin(tangentAngle)
    
    const leftX = tipX - arrowLength * Math.cos(tangentAngle - arrowAngle)
    const leftY = tipY - arrowLength * Math.sin(tangentAngle - arrowAngle)
    const rightX = tipX - arrowLength * Math.cos(tangentAngle + arrowAngle)
    const rightY = tipY - arrowLength * Math.sin(tangentAngle + arrowAngle)
    
    // Add subtle glow effect for better visibility
    ctx.shadowColor = style.color
    ctx.shadowBlur = 6
    
    // Draw arrowhead with enhanced visibility
    ctx.fillStyle = selected ? "#ef4444" : style.color
    ctx.strokeStyle = "rgba(0, 0, 0, 0.25)"
    ctx.lineWidth = 1
    
    // Draw arrowhead with a more streamlined shape
    ctx.beginPath()
    ctx.moveTo(tipX, tipY)
    ctx.lineTo(leftX, leftY)
    ctx.lineTo(rightX, rightY)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()
    
    // Reset shadow
    ctx.shadowColor = "transparent"
    ctx.shadowBlur = 0

    // Draw connection label with improved positioning to avoid overlap
    if (showLabels && displayLabel) {
      // Calculate position for label (midpoint of control curve)
      let labelX = (from.x + control1X + control2X + to.x) / 4
      let labelY = (from.y + control1Y + control2Y + to.y) / 4
      
      // Adjust label position to avoid component overlap
      const labelOffset = 30 // Minimum distance from components
      
      // Find nearby components and adjust label position
      const nearbyComponents = components.filter(comp => {
        const distX = Math.abs(labelX - (comp.x + comp.width/2))
        const distY = Math.abs(labelY - (comp.y + comp.height/2))
        return distX < comp.width/2 + labelOffset && distY < comp.height/2 + labelOffset
      })
      
      if (nearbyComponents.length > 0) {
        // Move label away from nearby components
        const offsetDirection = Math.atan2(to.y - from.y, to.x - from.x) + Math.PI/2
        labelX += Math.cos(offsetDirection) * labelOffset
        labelY += Math.sin(offsetDirection) * labelOffset
      }
      
      // Calculate text dimensions
      ctx.font = "13px sans-serif"
      const textWidth = ctx.measureText(displayLabel).width
      const paddingX = 12
      const paddingY = 8
      const borderRadius = 6
      const rectWidth = textWidth + paddingX * 2
      const rectHeight = 26
      
      // Enhanced label background with better contrast and hover indication
      const isClickable = !isEditing // Labels are clickable when not editing
      ctx.fillStyle = isEditing ? "rgba(139, 92, 246, 0.1)" : 
                      isHovered && isClickable ? "rgba(139, 92, 246, 0.1)" : 
                      "rgba(248, 250, 252, 0.95)"
      ctx.strokeStyle = isEditing ? "#8b5cf6" : 
                       isHovered && isClickable ? "#8b5cf6" : 
                       "rgba(71, 85, 105, 0.3)"
      ctx.lineWidth = isEditing ? 2 : isHovered && isClickable ? 2 : 1
      
      // Add subtle shadow for better elevation and clickable indication
      ctx.shadowColor = isEditing ? "rgba(139, 92, 246, 0.3)" : 
                       isHovered && isClickable ? "rgba(139, 92, 246, 0.2)" : 
                       "rgba(0, 0, 0, 0.15)"
      ctx.shadowBlur = isEditing ? 8 : isHovered && isClickable ? 6 : 4
      ctx.shadowOffsetX = 2
      ctx.shadowOffsetY = 2
      
      // Draw rounded rectangle with enhanced styling
      ctx.beginPath()
      ctx.roundRect(labelX - rectWidth/2, labelY - rectHeight/2, rectWidth, rectHeight, borderRadius)
      ctx.fill()
      ctx.stroke()
      
      // Add subtle clickable indicator when hovered
      if (isHovered && isClickable && !isEditing) {
        ctx.strokeStyle = "rgba(139, 92, 246, 0.4)"
        ctx.lineWidth = 1
        ctx.setLineDash([2, 2])
        ctx.beginPath()
        ctx.roundRect(labelX - rectWidth/2 - 2, labelY - rectHeight/2 - 2, rectWidth + 4, rectHeight + 4, borderRadius + 2)
        ctx.stroke()
        ctx.setLineDash([])
      }
      
      // Reset shadow
      ctx.shadowColor = "transparent"
      ctx.shadowBlur = 0
      ctx.shadowOffsetX = 0
      ctx.shadowOffsetY = 0
      
      // Label text with enhanced contrast and hover indication
      ctx.fillStyle = isEditing ? "#8b5cf6" : 
                     isHovered && isClickable ? "#8b5cf6" : 
                     "#1e293b"
      ctx.font = "13px sans-serif"
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      ctx.fillText(displayLabel, labelX, labelY)
      
      // Add cursor indicator when editing
      if (isEditing) {
        const cursorX = labelX + textWidth/2 + 2
        ctx.fillStyle = "#8b5cf6"
        ctx.fillRect(cursorX, labelY - 8, 1, 16)
      }
      
      // Add small click hint icon when hovered (for better UX)
      if (isHovered && isClickable && !isEditing) {
        ctx.fillStyle = "rgba(139, 92, 246, 0.6)"
        ctx.font = "10px sans-serif"
        ctx.textAlign = "center"
        ctx.fillText("✎", labelX + rectWidth/2 - 8, labelY - rectHeight/2 + 8)
      }
      
      // Reset text styles
      ctx.shadowColor = "transparent"
      ctx.shadowBlur = 0
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

  const getConnectionAt = (x: number, y: number): Connection | null => {
    const canvasX = (x - pan.x) / zoom
    const canvasY = (y - pan.y) / zoom

    // Check if click is near any connection label
    for (const connection of connections) {
      if (!connection.label) continue

      const { from, to } = connection
      
      // Calculate label position using the same logic as drawConnection
      // Calculate control points for smooth curve (same as in drawConnection)
      const dx = to.x - from.x
      const dy = to.y - from.y
      const distance = Math.sqrt(dx * dx + dy * dy)
      const controlDistance = Math.min(distance * 0.3, 100)
      const angle = Math.atan2(dy, dx)
      const control1X = from.x + controlDistance * Math.cos(angle)
      const control1Y = from.y + controlDistance * Math.sin(angle)
      const control2X = to.x - controlDistance * Math.cos(angle)
      const control2Y = to.y - controlDistance * Math.sin(angle)
      
      // Calculate label position (midpoint of control curve)
      let labelX = (from.x + control1X + control2X + to.x) / 4
      let labelY = (from.y + control1Y + control2Y + to.y) / 4
      
      // Adjust label position to avoid component overlap (same logic as drawConnection)
      const labelOffset = 30
      const nearbyComponents = components.filter(comp => {
        const distX = Math.abs(labelX - (comp.x + comp.width/2))
        const distY = Math.abs(labelY - (comp.y + comp.height/2))
        return distX < comp.width/2 + labelOffset && distY < comp.height/2 + labelOffset
      })
      
      if (nearbyComponents.length > 0) {
        const offsetDirection = Math.atan2(to.y - from.y, to.x - from.x) + Math.PI/2
        labelX += Math.cos(offsetDirection) * labelOffset
        labelY += Math.sin(offsetDirection) * labelOffset
      }
      
      // Calculate text dimensions
      const canvas = canvasRef.current
      if (!canvas) continue
      
      const ctx = canvas.getContext("2d")
      if (!ctx) continue
      
      ctx.font = "13px sans-serif"
      const textWidth = ctx.measureText(connection.label).width
      const paddingX = 12
      const rectWidth = textWidth + paddingX * 2
      const rectHeight = 26
      
      // Check if click is within label bounds with increased tolerance for easier clicking
      const tolerance = 10 // Increased tolerance for easier clicking
      const isWithinBounds = canvasX >= labelX - rectWidth/2 - tolerance && 
          canvasX <= labelX + rectWidth/2 + tolerance && 
          canvasY >= labelY - rectHeight/2 - tolerance && 
          canvasY <= labelY + rectHeight/2 + tolerance
      
      if (isWithinBounds) {
        console.log("Connection label clicked:", {
          connectionId: connection.id,
          label: connection.label,
          clickPos: { canvasX, canvasY },
          labelPos: { labelX, labelY },
          bounds: { 
            left: labelX - rectWidth/2 - tolerance, 
            right: labelX + rectWidth/2 + tolerance,
            top: labelY - rectHeight/2 - tolerance,
            bottom: labelY + rectHeight/2 + tolerance
          }
        })
        return connection
      }
    }

    // Also check if click is near the connection line itself (for connections without labels)
    for (const connection of connections) {
      const { from, to } = connection
      
      // Simple line-click detection - check if click is near the straight line
      const lineDistance = pointToLineDistance(canvasX, canvasY, from.x, from.y, to.x, to.y)
      if (lineDistance < 8) { // 8px tolerance for line clicking
        console.log("Connection line clicked:", connection.id)
        return connection
      }
    }

    return null
  }
  
  // Helper function to calculate distance from point to line
  const pointToLineDistance = (px: number, py: number, x1: number, y1: number, x2: number, y2: number): number => {
    const A = px - x1
    const B = py - y1
    const C = x2 - x1
    const D = y2 - y1
    
    const dot = A * C + B * D
    const lenSq = C * C + D * D
    
    if (lenSq === 0) {
      // Line is actually a point
      return Math.sqrt(A * A + B * B)
    }
    
    let t = dot / lenSq
    
    if (t < 0) {
      // Beyond the start of the line
      return Math.sqrt(A * A + B * B)
    } else if (t > 1) {
      // Beyond the end of the line
      const dx = px - x2
      const dy = py - y2
      return Math.sqrt(dx * dx + dy * dy)
    } else {
      // Perpendicular distance to line
      const projX = x1 + t * C
      const projY = y1 + t * D
      const dx = px - projX
      const dy = py - projY
      return Math.sqrt(dx * dx + dy * dy)
    }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    // Don't handle mouse events during drag and drop operations
    if (isDragOver) {
      console.log("Skipping mouse down during drag operation")
      return
    }

    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return

    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    setDragStart({ x: e.clientX, y: e.clientY })

    const component = getComponentAt(x, y)
    const connection = getConnectionAt(x, y)

    if (tool === "select") {
      if (connection) {
        // Check if connection has a label for easier single-click editing
        const hasLabel = connection.label && connection.label.trim().length > 0
        
        // Handle double-click for inline editing
        const currentTime = Date.now()
        const isDoubleClick = currentTime - lastClickTime < 500 && lastClickedConnection === connection.id // Increased to 500ms
        
        console.log("Connection click detected:", {
          connectionId: connection.id,
          label: connection.label,
          hasLabel,
          currentTime,
          lastClickTime,
          timeDiff: currentTime - lastClickTime,
          lastClickedConnection,
          isDoubleClick
        })
        
        // For connections with labels, single click starts editing (more intuitive)
        // For connections without labels, require double-click to avoid accidental edits
        const shouldStartEditing = hasLabel ? true : isDoubleClick
        
        if (shouldStartEditing) {
          // Start inline editing
          console.log("Starting inline edit for:", connection.id, connection.label)
          setEditingConnectionLabel(connection.id)
          setTempConnectionLabel(connection.label || "New Label")
          // Prevent further processing
          e.preventDefault()
          e.stopPropagation()
          return
        } else {
          // Single click - just select and update click tracking
          console.log("Connection single-clicked:", connection.id, connection.label)
          setLastClickTime(currentTime)
          setLastClickedConnection(connection.id)
        }
        
        setSelectedConnection(connection)
        setConnections((prev) => prev.map((c) => ({ ...c, selected: c.id === connection.id })))
        setSelectedComponent(null)
        setComponents((prev) => prev.map((c) => ({ ...c, selected: false })))
        setIsDraggingComponent(false)
      } else if (component) {
        // Calculate the offset from the mouse to the component's top-left corner
        const canvasX = (x - pan.x) / zoom
        const canvasY = (y - pan.y) / zoom
        setDragOffset({
          x: canvasX - component.x,
          y: canvasY - component.y
        })
        
        // Select component and prepare for dragging
        setSelectedComponent(component)
        setComponents((prev) => prev.map((c) => ({ ...c, selected: c.id === component.id })))
        setSelectedConnection(null)
        setConnections((prev) => prev.map((c) => ({ ...c, selected: false })))
        setEditingConnectionLabel(null)
        setIsDraggingComponent(true)
      } else {
        // Deselect all and prepare for canvas panning
        setSelectedComponent(null)
        setSelectedConnection(null)
        setComponents((prev) => prev.map((c) => ({ ...c, selected: false })))
        setConnections((prev) => prev.map((c) => ({ ...c, selected: false })))
        setEditingConnectionLabel(null)
        setIsDraggingComponent(false)
        setContextMenu({ x: 0, y: 0, type: null, target: null })
      }
      setIsDragging(true)
    } else if (tool === "pan") {
      setIsDragging(true)
      setIsDraggingComponent(false)
      setEditingConnectionLabel(null)
    } else if (tool === "connect") {
      if (component) {
        setIsConnecting(true)
        setConnectionStart({
          x: component.x + component.width / 2,
          y: component.y + component.height / 2,
          componentId: component.id,
        })
        setEditingConnectionLabel(null)
      }
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    // Don't handle mouse events during drag and drop operations
    if (isDragOver) {
      return
    }

    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return

    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // Update hover state
    const component = getComponentAt(x, y)
    const connection = getConnectionAt(x, y)
    setHoveredComponent(component?.id || null)
    setHoveredConnection(connection?.id || null)

    if (isDragging) {
      if (tool === "pan" || (tool === "select" && !isDraggingComponent)) {
        // Pan the canvas
        setPan({
          x: e.clientX - dragStart.x + pan.x,
          y: e.clientY - dragStart.y + pan.y,
        })
        setDragStart({ x: e.clientX, y: e.clientY })
      } else if (tool === "select" && isDraggingComponent && selectedComponent) {
        // Move selected component smoothly
        const canvasX = (e.clientX - rect.left - pan.x) / zoom
        const canvasY = (e.clientY - rect.top - pan.y) / zoom
        
        // Calculate new position using the stored offset
        let newX = canvasX - dragOffset.x
        let newY = canvasY - dragOffset.y
        
        // Apply grid snapping and alignment guides
        const gridSize = 20 // Smaller grid for smoother movement
        const snapDistance = 15 // Reduced snap distance for more precise control
        const minComponentSpacing = 60 // Minimum distance between components
        
        // Check for nearby components for alignment guides
        const nearbyComponents = components.filter(
          (comp) => comp.id !== selectedComponent?.id
        )
        
        let snappedX = newX
        let snappedY = newY
        let showGuideX = false
        let showGuideY = false
        
        // Smart snapping to other components for alignment
        nearbyComponents.forEach((comp) => {
          // Horizontal alignment guides
          if (Math.abs(comp.x - newX) < snapDistance) {
            snappedX = comp.x // Left align
            showGuideX = true
          } else if (Math.abs((comp.x + comp.width) - (newX + selectedComponent.width)) < snapDistance) {
            snappedX = comp.x + comp.width - selectedComponent.width // Right align
            showGuideX = true
          } else if (Math.abs(comp.x + comp.width/2 - (newX + selectedComponent.width/2)) < snapDistance) {
            snappedX = comp.x + comp.width/2 - selectedComponent.width/2 // Center align
            showGuideX = true
          }
          
          // Vertical alignment guides
          if (Math.abs(comp.y - newY) < snapDistance) {
            snappedY = comp.y // Top align
            showGuideY = true
          } else if (Math.abs((comp.y + comp.height) - (newY + selectedComponent.height)) < snapDistance) {
            snappedY = comp.y + comp.height - selectedComponent.height // Bottom align
            showGuideY = true
          } else if (Math.abs(comp.y + comp.height/2 - (newY + selectedComponent.height/2)) < snapDistance) {
            snappedY = comp.y + comp.height/2 - selectedComponent.height/2 // Middle align
            showGuideY = true
          }
        })
        
        // Apply subtle grid snapping only when not aligned to other components
        if (!showGuideX) {
          const snapThreshold = 8 // Only snap if very close to grid
          const gridX = Math.round(newX / gridSize) * gridSize
          if (Math.abs(newX - gridX) < snapThreshold) {
            snappedX = gridX
          }
        }
        if (!showGuideY) {
          const snapThreshold = 8
          const gridY = Math.round(newY / gridSize) * gridSize
          if (Math.abs(newY - gridY) < snapThreshold) {
            snappedY = gridY
          }
        }
        
        // Check for collisions and maintain minimum spacing
        const wouldCollide = nearbyComponents.some((comp) => {
          const distanceX = Math.abs((snappedX + selectedComponent.width/2) - (comp.x + comp.width/2))
          const distanceY = Math.abs((snappedY + selectedComponent.height/2) - (comp.y + comp.height/2))
          return distanceX < (selectedComponent.width + comp.width)/2 + minComponentSpacing &&
                 distanceY < (selectedComponent.height + comp.height)/2 + minComponentSpacing
        })
        
        // Only update position if no collision
        if (!wouldCollide) {
          setComponents((prev) =>
            prev.map((comp) =>
              comp.id === selectedComponent.id 
                ? { ...comp, x: snappedX, y: snappedY } 
                : comp,
            ),
          )
          
          // Update connections that are attached to this component
          setConnections((prev) =>
            prev.map((conn) => {
              if (conn.from.componentId === selectedComponent.id) {
                return {
                  ...conn,
                  from: {
                    ...conn.from,
                    x: snappedX + selectedComponent.width / 2,
                    y: snappedY + selectedComponent.height / 2
                  }
                }
              }
              if (conn.to.componentId === selectedComponent.id) {
                return {
                  ...conn,
                  to: {
                    ...conn.to,
                    x: snappedX + selectedComponent.width / 2,
                    y: snappedY + selectedComponent.height / 2
                  }
                }
              }
              return conn
            })
          )
          
          // Update selected component reference
          setSelectedComponent({ ...selectedComponent, x: snappedX, y: snappedY })
        }
      }
    }

    if (isConnecting) {
      drawCanvas() // Redraw to show connection preview
    }
  }

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return

    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    
    const component = getComponentAt(x, y)
    const connection = getConnectionAt(x, y)
    
    if (connection) {
      setContextMenu({
        x: e.clientX,
        y: e.clientY,
        type: 'connection',
        target: connection
      })
    } else if (component) {
      setContextMenu({
        x: e.clientX,
        y: e.clientY,
        type: 'component',
        target: component
      })
    } else {
      setContextMenu({ x: 0, y: 0, type: null, target: null })
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
        saveToHistory() // Save state before creating connection
        
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

    // Save to history if component was moved
    if (isDraggingComponent && selectedComponent) {
      saveToHistory()
    }

    setIsDragging(false)
    setIsDraggingComponent(false)
  }

  const duplicateComponent = () => {
    if (!selectedComponent) return

    saveToHistory() // Save state before change
    
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

    saveToHistory() // Save state before change
    
    setComponents((prev) => prev.filter((c) => c.id !== selectedComponent.id))
    setConnections((prev) =>
      prev.filter((c) => c.from.componentId !== selectedComponent.id && c.to.componentId !== selectedComponent.id),
    )
    setSelectedComponent(null)
  }

  const deleteConnection = () => {
    if (!selectedConnection) return

    saveToHistory() // Save state before change
    
    setConnections((prev) => prev.filter((c) => c.id !== selectedConnection.id))
    setSelectedConnection(null)
  }

  const handleZoomIn = () => setZoom((prev) => Math.min(prev * 1.2, 3))
  const handleZoomOut = () => setZoom((prev) => Math.max(prev / 1.2, 0.3))
  const handleReset = () => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }

  // Drag and drop handlers - optimized for smooth operation
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    // Set the drop effect to copy for better UX
    e.dataTransfer.dropEffect = "copy"
    
    // Only set drag over state if not already set (reduces re-renders)
    if (!isDragOver) {
      console.log("Drag over canvas - enabling drop zone")
      setIsDragOver(true)
    }
  }

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    // Additional drag enter handling for smoother experience
    e.dataTransfer.dropEffect = "copy"
    
    console.log("Drag enter canvas")
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    // More reliable drag leave detection
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX
    const y = e.clientY
    
    // Check if mouse is still within canvas bounds with some tolerance
    const tolerance = 5
    const isWithinBounds = x >= (rect.left - tolerance) && 
                          x <= (rect.right + tolerance) && 
                          y >= (rect.top - tolerance) && 
                          y <= (rect.bottom + tolerance)
    
    if (!isWithinBounds) {
      console.log("Drag leave canvas - disabling drop zone")
      setIsDragOver(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    // Immediately clear drag state for responsive feedback
    setIsDragOver(false)

    console.log("=== DROP EVENT TRIGGERED ===")
    console.log("DataTransfer types:", e.dataTransfer.types)
    console.log("Available data formats:", Array.from(e.dataTransfer.types))

    try {
      const rawData = e.dataTransfer.getData("application/json")
      console.log("Raw data from drag:", rawData)
      
      if (!rawData) {
        console.error("No JSON data found in drag event")
        // Try to get text data as fallback
        const textData = e.dataTransfer.getData("text/plain")
        console.log("Fallback text data:", textData)
        return
      }
      
      const componentData = JSON.parse(rawData)
      console.log("Parsed component data:", componentData)
      
      if (!componentData || !componentData.type) {
        console.error("Invalid component data - missing type")
        console.log("Component data keys:", Object.keys(componentData || {}))
        return
      }

      const rect = canvasRef.current?.getBoundingClientRect()
      if (!rect) {
        console.error("Canvas rect not found")
        return
      }

      // Calculate drop position relative to canvas
      const x = (e.clientX - rect.left - pan.x) / zoom
      const y = (e.clientY - rect.top - pan.y) / zoom

      console.log("Drop position calculation:", {
        clientX: e.clientX,
        clientY: e.clientY,
        rectLeft: rect.left,
        rectTop: rect.top,
        panX: pan.x,
        panY: pan.y,
        zoom,
        calculatedX: x,
        calculatedY: y
      })

      // Create new component
      const newComponent: Component = {
        id: `comp-${Date.now()}`,
        type: componentData.type,
        label: componentData.label || componentData.type,
        x: x - 70, // Center the component on cursor
        y: y - 50,
        width: 140,
        height: 100,
        category: getCategoryFromType(componentData.type),
        selected: false,
        icon: componentData.icon, // Include the icon from component library
        color: componentData.color, // Include the color from component library
      }

      console.log("=== CREATING NEW COMPONENT ===")
      console.log("New component:", newComponent)
      console.log("Component position:", { x: newComponent.x, y: newComponent.y })
      console.log("Component dimensions:", { width: newComponent.width, height: newComponent.height })
      console.log("Component icon:", componentData.icon)
      console.log("Component color:", componentData.color)

      // Save state before adding new component (with error handling)
      try {
        saveToHistory()
      } catch (error) {
        console.warn("Could not save to history:", error)
        // Continue anyway - drag and drop should still work
      }
      
      // Update components immediately for smooth UX
      const newComponents = [...components, newComponent]
      setComponents(newComponents)
      
      // Trigger canvas redraw immediately
      requestAnimationFrame(() => {
        drawCanvas()
      })

      // Notify parent of architecture change
      if (onArchitectureChange) {
        onArchitectureChange({
          components: newComponents,
          connections,
        })
      }
      
      console.log("=== DROP COMPLETED SUCCESSFULLY ===")
      console.log("Final component count:", components.length + 1)
      
    } catch (error) {
      console.error("=== ERROR HANDLING DROP ===", error)
      console.error("Error details:", {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace'
      })
    }
  }

  // Helper function to determine category from component type
  const getCategoryFromType = (type: string): string => {
    const categoryMap: { [key: string]: string } = {
      database: "database",
      cache: "database",
      search: "database",
      api: "application",
      microservice: "application",
      auth: "application",
      cloud: "infrastructure",
      cdn: "infrastructure",
      loadbalancer: "infrastructure",
      payment: "service",
      email: "service",
      mobile: "application",
    }
    return categoryMap[type] || "default"
  }

  // Helper function to get icon symbol for canvas rendering
  const getIconSymbol = (type: string): string => {
    const iconMap: { [key: string]: string } = {
      database: "🗄️",
      cache: "⚡",
      search: "🔍",
      api: "🔌",
      microservice: "🌐",
      auth: "🔐",
      cloud: "☁️",
      cdn: "🌍",
      loadbalancer: "⚖️",
      payment: "💳",
      email: "📧",
      mobile: "📱",
    }
    return iconMap[type] || "📦"
  }

  // Helper function to convert Tailwind color classes to hex colors
  const getColorFromTailwind = (tailwindColor: string): string => {
    const colorMap: { [key: string]: string } = {
      "bg-blue-500": "#3b82f6",
      "bg-orange-500": "#f97316",
      "bg-green-500": "#22c55e",
      "bg-purple-500": "#a855f7",
      "bg-indigo-500": "#6366f1",
      "bg-red-500": "#ef4444",
      "bg-cyan-500": "#06b6d4",
      "bg-teal-500": "#14b8a6",
      "bg-yellow-500": "#eab308",
      "bg-emerald-500": "#10b981",
      "bg-pink-500": "#ec4899",
      "bg-violet-500": "#8b5cf6",
    }
    return colorMap[tailwindColor] || "#6b7280"
  }

  // Helper function to draw SVG-like icons on canvas
  const drawIconOnCanvas = (ctx: CanvasRenderingContext2D, type: string, x: number, y: number, size: number) => {
    ctx.save()
    ctx.translate(x + size / 2, y + size / 2)
    ctx.scale(size / 24, size / 24) // Scale to fit the icon size
    
    ctx.strokeStyle = "#ffffff"
    ctx.fillStyle = "#ffffff"
    ctx.lineWidth = 1.5
    ctx.lineCap = "round"
    ctx.lineJoin = "round"
    
    switch (type) {
      case 'database':
        // Draw database cylinder
        ctx.beginPath()
        ctx.ellipse(0, -6, 8, 3, 0, 0, Math.PI * 2)
        ctx.stroke()
        ctx.beginPath()
        ctx.ellipse(0, 6, 8, 3, 0, 0, Math.PI * 2)
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(-8, -6)
        ctx.lineTo(-8, 6)
        ctx.moveTo(8, -6)
        ctx.lineTo(8, 6)
        ctx.stroke()
        break
        
      case 'cache':
        // Draw lightning bolt for cache
        ctx.beginPath()
        ctx.moveTo(-2, -8)
        ctx.lineTo(4, -2)
        ctx.lineTo(1, -2)
        ctx.lineTo(6, 8)
        ctx.lineTo(0, 2)
        ctx.lineTo(-3, 2)
        ctx.closePath()
        ctx.fill()
        break
        
      case 'search':
        // Draw search magnifying glass
        ctx.beginPath()
        ctx.arc(-2, -2, 4, 0, Math.PI * 2)
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(2, 2)
        ctx.lineTo(6, 6)
        ctx.stroke()
        break
        
      case 'api':
        // Draw API connector
        ctx.beginPath()
        ctx.moveTo(-8, 0)
        ctx.lineTo(8, 0)
        ctx.moveTo(-6, -2)
        ctx.lineTo(-6, 2)
        ctx.moveTo(6, -2)
        ctx.lineTo(6, 2)
        ctx.stroke()
        break
        
      case 'microservice':
        // Draw globe for microservice
        ctx.beginPath()
        ctx.arc(0, 0, 8, 0, Math.PI * 2)
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(-8, 0)
        ctx.lineTo(8, 0)
        ctx.moveTo(0, -8)
        ctx.lineTo(0, 8)
        ctx.stroke()
        break
        
      case 'auth':
        // Draw shield
        ctx.beginPath()
        ctx.moveTo(0, -8)
        ctx.lineTo(-6, -4)
        ctx.lineTo(-6, 4)
        ctx.lineTo(0, 8)
        ctx.lineTo(6, 4)
        ctx.lineTo(6, -4)
        ctx.closePath()
        ctx.stroke()
        break
        
      case 'cloud':
        // Draw cloud
        ctx.beginPath()
        ctx.arc(-4, 0, 4, 0, Math.PI * 2)
        ctx.arc(4, 0, 4, 0, Math.PI * 2)
        ctx.arc(0, -2, 6, 0, Math.PI * 2)
        ctx.fill()
        break
        
      case 'cdn':
        // Draw globe for CDN
        ctx.beginPath()
        ctx.arc(0, 0, 8, 0, Math.PI * 2)
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(-8, 0)
        ctx.lineTo(8, 0)
        ctx.moveTo(0, -8)
        ctx.lineTo(0, 8)
        ctx.stroke()
        break
        
      case 'loadbalancer':
        // Draw bar chart for load balancer
        ctx.fillRect(-6, 4, 3, 4)
        ctx.fillRect(-1, 2, 3, 6)
        ctx.fillRect(4, 0, 3, 8)
        break
        
      case 'payment':
        // Draw credit card
        ctx.fillRect(-8, -5, 16, 10)
        ctx.strokeRect(-8, -5, 16, 10)
        ctx.fillStyle = "#ffffff"
        ctx.fillRect(-6, -3, 12, 2)
        ctx.fillStyle = "#ffffff"
        ctx.fillRect(-6, 1, 8, 1)
        break
        
      case 'email':
        // Draw mail icon
        ctx.beginPath()
        ctx.moveTo(-8, -4)
        ctx.lineTo(0, 2)
        ctx.lineTo(8, -4)
        ctx.lineTo(8, 6)
        ctx.lineTo(-8, 6)
        ctx.closePath()
        ctx.stroke()
        break
        
      case 'mobile':
        // Draw smartphone
        ctx.fillRect(-4, -8, 8, 16)
        ctx.strokeRect(-4, -8, 8, 16)
        ctx.fillStyle = "#ffffff"
        ctx.fillRect(-3, -6, 6, 4)
        ctx.fillStyle = "#ffffff"
        ctx.beginPath()
        ctx.arc(0, 6, 1, 0, Math.PI * 2)
        ctx.fill()
        break
        
      default:
        // Draw a simple box for unknown types
        ctx.strokeRect(-6, -6, 12, 12)
        break
    }
    
    ctx.restore()
  }

  return (
    <div className="relative h-full bg-gradient-to-br from-background to-muted/30 rounded-lg overflow-hidden neomorphism-inset">
      {/* Canvas Controls */}
      <div className="absolute top-4 left-4 z-10 flex gap-2 bg-background/80 backdrop-blur-sm rounded-lg p-1.5 shadow-md">
        <div className="flex bg-card rounded-lg p-1 neomorphism">
          <Button
            variant={tool === "select" ? "default" : "ghost"}
            size="sm"
            onClick={() => setTool("select")}
            className="h-8 w-8 p-0 transition-all duration-200 hover:scale-105"
            title="Select Tool"
          >
            <MousePointer className="h-4 w-4" />
          </Button>
          <Button
            variant={tool === "pan" ? "default" : "ghost"}
            size="sm"
            onClick={() => setTool("pan")}
            className="h-8 w-8 p-0 transition-all duration-200 hover:scale-105"
            title="Pan Tool"
          >
            <Hand className="h-4 w-4" />
          </Button>
          <Button
            variant={tool === "connect" ? "default" : "ghost"}
            size="sm"
            onClick={() => setTool("connect")}
            className="h-8 w-8 p-0 transition-all duration-200 hover:scale-105"
            title="Connect Tool"
          >
            <Link className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex bg-card rounded-lg p-1 neomorphism">
          <Button variant="ghost" size="sm" onClick={handleZoomOut} className="h-8 w-8 p-0 transition-all duration-200 hover:scale-105" title="Zoom Out">
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={handleZoomIn} className="h-8 w-8 p-0 transition-all duration-200 hover:scale-105" title="Zoom In">
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={handleReset} className="h-8 w-8 p-0 transition-all duration-200 hover:scale-105" title="Reset View">
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>

        {/* Undo/Redo Controls */}
        <div className="flex bg-card rounded-lg p-1 neomorphism">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={undo} 
            disabled={!canUndo}
            className="h-8 w-8 p-0 transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed" 
            title="Undo (Ctrl+Z)"
          >
            <Undo className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={redo} 
            disabled={!canRedo}
            className="h-8 w-8 p-0 transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed" 
            title="Redo (Ctrl+Y)"
          >
            <Redo className="h-4 w-4" />
          </Button>
        </div>

        {/* View Options */}
        <div className="flex bg-card rounded-lg p-1 neomorphism">
          <Button
            variant={showLabels ? "default" : "ghost"}
            size="sm"
            onClick={() => setShowLabels(!showLabels)}
            className="h-8 w-8 p-0 transition-all duration-200 hover:scale-105"
            title="Toggle Labels"
          >
            {showLabels ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          </Button>
          <Button
            variant={showConnections ? "default" : "ghost"}
            size="sm"
            onClick={() => setShowConnections(!showConnections)}
            className="h-8 w-8 p-0 transition-all duration-200 hover:scale-105"
            title="Toggle Connections"
          >
            <Link className="h-4 w-4" />
          </Button>
          <Button
            variant={showKeyboardShortcuts ? "default" : "ghost"}
            size="sm"
            onClick={() => setShowKeyboardShortcuts(!showKeyboardShortcuts)}
            className="h-8 w-8 p-0 transition-all duration-200 hover:scale-105"
            title="Show Keyboard Shortcuts (?)"
          >
            <HelpCircle className="h-4 w-4" />
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

      {/* History indicator */}
      {history.length > 1 && (
        <div className="absolute bottom-4 left-24 z-10 bg-card px-3 py-1 rounded-lg text-sm neomorphism">
          History: {historyIndex + 1}/{history.length}
        </div>
      )}

      {/* Canvas Container */}
      <div
        className={`w-full h-full transition-all duration-200 ${
          isDragOver ? "ring-2 ring-primary ring-opacity-50 bg-primary/5" : ""
        }`}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <canvas
          ref={canvasRef}
          draggable={false}
          className="w-full h-full"
          style={{
            cursor: 
              tool === "pan" ? (isDragging ? "grabbing" : "grab") :
              tool === "connect" ? "crosshair" :
              isDraggingComponent ? "grabbing" :
              hoveredComponent ? "grab" :
              "default",
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onContextMenu={handleContextMenu}
          onMouseLeave={() => {
            setIsDragging(false)
            setIsDraggingComponent(false)
            setIsConnecting(false)
            setHoveredComponent(null)
          }}
        />
      </div>

      {/* Drag Over Indicator */}
      {isDragOver && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
          <div className="bg-primary/10 border-2 border-dashed border-primary rounded-lg p-8 text-center">
            <div className="w-16 h-16 bg-primary/20 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Move className="h-8 w-8 text-primary" />
            </div>
            <p className="text-lg font-medium text-primary">Drop component here</p>
            <p className="text-sm text-muted-foreground">Release to add to canvas</p>
          </div>
        </div>
      )}

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
      {components.length === 0 && !isGenerating && !isDragOver && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center mx-auto mb-4 neomorphism">
              <Move className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-lg font-medium mb-2">Ready to Generate</p>
            <p className="text-sm text-muted-foreground max-w-sm">
              Enter your business requirements and click "Generate Architecture" to create your system design, or drag components from the library
            </p>
          </div>
        </div>
      )}

      {/* Component Properties Panel */}
      {selectedComponent && (
        <Card className="absolute top-16 right-4 w-64 p-4 neomorphism z-20 shadow-lg">
          <h3 className="font-medium mb-3 flex items-center gap-2 text-sm">
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
                className="h-8 text-sm focus:border-primary/50"
                placeholder="Component label"
                data-component-input="label"
                onFocus={() => console.log('Component label input focused')}
                onBlur={() => console.log('Component label input blurred')}
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
                className="h-8 text-sm focus:border-primary/50"
                placeholder="Component type"
                data-component-input="type"
                onFocus={() => console.log('Component type input focused')}
                onBlur={() => console.log('Component type input blurred')}
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
                className="h-16 text-sm resize-none focus:border-primary/50"
                placeholder="Component description"
                data-component-input="description"
                onFocus={() => console.log('Component description input focused')}
                onBlur={() => console.log('Component description input blurred')}
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
                  className="h-8 text-sm focus:border-primary/50"
                  min={40}
                  step={5}
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
                  className="h-8 text-sm focus:border-primary/50"
                  min={40}
                  step={5}
                />
              </div>
            </div>
            
            {/* Category selector */}
            <div>
              <label className="text-xs text-muted-foreground">Category</label>
              <select
                value={selectedComponent.category || "default"}
                onChange={(e) => {
                  setComponents((prev) =>
                    prev.map((c) => (c.id === selectedComponent.id ? { ...c, category: e.target.value } : c)),
                  )
                  setSelectedComponent({ ...selectedComponent, category: e.target.value })
                }}
                className="w-full h-8 text-sm border border-input bg-background rounded-md px-3 focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
              >
                <option value="default">Default</option>
                <option value="infrastructure">Infrastructure</option>
                <option value="application">Application</option>
                <option value="database">Database</option>
                <option value="service">Service</option>
              </select>
            </div>
            
            {selectedComponent.technologies && (
              <div>
                <label className="text-xs text-muted-foreground">Technologies</label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {selectedComponent.technologies.map((tech, index) => (
                    <Badge key={index} variant="outline" className="text-xs px-2 py-0.5">
                      {tech}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* Add a color preview */}
          <div className="mt-3 pt-3 border-t border-border">
            <h4 className="text-xs font-medium text-muted-foreground mb-2">Color Scheme</h4>
            <div className="grid grid-cols-2 gap-x-2 gap-y-1">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: getCategoryColor(selectedComponent, 'base') }}></div>
                <span className="text-xs text-muted-foreground">Base</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: getCategoryColor(selectedComponent, 'hover') }}></div>
                <span className="text-xs text-muted-foreground">Hover</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: getCategoryColor(selectedComponent, 'selected') }}></div>
                <span className="text-xs text-muted-foreground">Selected</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: getCategoryColor(selectedComponent, 'border') }}></div>
                <span className="text-xs text-muted-foreground">Border</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: getCategoryColor(selectedComponent, 'highlight') }}></div>
                <span className="text-xs text-muted-foreground">Highlight</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: getCategoryColor(selectedComponent, 'icon') }}></div>
                <span className="text-xs text-muted-foreground">Icon</span>
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-border">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: "#ffffff" }}></div>
                <span className="text-xs text-muted-foreground">Text</span>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Connection Properties Panel */}
      {selectedConnection && (
        <Card className="absolute top-16 right-4 w-64 p-4 neomorphism z-20 shadow-lg">
          <h3 className="font-medium mb-3 flex items-center gap-2 text-sm">
            <Link className="h-4 w-4" />
            Connection Properties
          </h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground">Label</label>
              <Input
                value={selectedConnection.label || ""}
                onChange={(e) => {
                  setConnections((prev) =>
                    prev.map((c) => (c.id === selectedConnection.id ? { ...c, label: e.target.value } : c)),
                  )
                  setSelectedConnection({ ...selectedConnection, label: e.target.value })
                }}
                className="h-8 text-sm focus:border-primary/50"
                placeholder="Connection label"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Type</label>
              <select
                value={selectedConnection.type || "data"}
                onChange={(e) => {
                  setConnections((prev) =>
                    prev.map((c) => (c.id === selectedConnection.id ? { ...c, type: e.target.value } : c)),
                  )
                  setSelectedConnection({ ...selectedConnection, type: e.target.value })
                }}
                className="w-full h-8 text-sm border border-input bg-background rounded-md px-3 focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
              >
                <option value="data">Data Flow</option>
                <option value="async">Async</option>
                <option value="sync">Sync</option>
                <option value="event">Event</option>
                <option value="dependency">Dependency</option>
                <option value="api">API</option>
                <option value="message">Message</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Protocol</label>
              <Input
                value={selectedConnection.protocol || ""}
                onChange={(e) => {
                  setConnections((prev) =>
                    prev.map((c) => (c.id === selectedConnection.id ? { ...c, protocol: e.target.value } : c)),
                  )
                  setSelectedConnection({ ...selectedConnection, protocol: e.target.value })
                }}
                className="h-8 text-sm focus:border-primary/50"
                placeholder="e.g., HTTP, TCP, WebSocket"
              />
            </div>
            
            {/* Connection Actions */}
            <div className="pt-3 border-t border-border">
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={deleteConnection}
                  className="flex-1 h-8 text-xs"
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Delete
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    setEditingConnectionLabel(selectedConnection.id)
                    setTempConnectionLabel(selectedConnection.label || "")
                  }}
                  className="flex-1 h-8 text-xs"
                >
                  <Edit3 className="h-3 w-3 mr-1" />
                  Edit Label
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Inline Connection Label Editor */}
      {editingConnectionLabel && (() => {
        const connection = connections.find(c => c.id === editingConnectionLabel)
        if (!connection) return null
        
        const { from, to } = connection
        
        // Calculate label position using the same logic as drawConnection
        const dx = to.x - from.x
        const dy = to.y - from.y
        const distance = Math.sqrt(dx * dx + dy * dy)
        const controlDistance = Math.min(distance * 0.3, 100)
        const angle = Math.atan2(dy, dx)
        const control1X = from.x + controlDistance * Math.cos(angle)
        const control1Y = from.y + controlDistance * Math.sin(angle)
        const control2X = to.x - controlDistance * Math.cos(angle)
        const control2Y = to.y - controlDistance * Math.sin(angle)
        
        let labelX = (from.x + control1X + control2X + to.x) / 4
        let labelY = (from.y + control1Y + control2Y + to.y) / 4
        
        // Adjust label position to avoid component overlap
        const labelOffset = 30
        const nearbyComponents = components.filter(comp => {
          const distX = Math.abs(labelX - (comp.x + comp.width/2))
          const distY = Math.abs(labelY - (comp.y + comp.height/2))
          return distX < comp.width/2 + labelOffset && distY < comp.height/2 + labelOffset
        })
        
        if (nearbyComponents.length > 0) {
          const offsetDirection = Math.atan2(to.y - from.y, to.x - from.x) + Math.PI/2
          labelX += Math.cos(offsetDirection) * labelOffset
          labelY += Math.sin(offsetDirection) * labelOffset
        }
        
        // Convert to screen coordinates
        const screenX = labelX * zoom + pan.x
        const screenY = labelY * zoom + pan.y
        
        return (
          <div 
            className="absolute z-30 pointer-events-auto"
            style={{
              left: screenX,
              top: screenY,
              transform: 'translate(-50%, -50%)'
            }}
          >
            <div className="bg-white p-2 rounded-lg shadow-xl border-2 border-primary">
              <div className="text-xs text-gray-500 mb-1 text-center">Edit Arrow Label</div>
              <Input
                value={tempConnectionLabel}
                onChange={(e) => setTempConnectionLabel(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    // Save the label
                    setConnections(prev => 
                      prev.map(conn => 
                        conn.id === editingConnectionLabel 
                          ? { ...conn, label: tempConnectionLabel }
                          : conn
                      )
                    )
                    if (selectedConnection) {
                      setSelectedConnection({ ...selectedConnection, label: tempConnectionLabel })
                    }
                    setEditingConnectionLabel(null)
                    setTempConnectionLabel("")
                    saveToHistory() // Save after editing
                    console.log("Label saved:", tempConnectionLabel)
                  } else if (e.key === 'Escape') {
                    e.preventDefault()
                    // Cancel editing
                    setEditingConnectionLabel(null)
                    setTempConnectionLabel("")
                    console.log("Label editing cancelled")
                  }
                }}
                onBlur={() => {
                  // Save on blur
                  setConnections(prev => 
                    prev.map(conn => 
                      conn.id === editingConnectionLabel 
                        ? { ...conn, label: tempConnectionLabel }
                        : conn
                    )
                  )
                  if (selectedConnection) {
                    setSelectedConnection({ ...selectedConnection, label: tempConnectionLabel })
                  }
                  setEditingConnectionLabel(null)
                  setTempConnectionLabel("")
                  saveToHistory() // Save after editing
                  console.log("Label saved on blur:", tempConnectionLabel)
                }}
                autoFocus
                className="h-8 text-sm bg-white border-2 border-primary shadow-lg min-w-[150px]"
                placeholder="Enter arrow label..."
              />
              <div className="text-xs text-gray-400 mt-1 text-center">
                Press Enter to save, Esc to cancel
              </div>
            </div>
          </div>
        )
      })()}

      {/* Context Menu */}
      {contextMenu.type && (
        <div 
          className="absolute z-30 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[120px]"
          style={{
            left: contextMenu.x,
            top: contextMenu.y
          }}
          onMouseLeave={() => setContextMenu({ x: 0, y: 0, type: null, target: null })}
        >
          {contextMenu.type === 'connection' && (
            <>
              <button
                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                onClick={() => {
                  const connection = contextMenu.target as Connection
                  setEditingConnectionLabel(connection.id)
                  setTempConnectionLabel(connection.label || "")
                  setContextMenu({ x: 0, y: 0, type: null, target: null })
                }}
              >
                <Edit3 className="h-4 w-4" />
                Rename Arrow
              </button>
              <button
                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2 text-red-600"
                onClick={() => {
                  const connection = contextMenu.target as Connection
                  setSelectedConnection(connection)
                  deleteConnection()
                  setContextMenu({ x: 0, y: 0, type: null, target: null })
                }}
              >
                <Trash2 className="h-4 w-4" />
                Delete Arrow
              </button>
            </>
          )}
          {contextMenu.type === 'component' && (
            <>
              <button
                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                onClick={() => {
                  const component = contextMenu.target as Component
                  setSelectedComponent(component)
                  duplicateComponent()
                  setContextMenu({ x: 0, y: 0, type: null, target: null })
                }}
              >
                <Copy className="h-4 w-4" />
                Duplicate
              </button>
              <button
                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2 text-red-600"
                onClick={() => {
                  const component = contextMenu.target as Component
                  setSelectedComponent(component)
                  deleteComponent()
                  setContextMenu({ x: 0, y: 0, type: null, target: null })
                }}
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
            </>
          )}
        </div>
      )}
      {showKeyboardShortcuts && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-30">
          <Card className="w-96 p-6 neomorphism shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <HelpCircle className="h-5 w-5" />
                Keyboard Shortcuts
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowKeyboardShortcuts(false)}
                className="h-8 w-8 p-0"
              >
                ×
              </Button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="space-y-2">
                <h4 className="font-medium text-muted-foreground">Tools</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex justify-between">
                    <span>Select Tool</span>
                    <Badge variant="outline" className="px-2 py-1">V</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Pan Tool</span>
                    <Badge variant="outline" className="px-2 py-1">H</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Connect Tool</span>
                    <Badge variant="outline" className="px-2 py-1">C</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Deselect All</span>
                    <Badge variant="outline" className="px-2 py-1">Esc</Badge>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium text-muted-foreground">History</h4>
                <div className="grid grid-cols-1 gap-2">
                  <div className="flex justify-between">
                    <span>Undo</span>
                    <Badge variant="outline" className="px-2 py-1">Ctrl + Z</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Redo</span>
                    <Badge variant="outline" className="px-2 py-1">Ctrl + Y</Badge>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium text-muted-foreground">Component Actions</h4>
                <div className="grid grid-cols-1 gap-2">
                  <div className="flex justify-between">
                    <span>Delete Component</span>
                    <Badge variant="outline" className="px-2 py-1">Del / Backspace</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Duplicate Component</span>
                    <Badge variant="outline" className="px-2 py-1">Ctrl + D</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Select All</span>
                    <Badge variant="outline" className="px-2 py-1">Ctrl + A</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Rename Arrow</span>
                    <Badge variant="outline" className="px-2 py-1">F2 / Enter</Badge>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium text-muted-foreground">Connection Actions</h4>
                <div className="grid grid-cols-1 gap-2">
                  <div className="flex justify-between">
                    <span>Edit Connection Label</span>
                    <Badge variant="outline" className="px-2 py-1">Click Label</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Save Label</span>
                    <Badge variant="outline" className="px-2 py-1">Enter</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Cancel Edit</span>
                    <Badge variant="outline" className="px-2 py-1">Esc</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Delete Connection</span>
                    <Badge variant="outline" className="px-2 py-1">Del / Backspace</Badge>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium text-muted-foreground">Movement</h4>
                <div className="grid grid-cols-1 gap-2">
                  <div className="flex justify-between">
                    <span>Move Component</span>
                    <Badge variant="outline" className="px-2 py-1">Arrow Keys</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Move (Large Steps)</span>
                    <Badge variant="outline" className="px-2 py-1">Shift + Arrows</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Drag & Drop</span>
                    <Badge variant="outline" className="px-2 py-1">Click & Drag</Badge>
                  </div>
                </div>
              </div>
              
              <div className="pt-3 border-t border-border">
                <p className="text-xs text-muted-foreground">
                  • Components snap to grid and other components for easy alignment<br/>
                  • Hold Shift while dragging for precise positioning<br/>
                  • Connections automatically update when moving components<br/>
                  • Double-click arrow labels to rename them inline<br/>
                  • Right-click for context menu with quick actions<br/>
                  • Actions are automatically saved to history for undo/redo
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
