import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ScrollView,
  ActivityIndicator 
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';

type SoqlEditorScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'SoqlEditor'>;
type SoqlEditorScreenRouteProp = RouteProp<RootStackParamList, 'SoqlEditor'>;

interface SoqlEditorScreenProps {
  navigation: SoqlEditorScreenNavigationProp;
  route: SoqlEditorScreenRouteProp;
}

interface QueryResult {
  records: any[];
  totalSize: number;
  done: boolean;
}

export default function SoqlEditorScreen({ navigation, route }: SoqlEditorScreenProps) {
  const { orgId } = route.params;
  const [query, setQuery] = useState("SELECT Id, Name FROM Account LIMIT 10");
  const [isExecuting, setIsExecuting] = useState(false);
  const [result, setResult] = useState<QueryResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const executeQuery = () => {
    setIsExecuting(true);
    setError(null);
    
    // Simulate API call to execute SOQL query
    setTimeout(() => {
      setIsExecuting(false);
      
      if (query.trim() === '') {
        setError('Query cannot be empty');
        return;
      }
      
      // Mock response data
      setResult({
        records: [
          { Id: '001xx000003DGbzAAG', Name: 'Global Media' },
          { Id: '001xx000003DGc0AAG', Name: 'Acme Corp' },
          { Id: '001xx000003DGc1AAG', Name: 'Universal Containers' },
          { Id: '001xx000003DGc2AAG', Name: 'Edge Communications' },
          { Id: '001xx000003DGc3AAG', Name: 'Burlington Textiles' }
        ],
        totalSize: 5,
        done: true
      });
    }, 1500);
  };

  const clearResults = () => {
    setResult(null);
    setError(null);
  };

  return (
    <View style={styles.container}>
      <View style={styles.editorContainer}>
        <View style={styles.editorHeader}>
          <Text style={styles.editorTitle}>SOQL Query</Text>
          <View style={styles.editorActions}>
            <TouchableOpacity 
              style={styles.editorButton} 
              onPress={clearResults}
            >
              <Text style={styles.editorButtonText}>Clear</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.editorButton, styles.executeButton]}
              onPress={executeQuery}
              disabled={isExecuting}
            >
              <Text style={styles.executeButtonText}>
                {isExecuting ? 'Executing...' : 'Execute Query'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <TextInput
          style={styles.queryInput}
          value={query}
          onChangeText={setQuery}
          multiline
          numberOfLines={5}
          placeholder="Enter SOQL query..."
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>
      
      <View style={styles.resultsContainer}>
        <Text style={styles.resultsTitle}>Results</Text>
        
        {isExecuting && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text style={styles.loadingText}>Executing query...</Text>
          </View>
        )}
        
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
        
        {!isExecuting && !error && result && (
          <>
            <View style={styles.resultStats}>
              <Text style={styles.resultStatsText}>
                {result.totalSize} {result.totalSize === 1 ? 'record' : 'records'} returned
              </Text>
            </View>
            
            <ScrollView style={styles.recordsContainer}>
              {result.records.map((record, index) => (
                <View key={record.Id} style={styles.recordCard}>
                  <Text style={styles.recordHeader}>Record {index + 1}</Text>
                  {Object.entries(record).map(([key, value]) => (
                    <View key={key} style={styles.recordField}>
                      <Text style={styles.fieldName}>{key}:</Text>
                      <Text style={styles.fieldValue}>{String(value)}</Text>
                    </View>
                  ))}
                </View>
              ))}
            </ScrollView>
          </>
        )}
        
        {!isExecuting && !error && !result && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              Enter a SOQL query and press "Execute Query" to see results
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f8fa',
    padding: 16,
  },
  editorContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  editorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  editorTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  editorActions: {
    flexDirection: 'row',
  },
  editorButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
    marginLeft: 8,
    backgroundColor: '#f1f5f9',
  },
  editorButtonText: {
    fontSize: 14,
    color: '#64748b',
  },
  executeButton: {
    backgroundColor: '#3b82f6',
  },
  executeButtonText: {
    fontSize: 14,
    color: 'white',
    fontWeight: '500',
  },
  queryInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 4,
    padding: 12,
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    height: 120,
    textAlignVertical: 'top',
  },
  resultsContainer: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748b',
  },
  errorContainer: {
    backgroundColor: '#fee2e2',
    borderRadius: 4,
    padding: 12,
    marginBottom: 12,
  },
  errorText: {
    color: '#b91c1c',
    fontSize: 14,
  },
  resultStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  resultStatsText: {
    fontSize: 14,
    color: '#64748b',
  },
  recordsContainer: {
    flex: 1,
  },
  recordCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 4,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#3b82f6',
  },
  recordHeader: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  recordField: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  fieldName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
    marginRight: 8,
    minWidth: 80,
  },
  fieldValue: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyStateText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#94a3b8',
  },
});