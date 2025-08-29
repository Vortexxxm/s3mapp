import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { isSupabaseConfigured } from '@/lib/supabase';

export default function AuthScreen() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();

  // Show setup message if Supabase is not configured
  if (!isSupabaseConfigured) {
    return (
      <View style={styles.container}>
        <View style={styles.setupContainer}>
          <View style={styles.logoContainer}>
            <View style={styles.logoPlaceholder}>
              <Text style={styles.logoText}>S3M</Text>
            </View>
            <Text style={styles.title}>S3M HUB</Text>
          </View>
          
          <View style={styles.setupMessage}>
            <Text style={styles.setupTitle}>إعداد قاعدة البيانات مطلوب</Text>
            <Text style={styles.setupText}>
              يرجى النقر على زر "Connect to Supabase" في الأعلى لإعداد قاعدة البيانات وبدء استخدام التطبيق.
            </Text>
          </View>
        </View>
      </View>
    );
  }

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert('خطأ', 'يرجى ملء جميع الحقول');
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        await signUp(email, password);
        Alert.alert('نجح', 'تم إنشاء الحساب بنجاح!');
      } else {
        await signIn(email, password);
      }
    } catch (error: any) {
      let errorMessage = 'حدث خطأ غير متوقع';
      
      if (error.message?.includes('Invalid login credentials')) {
        errorMessage = isSignUp 
          ? 'البريد الإلكتروني مستخدم بالفعل أو كلمة المرور ضعيفة'
          : 'البريد الإلكتروني أو كلمة المرور غير صحيح';
      } else if (error.message?.includes('Email not confirmed')) {
        errorMessage = 'يرجى تأكيد البريد الإلكتروني أولاً';
      } else if (error.message?.includes('Password should be at least')) {
        errorMessage = 'كلمة المرور يجب أن تكون 6 أحرف على الأقل';
      } else if (error.message?.includes('Unable to validate email address')) {
        errorMessage = 'عنوان البريد الإلكتروني غير صالح';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('خطأ', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.logoContainer}>
          <View style={styles.logoPlaceholder}>
            <Text style={styles.logoText}>S3M</Text>
          </View>
          <Text style={styles.title}>S3M HUB</Text>
          <Text style={styles.subtitle}>
            {isSignUp ? 'إنشاء حساب' : 'مرحباً بعودتك'}
          </Text>
        </View>

        <View style={styles.formContainer}>
          <TextInput
            style={styles.input}
            placeholder="البريد الإلكتروني"
            placeholderTextColor="#666"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TextInput
            style={styles.input}
            placeholder="كلمة المرور"
            placeholderTextColor="#666"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleAuth}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'جاري التحميل...' : isSignUp ? 'إنشاء حساب' : 'تسجيل الدخول'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.switchButton}
            onPress={() => setIsSignUp(!isSignUp)}
          >
            <Text style={styles.switchText}>
              {isSignUp
                ? 'لديك حساب بالفعل؟ تسجيل الدخول'
                : 'ليس لديك حساب؟ إنشاء حساب'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#DC143C',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#DC143C',
    marginBottom: 8,
    writingDirection: 'rtl',
  },
  subtitle: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '300',
    writingDirection: 'rtl',
  },
  formContainer: {
    width: '100%',
  },
  input: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333',
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  button: {
    backgroundColor: '#DC143C',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    writingDirection: 'rtl',
  },
  switchButton: {
    alignItems: 'center',
    marginTop: 24,
  },
  switchText: {
    color: '#DC143C',
    fontSize: 16,
    writingDirection: 'rtl',
  },
  setupContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  setupMessage: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 24,
    borderWidth: 1,
    borderColor: '#DC143C',
    maxWidth: 400,
  },
  setupTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#DC143C',
    textAlign: 'center',
    marginBottom: 16,
    writingDirection: 'rtl',
  },
  setupText: {
    fontSize: 16,
    color: '#CCCCCC',
    textAlign: 'center',
    lineHeight: 24,
    writingDirection: 'rtl',
  },
});