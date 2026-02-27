"use client"

import { Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer } from "recharts"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

export const description = "A bar chart with negative values"

const chartData = [
  { day: "Sunday", hours: 8, isNight: false },
  { day: "Monday", hours: 7, isNight: true },
  { day: "Tuesday", hours: 7, isNight: false },
  { day: "Wednessday", hours: 6, isNight: true },
  { day: "Thursday", hours: 5, isNight: true },
  { day: "Saturday", hours: 9, isNight: false },
]

const chartConfig = {
  hours: {
    label: "Hours",
  },
  isNight:{
    label:"Shift Details"
  }
} satisfies ChartConfig

export function StaffShift() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Weekly Shift Details</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[580px] w-full">
          <BarChart accessibilityLayer data={chartData}>
            <CartesianGrid vertical={false} />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel hideIndicator />}
            />
             <ChartLegend content={<ChartLegendContent nameKey="isNight" />} />
            <Bar dataKey="hours">
              <LabelList position="top" dataKey="day" fillOpacity={1} />
              {chartData.map((item) => (
                <Cell
                  key={item.day}
                  fill={item.isNight ? "var(--chart-1)" : "var(--chart-2)"}
                />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
