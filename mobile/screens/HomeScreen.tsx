import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView, 
  TouchableOpacity, 
  RefreshControl 
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

interface HomeScreenProps {
  navigation: HomeScreenNavigationProp;
}

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const [refreshing, setRefreshing] = useState(false);
  // In a real app, this would come from the API
  const [organizations, setOrganizations] = useState([
    { id: 1, name: 'Demo Organization', type: 'Production', lastSync: '2025-04-01T10:30:00Z' }
  ]);
  
  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    // In a real app, we would fetch the organizations from the API
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Organizations</Text>
          {organizations.map(org => (
            <View key={org.id} style={styles.card}>
              <Text style={styles.cardTitle}>{org.name}</Text>
              <Text style={styles.cardSubtitle}>{org.type}</Text>
              <Text style={styles.cardDescription}>
                Last Synchronized: {new Date(org.lastSync).toLocaleString()}
              </Text>
              <View style={styles.buttonRow}>
                <TouchableOpacity 
                  style={styles.button}
                  onPress={() => navigation.navigate('DataModel', { orgId: org.id })}
                >
                  <Text style={styles.buttonText}>Data Model</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.button}
                  onPress={() => navigation.navigate('Security', { orgId: org.id })}
                >
                  <Text style={styles.buttonText}>Security</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.button}
                  onPress={() => navigation.navigate('SoqlEditor', { orgId: org.id })}
                >
                  <Text style={styles.buttonText}>SOQL</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Connect New Organization</Text>
          <View style={styles.card}>
            <Text style={styles.cardDescription}>
              Connect to a Salesforce organization to begin analyzing metadata.
            </Text>
            <TouchableOpacity style={[styles.button, styles.primaryButton]}>
              <Text style={styles.buttonText}>Connect Org</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <View style={styles.card}>
            <Text style={styles.cardDescription}>
              No recent activity to display.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
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
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#333',
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  button: {
    backgroundColor: '#3b82f6',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
    marginHorizontal: 4,
    marginBottom: 8,
  },
  primaryButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  buttonText: {
    color: 'white',
    fontWeight: '500',
    fontSize: 14,
  },
});