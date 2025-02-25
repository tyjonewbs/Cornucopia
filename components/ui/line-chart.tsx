'use client'

import { Line, LineChart as RechartsLineChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts'

interface LineChartProps {
  data: Array<{
    date: Date | string
    [key: string]: any
  }>
  xField: string
  yField: string
  height?: number
  valuePrefix?: string
}

export function LineChart({ data, xField, yField, height = 300, valuePrefix = '' }: LineChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsLineChart data={data}>
        <XAxis 
          dataKey={xField}
          tickFormatter={(value: any) => {
            if (value instanceof Date) {
              return new Date(value).toLocaleDateString()
            }
            return String(value)
          }}
        />
        <YAxis 
          tickFormatter={(value: number) => `${valuePrefix}${String(value)}`}
        />
        <Tooltip 
          formatter={(value: number) => [`${valuePrefix}${value}`, yField]}
          labelFormatter={(label: string | number | Date) => {
            if (label instanceof Date) {
              return new Date(label).toLocaleDateString()
            }
            return label
          }}
        />
        <Line 
          type="monotone" 
          dataKey={yField} 
          stroke="#8884d8" 
          strokeWidth={2}
          dot={false}
        />
      </RechartsLineChart>
    </ResponsiveContainer>
  )
}
