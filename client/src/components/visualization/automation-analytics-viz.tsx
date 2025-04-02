import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DataPoint {
  month: string;
  flows: number;
  processes: number;
  triggers: number;
}

interface AutomationAnalyticsVizProps {
  data?: DataPoint[];
  loading?: boolean;
  className?: string;
}

export default function AutomationAnalyticsViz({
  data,
  loading = false,
  className = ""
}: AutomationAnalyticsVizProps) {
  // Default data if none provided
  const defaultData: DataPoint[] = [
    { month: 'Jan', flows: 15, processes: 10, triggers: 5 },
    { month: 'Feb', flows: 18, processes: 12, triggers: 7 },
    { month: 'Mar', flows: 22, processes: 14, triggers: 10 },
    { month: 'Apr', flows: 25, processes: 15, triggers: 12 },
    { month: 'May', flows: 30, processes: 18, triggers: 16 },
    { month: 'Jun', flows: 38, processes: 22, triggers: 19 },
  ];
  
  const chartData = data || defaultData;
  
  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Automation Trends</CardTitle>
        <CardDescription>
          Growth of automation components over time
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis 
                dataKey="month" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: '#64748b' }}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: '#64748b' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '4px',
                  fontSize: '12px'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="flows" 
                stroke="#10b981" 
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 3 }}
              />
              <Line 
                type="monotone" 
                dataKey="processes" 
                stroke="#6366f1" 
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 3 }}
              />
              <Line 
                type="monotone" 
                dataKey="triggers" 
                stroke="#f59e0b" 
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        <div className="flex justify-center mt-2 text-xs">
          <div className="flex items-center mr-4">
            <div className="w-3 h-3 rounded-full bg-[#10b981] mr-1" />
            <span>Flows</span>
          </div>
          <div className="flex items-center mr-4">
            <div className="w-3 h-3 rounded-full bg-[#6366f1] mr-1" />
            <span>Processes</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-[#f59e0b] mr-1" />
            <span>Triggers</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}