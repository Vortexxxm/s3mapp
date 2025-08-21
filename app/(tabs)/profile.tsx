import React, { useState, useEffect } from 'react';
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
  I18nManager,
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

  useEffect(() => {
    I18nManager.forceRTL(true);
  }, []);

  const handleSave = async () => {
    if (!username.trim()) {
      Alert.alert('خطأ', 'لا يمكن أن يكون اسم المستخدم فارغاً');
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
      Alert.alert('نجح', 'تم تحديث الملف الشخصي بنجاح!');
    } catch (error: any) {
      Alert.alert('خطأ', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert('خطأ', 'يرجى ملء جميع حقول كلمة المرور');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('خطأ', 'كلمات المرور غير متطابقة');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('خطأ', 'يجب أن تكون كلمة المرور 6 أحرف على الأقل');
      return;
    }

    try {
      await changePassword(newPassword);
      setShowPasswordModal(false);
      setNewPassword('');
      setConfirmPassword('');
      Alert.alert('نجح', 'تم تغيير كلمة المرور بنجاح!');
    } catch (error: any) {
      Alert.alert('خطأ', error.message);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('إذن مطلوب', 'يرجى منح إذن الوصول للصور لتغيير صورتك الشخصية.');
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
      'تسجيل الخروج',
      'هل أنت متأكد من رغبتك في تسجيل الخروج؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        { text: 'تسجيل الخروج', style: 'destructive', onPress: signOut },
      ]
    );
  };

  if (!profile) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>لم يتم العثور على ملف شخصي</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>الملف الشخصي</Text>
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
              <Text style={styles.fieldLabel}>اسم المستخدم</Text>
              {editing ? (
                <TextInput
                  style={styles.input}
                  value={username}
                  onChangeText={setUsername}
                  placeholder="أدخل اسم المستخدم"
                  placeholderTextColor="#666"
                />
              ) : (
                <Text style={styles.fieldValue}>{profile.username}</Text>
              )}
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>العمر</Text>
              {editing ? (
                <TextInput
                  style={styles.input}
                  value={age}
                  onChangeText={setAge}
                  placeholder="أدخل العمر"
                  placeholderTextColor="#666"
                  keyboardType="numeric"
                />
              ) : (
                <Text style={styles.fieldValue}>{profile.age || 'غير محدد'}</Text>
              )}
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>النبذة الشخصية</Text>
              {editing ? (
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={bio}
                  onChangeText={setBio}
                  placeholder="أخبرنا عن نفسك"
                  placeholderTextColor="#666"
                  multiline
                  numberOfLines={3}
                />
              ) : (
                <Text style={styles.fieldValue}>{profile.bio || 'لا توجد نبذة شخصية بعد'}</Text>
              )}
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>الدور</Text>
              <Text style={[styles.fieldValue, styles.roleText]}>
                {profile.role === 'admin' ? 'مشرف' : 'مستخدم'}
              </Text>
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>عضو منذ</Text>
              <Text style={styles.fieldValue}>
                {new Date(profile.created_at).toLocaleDateString('ar-SA')}
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
                    {loading ? 'جاري الحفظ...' : 'حفظ'}
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
                  <Text style={styles.cancelButtonText}>إلغاء</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.button, styles.editButton]}
                onPress={() => setEditing(true)}
              >
                <Edit3 size={20} color="#FFD700" />
                <Text style={styles.editButtonText}>تعديل الملف الشخصي</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.button, styles.passwordButton]}
              onPress={() => setShowPasswordModal(true)}
            >
              <Key size={20} color="#FFD700" />
              <Text style={styles.passwordButtonText}>تغيير كلمة المرور</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.signOutButton]}
              onPress={handleSignOut}
            >
              <LogOut size={20} color="#FF4444" />
              <Text style={styles.signOutButtonText}>تسجيل الخروج</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <Modal visible={showPasswordModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>تغيير كلمة المرور</Text>
            
            <TextInput
              style={styles.input}
              placeholder="كلمة المرور الجديدة"
              placeholderTextColor="#666"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
            />
            
            <TextInput
              style={styles.input}
              placeholder="تأكيد كلمة المرور الجديدة"
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
                <Text style={styles.saveButtonText}>تغيير كلمة المرور</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => {
                  setShowPasswordModal(false);
                  setNewPassword('');
                  setConfirmPassword('');
                }}
              >
                <Text style={styles.cancelButtonText}>إلغاء</Text>
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
    backgroundColor: '#0a0a0a',
  },
  scrollContainer: {
    flexGrow: 1,
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
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#DC143C',
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
    backgroundColor: '#DC143C',
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
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  fieldValue: {
    fontSize: 18,
    color: '#FFFFFF',
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  roleText: {
    color: '#DC143C',
    fontWeight: 'bold',
  },
  input: {
    fontSize: 18,
    color: '#FFFFFF',
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#DC143C',
    writingDirection: 'rtl',
    textAlign: 'right',
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
    backgroundColor: '#1a1a1a',
    borderWidth: 2,
    borderColor: '#DC143C',
  },
  editButtonText: {
    color: '#DC143C',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
    writingDirection: 'rtl',
  },
  saveButton: {
    backgroundColor: '#DC143C',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
    writingDirection: 'rtl',
  },
  cancelButton: {
    backgroundColor: '#333',
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    writingDirection: 'rtl',
  },
  passwordButton: {
    backgroundColor: '#1a1a1a',
    borderWidth: 2,
    borderColor: '#DC143C',
  },
  passwordButtonText: {
    color: '#DC143C',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
    writingDirection: 'rtl',
  },
  signOutButton: {
    backgroundColor: '#1a1a1a',
    borderWidth: 2,
    borderColor: '#FF4444',
  },
  signOutButtonText: {
    color: '#FF4444',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
    writingDirection: 'rtl',
  },
  errorText: {
    color: '#FF4444',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 50,
    writingDirection: 'rtl',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
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
    writingDirection: 'rtl',
  },
  modalButtons: {
    marginTop: 16,
  },
});