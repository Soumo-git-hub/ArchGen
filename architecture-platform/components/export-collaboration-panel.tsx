"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Download,
  Share2,
  Users,
  MessageSquare,
  FileImage,
  FileText,
  Code,
  Link,
  Copy,
  Mail,
  Eye,
  Edit3,
  Send,
  Plus,
  X,
  CheckCircle,
  AlertCircle,
} from "lucide-react"

interface Comment {
  id: string
  author: string
  avatar?: string
  content: string
  timestamp: Date
  x?: number
  y?: number
  resolved?: boolean
}

interface Collaborator {
  id: string
  name: string
  email: string
  avatar?: string
  role: "owner" | "editor" | "viewer"
  status: "online" | "offline"
  lastSeen?: Date
}

interface ExportCollaborationPanelProps {
  architecture: any
  onExport?: (format: string, options: any) => void
  onShare?: (shareData: any) => void
}

export function ExportCollaborationPanel({ architecture, onExport, onShare }: ExportCollaborationPanelProps) {
  const [activeTab, setActiveTab] = useState<"export" | "share" | "collaborate">("export")
  const [exportFormat, setExportFormat] = useState("png")
  const [exportOptions, setExportOptions] = useState({
    includeLabels: true,
    includeConnections: true,
    backgroundColor: "dark",
    resolution: "high",
  })
  const [shareLink, setShareLink] = useState("")
  const [sharePermissions, setSharePermissions] = useState("view")
  const [comments, setComments] = useState<Comment[]>([
    {
      id: "1",
      author: "John Doe",
      avatar: "/placeholder.svg?height=32&width=32",
      content: "Should we consider adding a load balancer here?",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      x: 300,
      y: 200,
      resolved: false,
    },
    {
      id: "2",
      author: "Jane Smith",
      avatar: "/placeholder.svg?height=32&width=32",
      content: "The database connection looks good. Consider adding Redis for caching.",
      timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
      x: 500,
      y: 400,
      resolved: true,
    },
  ])
  const [newComment, setNewComment] = useState("")
  const [collaborators, setCollaborators] = useState<Collaborator[]>([
    {
      id: "1",
      name: "John Doe",
      email: "john@example.com",
      avatar: "/placeholder.svg?height=32&width=32",
      role: "editor",
      status: "online",
    },
    {
      id: "2",
      name: "Jane Smith",
      email: "jane@example.com",
      avatar: "/placeholder.svg?height=32&width=32",
      role: "viewer",
      status: "online",
    },
    {
      id: "3",
      name: "Mike Johnson",
      email: "mike@example.com",
      role: "editor",
      status: "offline",
      lastSeen: new Date(Date.now() - 30 * 60 * 1000),
    },
  ])
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState("viewer")

  const handleExport = async () => {
    if (!architecture) return

    try {
      const response = await fetch("/api/export-architecture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          architecture,
          format: exportFormat,
          options: exportOptions,
        }),
      })

      if (response.ok) {
        const blob = await response.blob()
        
        // For PNG and PDF, we need to convert SVG on the client side
        if (exportFormat === "png") {
          const svgText = await blob.text()
          await convertSVGToPNG(svgText)
        } else if (exportFormat === "pdf") {
          const svgText = await blob.text()
          await convertSVGToPDF(svgText)
        } else {
          // Direct download for SVG, JSON, Terraform, Docker
          const url = window.URL.createObjectURL(blob)
          const a = document.createElement("a")
          a.href = url
          a.download = `architecture.${exportFormat}`
          document.body.appendChild(a)
          a.click()
          window.URL.revokeObjectURL(url)
          document.body.removeChild(a)
        }
      }

      if (onExport) {
        onExport(exportFormat, exportOptions)
      }
    } catch (error) {
      console.error("Export failed:", error)
      alert(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const convertSVGToPNG = async (svgContent: string) => {
    return new Promise<void>((resolve, reject) => {
      try {
        // Create a canvas element
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Could not get canvas context'))
          return
        }
        
        // Set canvas size based on resolution
        const multiplier = exportOptions.resolution === 'high' ? 3 : exportOptions.resolution === 'medium' ? 2 : 1
        canvas.width = 800 * multiplier
        canvas.height = 600 * multiplier
        
        // Create an image from SVG
        const img = new Image()
        
        img.onload = () => {
          try {
            // Set background color
            if (exportOptions.backgroundColor !== 'transparent') {
              ctx.fillStyle = exportOptions.backgroundColor === 'dark' ? '#1f2937' : '#ffffff'
              ctx.fillRect(0, 0, canvas.width, canvas.height)
            }
            
            // Draw the SVG image
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
            
            // Convert to PNG and download
            canvas.toBlob((blob) => {
              if (blob) {
                const url = window.URL.createObjectURL(blob)
                const a = document.createElement("a")
                a.href = url
                a.download = "architecture.png"
                document.body.appendChild(a)
                a.click()
                window.URL.revokeObjectURL(url)
                document.body.removeChild(a)
                resolve()
              } else {
                reject(new Error('Failed to create PNG blob'))
              }
            }, 'image/png')
            
            URL.revokeObjectURL(img.src)
          } catch (err) {
            reject(err)
          }
        }
        
        img.onerror = () => {
          reject(new Error('Failed to load SVG image'))
        }
        
        // Convert SVG to data URL
        const svgBlob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' })
        img.src = URL.createObjectURL(svgBlob)
      } catch (error) {
        reject(error)
      }
    })
  }

  const convertSVGToPDF = async (svgContent: string) => {
    return new Promise<void>((resolve, reject) => {
      try {
        // Create a high-resolution canvas for PDF
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Could not get canvas context'))
          return
        }
        
        // Set high resolution for PDF (300 DPI equivalent)
        const scale = 3 // High resolution multiplier
        canvas.width = 800 * scale
        canvas.height = 600 * scale
        
        // Create an image from SVG
        const img = new Image()
        
        img.onload = () => {
          try {
            // Set white background for PDF
            ctx.fillStyle = '#ffffff'
            ctx.fillRect(0, 0, canvas.width, canvas.height)
            
            // Draw the SVG image at high resolution
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
            
            // Convert canvas to image data
            const imgData = canvas.toDataURL('image/png')
            
            // Generate PDF content using basic PDF structure
            const pdfContent = generatePDFWithImage(imgData, canvas.width, canvas.height)
            
            // Create and download PDF
            const pdfBlob = new Blob([pdfContent], { type: 'application/pdf' })
            const url = window.URL.createObjectURL(pdfBlob)
            const a = document.createElement("a")
            a.href = url
            a.download = "architecture.pdf"
            document.body.appendChild(a)
            a.click()
            window.URL.revokeObjectURL(url)
            document.body.removeChild(a)
            
            URL.revokeObjectURL(img.src)
            resolve()
          } catch (err) {
            reject(err)
          }
        }
        
        img.onerror = () => {
          reject(new Error('Failed to load SVG image for PDF'))
        }
        
        // Convert SVG to data URL
        const svgBlob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' })
        img.src = URL.createObjectURL(svgBlob)
      } catch (error) {
        reject(error)
      }
    })
  }

  const generatePDFWithImage = (imageDataURL: string, width: number, height: number): string => {
    // Create a basic PDF structure with embedded image
    const pdfHeader = '%PDF-1.4\n'
    
    // Remove data URL prefix to get base64 data
    const base64Data = imageDataURL.replace(/^data:image\/png;base64,/, '')
    
    // Calculate object positions
    let currentPos = pdfHeader.length
    
    // Catalog object
    const catalogObj = `1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj
`
    const catalogPos = currentPos
    currentPos += catalogObj.length
    
    // Pages object
    const pagesObj = `2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj
`
    const pagesPos = currentPos
    currentPos += pagesObj.length
    
    // Page object
    const pageObj = `3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 ${width / 3} ${height / 3}]
/Resources <<
/XObject <<
/Im1 4 0 R
>>
>>
/Contents 5 0 R
>>
endobj
`
    const pagePos = currentPos
    currentPos += pageObj.length
    
    // Image object
    const imageObj = `4 0 obj
<<
/Type /XObject
/Subtype /Image
/Width ${width}
/Height ${height}
/BitsPerComponent 8
/ColorSpace /DeviceRGB
/Filter /DCTDecode
/Length ${base64Data.length}
>>
stream
${base64Data}
endstream
endobj
`
    const imagePos = currentPos
    currentPos += imageObj.length
    
    // Content stream object
    const contentStream = `q
${width / 3} 0 0 ${height / 3} 0 0 cm
/Im1 Do
Q
`
    const contentObj = `5 0 obj
<<
/Length ${contentStream.length}
>>
stream
${contentStream}
endstream
endobj
`
    const contentPos = currentPos
    currentPos += contentObj.length
    
    // Cross-reference table
    const xrefPos = currentPos
    const xref = `xref
0 6
0000000000 65535 f 
${catalogPos.toString().padStart(10, '0')} 00000 n 
${pagesPos.toString().padStart(10, '0')} 00000 n 
${pagePos.toString().padStart(10, '0')} 00000 n 
${imagePos.toString().padStart(10, '0')} 00000 n 
${contentPos.toString().padStart(10, '0')} 00000 n 
`
    
    // Trailer
    const trailer = `trailer
<<
/Size 6
/Root 1 0 R
>>
startxref
${xrefPos}
%%EOF
`
    
    // Combine all parts and return as string
    return pdfHeader + catalogObj + pagesObj + pageObj + imageObj + contentObj + xref + trailer
  }

  const generateShareLink = async () => {
    try {
      const response = await fetch("/api/share-architecture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          architecture,
          permissions: sharePermissions,
        }),
      })

      const data = await response.json()
      setShareLink(data.shareUrl || `${window.location.origin}/shared/${data.id}`)

      if (onShare) {
        onShare({ shareUrl: shareLink, permissions: sharePermissions })
      }
    } catch (error) {
      console.error("Share link generation failed:", error)
      // Fallback to mock URL
      setShareLink(`${window.location.origin}/shared/mock-${Date.now()}`)
    }
  }

  const copyShareLink = () => {
    navigator.clipboard.writeText(shareLink)
  }

  const addComment = () => {
    if (!newComment.trim()) return

    const comment: Comment = {
      id: Date.now().toString(),
      author: "You",
      content: newComment,
      timestamp: new Date(),
      resolved: false,
    }

    setComments([...comments, comment])
    setNewComment("")
  }

  const resolveComment = (commentId: string) => {
    setComments(comments.map((c) => (c.id === commentId ? { ...c, resolved: !c.resolved } : c)))
  }

  const inviteCollaborator = () => {
    if (!inviteEmail.trim()) return

    const newCollaborator: Collaborator = {
      id: Date.now().toString(),
      name: inviteEmail.split("@")[0],
      email: inviteEmail,
      role: inviteRole as any,
      status: "offline",
    }

    setCollaborators([...collaborators, newCollaborator])
    setInviteEmail("")
  }

  const removeCollaborator = (collaboratorId: string) => {
    setCollaborators(collaborators.filter((c) => c.id !== collaboratorId))
  }

  const getStatusColor = (status: string) => {
    return status === "online" ? "bg-green-500" : "bg-gray-400"
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case "owner":
        return "bg-purple-500"
      case "editor":
        return "bg-blue-500"
      case "viewer":
        return "bg-gray-500"
      default:
        return "bg-gray-500"
    }
  }

  return (
    <Card className="p-4 neomorphism">
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Share2 className="h-5 w-5 text-primary" />
        Export & Collaboration
      </h2>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 neomorphism">
          <TabsTrigger value="export">Export</TabsTrigger>
          <TabsTrigger value="share">Share</TabsTrigger>
          <TabsTrigger value="collaborate">Collaborate</TabsTrigger>
        </TabsList>

        <TabsContent value="export" className="space-y-4">
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium mb-2 block">Export Format</label>
              <Select value={exportFormat} onValueChange={setExportFormat}>
                <SelectTrigger className="neomorphism-inset">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="png">
                    <div className="flex items-center gap-2">
                      <FileImage className="h-4 w-4" />
                      PNG Image
                    </div>
                  </SelectItem>
                  <SelectItem value="svg">
                    <div className="flex items-center gap-2">
                      <FileImage className="h-4 w-4" />
                      SVG Vector
                    </div>
                  </SelectItem>
                  <SelectItem value="pdf">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      PDF Document
                    </div>
                  </SelectItem>
                  <SelectItem value="json">
                    <div className="flex items-center gap-2">
                      <Code className="h-4 w-4" />
                      JSON Data
                    </div>
                  </SelectItem>
                  <SelectItem value="terraform">
                    <div className="flex items-center gap-2">
                      <Code className="h-4 w-4" />
                      Terraform Config
                    </div>
                  </SelectItem>
                  <SelectItem value="docker">
                    <div className="flex items-center gap-2">
                      <Code className="h-4 w-4" />
                      Docker Compose
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Export Options</label>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={exportOptions.includeLabels}
                    onChange={(e) => setExportOptions({ ...exportOptions, includeLabels: e.target.checked })}
                    className="rounded"
                  />
                  Include component labels
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={exportOptions.includeConnections}
                    onChange={(e) => setExportOptions({ ...exportOptions, includeConnections: e.target.checked })}
                    className="rounded"
                  />
                  Include connections
                </label>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">Background</label>
                <Select
                  value={exportOptions.backgroundColor}
                  onValueChange={(value) => setExportOptions({ ...exportOptions, backgroundColor: value })}
                >
                  <SelectTrigger className="neomorphism-inset">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="transparent">Transparent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Resolution</label>
                <Select
                  value={exportOptions.resolution}
                  onValueChange={(value) => setExportOptions({ ...exportOptions, resolution: value })}
                >
                  <SelectTrigger className="neomorphism-inset">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low (1x)</SelectItem>
                    <SelectItem value="medium">Medium (2x)</SelectItem>
                    <SelectItem value="high">High (3x)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button onClick={handleExport} disabled={!architecture} className="w-full neomorphism-hover" size="lg">
              <Download className="h-4 w-4 mr-2" />
              Export Architecture
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="share" className="space-y-4">
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium mb-2 block">Share Permissions</label>
              <Select value={sharePermissions} onValueChange={setSharePermissions}>
                <SelectTrigger className="neomorphism-inset">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="view">
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      View Only
                    </div>
                  </SelectItem>
                  <SelectItem value="comment">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      View & Comment
                    </div>
                  </SelectItem>
                  <SelectItem value="edit">
                    <div className="flex items-center gap-2">
                      <Edit3 className="h-4 w-4" />
                      View & Edit
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button onClick={generateShareLink} className="w-full neomorphism-hover bg-transparent" variant="outline">
              <Link className="h-4 w-4 mr-2" />
              Generate Share Link
            </Button>

            {shareLink && (
              <div className="p-3 bg-muted/50 rounded-lg neomorphism-inset">
                <div className="flex items-center gap-2 mb-2">
                  <Link className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Share Link</span>
                </div>
                <div className="flex items-center gap-2">
                  <Input value={shareLink} readOnly className="text-xs" />
                  <Button size="sm" variant="outline" onClick={copyShareLink}>
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">Share via Email</label>
              <div className="flex gap-2">
                <Input placeholder="Enter email addresses..." className="neomorphism-inset" />
                <Button variant="outline" size="sm" className="neomorphism-hover bg-transparent">
                  <Mail className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="collaborate" className="space-y-4">
          <div className="space-y-4">
            {/* Active Collaborators */}
            <div>
              <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Active Collaborators ({collaborators.filter((c) => c.status === "online").length})
              </h3>
              <div className="space-y-2">
                {collaborators.map((collaborator) => (
                  <div
                    key={collaborator.id}
                    className="flex items-center justify-between p-2 bg-muted/50 rounded-lg neomorphism-inset"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={collaborator.avatar || "/placeholder.svg"} />
                          <AvatarFallback>{collaborator.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div
                          className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-background ${getStatusColor(
                            collaborator.status,
                          )}`}
                        />
                      </div>
                      <div>
                        <div className="text-sm font-medium">{collaborator.name}</div>
                        <div className="text-xs text-muted-foreground">{collaborator.email}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={`text-xs ${getRoleColor(collaborator.role)} text-white border-none`}
                      >
                        {collaborator.role}
                      </Badge>
                      {collaborator.role !== "owner" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeCollaborator(collaborator.id)}
                          className="h-6 w-6 p-0"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Invite Collaborator */}
            <div>
              <h3 className="text-sm font-medium mb-3">Invite Collaborator</h3>
              <div className="space-y-2">
                <Input
                  placeholder="Enter email address..."
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="neomorphism-inset"
                />
                <div className="flex gap-2">
                  <Select value={inviteRole} onValueChange={setInviteRole}>
                    <SelectTrigger className="neomorphism-inset">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="viewer">Viewer</SelectItem>
                      <SelectItem value="editor">Editor</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={inviteCollaborator} className="neomorphism-hover">
                    <Plus className="h-4 w-4 mr-2" />
                    Invite
                  </Button>
                </div>
              </div>
            </div>

            {/* Comments */}
            <div>
              <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Comments ({comments.length})
              </h3>
              <div className="space-y-3 max-h-48 overflow-y-auto">
                {comments.map((comment) => (
                  <div key={comment.id} className="p-3 bg-muted/50 rounded-lg neomorphism-inset">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={comment.avatar || "/placeholder.svg"} />
                          <AvatarFallback>{comment.author.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium">{comment.author}</span>
                        <span className="text-xs text-muted-foreground">{comment.timestamp.toLocaleTimeString()}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => resolveComment(comment.id)}
                        className="h-6 w-6 p-0"
                      >
                        {comment.resolved ? (
                          <CheckCircle className="h-3 w-3 text-green-500" />
                        ) : (
                          <AlertCircle className="h-3 w-3 text-yellow-500" />
                        )}
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">{comment.content}</p>
                  </div>
                ))}
              </div>

              <div className="flex gap-2 mt-3">
                <Textarea
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="min-h-[60px] neomorphism-inset resize-none"
                />
                <Button onClick={addComment} className="neomorphism-hover">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  )
}
