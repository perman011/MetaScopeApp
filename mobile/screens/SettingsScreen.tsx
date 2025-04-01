import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Switch, 
  TouchableOpacity, 
  ScrollView,
  Alert
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';

type SettingsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Settings'>;

interface SettingsScreenProps {
  navigation: SettingsScreenNavigationProp;
}

interface SettingItem {
  id: string;
  title: string;
  type: 'toggle' | 'button' | 'info';
  value?: boolean;
  description?: string;
  action?: () => void;
}

export default function SettingsScreen({ navigation }: SettingsScreenProps) {
  const [settings, setSettings] = useState<SettingItem[]>([
    {
      id: 'darkMode',
      title: 'Dark Mode',
      type: 'toggle',
      value: false,
      description: 'Enable dark mode for better viewing at night'
    },
    {
      id: 'notifications',
      title: 'Push Notifications',
      type: 'toggle',
      value: true,
      description: 'Get notified about security issues and updates'
    },
    {
      id: 'autoSync',
      title: 'Automatic Sync',
      type: 'toggle',
      value: true,
      description: 'Automatically sync metadata when the app opens'
    },
    {
      id: 'syncFrequency',
      title: 'Sync Frequency',
      type: 'info',
      description: 'Daily'
    },
    {
      id: 'dataUsage',
      title: 'Optimize Data Usage',
      type: 'toggle',
      value: true,
      description: 'Reduce data usage by loading less metadata at once'
    },
    {
      id: 'clearCache',
      title: 'Clear Cache',
      type: 'button',
      description: 'Clear locally stored metadata (11.2 MB)',
      action: () => {
        Alert.alert(
          'Clear Cache',
          'Are you sure you want to clear the cache? This will remove all locally stored metadata.',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Clear', 
              style: 'destructive',
              onPress: () => {
                Alert.alert('Cache Cleared', 'All locally stored metadata has been cleared.');
              }
            }
          ]
        );
      }
    },
    {
      id: 'logout',
      title: 'Logout',
      type: 'button',
      description: 'Sign out of your account',
      action: () => {
        Alert.alert(
          'Logout',
          'Are you sure you want to logout?',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Logout', 
              style: 'destructive',
              onPress: () => {
                navigation.replace('Login');
              }
            }
          ]
        );
      }
    }
  ]);

  const handleToggle = (id: string, newValue: boolean) => {
    setSettings(settings.map(setting => 
      setting.id === id ? { ...setting, value: newValue } : setting
    ));
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Settings</Text>
          {settings.map(setting => (
            <View key={setting.id} style={styles.settingCard}>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>{setting.title}</Text>
                {setting.description && (
                  <Text style={styles.settingDescription}>{setting.description}</Text>
                )}
              </View>
              
              {setting.type === 'toggle' && (
                <Switch
                  value={setting.value}
                  onValueChange={(newValue) => handleToggle(setting.id, newValue)}
                  trackColor={{ false: '#d1d5db', true: '#bfdbfe' }}
                  thumbColor={setting.value ? '#3b82f6' : '#9ca3af'}
                />
              )}
              
              {setting.type === 'button' && (
                <TouchableOpacity
                  style={styles.settingButton}
                  onPress={setting.action}
                >
                  <Text 
                    style={[
                      styles.settingButtonText,
                      setting.id === 'logout' && styles.logoutButtonText
                    ]}
                  >
                    {setting.id === 'logout' ? 'Logout' : 'Clear'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.aboutCard}>
            <Text style={styles.appName}>Salesforce Metadata Manager</Text>
            <Text style={styles.version}>Version 1.0.0</Text>
            <Text style={styles.copyright}>© 2025 All Rights Reserved</Text>
            
            <View style={styles.linksContainer}>
              <TouchableOpacity style={styles.link}>
                <Text style={styles.linkText}>Privacy Policy</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.link}>
                <Text style={styles.linkText}>Terms of Service</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.link}>
                <Text style={styles.linkText}>Support</Text>
              </TouchableOpacity>
            </View>
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
  settingCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#666',
  },
  settingButton: {
    backgroundColor: '#f1f5f9',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
  },
  settingButtonText: {
    fontSize: 14,
    color: '#334155',
    fontWeight: '500',
  },
  logoutButtonText: {
    color: '#ef4444',
  },
  aboutCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  appName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  version: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  copyright: {
    fontSize: 12,
    color: '#999',
    marginBottom: 16,
  },
  linksContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  link: {
    margin: 8,
  },
  linkText: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '500',
  },
});