import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/contexts/AuthContext';
import { importProductsFromArray, sampleProducts } from '../../src/services/SimpleImportService';

const PRIMARY = '#23B6C7';
const PINK = '#E94B7B';

export default function ProductImportScreen() {
  const [isImporting, setIsImporting] = useState(false);
  const [jsonInput, setJsonInput] = useState('');
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<any>(null);
  const { token } = useAuth();

  // الاستيراد الحقيقي للباك اند
  const realImport = async (products: any[]) => {
    if (!token) {
      Alert.alert('خطأ', 'يجب تسجيل الدخول كمدير');
      return;
    }

    setIsImporting(true);
    setImportProgress(0);

    try {
      const result = await importProductsFromArray(products, token);
      setImportResult(result);
      
      Alert.alert(
        'تمت العملية',
        `نجح: ${result.success}\nفشل: ${result.failed}`
      );
      
    } catch (error: any) {
      Alert.alert('خطأ', error.message || 'فشل في عملية الاستيراد');
    } finally {
      setIsImporting(false);
      setImportProgress(0);
    }
  };

  const handleImport = () => {
    if (!jsonInput.trim()) {
      Alert.alert('تنبيه', 'يرجى إدخال بيانات JSON');
      return;
    }

    try {
      const products = JSON.parse(jsonInput);
      
      if (!Array.isArray(products)) {
        Alert.alert('خطأ', 'البيانات يجب أن تكون مصفوفة من المنتجات');
        return;
      }

      Alert.alert(
        'تأكيد الاستيراد',
        `هل تريد استيراد ${products.length} منتج إلى الباك اند؟\n\nهذه العملية حقيقية وستضيف المنتجات فعلياً.`,
        [
          { text: 'إلغاء', style: 'cancel' },
          { text: 'استيراد', onPress: () => realImport(products) }
        ]
      );

    } catch (error) {
      Alert.alert('خطأ', 'تنسيق JSON غير صحيح');
    }
  };

  const loadSampleData = () => {
    setJsonInput(JSON.stringify(sampleProducts, null, 2));
  };

  const importSampleDirectly = () => {
    Alert.alert(
      'استيراد البيانات التجريبية',
      `هل تريد إضافة ${sampleProducts.length} منتج تجريبي مباشرة؟`,
      [
        { text: 'إلغاء', style: 'cancel' },
        { text: 'استيراد', onPress: () => realImport(sampleProducts) }
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="cloud-upload-outline" size={60} color={PRIMARY} />
        <Text style={styles.title}>استيراد المنتجات</Text>
        <Text style={styles.subtitle}>إضافة منتجات حقيقية للباك اند</Text>
      </View>

      {/* استيراد مباشر للبيانات التجريبية */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>الاستيراد السريع:</Text>
        <TouchableOpacity 
          style={[styles.quickImportButton, isImporting && styles.disabledButton]}
          onPress={importSampleDirectly}
          disabled={isImporting}
        >
          <Ionicons name="flash-outline" size={20} color="white" />
          <Text style={styles.buttonText}>
            استيراد 5 منتجات تجريبية فوراً
          </Text>
        </TouchableOpacity>
      </View>

      {/* إدخال JSON يدوي */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>بيانات JSON مخصصة:</Text>
        <TextInput
          style={styles.jsonInput}
          multiline
          numberOfLines={8}
          placeholder="أدخل بيانات JSON هنا..."
          value={jsonInput}
          onChangeText={setJsonInput}
          textAlignVertical="top"
        />
        
        <TouchableOpacity style={styles.sampleButton} onPress={loadSampleData}>
          <Ionicons name="document-text-outline" size={20} color={PRIMARY} />
          <Text style={styles.sampleButtonText}>تحميل مثال</Text>
        </TouchableOpacity>
      </View>

      {/* زر الاستيراد */}
      <View style={styles.section}>
        <TouchableOpacity 
          style={[styles.importButton, isImporting && styles.disabledButton]} 
          onPress={handleImport}
          disabled={isImporting}
        >
          {isImporting ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Ionicons name="cloud-upload-outline" size={20} color="white" />
          )}
          <Text style={styles.importButtonText}>
            {isImporting ? 'جاري الاستيراد...' : 'استيراد JSON المخصص'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* نتائج الاستيراد */}
      {importResult && (
        <View style={styles.resultSection}>
          <Text style={styles.resultTitle}>نتائج آخر استيراد:</Text>
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
              {importResult.errors.slice(0, 3).map((error: string, index: number) => (
                <Text key={index} style={styles.errorText}>• {error}</Text>
              ))}
              {importResult.errors.length > 3 && (
                <Text style={styles.moreErrors}>
                  +{importResult.errors.length - 3} أخطاء أخرى
                </Text>
              )}
            </View>
          )}
        </View>
      )}

      {/* نصائح */}
      <View style={styles.tipsSection}>
        <Text style={styles.tipsTitle}>💡 تنسيق البيانات المطلوب:</Text>
        <Text style={styles.tipText}>• name: اسم المنتج (مطلوب)</Text>
        <Text style={styles.tipText}>• price: السعر (مطلوب)</Text>
        <Text style={styles.tipText}>• stock: المخزون (مطلوب)</Text>
        <Text style={styles.tipText}>• description: الوصف (اختياري)</Text>
        <Text style={styles.tipText}>• category: الفئة (اختياري)</Text>
        <Text style={styles.tipText}>• brand: العلامة التجارية (اختياري)</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    alignItems: 'center',
    padding: 30,
    backgroundColor: 'white',
    marginBottom: 20,
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
  },
  section: {
    backgroundColor: 'white',
    margin: 15,
    padding: 20,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  quickImportButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 8,
    gap: 10,
  },
  jsonInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    fontSize: 14,
    fontFamily: 'monospace',
    minHeight: 150,
    backgroundColor: '#f9f9f9',
    marginBottom: 10,
  },
  sampleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: PRIMARY,
    gap: 8,
  },
  sampleButtonText: {
    color: PRIMARY,
    fontSize: 14,
    fontWeight: 'bold',
  },
  importButton: {
    backgroundColor: PINK,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 8,
    gap: 10,
  },
  importButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  resultSection: {
    backgroundColor: 'white',
    margin: 15,
    padding: 20,
    borderRadius: 12,
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
  tipsSection: {
    backgroundColor: '#fff3cd',
    margin: 15,
    padding: 20,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#856404',
    marginBottom: 10,
  },
  tipText: {
    fontSize: 14,
    color: '#856404',
    marginBottom: 5,
    paddingLeft: 10,
  },
});