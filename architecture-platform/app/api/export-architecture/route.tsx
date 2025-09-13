import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { architecture, format, options } = await request.json()

    // Mock export functionality - in production, this would generate actual files
    const exportData = {
      architecture,
      format,
      options,
      timestamp: new Date().toISOString(),
    }

    let content: string
    let contentType: string
    let filename: string

    switch (format) {
      case "json":
        content = JSON.stringify(exportData, null, 2)
        contentType = "application/json"
        filename = "architecture.json"
        break

      case "terraform":
        content = generateTerraformConfig(architecture)
        contentType = "text/plain"
        filename = "main.tf"
        break

      case "docker":
        content = generateDockerCompose(architecture)
        contentType = "text/yaml"
        filename = "docker-compose.yml"
        break

      case "svg":
        content = generateSVG(architecture, options)
        contentType = "image/svg+xml"
        filename = "architecture.svg"
        break

      case "png":
      case "pdf":
        // For image formats, generate SVG and let client handle conversion
        const svgForImage = generateSVG(architecture, options)
        content = svgForImage
        contentType = format === "png" ? "image/svg+xml" : "image/svg+xml"
        filename = `architecture.${format}`
        break

      default:
        content = JSON.stringify(exportData, null, 2)
        contentType = "application/json"
        filename = `architecture.${format}`
    }

    const response = new NextResponse(content, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    })

    return response
  } catch (error) {
    console.error("Export error:", error)
    return NextResponse.json({ error: "Export failed" }, { status: 500 })
  }
}

function generateTerraformConfig(architecture: any): string {
  const components = architecture?.components || []

  let terraform = `# Generated Terraform configuration
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-west-2"
}

`

  components.forEach((component: any) => {
    switch (component.type) {
      case "database":
        terraform += `
resource "aws_db_instance" "${component.id}" {
  identifier = "${component.label.toLowerCase().replace(/\s+/g, "-")}"
  engine     = "postgres"
  instance_class = "db.t3.micro"
  allocated_storage = 20
  
  db_name  = "${component.label.toLowerCase().replace(/\s+/g, "_")}"
  username = "admin"
  password = "changeme"
  
  skip_final_snapshot = true
}
`
        break

      case "api":
        terraform += `
resource "aws_lambda_function" "${component.id}" {
  filename         = "api.zip"
  function_name    = "${component.label.toLowerCase().replace(/\s+/g, "-")}"
  role            = aws_iam_role.lambda_role.arn
  handler         = "index.handler"
  runtime         = "nodejs18.x"
}
`
        break

      case "cloud":
        terraform += `
resource "aws_s3_bucket" "${component.id}" {
  bucket = "${component.label.toLowerCase().replace(/\s+/g, "-")}"
}
`
        break
    }
  })

  return terraform
}

function generateDockerCompose(architecture: any): string {
  const components = architecture?.components || []

  let compose = `version: '3.8'
services:
`

  components.forEach((component: any) => {
    const serviceName = component.label.toLowerCase().replace(/\s+/g, "-")

    switch (component.type) {
      case "database":
        compose += `
  ${serviceName}:
    image: postgres:15
    environment:
      POSTGRES_DB: ${component.label.toLowerCase().replace(/\s+/g, "_")}
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: changeme
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
`
        break

      case "api":
        compose += `
  ${serviceName}:
    build: .
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
    depends_on:
      - database
`
        break

      case "cache":
        compose += `
  ${serviceName}:
    image: redis:7-alpine
    ports:
      - "6379:6379"
`
        break

      case "web":
        compose += `
  ${serviceName}:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
`
        break
    }
  })

  compose += `
volumes:
  postgres_data:
`

  return compose
}

function generateSVG(architecture: any, options: any): string {
  const components = architecture?.components || []
  const connections = architecture?.connections || []

  // Apply background color based on options
  const bgColor = options.backgroundColor === 'dark' ? '#1f2937' : 
                 options.backgroundColor === 'light' ? '#ffffff' : 'transparent'
  
  let svg = `<svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>
      .component { 
        fill: ${options.backgroundColor === 'dark' ? '#374151' : '#f3f4f6'}; 
        stroke: ${options.backgroundColor === 'dark' ? '#6b7280' : '#9ca3af'}; 
        stroke-width: 2; 
      }
      .component-text { 
        fill: ${options.backgroundColor === 'dark' ? '#f1f5f9' : '#1f2937'}; 
        font-family: Arial, sans-serif; 
        font-size: 14px; 
        text-anchor: middle; 
        dominant-baseline: middle;
      }
      .connection { 
        stroke: #8b5cf6; 
        stroke-width: 2; 
        fill: none; 
        marker-end: url(#arrowhead);
      }
      .placeholder-text {
        fill: ${options.backgroundColor === 'dark' ? '#9ca3af' : '#6b7280'};
        font-family: Arial, sans-serif;
        font-size: 16px;
        text-anchor: middle;
        dominant-baseline: middle;
      }
    </style>
    <marker id="arrowhead" markerWidth="10" markerHeight="7" 
            refX="9" refY="3.5" orient="auto">
      <polygon points="0 0, 10 3.5, 0 7" fill="#8b5cf6" />
    </marker>
  </defs>`

  // Add background rectangle if not transparent
  if (bgColor !== 'transparent') {
    svg += `
  <rect width="100%" height="100%" fill="${bgColor}" />`
  }

  // If no components, show placeholder
  if (components.length === 0) {
    svg += `
  <text x="400" y="280" class="placeholder-text">No Architecture Components</text>
  <text x="400" y="310" class="placeholder-text">Generate or add components to see the diagram</text>`
  } else {
    // Draw connections if enabled
    if (options.includeConnections) {
      connections.forEach((conn: any) => {
        const fromX = conn.from?.x || 100
        const fromY = conn.from?.y || 100
        const toX = conn.to?.x || 200
        const toY = conn.to?.y || 200
        
        svg += `
  <line x1="${fromX}" y1="${fromY}" x2="${toX}" y2="${toY}" class="connection" />`
      })
    }

    // Draw components
    components.forEach((comp: any, index: number) => {
      const x = comp.x || (100 + (index * 150))
      const y = comp.y || (100 + (index % 3) * 120)
      const width = comp.width || 120
      const height = comp.height || 80
      const label = comp.label || `Component ${index + 1}`
      
      // Draw component rectangle
      svg += `
  <rect x="${x}" y="${y}" width="${width}" height="${height}" class="component" rx="8" />`
      
      // Add component label if enabled
      if (options.includeLabels && label) {
        svg += `
  <text x="${x + width / 2}" y="${y + height / 2 - 8}" class="component-text">${label}</text>`
      }
      
      // Add component type indicator
      if (comp.type) {
        svg += `
  <text x="${x + width / 2}" y="${y + height / 2 + 12}" class="component-text" style="font-size: 10px; opacity: 0.7;">${comp.type}</text>`
      }
    })
  }

  svg += `
</svg>`
  return svg
}
