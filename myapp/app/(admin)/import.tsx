import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/contexts/AuthContext';
import { importProductsFromArray, sampleProducts } from '../../src/services/SimpleImportService';
import { useRouter } from 'expo-router';

const PRIMARY = '#23B6C7';
const PINK = '#E94B7B';

export default function AdminImportScreen() {
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);
  const { token } = useAuth();
  const router = useRouter();

  const handleImportSample = async () => {
    if (!token) {
      Alert.alert('خطأ', 'يجب تسجيل الدخول كمدير');
      return;
    }

    Alert.alert(
      'استيراد البيانات التجريبية',
      `هل تريد إضافة ${sampleProducts.length} منتج تجريبي؟`,
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'استيراد',
          onPress: async () => {
            setIsImporting(true);
            try {
              const result = await importProductsFromArray(sampleProducts, token);
              setImportResult(result);
              
              Alert.alert(
                'تمت العملية',
                `نجح: ${result.success}\nفشل: ${result.failed}\n\nتحقق من النتائج أدناه`
              );
            } catch (error: any) {
              Alert.alert('خطأ', error.message || 'فشل في الاستيراد');
            } finally {
              setIsImporting(false);
            }
          }
        }
      ]
    );
  };

  const handleImportLargeDataset = () => {
    Alert.alert(
      'استيراد بيانات كبيرة',
      'لاستيراد 17 ألف منتج:\n\n1. حضر ملف JSON بالتنسيق المطلوب\n2. استخدم الكود في SimpleImportService.ts\n3. استدعي importProductsFromArray مع البيانات\n\nهذا سيتم في التحديث القادم!',
      [{ text: 'حسناً' }]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>إدارة المنتجات</Text>
        </View>

        <View style={styles.content}>
          <View style={styles.section}>
            <Ionicons name="cloud-upload-outline" size={60} color={PRIMARY} />
            <Text style={styles.title}>استيراد المنتجات</Text>
            <Text style={styles.subtitle}>إضافة منتجات جديدة للمتجر</Text>
          </View>

          <View style={styles.buttonSection}>
            <TouchableOpacity 
              style={[styles.importButton, isImporting && styles.disabledButton]}
              onPress={handleImportSample}
              disabled={isImporting}
            >
              {isImporting ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Ionicons name="flask-outline" size={20} color="white" />
              )}
              <Text style={styles.buttonText}>
                {isImporting ? 'جاري الاستيراد...' : 'استيراد بيانات تجريبية (5 منتجات)'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.largeImportButton}
              onPress={handleImportLargeDataset}
            >
              <Ionicons name="server-outline" size={20} color={PRIMARY} />
              <Text style={styles.largeImportButtonText}>
                استيراد بيانات كبيرة (17K منتج)
              </Text>
            </TouchableOpacity>
          </View>

          {importResult && (
            <View style={styles.resultSection}>
              <Text style={styles.resultTitle}>نتائج الاستيراد:</Text>
              <View style={styles.resultStats}>
                <View style={styles.statItem}>
                  <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                  <Text style={styles.statText}>نجح: {importResult.success}</Text>
                </View>
                <View style={styles.statItem}>
                  <Ionicons name="close-circle" size={20} color="#F44336" />
                  <Text style={styles.statText}>فشل: {importResult.failed}</Text>
                </View>
              </View>
              
              {importResult.errors.length > 0 && (
                <View style={styles.errorsSection}>
                  <Text style={styles.errorsTitle}>الأخطاء:</Text>
                  {importResult.errors.slice(0, 5).map((error: string, index: number) => (
                    <Text key={index} style={styles.errorText}>• {error}</Text>
                  ))}
                  {importResult.errors.length > 5 && (
                    <Text style={styles.moreErrors}>
                      +{importResult.errors.length - 5} أخطاء أخرى
                    </Text>
                  )}
                </View>
              )}
            </View>
          )}

          <View style={styles.infoSection}>
            <Text style={styles.infoTitle}>💡 معلومات مهمة:</Text>
            <Text style={styles.infoText}>• البيانات التجريبية تحتوي على 5 منتجات متنوعة</Text>
            <Text style={styles.infoText}>• لاستيراد 17K منتج، حضر ملف JSON أولاً</Text>
            <Text style={styles.infoText}>• العملية تتم بدفعات لضمان الأداء</Text>
            <Text style={styles.infoText}>• يمكن متابعة التقدم في console logs</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: PRIMARY,
    padding: 20,
    paddingTop: 50,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  content: {
    padding: 20,
  },
  section: {
    backgroundColor: 'white',
    padding: 30,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 15,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
    textAlign: 'center',
  },
  buttonSection: {
    marginBottom: 20,
  },
  importButton: {
    backgroundColor: PINK,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    gap: 10,
  },
  largeImportButton: {
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: PRIMARY,
    gap: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  largeImportButtonText: {
    color: PRIMARY,
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  resultSection: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  resultStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorsSection: {
    backgroundColor: '#ffebee',
    padding: 15,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#F44336',
  },
  errorsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#c62828',
    marginBottom: 10,
  },
  errorText: {
    fontSize: 14,
    color: '#d32f2f',
    marginBottom: 5,
  },
  moreErrors: {
    fontSize: 14,
    color: '#d32f2f',
    fontStyle: 'italic',
    marginTop: 5,
  },
  infoSection: {
    backgroundColor: '#fff3cd',
    padding: 20,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#856404',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#856404',
    marginBottom: 5,
    paddingLeft: 10,
  },
});