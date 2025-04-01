import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView,
  Dimensions
} from 'react-native';
import Card from './ui/Card';
import MoodRing from './ui/MoodRing';
import { COLORS, FONT_SIZE, FONT_WEIGHT, SPACING } from '../constants/theme';

// We'll use mock data since we don't have direct access to the HealthScore type in mobile
interface HealthScoreData {
  overallScore: number;
  securityScore: number;
  dataModelScore: number;
  automationScore: number;
  apexScore: number;
  uiComponentScore: number;
  complexityScore: number;
  performanceRisk: number;
  technicalDebt: number;
  metadataVolume: number;
  customizationLevel: number;
  lastAnalyzed: string;
}

interface Metric {
  name: string;
  value: number;
  description: string;
  color: string;
}

interface ConfigurationMoodRingCardProps {
  healthScore: HealthScoreData;
  onViewFullAnalysis?: () => void;
}

export default function ConfigurationMoodRingCard({ 
  healthScore,
  onViewFullAnalysis 
}: ConfigurationMoodRingCardProps) {
  const [activeTab, setActiveTab] = useState<'metrics' | 'details'>('metrics');
  
  const metrics: Metric[] = [
    {
      name: 'Security',
      value: healthScore.securityScore,
      description: 'Overall security posture including permissions and vulnerabilities',
      color: COLORS.error
    },
    {
      name: 'Complexity',
      value: healthScore.complexityScore,
      description: 'Overall org complexity score based on metadata and customizations',
      color: COLORS.accent
    },
    {
      name: 'Technical Debt',
      value: healthScore.technicalDebt,
      description: 'Assessment of code quality and maintenance burden',
      color: COLORS.primary
    },
    {
      name: 'Data Model',
      value: healthScore.dataModelScore,
      description: 'Health of object relationships and data architecture',
      color: COLORS.success
    },
    {
      name: 'Performance',
      value: healthScore.performanceRisk,
      description: 'Indicators of potential performance impacts',
      color: COLORS.warningColor
    }
  ];
  
  const renderMetricBar = (metric: Metric) => {
    return (
      <TouchableOpacity 
        key={metric.name}
        style={styles.metricItem}
        onPress={() => alert(metric.description)}
      >
        <View style={styles.metricHeader}>
          <Text style={styles.metricName}>{metric.name}</Text>
          <Text style={styles.metricValue}>{metric.value}</Text>
        </View>
        
        <View style={styles.progressBarContainer}>
          <View 
            style={[
              styles.progressBar, 
              { 
                width: `${metric.value}%`,
                backgroundColor: metric.color 
              }
            ]} 
          />
        </View>
      </TouchableOpacity>
    );
  };
  
  const getDetailsContent = () => {
    return (
      <View style={styles.detailsContainer}>
        <Text style={styles.detailsTitle}>What Affects Your Mood Ring?</Text>
        
        <View style={styles.detailItem}>
          <Text style={styles.detailName}>Complexity Score: {healthScore.complexityScore}</Text>
          <Text style={styles.detailDescription}>
            Measures how complex your org configuration is based on the total number of customizations,
            relationships between objects, and integration points.
          </Text>
        </View>
        
        <View style={styles.detailItem}>
          <Text style={styles.detailName}>Technical Debt: {healthScore.technicalDebt}</Text>
          <Text style={styles.detailDescription}>
            Quantifies potential maintenance challenges in your codebase, such as
            test coverage gaps, deprecated API usage, and code complexity.
          </Text>
        </View>
        
        <View style={styles.detailItem}>
          <Text style={styles.detailName}>Performance Risk: {healthScore.performanceRisk}</Text>
          <Text style={styles.detailDescription}>
            Evaluates configurations that could impact system performance, including
            SOQL query patterns, trigger cascades, and flow design.
          </Text>
        </View>
        
        <View style={styles.detailItem}>
          <Text style={styles.detailName}>Metadata Volume: {healthScore.metadataVolume}</Text>
          <Text style={styles.detailDescription}>
            Measures the sheer volume of metadata in your org compared to similar organizations.
          </Text>
        </View>
      </View>
    );
  };
  
  return (
    <Card title="Configuration Mood Ring" style={styles.card}>
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'metrics' && styles.activeTabButton]}
          onPress={() => setActiveTab('metrics')}
        >
          <Text style={[styles.tabText, activeTab === 'metrics' && styles.activeTabText]}>
            Metrics
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'details' && styles.activeTabButton]}
          onPress={() => setActiveTab('details')}
        >
          <Text style={[styles.tabText, activeTab === 'details' && styles.activeTabText]}>
            Details
          </Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.contentContainer}>
        <View style={styles.ringContainer}>
          <MoodRing 
            score={healthScore.overallScore}
            securityScore={healthScore.securityScore}
            complexityScore={healthScore.complexityScore}
            performanceScore={100 - healthScore.performanceRisk} // Invert performance risk
            size="lg"
            pulsate={healthScore.overallScore < 60}
          />
          
          <Text style={styles.lastUpdated}>
            Last updated: {new Date(healthScore.lastAnalyzed).toLocaleDateString()}
          </Text>
        </View>
        
        <ScrollView style={styles.metricsContainer}>
          {activeTab === 'metrics' ? (
            metrics.map(metric => renderMetricBar(metric))
          ) : (
            getDetailsContent()
          )}
        </ScrollView>
      </View>
      
      {onViewFullAnalysis && (
        <TouchableOpacity 
          style={styles.fullAnalysisButton}
          onPress={onViewFullAnalysis}
        >
          <Text style={styles.fullAnalysisText}>View Full Analysis</Text>
        </TouchableOpacity>
      )}
    </Card>
  );
}

const { width } = Dimensions.get('window');
const isSmallScreen = width < 375;

const styles = StyleSheet.create({
  card: {
    margin: SPACING.md,
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginBottom: SPACING.md,
  },
  tabButton: {
    flex: 1,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
  },
  activeTabButton: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    color: COLORS.textLight,
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.medium,
  },
  activeTabText: {
    color: COLORS.primary,
    fontWeight: FONT_WEIGHT.semibold,
  },
  contentContainer: {
    flexDirection: isSmallScreen ? 'column' : 'row',
  },
  ringContainer: {
    alignItems: 'center',
    marginBottom: SPACING.md,
    width: isSmallScreen ? '100%' : '40%',
  },
  lastUpdated: {
    marginTop: SPACING.sm,
    fontSize: FONT_SIZE.xs,
    color: COLORS.textLight,
  },
  metricsContainer: {
    flex: 1,
    width: isSmallScreen ? '100%' : '60%',
    maxHeight: 300,
  },
  metricItem: {
    marginBottom: SPACING.md,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  metricName: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.medium,
    color: COLORS.textDark,
  },
  metricValue: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.text,
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: COLORS.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
  },
  detailsContainer: {
    paddingBottom: SPACING.md,
  },
  detailsTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.textDark,
    marginBottom: SPACING.md,
  },
  detailItem: {
    marginBottom: SPACING.md,
  },
  detailName: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.medium,
    color: COLORS.textDark,
    marginBottom: SPACING.xs,
  },
  detailDescription: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textLight,
    lineHeight: 18,
  },
  fullAnalysisButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: 4,
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  fullAnalysisText: {
    color: 'white',
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.medium,
  },
});