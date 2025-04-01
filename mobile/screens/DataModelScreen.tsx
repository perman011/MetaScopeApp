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
import { metadataApi } from '../api/client';

type DataModelScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'DataModel'>;
type DataModelScreenRouteProp = RouteProp<RootStackParamList, 'DataModel'>;

interface DataModelScreenProps {
  navigation: DataModelScreenNavigationProp;
  route: DataModelScreenRouteProp;
}

interface ObjectMetadata {
  id: string;
  name: string;
  label: string;
  fields: FieldMetadata[];
  relationships: RelationshipMetadata[];
}

interface FieldMetadata {
  name: string;
  label: string;
  type: string;
  isRequired: boolean;
}

interface RelationshipMetadata {
  name: string;
  label: string;
  referenceTo: string;
  type: 'Lookup' | 'MasterDetail';
}

export default function DataModelScreen({ navigation, route }: DataModelScreenProps) {
  const { orgId } = route.params;
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [objects, setObjects] = useState<ObjectMetadata[]>([]);
  const [selectedObject, setSelectedObject] = useState<ObjectMetadata | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('');

  const fetchMetadata = async () => {
    try {
      setError(null);
      
      // In a real app, this would fetch from the API
      // const response = await metadataApi.getOrgMetadata(orgId, 'CustomObject');
      // setObjects(response);
      
      // Simulate network request with mock data
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const mockObjects: ObjectMetadata[] = [
        {
          id: '1',
          name: 'Account',
          label: 'Account',
          fields: [
            { name: 'Name', label: 'Name', type: 'Text', isRequired: true },
            { name: 'Phone', label: 'Phone', type: 'Phone', isRequired: false },
            { name: 'Industry', label: 'Industry', type: 'Picklist', isRequired: false },
            { name: 'AnnualRevenue', label: 'Annual Revenue', type: 'Currency', isRequired: false },
          ],
          relationships: [
            { name: 'Contacts', label: 'Contacts', referenceTo: 'Contact', type: 'Lookup' },
            { name: 'Opportunities', label: 'Opportunities', referenceTo: 'Opportunity', type: 'Lookup' },
          ]
        },
        {
          id: '2',
          name: 'Contact',
          label: 'Contact',
          fields: [
            { name: 'FirstName', label: 'First Name', type: 'Text', isRequired: false },
            { name: 'LastName', label: 'Last Name', type: 'Text', isRequired: true },
            { name: 'Email', label: 'Email', type: 'Email', isRequired: false },
            { name: 'Phone', label: 'Phone', type: 'Phone', isRequired: false },
          ],
          relationships: [
            { name: 'Account', label: 'Account', referenceTo: 'Account', type: 'MasterDetail' },
          ]
        },
        {
          id: '3',
          name: 'Opportunity',
          label: 'Opportunity',
          fields: [
            { name: 'Name', label: 'Name', type: 'Text', isRequired: true },
            { name: 'StageName', label: 'Stage', type: 'Picklist', isRequired: true },
            { name: 'CloseDate', label: 'Close Date', type: 'Date', isRequired: true },
            { name: 'Amount', label: 'Amount', type: 'Currency', isRequired: false },
          ],
          relationships: [
            { name: 'Account', label: 'Account', referenceTo: 'Account', type: 'MasterDetail' },
          ]
        },
        {
          id: '4',
          name: 'CustomObject__c',
          label: 'Custom Object',
          fields: [
            { name: 'Name', label: 'Name', type: 'Text', isRequired: true },
            { name: 'CustomField__c', label: 'Custom Field', type: 'Text', isRequired: false },
          ],
          relationships: []
        }
      ];
      
      setObjects(mockObjects);
    } catch (err) {
      setError('Failed to load metadata. Please try again.');
      console.error('Error fetching metadata:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMetadata();
  }, [orgId]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchMetadata();
  };

  const selectObject = (object: ObjectMetadata) => {
    setSelectedObject(object);
  };

  const goBack = () => {
    setSelectedObject(null);
  };

  const filteredObjects = objects.filter(obj => 
    obj.name.toLowerCase().includes(filter.toLowerCase()) || 
    obj.label.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <View style={styles.container}>
      {selectedObject ? (
        <ObjectDetailView object={selectedObject} onBack={goBack} />
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
              <Text style={styles.loadingText}>Loading data model...</Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={fetchMetadata}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.objectsContainer}>
              <Text style={styles.sectionTitle}>Objects</Text>
              
              {filteredObjects.map(object => (
                <TouchableOpacity 
                  key={object.id} 
                  style={styles.objectCard}
                  onPress={() => selectObject(object)}
                >
                  <Text style={styles.objectName}>{object.label}</Text>
                  <Text style={styles.objectApiName}>{object.name}</Text>
                  <View style={styles.stats}>
                    <Text style={styles.statText}>
                      {object.fields.length} fields
                    </Text>
                    <Text style={styles.statDivider}>•</Text>
                    <Text style={styles.statText}>
                      {object.relationships.length} relationships
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

interface ObjectDetailViewProps {
  object: ObjectMetadata;
  onBack: () => void;
}

function ObjectDetailView({ object, onBack }: ObjectDetailViewProps) {
  return (
    <View style={styles.detailContainer}>
      <View style={styles.detailHeader}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.detailObjectName}>{object.label}</Text>
        <Text style={styles.detailObjectApiName}>{object.name}</Text>
      </View>
      
      <ScrollView style={styles.detailScrollView}>
        {object.fields.length > 0 && (
          <View style={styles.detailSection}>
            <Text style={styles.detailSectionTitle}>Fields</Text>
            {object.fields.map((field, index) => (
              <View key={field.name} style={styles.detailItemCard}>
                <View style={styles.detailItemHeader}>
                  <Text style={styles.detailItemName}>{field.label}</Text>
                  <Text style={styles.detailItemType}>{field.type}</Text>
                </View>
                <Text style={styles.detailItemApiName}>{field.name}</Text>
                {field.isRequired && (
                  <View style={styles.requiredBadge}>
                    <Text style={styles.requiredBadgeText}>Required</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}
        
        {object.relationships.length > 0 && (
          <View style={styles.detailSection}>
            <Text style={styles.detailSectionTitle}>Relationships</Text>
            {object.relationships.map((rel, index) => (
              <View key={rel.name} style={styles.detailItemCard}>
                <View style={styles.detailItemHeader}>
                  <Text style={styles.detailItemName}>{rel.label}</Text>
                  <Text style={[
                    styles.relationshipTypeBadge,
                    rel.type === 'MasterDetail' ? styles.masterDetailBadge : styles.lookupBadge
                  ]}>
                    {rel.type}
                  </Text>
                </View>
                <Text style={styles.detailItemApiName}>{rel.name}</Text>
                <Text style={styles.referenceToText}>
                  References: {rel.referenceTo}
                </Text>
              </View>
            ))}
          </View>
        )}
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
  objectsContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  objectCard: {
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
  objectName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  objectApiName: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 8,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 12,
    color: '#94a3b8',
  },
  statDivider: {
    fontSize: 12,
    color: '#94a3b8',
    marginHorizontal: 4,
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
  detailObjectName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  detailObjectApiName: {
    fontSize: 14,
    color: '#64748b',
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
  detailItemCard: {
    padding: 12,
    backgroundColor: 'white',
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
  detailItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailItemName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  detailItemType: {
    fontSize: 12,
    color: '#64748b',
    backgroundColor: '#f1f5f9',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  detailItemApiName: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 4,
  },
  requiredBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#eff6ff',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
    marginTop: 4,
  },
  requiredBadgeText: {
    fontSize: 10,
    color: '#3b82f6',
    fontWeight: '500',
  },
  relationshipTypeBadge: {
    fontSize: 12,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  masterDetailBadge: {
    backgroundColor: '#fef3c7',
    color: '#d97706',
  },
  lookupBadge: {
    backgroundColor: '#dbeafe',
    color: '#3b82f6',
  },
  referenceToText: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
});