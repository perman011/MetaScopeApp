import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { healthScoreApi } from '../api/client';

type SecurityScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Security'>;
type SecurityScreenRouteProp = RouteProp<RootStackParamList, 'Security'>;

interface SecurityScreenProps {
  navigation: SecurityScreenNavigationProp;
  route: SecurityScreenRouteProp;
}

interface SecurityIssue {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  category: string;
  title: string;
  description: string;
}

export default function SecurityScreen({ navigation, route }: SecurityScreenProps) {
  const { orgId } = route.params;
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [securityIssues, setSecurityIssues] = useState<SecurityIssue[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedIssue, setSelectedIssue] = useState<SecurityIssue | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [severityFilter, setSeverityFilter] = useState<string | null>(null);

  const fetchSecurityIssues = async () => {
    try {
      setError(null);
      
      // In a real app, this would fetch from the API
      // const healthScore = await healthScoreApi.getHealthScore(orgId);
      // setSecurityIssues(healthScore.issues.filter(issue => issue.category === 'security'));
      
      // Simulate network request
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock data for demonstration
      const mockIssues: SecurityIssue[] = [
        {
          id: '1',
          severity: 'critical',
          category: 'Sharing',
          title: 'Public Read/Write on Account',
          description: 'The Account object has public read/write access enabled, which could expose sensitive customer data. Update the organization-wide defaults to Private or Public Read Only.'
        },
        {
          id: '2',
          severity: 'warning',
          category: 'Profiles',
          title: 'System Administrator Profile Cloned',
          description: 'Multiple profiles have been created by cloning the System Administrator profile. This could lead to privilege escalation. Review these profiles and remove unnecessary permissions.'
        },
        {
          id: '3',
          severity: 'warning',
          category: 'API',
          title: 'API Access Enabled for All Users',
          description: 'API access is enabled for all user profiles. It is recommended to restrict API access only to profiles that require it.'
        },
        {
          id: '4',
          severity: 'critical',
          category: 'Password Policy',
          title: 'Weak Password Policy',
          description: 'Current password policy does not meet security best practices. Increase minimum length to 12 characters and require complexity.'
        },
        {
          id: '5',
          severity: 'info',
          category: 'Login',
          title: 'Login IP Ranges Not Restricted',
          description: 'Users can log in from any IP address. Consider setting login IP ranges for user profiles to restrict access from untrusted networks.'
        },
        {
          id: '6',
          severity: 'warning',
          category: 'Sharing',
          title: 'Excessive Permission Sets',
          description: 'There are 15 permission sets with "Modify All Data" permission. Review these permission sets and remove this permission where not strictly necessary.'
        },
        {
          id: '7',
          severity: 'info',
          category: 'Profiles',
          title: 'Standard User Profile Has View Encrypted Data',
          description: 'The Standard User profile has "View Encrypted Data" permission enabled. This allows users to see data that should be protected.'
        }
      ];
      
      setSecurityIssues(mockIssues);
    } catch (err) {
      setError('Failed to load security issues. Please try again.');
      console.error('Error fetching security issues:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSecurityIssues();
  }, [orgId]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchSecurityIssues();
  };

  const selectIssue = (issue: SecurityIssue) => {
    setSelectedIssue(issue);
  };

  const goBack = () => {
    setSelectedIssue(null);
  };

  const toggleCategoryFilter = (category: string) => {
    setCategoryFilter(categoryFilter === category ? null : category);
  };

  const toggleSeverityFilter = (severity: string) => {
    setSeverityFilter(severityFilter === severity ? null : severity);
  };

  const filteredIssues = securityIssues.filter(issue => {
    if (categoryFilter && issue.category !== categoryFilter) {
      return false;
    }
    if (severityFilter && issue.severity !== severityFilter) {
      return false;
    }
    return true;
  });

  // Get unique categories and counts
  const categories = Array.from(new Set(securityIssues.map(issue => issue.category)));
  const getCategoryCount = (category: string) => {
    return securityIssues.filter(issue => issue.category === category).length;
  };

  // Get counts by severity
  const criticalCount = securityIssues.filter(issue => issue.severity === 'critical').length;
  const warningCount = securityIssues.filter(issue => issue.severity === 'warning').length;
  const infoCount = securityIssues.filter(issue => issue.severity === 'info').length;

  return (
    <View style={styles.container}>
      {selectedIssue ? (
        <IssueDetailView issue={selectedIssue} onBack={goBack} />
      ) : (
        <ScrollView 
          style={styles.scrollView}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#3b82f6" />
              <Text style={styles.loadingText}>Loading security issues...</Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={fetchSecurityIssues}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View style={styles.summaryContainer}>
                <Text style={styles.sectionTitle}>Security Overview</Text>
                <View style={styles.summaryCards}>
                  <View style={[styles.summaryCard, styles.criticalCard]}>
                    <Text style={styles.summaryCount}>{criticalCount}</Text>
                    <Text style={styles.summaryLabel}>Critical</Text>
                  </View>
                  <View style={[styles.summaryCard, styles.warningCard]}>
                    <Text style={styles.summaryCount}>{warningCount}</Text>
                    <Text style={styles.summaryLabel}>Warning</Text>
                  </View>
                  <View style={[styles.summaryCard, styles.infoCard]}>
                    <Text style={styles.summaryCount}>{infoCount}</Text>
                    <Text style={styles.summaryLabel}>Info</Text>
                  </View>
                </View>
              </View>
              
              <View style={styles.filtersContainer}>
                <Text style={styles.filtersTitle}>Filter by Severity</Text>
                <View style={styles.filterButtons}>
                  <TouchableOpacity 
                    style={[
                      styles.filterButton, 
                      severityFilter === 'critical' && styles.filterButtonActive,
                      styles.criticalFilterButton
                    ]}
                    onPress={() => toggleSeverityFilter('critical')}
                  >
                    <Text style={[
                      styles.filterButtonText,
                      severityFilter === 'critical' && styles.filterButtonTextActive
                    ]}>Critical</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[
                      styles.filterButton, 
                      severityFilter === 'warning' && styles.filterButtonActive,
                      styles.warningFilterButton
                    ]}
                    onPress={() => toggleSeverityFilter('warning')}
                  >
                    <Text style={[
                      styles.filterButtonText,
                      severityFilter === 'warning' && styles.filterButtonTextActive
                    ]}>Warning</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[
                      styles.filterButton, 
                      severityFilter === 'info' && styles.filterButtonActive,
                      styles.infoFilterButton
                    ]}
                    onPress={() => toggleSeverityFilter('info')}
                  >
                    <Text style={[
                      styles.filterButtonText,
                      severityFilter === 'info' && styles.filterButtonTextActive
                    ]}>Info</Text>
                  </TouchableOpacity>
                </View>
                
                <Text style={styles.filtersTitle}>Filter by Category</Text>
                <View style={styles.categoryFilters}>
                  {categories.map(category => (
                    <TouchableOpacity 
                      key={category}
                      style={[
                        styles.categoryButton,
                        categoryFilter === category && styles.categoryButtonActive
                      ]}
                      onPress={() => toggleCategoryFilter(category)}
                    >
                      <Text style={[
                        styles.categoryButtonText,
                        categoryFilter === category && styles.categoryButtonTextActive
                      ]}>
                        {category} ({getCategoryCount(category)})
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              
              <View style={styles.issuesContainer}>
                <Text style={styles.sectionTitle}>
                  Security Issues {filteredIssues.length !== securityIssues.length ? 
                    `(${filteredIssues.length} of ${securityIssues.length})` : 
                    `(${securityIssues.length})`}
                </Text>
                
                {filteredIssues.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>
                      No issues match the selected filters
                    </Text>
                  </View>
                ) : (
                  filteredIssues.map(issue => (
                    <TouchableOpacity 
                      key={issue.id} 
                      style={styles.issueCard}
                      onPress={() => selectIssue(issue)}
                    >
                      <View style={styles.issueCardHeader}>
                        <Text style={styles.issueTitle}>{issue.title}</Text>
                        <View style={[
                          styles.issueSeverityBadge,
                          issue.severity === 'critical' && styles.criticalBadge,
                          issue.severity === 'warning' && styles.warningBadge,
                          issue.severity === 'info' && styles.infoBadge,
                        ]}>
                          <Text style={styles.issueSeverityText}>
                            {issue.severity.charAt(0).toUpperCase() + issue.severity.slice(1)}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.issueCategory}>{issue.category}</Text>
                      <Text style={styles.issueDescription} numberOfLines={2}>
                        {issue.description}
                      </Text>
                    </TouchableOpacity>
                  ))
                )}
              </View>
            </>
          )}
        </ScrollView>
      )}
    </View>
  );
}

interface IssueDetailViewProps {
  issue: SecurityIssue;
  onBack: () => void;
}

function IssueDetailView({ issue, onBack }: IssueDetailViewProps) {
  return (
    <View style={styles.detailContainer}>
      <View style={styles.detailHeader}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        
        <View style={[
          styles.issueSeverityBadge,
          issue.severity === 'critical' && styles.criticalBadge,
          issue.severity === 'warning' && styles.warningBadge,
          issue.severity === 'info' && styles.infoBadge,
        ]}>
          <Text style={styles.issueSeverityText}>
            {issue.severity.charAt(0).toUpperCase() + issue.severity.slice(1)}
          </Text>
        </View>
        
        <Text style={styles.detailIssueCategory}>{issue.category}</Text>
        <Text style={styles.detailIssueTitle}>{issue.title}</Text>
      </View>
      
      <ScrollView style={styles.detailScrollView}>
        <View style={styles.detailSection}>
          <Text style={styles.detailSectionTitle}>Description</Text>
          <View style={styles.detailDescriptionCard}>
            <Text style={styles.detailDescriptionText}>
              {issue.description}
            </Text>
          </View>
        </View>
        
        <View style={styles.detailSection}>
          <Text style={styles.detailSectionTitle}>Recommendation</Text>
          <View style={styles.detailDescriptionCard}>
            <Text style={styles.detailDescriptionText}>
              {issue.severity === 'critical' ? 
                'It is strongly recommended to address this issue immediately as it could lead to unauthorized data access or service disruption.' : 
                issue.severity === 'warning' ?
                'This issue should be addressed as soon as possible to improve your organization\'s security posture.' :
                'Consider addressing this issue as part of your regular security maintenance.'
              }
            </Text>
          </View>
        </View>
        
        <TouchableOpacity style={styles.resolveButton}>
          <Text style={styles.resolveButtonText}>Mark as Resolved</Text>
        </TouchableOpacity>
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
  loadingContainer: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
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
  summaryContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  summaryCards: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryCard: {
    flex: 1,
    borderRadius: 8,
    padding: 16,
    margin: 4,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  criticalCard: {
    backgroundColor: '#fef2f2',
  },
  warningCard: {
    backgroundColor: '#fffbeb',
  },
  infoCard: {
    backgroundColor: '#f0f9ff',
  },
  summaryCount: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  filtersContainer: {
    marginBottom: 24,
  },
  filtersTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  filterButtons: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  filterButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
    marginRight: 8,
    borderWidth: 1,
  },
  criticalFilterButton: {
    borderColor: '#f87171',
    backgroundColor: 'white',
  },
  warningFilterButton: {
    borderColor: '#fbbf24',
    backgroundColor: 'white',
  },
  infoFilterButton: {
    borderColor: '#60a5fa',
    backgroundColor: 'white',
  },
  filterButtonActive: {
    backgroundColor: '#f1f5f9',
  },
  filterButtonText: {
    fontSize: 14,
  },
  filterButtonTextActive: {
    fontWeight: '500',
  },
  categoryFilters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  categoryButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: '#f1f5f9',
  },
  categoryButtonActive: {
    backgroundColor: '#e2e8f0',
  },
  categoryButtonText: {
    fontSize: 14,
    color: '#64748b',
  },
  categoryButtonTextActive: {
    color: '#334155',
    fontWeight: '500',
  },
  issuesContainer: {
    flex: 1,
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    borderRadius: 8,
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: 14,
    textAlign: 'center',
  },
  issueCard: {
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
  issueCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  issueTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 8,
  },
  issueSeverityBadge: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  criticalBadge: {
    backgroundColor: '#fef2f2',
  },
  warningBadge: {
    backgroundColor: '#fffbeb',
  },
  infoBadge: {
    backgroundColor: '#f0f9ff',
  },
  issueSeverityText: {
    fontSize: 12,
    fontWeight: '500',
  },
  issueCategory: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 8,
  },
  issueDescription: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  // Detail view styles
  detailContainer: {
    flex: 1,
    backgroundColor: '#f5f8fa',
  },
  detailHeader: {
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backButton: {
    marginBottom: 12,
  },
  backButtonText: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '500',
  },
  detailIssueCategory: {
    fontSize: 14,
    color: '#64748b',
    marginVertical: 4,
  },
  detailIssueTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 4,
  },
  detailScrollView: {
    flex: 1,
    padding: 16,
  },
  detailSection: {
    marginBottom: 24,
  },
  detailSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  detailDescriptionCard: {
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
  detailDescriptionText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  resolveButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 4,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  resolveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});