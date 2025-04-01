import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';

type SecurityScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Security'>;
type SecurityScreenRouteProp = RouteProp<RootStackParamList, 'Security'>;

interface SecurityScreenProps {
  navigation: SecurityScreenNavigationProp;
  route: SecurityScreenRouteProp;
}

// Define security issue types
interface SecurityIssue {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  category: string;
  title: string;
  description: string;
}

export default function SecurityScreen({ navigation, route }: SecurityScreenProps) {
  const { orgId } = route.params;
  
  // Placeholder security issues for demonstration
  const [issues] = useState<SecurityIssue[]>([
    {
      id: '1',
      severity: 'critical',
      category: 'Access Control',
      title: 'Public Read/Write Access on Sensitive Object',
      description: 'The Account object has public read/write access enabled, potentially exposing sensitive customer data.'
    },
    {
      id: '2',
      severity: 'warning',
      category: 'Password Policy',
      title: 'Weak Password Policy',
      description: 'Current password policy does not require complexity and allows passwords as short as 6 characters.'
    },
    {
      id: '3',
      severity: 'info',
      category: 'API Security',
      title: 'API Access for Guest User',
      description: 'Guest user profile has API access enabled which may not be necessary for its functionality.'
    },
    {
      id: '4',
      severity: 'warning',
      category: 'Field-Level Security',
      title: 'Sensitive Fields Visible to All Profiles',
      description: 'Several sensitive fields are readable by all profiles, including integration users.'
    },
    {
      id: '5',
      severity: 'critical',
      category: 'CRUD/FLS',
      title: 'Missing CRUD/FLS Security Checks',
      description: 'Several Apex classes do not implement CRUD or FLS security checks before database operations.'
    }
  ]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return '#ef4444';
      case 'warning':
        return '#f59e0b';
      case 'info':
        return '#3b82f6';
      default:
        return '#3b82f6';
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, styles.criticalCard]}>
            <Text style={styles.statNumber}>2</Text>
            <Text style={styles.statLabel}>Critical</Text>
          </View>
          <View style={[styles.statCard, styles.warningCard]}>
            <Text style={styles.statNumber}>2</Text>
            <Text style={styles.statLabel}>Warning</Text>
          </View>
          <View style={[styles.statCard, styles.infoCard]}>
            <Text style={styles.statNumber}>1</Text>
            <Text style={styles.statLabel}>Info</Text>
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security Issues</Text>
          {issues.map(issue => (
            <TouchableOpacity key={issue.id} style={styles.issueCard}>
              <View style={styles.issueTitleRow}>
                <View 
                  style={[
                    styles.severityIndicator, 
                    { backgroundColor: getSeverityColor(issue.severity) }
                  ]} 
                />
                <Text style={styles.issueTitle}>{issue.title}</Text>
              </View>
              <Text style={styles.issueCategory}>{issue.category}</Text>
              <Text style={styles.issueDescription}>{issue.description}</Text>
            </TouchableOpacity>
          ))}
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
  content: {
    flex: 1,
    padding: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginHorizontal: 4,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  criticalCard: {
    borderTopWidth: 4,
    borderTopColor: '#ef4444',
  },
  warningCard: {
    borderTopWidth: 4,
    borderTopColor: '#f59e0b',
  },
  infoCard: {
    borderTopWidth: 4,
    borderTopColor: '#3b82f6',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  issueCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  issueTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  severityIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  issueTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  issueCategory: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  issueDescription: {
    fontSize: 14,
    color: '#666',
  },
});