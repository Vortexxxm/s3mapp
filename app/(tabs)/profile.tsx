import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { User, LogOut, CreditCard as Edit3, Save } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';

export default function ProfileScreen() {
  const { profile, signOut, updateProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [username, setUsername] = useState(profile?.username || '');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!username.trim()) {
      Alert.alert('Error', 'Username cannot be empty');
      return;
    }

    setLoading(true);
    try {
      await updateProfile({ username: username.trim() });
      setEditing(false);
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: signOut },
      ]
    );
  };

  if (!profile) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>No profile found</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>

        <View style={styles.profileContainer}>
          <View style={styles.avatarContainer}>
            <User size={80} color="#FFD700" />
          </View>

          <View style={styles.infoContainer}>
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Username</Text>
              {editing ? (
                <TextInput
                  style={styles.input}
                  value={username}
                  onChangeText={setUsername}
                  placeholder="Enter username"
                  placeholderTextColor="#666"
                />
              ) : (
                <Text style={styles.fieldValue}>{profile.username}</Text>
              )}
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Role</Text>
              <Text style={[styles.fieldValue, styles.roleText]}>
                {profile.role.toUpperCase()}
              </Text>
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Member Since</Text>
              <Text style={styles.fieldValue}>
                {new Date(profile.created_at).toLocaleDateString()}
              </Text>
            </View>
          </View>

          <View style={styles.buttonsContainer}>
            {editing ? (
              <View style={styles.editButtons}>
                <TouchableOpacity
                  style={[styles.button, styles.saveButton]}
                  onPress={handleSave}
                  disabled={loading}
                >
                  <Save size={20} color="#000000" />
                  <Text style={styles.saveButtonText}>
                    {loading ? 'Saving...' : 'Save'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={() => {
                    setEditing(false);
                    setUsername(profile.username);
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.button, styles.editButton]}
                onPress={() => setEditing(true)}
              >
                <Edit3 size={20} color="#FFD700" />
                <Text style={styles.editButtonText}>Edit Profile</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.button, styles.signOutButton]}
              onPress={handleSignOut}
            >
              <LogOut size={20} color="#FF4444" />
              <Text style={styles.signOutButtonText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  scrollContainer: {
    flexGrow: 1,
  },
  header: {
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#3a3a3a',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFD700',
    textAlign: 'center',
  },
  profileContainer: {
    padding: 20,
    alignItems: 'center',
  },
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  infoContainer: {
    width: '100%',
    marginBottom: 30,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 16,
    color: '#CCCCCC',
    marginBottom: 8,
    fontWeight: '500',
  },
  fieldValue: {
    fontSize: 18,
    color: '#FFFFFF',
    backgroundColor: '#2a2a2a',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3a3a3a',
  },
  roleText: {
    color: '#FFD700',
    fontWeight: 'bold',
  },
  input: {
    fontSize: 18,
    color: '#FFFFFF',
    backgroundColor: '#2a2a2a',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  buttonsContainer: {
    width: '100%',
  },
  editButtons: {
    marginBottom: 16,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  editButton: {
    backgroundColor: '#2a2a2a',
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  editButtonText: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  saveButton: {
    backgroundColor: '#FFD700',
  },
  saveButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  cancelButton: {
    backgroundColor: '#3a3a3a',
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  signOutButton: {
    backgroundColor: '#2a2a2a',
    borderWidth: 2,
    borderColor: '#FF4444',
  },
  signOutButtonText: {
    color: '#FF4444',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  errorText: {
    color: '#FF4444',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 50,
  },
});