import React, { useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, I18nManager } from 'react-native';
import { Settings } from 'lucide-react-native';

export default function AdminScreen() {
  useEffect(() => {
    I18nManager.forceRTL(true);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>الإدارة</Text>
      </View>
      
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Settings size={24} color="#DC143C" />
            <Text style={styles.sectionTitle}>ميزات الإدارة</Text>
          </View>
          <Text style={styles.description}>
            سيتم تنفيذ وظائف الإدارة هنا قريباً.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#DC143C',
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  content: {
    padding: 20,
  },
  section: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    justifyContent: 'flex-end',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginRight: 8,
    writingDirection: 'rtl',
  },
  description: {
    fontSize: 16,
    color: '#CCCCCC',
    lineHeight: 22,
    writingDirection: 'rtl',
    textAlign: 'right',
  },
});