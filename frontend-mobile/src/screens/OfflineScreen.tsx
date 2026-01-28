import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Dimensions } from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface OfflineProps {
  onRetry: () => void;
}

export default function OfflineScreen({ onRetry }: OfflineProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <MaterialIcons name="wifi-off" size={60} color="#EF4444" />
      </View>
      
      <Text style={styles.title}>Connection Failed</Text>
      <Text style={styles.subTitle}>
        មិនអាចភ្ជាប់ទៅកាន់ Server បានទេ។{'\n'}សូមពិនិត្យអ៊ីនធឺណិត ឬសាកល្បងម្តងទៀត។
      </Text>

      <TouchableOpacity style={styles.retryBtn} onPress={onRetry}>
        <Ionicons name="refresh" size={20} color="white" />
        <Text style={styles.retryText}>ព្យាយាមម្តងទៀត (Retry)</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FEE2E2', // Red Light
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 10,
  },
  subTitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 22,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 30,
    gap: 10,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  retryText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  }
});