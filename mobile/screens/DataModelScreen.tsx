import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';

type DataModelScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'DataModel'>;
type DataModelScreenRouteProp = RouteProp<RootStackParamList, 'DataModel'>;

interface DataModelScreenProps {
  navigation: DataModelScreenNavigationProp;
  route: DataModelScreenRouteProp;
}

export default function DataModelScreen({ navigation, route }: DataModelScreenProps) {
  const { orgId } = route.params;
  
  // In a real app, we would fetch the data model for the organization
  const objects = [
    { id: 1, name: 'Account', fields: 25, relationships: 15 },
    { id: 2, name: 'Contact', fields: 20, relationships: 10 },
    { id: 3, name: 'Opportunity', fields: 30, relationships: 12 },
    { id: 4, name: 'Lead', fields: 22, relationships: 8 },
    { id: 5, name: 'Case', fields: 28, relationships: 14 },
  ];

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Standard Objects</Text>
          {objects.map(obj => (
            <TouchableOpacity key={obj.id} style={styles.card}>
              <Text style={styles.objectName}>{obj.name}</Text>
              <View style={styles.objectDetails}>
                <Text style={styles.detailText}>{obj.fields} Fields</Text>
                <Text style={styles.detailText}>{obj.relationships} Relationships</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Custom Objects</Text>
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No custom objects found</Text>
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Object Relationships</Text>
          <View style={styles.card}>
            <Text style={styles.cardText}>
              Object relationship visualization is available in the web application.
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
  content: {
    flex: 1,
    padding: 16,
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
  card: {
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
  objectName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  objectDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailText: {
    fontSize: 14,
    color: '#666',
  },
  emptyState: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#888',
  },
  cardText: {
    fontSize: 14,
    color: '#666',
  },
});