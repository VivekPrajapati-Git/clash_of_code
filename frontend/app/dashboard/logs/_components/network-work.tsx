"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Graph } from "react-d3-graph"
import { useState, useEffect, useRef } from "react"

// --- Types ---
export interface Node {
  id: string
  label: string
  group: string
}

export interface Link {
  source: string
  target: string
  type: string
}

interface NetworkGraphProps {
  data: {
    nodes: Node[]
    links: Link[]
  }
}

// --- Node color map ---
const groupColors: Record<string, string> = {
  Patient: "#4f46e5",  // indigo
  Location: "#16a34a", // green
  Doctor: "#f59e0b",   // amber
  Equipment:"black",
  default: "#9ca3af",  // gray fallback
}

export function NetworkGraph({ data }: NetworkGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState({ width: 600, height: 400 })

  // Make the graph responsive to the card size
  useEffect(() => {
    function updateSize() {
      if (containerRef.current) {
        const { clientWidth, clientHeight } = containerRef.current
        setDimensions({ width: clientWidth, height: clientHeight })
      }
    }

    updateSize()
    window.addEventListener("resize", updateSize)
    return () => window.removeEventListener("resize", updateSize)
  }, [])

  // Color nodes by group
  const coloredNodes = data.nodes.map((node) => ({
    ...node,
    color: groupColors[node.group] || groupColors.default,
  }))

  const config = {
    nodeHighlightBehavior: true,
    node: {
      size: 400,
      highlightStrokeColor: "#000",
      labelProperty: "label",
    },
    link: {
      highlightColor: "#888",
      renderLabel: true,
      labelProperty: "type",
      strokeWidth: 2,
    },
    directed: true,
    d3: {
      gravity: -400,
      linkLength: 200,
      alphaTarget: 0.05,
    },
    height: dimensions.height,
    width: dimensions.width,
  }

  return (
    <Card className="w-full h-[80vh]">
      <CardHeader>
        <CardTitle>Network Graph</CardTitle>
        <CardDescription>Patient Visits / Locations</CardDescription>
      </CardHeader>
      <CardContent ref={containerRef} className="w-full h-full overflow-auto">
        <Graph
          id="network-graph"
          data={{ nodes: coloredNodes, links: data.links }}
          config={config as any}
        />
      </CardContent>
    </Card>
  )
}