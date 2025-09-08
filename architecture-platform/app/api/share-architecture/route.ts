import { type NextRequest, NextResponse } from "next/server"

// Mock database for shared architectures
const sharedArchitectures = new Map()

export async function POST(request: NextRequest) {
  try {
    const { architecture, permissions } = await request.json()

    // Generate a unique share ID
    const shareId = `arch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Store the architecture with metadata
    const shareData = {
      id: shareId,
      architecture,
      permissions,
      createdAt: new Date().toISOString(),
      views: 0,
      lastAccessed: null,
    }

    sharedArchitectures.set(shareId, shareData)

    const shareUrl = `${request.nextUrl.origin}/shared/${shareId}`

    return NextResponse.json({
      id: shareId,
      shareUrl,
      permissions,
      createdAt: shareData.createdAt,
    })
  } catch (error) {
    console.error("Share error:", error)
    return NextResponse.json({ error: "Failed to create share link" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const shareId = url.searchParams.get("id")

    if (!shareId) {
      return NextResponse.json({ error: "Share ID required" }, { status: 400 })
    }

    const shareData = sharedArchitectures.get(shareId)

    if (!shareData) {
      return NextResponse.json({ error: "Architecture not found" }, { status: 404 })
    }

    // Update access tracking
    shareData.views += 1
    shareData.lastAccessed = new Date().toISOString()

    return NextResponse.json(shareData)
  } catch (error) {
    console.error("Share retrieval error:", error)
    return NextResponse.json({ error: "Failed to retrieve shared architecture" }, { status: 500 })
  }
}
