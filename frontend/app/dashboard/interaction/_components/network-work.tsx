"use client"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Graph } from "react-d3-graph"
import { useState, useEffect, useRef } from "react"
import test from "node:test"

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
  Patient: "#c00707",
  Location: "#16a34a",
  Doctor: "#f59e0b",
  Equipment: "#8494ff",
  default: "#9ca3af",
}

export function NetworkGraph({ data }: NetworkGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState({ width: 600, height: 600 })

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
      size: 500,
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
      <CardFooter className="flex flex-wrap gap-4 pt-4">
        {Object.entries(groupColors).map(([group, color]) => (
          <div key={group} className="flex items-center gap-2 text-sm">
            <span
              className="inline-block h-4 w-4 rounded-full"
              style={{ backgroundColor: color }}
            />
            <span>{group}</span>
          </div>
        ))}
      </CardFooter>
    </Card>
  )
}