/**
 * 🚀 Quick Category Products Setup Script
 * سكريبت سريع لإضافة منتجات للفئات
 */

import { sampleCategoryProducts } from '../data/sampleCategoryProducts';
import { importProductsFromArray } from '../services/SimpleImportService';

// دالة لإضافة المنتجات التجريبية
export const setupCategoryProducts = async (token: string) => {
  console.log('🚀 بدء إضافة منتجات الفئات...');
  
  try {
    const result = await importProductsFromArray(sampleCategoryProducts, token);
    
    console.log('✅ تم إنشاء المنتجات بنجاح:');
    console.log(`   - نجح: ${result.success} منتج`);
    console.log(`   - فشل: ${result.failed} منتج`);
    
    if (result.errors.length > 0) {
      console.log('❌ الأخطاء:');
      result.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
    }
    
    return result;
  } catch (error) {
    console.error('❌ فشل في إعداد منتجات الفئات:', error);
    throw error;
  }
};

// تصدير المنتجات أيضاً للاستخدام المباشر
export { sampleCategoryProducts };
