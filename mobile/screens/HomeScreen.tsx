import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { orgApi } from '../api/client';
import ConfigurationMoodRingCard from '../components/ConfigurationMoodRingCard';

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

interface HomeScreenProps {
  navigation: HomeScreenNavigationProp;
}

interface SalesforceOrg {
  id: number;
  name: string;
  instanceUrl: string;
  userId: number;
}

// Mock health score data for demo purposes
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

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const [orgs, setOrgs] = useState<SalesforceOrg[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [healthScore, setHealthScore] = useState<HealthScoreData | null>(null);

  const fetchOrgs = async () => {
    try {
      setError(null);
      // In a real app, this would fetch from the API
      // const response = await orgApi.getOrgs();
      // setOrgs(response);
      
      // Mock data for demonstration
      setOrgs([
        { id: 1, name: 'Production Org', instanceUrl: 'https://login.salesforce.com', userId: 1 },
        { id: 2, name: 'Sandbox', instanceUrl: 'https://test.salesforce.com', userId: 1 },
        { id: 3, name: 'Developer Edition', instanceUrl: 'https://developer.salesforce.com', userId: 1 },
      ]);

      // Mock health score data
      setHealthScore({
        overallScore: 78,
        securityScore: 72,
        dataModelScore: 91,
        automationScore: 88,
        apexScore: 85,
        uiComponentScore: 64,
        complexityScore: 69,
        performanceRisk: 45,
        technicalDebt: 58,
        metadataVolume: 76,
        customizationLevel: 83,
        lastAnalyzed: new Date().toISOString(),
      });
    } catch (err) {
      setError('Failed to load organizations. Please try again.');
      console.error('Error fetching orgs:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrgs();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrgs();
  };

  const handleOrgPress = (orgId: number) => {
    // Navigate to org dashboard or context
    // For now, we'll go directly to the data model screen
    navigation.navigate('DataModel', { orgId });
  };

  const navigateToSettings = () => {
    navigation.navigate('Settings');
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Organizations</Text>
            <TouchableOpacity style={styles.settingsButton} onPress={navigateToSettings}>
              <Text style={styles.settingsButtonText}>Settings</Text>
            </TouchableOpacity>
          </View>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#3b82f6" />
              <Text style={styles.loadingText}>Loading organizations...</Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={fetchOrgs}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : orgs.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                No Salesforce organizations connected.
              </Text>
              <TouchableOpacity style={styles.connectButton}>
                <Text style={styles.connectButtonText}>Connect Organization</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {orgs.map((org) => (
                <TouchableOpacity 
                  key={org.id} 
                  style={styles.orgCard}
                  onPress={() => handleOrgPress(org.id)}
                >
                  <Text style={styles.orgName}>{org.name}</Text>
                  <Text style={styles.orgUrl}>{org.instanceUrl}</Text>
                  
                  <View style={styles.orgActions}>
                    <TouchableOpacity 
                      style={styles.orgActionButton}
                      onPress={() => navigation.navigate('DataModel', { orgId: org.id })}
                    >
                      <Text style={styles.orgActionText}>Data Model</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.orgActionButton}
                      onPress={() => navigation.navigate('Security', { orgId: org.id })}
                    >
                      <Text style={styles.orgActionText}>Security</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.orgActionButton}
                      onPress={() => navigation.navigate('SoqlEditor', { orgId: org.id })}
                    >
                      <Text style={styles.orgActionText}>SOQL</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              ))}
            
              <TouchableOpacity style={styles.addOrgButton}>
                <Text style={styles.addOrgButtonText}>+ Connect New Organization</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
        
        {/* Configuration Mood Ring */}
        {healthScore && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Configuration Mood Ring</Text>
            <ConfigurationMoodRingCard 
              healthScore={healthScore}
              onViewFullAnalysis={() => {
                if (orgs.length > 0) {
                  navigation.navigate('Security', { orgId: orgs[0].id });
                }
              }}
            />
          </View>
        )}
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <View style={styles.activityCard}>
            <Text style={styles.activityEmptyText}>
              No recent activity to display.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f8fa',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  settingsButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#f1f5f9',
    borderRadius: 4,
  },
  settingsButtonText: {
    fontSize: 14,
    color: '#64748b',
  },
  loadingContainer: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  loadingText: {
    marginTop: 12,
    color: '#64748b',
    fontSize: 14,
  },
  errorContainer: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fee2e2',
    borderRadius: 8,
  },
  errorText: {
    marginBottom: 12,
    color: '#b91c1c',
    fontSize: 14,
    textAlign: 'center',
  },
  retryButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#ef4444',
    borderRadius: 4,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: '500',
    fontSize: 14,
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  emptyText: {
    marginBottom: 16,
    color: '#64748b',
    fontSize: 14,
    textAlign: 'center',
  },
  connectButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#3b82f6',
    borderRadius: 4,
  },
  connectButtonText: {
    color: 'white',
    fontWeight: '500',
    fontSize: 14,
  },
  orgCard: {
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  orgName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  orgUrl: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 12,
  },
  orgActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 12,
  },
  orgActionButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#f1f5f9',
    borderRadius: 4,
    marginRight: 8,
  },
  orgActionText: {
    fontSize: 14,
    color: '#64748b',
  },
  addOrgButton: {
    padding: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addOrgButtonText: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '500',
  },
  activityCard: {
    padding: 24,
    backgroundColor: 'white',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  activityEmptyText: {
    color: '#94a3b8',
    fontSize: 14,
    textAlign: 'center',
  },
});