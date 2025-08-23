import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { Trash2, TriangleAlert as AlertTriangle, Database } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';

export default function DataManagement() {
  const [deleting, setDeleting] = useState(false);

  const handleDeleteAllData = async () => {
    Alert.alert(
      'تحذير خطير!',
      'هذا الإجراء سيحذف جميع البيانات من قاعدة البيانات نهائياً ولا يمكن التراجع عنه. هل أنت متأكد؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'نعم، احذف كل شيء',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'تأكيد نهائي',
              'هذا هو التأكيد الأخير. سيتم حذف:\n\n• جميع الأخبار\n• جميع بيانات المتصدرين\n• جميع بيانات أفضل لاعب\n• جميع الجوائز الخاصة\n• جميع طلبات الانضمام\n• جميع الإشعارات\n\nهل أنت متأكد 100%؟',
              [
                { text: 'إلغاء', style: 'cancel' },
                {
                  text: 'نعم، احذف كل شيء نهائياً',
                  style: 'destructive',
                  onPress: confirmDeleteAll,
                },
              ]
            );
          },
        },
      ]
    );
  };

  const confirmDeleteAll = async () => {
    setDeleting(true);
    try {
      // Delete in order to avoid foreign key constraints
      console.log('🗑️ Starting data deletion...');

      // 1. Delete notifications first
      const { error: notificationsError } = await supabase
        .from('notifications')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

      if (notificationsError) throw notificationsError;
      console.log('✅ Deleted all notifications');

      // 2. Delete clan join requests
      const { error: requestsError } = await supabase
        .from('clan_join_requests')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

      if (requestsError) throw requestsError;
      console.log('✅ Deleted all clan join requests');

      // 3. Delete special awards
      const { error: awardsError } = await supabase
        .from('special_awards')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

      if (awardsError) throw awardsError;
      console.log('✅ Deleted all special awards');

      // 4. Delete top players
      const { error: playersError } = await supabase
        .from('top_players')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

      if (playersError) throw playersError;
      console.log('✅ Deleted all top players');

      // 5. Delete leaderboard
      const { error: leaderboardError } = await supabase
        .from('leaderboard')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

      if (leaderboardError) throw leaderboardError;
      console.log('✅ Deleted all leaderboard entries');

      // 6. Delete news
      const { error: newsError } = await supabase
        .from('news')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

      if (newsError) throw newsError;
      console.log('✅ Deleted all news');

      console.log('🎉 All data deleted successfully!');
      Alert.alert('نجح', 'تم حذف جميع البيانات بنجاح!');
    } catch (error: any) {
      console.error('❌ Error deleting data:', error);
      Alert.alert('خطأ', `حدث خطأ أثناء حذف البيانات: ${error.message}`);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Database size={20} color="#DC143C" />
        <Text style={styles.headerTitle}>إدارة البيانات</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.warningSection}>
          <AlertTriangle size={32} color="#FF4444" />
          <Text style={styles.warningTitle}>منطقة خطر!</Text>
          <Text style={styles.warningText}>
            العمليات في هذا القسم خطيرة ولا يمكن التراجع عنها. تأكد من أنك تعرف ما تفعله.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>حذف جميع البيانات</Text>
          <Text style={styles.sectionDescription}>
            سيتم حذف جميع البيانات من قاعدة البيانات بما في ذلك:
          </Text>
          
          <View style={styles.dataList}>
            <Text style={styles.dataItem}>• جميع الأخبار والمقالات</Text>
            <Text style={styles.dataItem}>• جميع بيانات المتصدرين</Text>
            <Text style={styles.dataItem}>• جميع بيانات أفضل لاعب</Text>
            <Text style={styles.dataItem}>• جميع الجوائز الخاصة</Text>
            <Text style={styles.dataItem}>• جميع طلبات الانضمام للكلان</Text>
            <Text style={styles.dataItem}>• جميع الإشعارات</Text>
          </View>

          <View style={styles.noteSection}>
            <Text style={styles.noteTitle}>ملاحظة مهمة:</Text>
            <Text style={styles.noteText}>
              لن يتم حذف حسابات المستخدمين أو ملفاتهم الشخصية. سيتم حذف المحتوى فقط.
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.deleteAllButton, deleting && styles.buttonDisabled]}
            onPress={handleDeleteAllData}
            disabled={deleting}
          >
            <Trash2 size={20} color="#FFFFFF" />
            <Text style={styles.deleteAllButtonText}>
              {deleting ? 'جاري الحذف...' : 'حذف جميع البيانات نهائياً'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
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
    justifyContent: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 8,
    writingDirection: 'rtl',
  },
  content: {
    padding: 20,
  },
  warningSection: {
    backgroundColor: '#2D1B1B',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 30,
    borderWidth: 2,
    borderColor: '#FF4444',
  },
  warningTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF4444',
    marginTop: 12,
    marginBottom: 8,
    writingDirection: 'rtl',
  },
  warningText: {
    fontSize: 14,
    color: '#FFCCCC',
    textAlign: 'center',
    lineHeight: 20,
    writingDirection: 'rtl',
  },
  section: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  sectionDescription: {
    fontSize: 14,
    color: '#CCCCCC',
    marginBottom: 16,
    writingDirection: 'rtl',
    textAlign: 'right',
    lineHeight: 20,
  },
  dataList: {
    marginBottom: 20,
  },
  dataItem: {
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 8,
    writingDirection: 'rtl',
    textAlign: 'right',
    lineHeight: 20,
  },
  noteSection: {
    backgroundColor: '#2D2D1B',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  noteTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 8,
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  noteText: {
    fontSize: 13,
    color: '#FFFFCC',
    writingDirection: 'rtl',
    textAlign: 'right',
    lineHeight: 18,
  },
  deleteAllButton: {
    backgroundColor: '#FF4444',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  deleteAllButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
    writingDirection: 'rtl',
  },
});