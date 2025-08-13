// خدمة استيراد المنتجات بالدفعات
import { useState } from 'react';
import { Alert } from 'react-native';

interface ImportStats {
  total: number;
  processed: number;
  success: number;
  failed: number;
  errors: string[];
}

export const useProductImport = () => {
  const [importProgress, setImportProgress] = useState(0);
  const [isImporting, setIsImporting] = useState(false);
  const [importStats, setImportStats] = useState<ImportStats>({
    total: 0,
    processed: 0,
    success: 0,
    failed: 0,
    errors: []
  });

  // استيراد بالدفعات (Batch Import)
  const importProductsBatch = async (products: any[], batchSize = 50) => {
    setIsImporting(true);
    setImportProgress(0);
    setImportStats({
      total: products.length,
      processed: 0,
      success: 0,
      failed: 0,
      errors: []
    });

    try {
      const batches = [];
      for (let i = 0; i < products.length; i += batchSize) {
        batches.push(products.slice(i, i + batchSize));
      }

      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        
        try {
          // إرسال الدفعة للباك اند
          const response = await fetch('/api/products/batch-import', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              products: batch,
              batchIndex: i,
              totalBatches: batches.length
            })
          });

          const result = await response.json();
          
          // تحديث الإحصائيات
          setImportStats(prev => ({
            ...prev,
            processed: prev.processed + batch.length,
            success: prev.success + (result.success || 0),
            failed: prev.failed + (result.failed || 0),
            errors: [...prev.errors, ...(result.errors || [])]
          }));

          // تحديث نسبة التقدم
          const progress = ((i + 1) / batches.length) * 100;
          setImportProgress(progress);

          // تأخير قصير لتجنب إرهاق الخادم
          await new Promise(resolve => setTimeout(resolve, 100));

        } catch (batchError: any) {
          console.error(`خطأ في الدفعة ${i}:`, batchError);
          setImportStats(prev => ({
            ...prev,
            processed: prev.processed + batch.length,
            failed: prev.failed + batch.length,
            errors: [...prev.errors, `خطأ في الدفعة ${i}: ${batchError?.message || 'خطأ غير معروف'}`]
          }));
        }
      }

      Alert.alert(
        'تمت عملية الاستيراد',
        `تم معالجة ${importStats.total} منتج\nنجح: ${importStats.success}\nفشل: ${importStats.failed}`
      );

    } catch (error) {
      console.error('خطأ في عملية الاستيراد:', error);
      Alert.alert('خطأ', 'فشل في عملية الاستيراد');
    } finally {
      setIsImporting(false);
    }
  };

  // تنظيف وتنسيق المنتجات
  const cleanAndFormatProducts = (rawProducts: any[]) => {
    return rawProducts.map((product, index) => ({
      name: product.name?.trim() || `منتج ${index + 1}`,
      description: product.description?.trim() || '',
      price: parseFloat(product.price) || 0,
      stock: parseInt(product.stock) || 0,
      category: product.category?.trim() || 'عام',
      barcode: product.barcode?.trim() || '',
      sku: product.sku?.trim() || `SKU${Date.now()}${index}`,
      image: product.image?.trim() || '',
      brand: product.brand?.trim() || '',
      isActive: product.isActive !== false,
      tags: Array.isArray(product.tags) ? product.tags : [],
      // إضافة معلومات إضافية
      importedAt: new Date().toISOString(),
      importBatch: Math.ceil((index + 1) / 50)
    })).filter(product => 
      product.name && 
      product.price >= 0 && 
      product.stock >= 0
    );
  };

  return {
    importProductsBatch,
    cleanAndFormatProducts,
    importProgress,
    isImporting,
    importStats
  };
};