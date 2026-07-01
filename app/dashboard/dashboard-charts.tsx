"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type ChartProps = {
  data: {
    name: string
    value: number
    color: string
  }[]
  title: string
}

export function DashboardCharts({ data, title }: ChartProps) {
  const total = data.reduce((acc, curr) => acc + curr.value, 0)

  return (
    <Card className="col-span-full shadow-sm">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <div className="h-32 flex items-center justify-center text-gray-400">
            No data available
          </div>
        ) : (
          <div className="space-y-6">
            {/* Visual Bar */}
            <div className="w-full h-8 flex rounded-lg overflow-hidden shadow-inner">
              {data.map((item, index) => {
                const percentage = (item.value / total) * 100
                if (percentage === 0) return null
                return (
                  <div
                    key={index}
                    style={{ width: `${percentage}%` }}
                    className={`${item.color} h-full transition-all duration-500 hover:opacity-90 cursor-pointer`}
                    title={`${item.name}: ${item.value} (${percentage.toFixed(1)}%)`}
                  />
                )
              })}
            </div>

            {/* Legend */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              {data.map((item, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <div className={`w-4 h-4 rounded-full ${item.color} shadow-sm`} />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-700">{item.name}</span>
                    <span className="text-xl font-bold">{item.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
