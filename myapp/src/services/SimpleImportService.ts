// خدمة استيراد المنتجات المبسطة
import { createProduct } from '../api/api';

export const importProductsFromArray = async (products: any[], token: string) => {
  const results = {
    success: 0,
    failed: 0,
    errors: [] as string[]
  };

  const batchSize = 50;
  const batches = [];
  
  // تقسيم المنتجات إلى دفعات
  for (let i = 0; i < products.length; i += batchSize) {
    batches.push(products.slice(i, i + batchSize));
  }

  console.log(`بدء استيراد ${products.length} منتج في ${batches.length} دفعة`);

  for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
    const batch = batches[batchIndex];
    console.log(`معالجة الدفعة ${batchIndex + 1} من ${batches.length}`);

    for (const product of batch) {
      try {
        // تنظيف البيانات
        const cleanProduct = {
          name: product.name?.trim() || `منتج ${results.success + results.failed + 1}`,
          description: product.description?.trim() || '',
          price: parseFloat(product.price) || 0,
          stock: parseInt(product.stock) || 0,
          category: product.category?.trim() || 'عام',
          barcode: product.barcode?.trim() || '',
          isFeatured: product.isFeatured || false,
          brand: product.brand?.trim() || '',
          image: product.image?.trim() || 'https://placehold.co/200x200?text=Product'
        };

        // التحقق من صحة البيانات
        if (!cleanProduct.name || cleanProduct.price < 0 || cleanProduct.stock < 0) {
          results.failed++;
          results.errors.push(`منتج غير صالح: ${cleanProduct.name || 'بدون اسم'}`);
          continue;
        }

        // إضافة المنتج
        await createProduct(cleanProduct, token);
        results.success++;
        
        console.log(`✅ تم إضافة: ${cleanProduct.name}`);

      } catch (error: any) {
        results.failed++;
        results.errors.push(`فشل في إضافة ${product.name || 'منتج غير معروف'}: ${error.message}`);
        console.error(`❌ فشل في إضافة ${product.name}:`, error);
      }

      // تأخير قصير لتجنب إرهاق الخادم
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    // تأخير بين الدفعات
    if (batchIndex < batches.length - 1) {
      console.log('⏱️ انتظار 2 ثانية قبل الدفعة التالية...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  console.log(`🏁 انتهت عملية الاستيراد - نجح: ${results.success}, فشل: ${results.failed}`);
  return results;
};

// بيانات تجريبية للاختبار
export const sampleProducts = [
  {
    name: "باراسيتامول 500 مجم",
    description: "مسكن للألم وخافض للحرارة",
    price: 12.50,
    stock: 200,
    category: "أدوية",
    brand: "الشافي",
    barcode: "1234567890123"
  },
  {
    name: "فيتامين سي 1000 مجم",
    description: "مكمل غذائي لتقوية المناعة",
    price: 35.00,
    stock: 150,
    category: "مكملات غذائية",
    brand: "صحتك",
    barcode: "1234567890124"
  },
  {
    name: "شامبو للشعر الجاف",
    description: "شامبو مرطب للشعر الجاف والمتقصف",
    price: 28.75,
    stock: 80,
    category: "منتجات التجميل",
    brand: "جمالك",
    barcode: "1234567890125"
  },
  {
    name: "كريم مرطب لليدين",
    description: "كريم مرطب ومغذي لليدين",
    price: 18.25,
    stock: 120,
    category: "منتجات التجميل",
    brand: "نعومة",
    barcode: "1234567890126"
  },
  {
    name: "أوميجا 3",
    description: "مكمل غذائي لصحة القلب والدماغ",
    price: 65.00,
    stock: 75,
    category: "مكملات غذائية",
    brand: "صحة القلب",
    barcode: "1234567890127"
  }
];