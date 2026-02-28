"use client"

import { LabelList, Pie, PieChart } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

export const description = "A pie chart with a label list"

type ChartData= {
  "status": string,
  "count":number
}

const chartConfig = {
  status: {
    label: "Status",
  },
  CONTAMINATED: {
    label: "CONTAMINATED",
    color: "var(--chart-1)",
  },
  IN_USE: {
    label: "IN_USE",
    color: "var(--chart-2)",
  },
  CLEAN: {
    label: "CLEAN",
    color: "var(--chart-3)",
  },
  other: {
    label: "Other",
    color: "var(--chart-5)",
  },
} satisfies ChartConfig

export function EquipmentGraph({chartData,total}:{chartData:ChartData[],total:number}) {
  return (
    <Card className="flex flex-1 flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>Equipment List</CardTitle>
        <CardDescription>Total Count : {total}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="[&_.recharts-text]:fill-background mx-auto aspect-square max-h-[250px]"
        >
          <PieChart>
            <ChartTooltip
              content={<ChartTooltipContent nameKey="count" hideLabel />}
            />
            <Pie data={chartData} dataKey="count">
              <LabelList
                dataKey="status"
                className="fill-background"
                stroke="none"
                fontSize={12}
                formatter={(value: keyof typeof chartConfig) =>
                  chartConfig[value]?.label
                }
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
