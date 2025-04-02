import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ResponsiveContainer, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, RadarChart } from 'recharts';

interface MetricData {
  name: string;
  value: number;
  fullMark: number;
}

interface HealthScoreMetrics {
  overallScore: number;
  securityScore: number;
  dataModelScore: number;
  automationScore: number;
  apexScore: number;
  uiComponentScore: number;
  performanceRisk: number;
  technicalDebt: number;
}

interface ConfigurationRadarChartProps {
  healthScore?: HealthScoreMetrics;
  loading?: boolean;
  className?: string;
}

export default function ConfigurationRadarChart({
  healthScore,
  loading = false,
  className = ""
}: ConfigurationRadarChartProps) {
  // Default metrics if no health score provided
  const defaultMetrics: MetricData[] = [
    { name: 'SEC', value: 75, fullMark: 100 },
    { name: 'UI', value: 82, fullMark: 100 },
    { name: 'DM', value: 92, fullMark: 100 },
    { name: 'PF', value: 68, fullMark: 100 },
    { name: 'TD', value: 73, fullMark: 100 },
    { name: 'AP', value: 84, fullMark: 100 },
    { name: 'AT', value: 90, fullMark: 100 },
  ];
  
  // Convert health score to radar data format if provided
  const metricsData = healthScore ? [
    { name: 'SEC', value: healthScore.securityScore, fullMark: 100 },
    { name: 'UI', value: healthScore.uiComponentScore, fullMark: 100 },
    { name: 'DM', value: healthScore.dataModelScore, fullMark: 100 },
    { name: 'PF', value: 100 - healthScore.performanceRisk, fullMark: 100 }, // Invert risk to show as positive score
    { name: 'TD', value: 100 - healthScore.technicalDebt, fullMark: 100 },   // Invert debt to show as positive score
    { name: 'AP', value: healthScore.apexScore, fullMark: 100 },
    { name: 'AT', value: healthScore.automationScore, fullMark: 100 },
  ] : defaultMetrics;
  
  // Legend description for the abbreviations
  const legendDescriptions = {
    'SEC': 'Security',
    'UI': 'UI Components',
    'DM': 'Data Model',
    'PF': 'Performance',
    'TD': 'Technical Debt',
    'AP': 'Apex Code',
    'AT': 'Automation'
  };
  
  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Configuration Health</CardTitle>
        <CardDescription>
          Radar analysis of org configuration metrics
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="h-64 -mx-4">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart 
              cx="50%" 
              cy="50%" 
              outerRadius="70%" 
              data={metricsData}
            >
              <PolarGrid stroke="#e2e8f0" />
              <PolarAngleAxis 
                dataKey="name"
                tick={{ fontSize: 11, fill: '#64748b' }}
              />
              <PolarRadiusAxis 
                angle={30} 
                domain={[0, 100]} 
                tick={{ fontSize: 10, fill: '#64748b' }} 
                strokeOpacity={0.5}
              />
              <Radar 
                name="Health Score" 
                dataKey="value" 
                stroke="#6366f1" 
                fill="#6366f1" 
                fillOpacity={0.4}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
        
        <div className="flex flex-wrap justify-center gap-2 mt-2 text-xs">
          {Object.entries(legendDescriptions).map(([key, value]) => (
            <div key={key} className="flex items-center">
              <div className="w-2 h-2 rounded-full bg-[#6366f1] mr-1" />
              <span className="mr-1 font-medium">{key}</span>
              <span className="text-gray-500">({value})</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}