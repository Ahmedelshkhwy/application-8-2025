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

const PRIMARY = '#23B6C7';
const PINK = '#E94B7B';

export default function ProductImportScreen() {
  const [isImporting, setIsImporting] = useState(false);
  const [jsonInput, setJsonInput] = useState('');
  const [importProgress, setImportProgress] = useState(0);

  // محاكاة عملية الاستيراد
  const simulateImport = async (products: any[]) => {
    setIsImporting(true);
    setImportProgress(0);

    try {
      const batchSize = 50;
      const batches = [];
      
      for (let i = 0; i < products.length; i += batchSize) {
        batches.push(products.slice(i, i + batchSize));
      }

      for (let i = 0; i < batches.length; i++) {
        // محاكاة إرسال الدفعة
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const progress = ((i + 1) / batches.length) * 100;
        setImportProgress(progress);
      }

      Alert.alert('تم الاستيراد', `تم استيراد ${products.length} منتج بنجاح!`);
      
    } catch (error) {
      Alert.alert('خطأ', 'فشل في عملية الاستيراد');
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
        `هل تريد استيراد ${products.length} منتج؟`,
        [
          { text: 'إلغاء', style: 'cancel' },
          { text: 'استيراد', onPress: () => simulateImport(products) }
        ]
      );

    } catch (error) {
      Alert.alert('خطأ', 'تنسيق JSON غير صحيح');
    }
  };

  const loadSampleData = () => {
    const sampleData = [
      {
        "name": "دواء الصداع",
        "description": "مسكن فعال للصداع",
        "price": 25.50,
        "stock": 100,
        "category": "أدوية",
        "brand": "الشافي"
      },
      {
        "name": "فيتامين سي",
        "description": "مكمل غذائي",
        "price": 45.00,
        "stock": 200,
        "category": "مكملات",
        "brand": "الصحة"
      }
    ];
    
    setJsonInput(JSON.stringify(sampleData, null, 2));
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="cloud-upload-outline" size={60} color={PRIMARY} />
        <Text style={styles.title}>استيراد المنتجات</Text>
        <Text style={styles.subtitle}>إدخال بيانات JSON مباشرة</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>بيانات JSON:</Text>
        <TextInput
          style={styles.jsonInput}
          multiline
          numberOfLines={10}
          placeholder="أدخل بيانات JSON هنا..."
          value={jsonInput}
          onChangeText={setJsonInput}
          textAlignVertical="top"
        />
        
        <TouchableOpacity style={styles.sampleButton} onPress={loadSampleData}>
          <Ionicons name="document-text-outline" size={20} color={PRIMARY} />
          <Text style={styles.sampleButtonText}>تحميل بيانات تجريبية</Text>
        </TouchableOpacity>
      </View>

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
            {isImporting ? `جاري الاستيراد... ${Math.round(importProgress)}%` : 'بدء الاستيراد'}
          </Text>
        </TouchableOpacity>
      </View>

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
    marginBottom: 10,
  },
  jsonInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    fontSize: 14,
    fontFamily: 'monospace',
    minHeight: 200,
    backgroundColor: '#f9f9f9',
  },
  sampleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    marginTop: 10,
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
  disabledButton: {
    backgroundColor: '#ccc',
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