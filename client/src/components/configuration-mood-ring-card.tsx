import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { MoodRing } from '@/components/ui/mood-ring';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend 
} from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { HealthScore, HealthScoreIssue } from '@shared/schema';
import { Activity, ArrowRight, AlertTriangle, BarChart2, Code, Database } from 'lucide-react';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';

interface ConfigurationMoodRingCardProps {
  healthScore?: HealthScore;
  className?: string;
}

interface MetricWithDescription {
  name: string;
  description: string;
  value: number;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'stable';
}

const moodRingMetricData = (healthScore: HealthScore): MetricWithDescription[] => [
  {
    name: 'Security',
    description: 'Overall security posture including profile permissions, sharing settings, and code vulnerabilities',
    value: healthScore.securityScore,
    icon: <AlertTriangle className="h-4 w-4 text-orange-500" />,
    trend: healthScore.securityScore > 75 ? 'up' : 'down',
  },
  {
    name: 'Complexity',
    description: 'Measures of org complexity across metadata volume, customization level, and interconnectedness',
    value: healthScore.complexityScore,
    icon: <BarChart2 className="h-4 w-4 text-purple-500" />,
    trend: healthScore.complexityScore < 50 ? 'up' : 'down',
  },
  {
    name: 'Technical Debt',
    description: 'Assessment of code quality, test coverage, and maintenance burden',
    value: healthScore.technicalDebt,
    icon: <Code className="h-4 w-4 text-blue-500" />,
    trend: healthScore.technicalDebt < 40 ? 'up' : 'down',
  },
  {
    name: 'Data Model',
    description: 'Health of object relationships, field usage, and overall data architecture',
    value: healthScore.dataModelScore,
    icon: <Database className="h-4 w-4 text-green-500" />,
    trend: healthScore.dataModelScore > 80 ? 'up' : 'down',
  },
  {
    name: 'Performance',
    description: 'Indicators of potential performance impacts from configuration choices',
    value: healthScore.performanceRisk,
    icon: <Activity className="h-4 w-4 text-red-500" />,
    trend: healthScore.performanceRisk < 30 ? 'up' : 'down',
  },
];

// Generate chart data with a time series for visualization
const generateChartData = (healthScore: HealthScore) => {
  // In a real implementation, this would use historical data
  // For this demo, we'll simulate 7 days of data with some variation
  
  const now = new Date();
  const data = [];
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    // Create a random variance of +/- 5 points
    const variance = () => Math.floor(Math.random() * 10) - 5;
    
    data.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      overall: Math.max(0, Math.min(100, healthScore.overallScore + variance())),
      security: Math.max(0, Math.min(100, healthScore.securityScore + variance())),
      complexity: Math.max(0, Math.min(100, healthScore.complexityScore + variance())),
      technical: Math.max(0, Math.min(100, healthScore.technicalDebt + variance())),
      performance: Math.max(0, Math.min(100, healthScore.performanceRisk + variance())),
    });
  }
  
  return data;
};

export default function ConfigurationMoodRingCard({ 
  healthScore, 
  className 
}: ConfigurationMoodRingCardProps) {
  const [, setLocation] = useLocation();
  
  // Default health score values for when data is not available
  const defaultHealthScore: HealthScore = {
    id: 0,
    orgId: 0,
    overallScore: 75,
    securityScore: 75,
    dataModelScore: 80,
    automationScore: 85,
    apexScore: 70,
    uiComponentScore: 75,
    complexityScore: 65,
    performanceRisk: 40,
    technicalDebt: 45,
    metadataVolume: 500,
    customizationLevel: 65,
    lastAnalyzed: new Date(),
    issues: []
  };
  
  // Use real data if available, otherwise use default values
  const scoreData = healthScore || defaultHealthScore;
  const metrics = moodRingMetricData(scoreData);
  const chartData = generateChartData(scoreData);
  
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Configuration Mood Ring</span>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-sm"
            onClick={() => setLocation('/health')}
          >
            Full Analysis <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardTitle>
        <CardDescription>
          Dynamic visualization of your org's health and complexity
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="flex flex-col items-center justify-center">
            <MoodRing 
              score={scoreData.overallScore}
              securityScore={scoreData.securityScore}
              complexityScore={scoreData.complexityScore}
              performanceScore={100 - scoreData.performanceRisk} // Invert performance risk
              size="xl"
              animation={true}
              pulsate={scoreData.overallScore < 60}
            />
            
            <div className="mt-4 text-center">
              <p className="text-sm text-muted-foreground mb-1">Last updated</p>
              <p className="font-medium">{new Date(scoreData.lastAnalyzed).toLocaleDateString()}</p>
            </div>
          </div>
          
          <div className="lg:col-span-2">
            <Tabs defaultValue="metrics">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="metrics">Key Metrics</TabsTrigger>
                <TabsTrigger value="trends">Trends</TabsTrigger>
              </TabsList>
              
              <TabsContent value="metrics" className="mt-4">
                <div className="space-y-4">
                  {metrics.map((metric) => (
                    <HoverCard key={metric.name}>
                      <HoverCardTrigger asChild>
                        <div className="flex items-center justify-between p-2 rounded hover:bg-muted cursor-pointer">
                          <div className="flex items-center">
                            {metric.icon}
                            <span className="ml-2 font-medium">{metric.name}</span>
                          </div>
                          <div className="flex items-center">
                            <div
                              className={`w-16 h-2 rounded-full mr-2 ${
                                metric.value > 80
                                  ? 'bg-gradient-to-r from-green-300 to-green-500'
                                  : metric.value > 60
                                  ? 'bg-gradient-to-r from-yellow-300 to-yellow-500'
                                  : 'bg-gradient-to-r from-red-300 to-red-500'
                              }`}
                            >
                              <div
                                className="h-full rounded-full bg-background"
                                style={{ width: `${100 - metric.value}%`, marginLeft: `${metric.value}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium">{metric.value}</span>
                          </div>
                        </div>
                      </HoverCardTrigger>
                      <HoverCardContent className="w-80">
                        <div className="space-y-2">
                          <h4 className="font-semibold">{metric.name}</h4>
                          <p className="text-sm text-muted-foreground">{metric.description}</p>
                          {metric.trend && (
                            <div className="flex items-center mt-2">
                              <span className="text-xs text-muted-foreground mr-1">Trend:</span>
                              <span
                                className={`text-xs ${
                                  metric.trend === 'up'
                                    ? 'text-green-500'
                                    : metric.trend === 'down'
                                    ? 'text-red-500'
                                    : 'text-yellow-500'
                                }`}
                              >
                                {metric.trend === 'up'
                                  ? 'Improving'
                                  : metric.trend === 'down'
                                  ? 'Declining'
                                  : 'Stable'}
                              </span>
                            </div>
                          )}
                        </div>
                      </HoverCardContent>
                    </HoverCard>
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="trends" className="mt-4">
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="date" fontSize={12} tickMargin={10} />
                    <YAxis domain={[0, 100]} fontSize={12} tickMargin={10} />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="overall"
                      name="Overall"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="security"
                      name="Security"
                      stroke="#f97316"
                      strokeWidth={1.5}
                      dot={false}
                      activeDot={{ r: 4 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="complexity"
                      name="Complexity"
                      stroke="#8b5cf6"
                      strokeWidth={1.5}
                      dot={false}
                      activeDot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}