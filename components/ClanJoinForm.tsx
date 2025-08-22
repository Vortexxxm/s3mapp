import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  Modal,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { UserPlus, X, Send } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

interface ClanJoinFormProps {
  visible: boolean;
  onClose: () => void;
}

export default function ClanJoinForm({ visible, onClose }: ClanJoinFormProps) {
  const { session } = useAuth();
  const [freeFireUsername, setFreeFireUsername] = useState('');
  const [age, setAge] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setFreeFireUsername('');
    setAge('');
    setReason('');
  };

  const handleSubmit = async () => {
    if (!freeFireUsername.trim() || !age.trim() || !reason.trim()) {
      Alert.alert('خطأ', 'يرجى ملء جميع الحقول');
      return;
    }

    const ageNum = parseInt(age);
    if (isNaN(ageNum) || ageNum < 10 || ageNum > 50) {
      Alert.alert('خطأ', 'يرجى إدخال عمر صحيح (10-50 سنة)');
      return;
    }

    if (!session?.user) {
      Alert.alert('خطأ', 'يجب تسجيل الدخول أولاً');
      return;
    }

    setLoading(true);
    try {
      // Check if user already has a pending request
      const { data: existingRequest, error: checkError } = await supabase
        .from('clan_join_requests')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('status', 'pending')
        .maybeSingle();

      if (checkError) throw checkError;

      if (existingRequest) {
        Alert.alert('تنبيه', 'لديك طلب انضمام في الانتظار بالفعل');
        setLoading(false);
        return;
      }

      // Create new clan join request
      const { error } = await supabase
        .from('clan_join_requests')
        .insert([{
          user_id: session.user.id,
          free_fire_username: freeFireUsername.trim(),
          age: ageNum,
          reason: reason.trim(),
        }]);

      if (error) throw error;

      resetForm();
      onClose();
      Alert.alert(
        'تم الإرسال بنجاح!', 
        'تم إرسال طلب انضمامك للكلان. سيتم مراجعة طلبك وإشعارك بالنتيجة قريباً.'
      );
    } catch (error: any) {
      Alert.alert('خطأ', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>طلب الانضمام للكلان</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.welcomeSection}>
            <UserPlus size={48} color="#DC143C" />
            <Text style={styles.welcomeTitle}>مرحباً بك في S3M!</Text>
            <Text style={styles.welcomeText}>
              املأ النموذج أدناه لتقديم طلب الانضمام لكلان S3M. سيتم مراجعة طلبك من قبل الإدارة.
            </Text>
          </View>

          <View style={styles.formSection}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>اسم المستخدم في فري فاير *</Text>
              <TextInput
                style={styles.input}
                value={freeFireUsername}
                onChangeText={setFreeFireUsername}
                placeholder="أدخل اسم المستخدم في فري فاير"
                placeholderTextColor="#666"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>العمر *</Text>
              <TextInput
                style={styles.input}
                value={age}
                onChangeText={setAge}
                placeholder="أدخل عمرك"
                placeholderTextColor="#666"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>لماذا تريد الانضمام للكلان؟ *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={reason}
                onChangeText={setReason}
                placeholder="أخبرنا لماذا تريد الانضمام لكلان S3M وما الذي يمكنك تقديمه للفريق"
                placeholderTextColor="#666"
                multiline
                numberOfLines={4}
              />
            </View>

            <TouchableOpacity
              style={[styles.submitButton, loading && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              <Send size={20} color="#FFFFFF" />
              <Text style={styles.submitButtonText}>
                {loading ? 'جاري الإرسال...' : 'إرسال طلب الانضمام'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.infoSection}>
            <Text style={styles.infoTitle}>ملاحظات مهمة:</Text>
            <Text style={styles.infoText}>• سيتم مراجعة طلبك خلال 24-48 ساعة</Text>
            <Text style={styles.infoText}>• ستصلك إشعار بنتيجة الطلب</Text>
            <Text style={styles.infoText}>• يمكنك متابعة حالة طلبك في قسم "الإشعارات"</Text>
            <Text style={styles.infoText}>• تأكد من صحة اسم المستخدم في فري فاير</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    writingDirection: 'rtl',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  welcomeSection: {
    alignItems: 'center',
    marginBottom: 30,
    padding: 20,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#DC143C',
    marginTop: 16,
    marginBottom: 12,
    writingDirection: 'rtl',
  },
  welcomeText: {
    fontSize: 16,
    color: '#CCCCCC',
    textAlign: 'center',
    lineHeight: 22,
    writingDirection: 'rtl',
  },
  formSection: {
    marginBottom: 30,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    color: '#CCCCCC',
    marginBottom: 8,
    fontWeight: '500',
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  input: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#333',
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#DC143C',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
    writingDirection: 'rtl',
  },
  infoSection: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#DC143C',
    marginBottom: 12,
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  infoText: {
    fontSize: 14,
    color: '#CCCCCC',
    marginBottom: 8,
    writingDirection: 'rtl',
    textAlign: 'right',
    lineHeight: 20,
  },
});