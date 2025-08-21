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
  Image,
  Modal,
} from 'react-native';
import { User, LogOut, CreditCard as Edit3, Save, Camera, Key } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '@/contexts/AuthContext';

export default function ProfileScreen() {
  const { profile, signOut, updateProfile, changePassword } = useAuth();
  const [editing, setEditing] = useState(false);
  const [username, setUsername] = useState(profile?.username || '');
  const [age, setAge] = useState(profile?.age?.toString() || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '');
  const [loading, setLoading] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSave = async () => {
    if (!username.trim()) {
      Alert.alert('Error', 'Username cannot be empty');
      return;
    }

    setLoading(true);
    try {
      const updates: Partial<typeof profile> = {
        username: username.trim(),
        bio: bio.trim(),
        avatar_url: avatarUrl,
      };
      
      if (age) {
        updates.age = parseInt(age);
      }
      
      await updateProfile(updates);
      setEditing(false);
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all password fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    try {
      await changePassword(newPassword);
      setShowPasswordModal(false);
      setNewPassword('');
      setConfirmPassword('');
      Alert.alert('Success', 'Password changed successfully!');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera roll permissions to change your avatar.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setAvatarUrl(result.assets[0].uri);
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
            <TouchableOpacity onPress={editing ? pickImage : undefined} style={styles.avatarTouchable}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatar} />
              ) : (
                <User size={80} color="#FFD700" />
              )}
              {editing && (
                <View style={styles.cameraOverlay}>
                  <Camera size={24} color="#FFFFFF" />
                </View>
              )}
            </TouchableOpacity>
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
              <Text style={styles.fieldLabel}>Age</Text>
              {editing ? (
                <TextInput
                  style={styles.input}
                  value={age}
                  onChangeText={setAge}
                  placeholder="Enter age"
                  placeholderTextColor="#666"
                  keyboardType="numeric"
                />
              ) : (
                <Text style={styles.fieldValue}>{profile.age || 'Not set'}</Text>
              )}
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Bio</Text>
              {editing ? (
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={bio}
                  onChangeText={setBio}
                  placeholder="Tell us about yourself"
                  placeholderTextColor="#666"
                  multiline
                  numberOfLines={3}
                />
              ) : (
                <Text style={styles.fieldValue}>{profile.bio || 'No bio yet'}</Text>
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
                    setAge(profile.age?.toString() || '');
                    setBio(profile.bio || '');
                    setAvatarUrl(profile.avatar_url || '');
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
              style={[styles.button, styles.passwordButton]}
              onPress={() => setShowPasswordModal(true)}
            >
              <Key size={20} color="#FFD700" />
              <Text style={styles.passwordButtonText}>Change Password</Text>
            </TouchableOpacity>

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

      <Modal visible={showPasswordModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Change Password</Text>
            
            <TextInput
              style={styles.input}
              placeholder="New Password"
              placeholderTextColor="#666"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
            />
            
            <TextInput
              style={styles.input}
              placeholder="Confirm New Password"
              placeholderTextColor="#666"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.button, styles.saveButton]}
                onPress={handleChangePassword}
              >
                <Text style={styles.saveButtonText}>Change Password</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => {
                  setShowPasswordModal(false);
                  setNewPassword('');
                  setConfirmPassword('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    marginBottom: 30,
  },
  avatarTouchable: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFD700',
    position: 'relative',
  },
  avatar: {
    width: 116,
    height: 116,
    borderRadius: 58,
  },
  cameraOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#FFD700',
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
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
  textArea: {
    height: 80,
    textAlignVertical: 'top',
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
  passwordButton: {
    backgroundColor: '#2a2a2a',
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  passwordButtonText: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#2a2a2a',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 24,
  },
  modalButtons: {
    marginTop: 16,
  },
});