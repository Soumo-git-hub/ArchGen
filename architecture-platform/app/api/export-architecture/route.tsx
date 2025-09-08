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

      default:
        // For PNG/PDF, we'd use a library like Puppeteer or Canvas
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

  let svg = `<svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>
      .component { fill: #374151; stroke: #6b7280; stroke-width: 2; }
      .component-text { fill: #f1f5f9; font-family: Arial, sans-serif; font-size: 12px; text-anchor: middle; }
      .connection { stroke: #8b5cf6; stroke-width: 2; fill: none; }
    </style>
  </defs>
`

  // Draw connections
  connections.forEach((conn: any) => {
    svg += `  <line x1="${conn.from.x}" y1="${conn.from.y}" x2="${conn.to.x}" y2="${conn.to.y}" class="connection" />
`
  })

  // Draw components
  components.forEach((comp: any) => {
    svg += `  <rect x="${comp.x}" y="${comp.y}" width="${comp.width}" height="${comp.height}" class="component" />
`
    if (options.includeLabels) {
      svg += `  <text x="${comp.x + comp.width / 2}" y="${comp.y + comp.height / 2}" class="component-text">${comp.label}</text>
`
    }
  })

  svg += `</svg>`
  return svg
}
