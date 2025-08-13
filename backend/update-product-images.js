const fs = require('fs');
const path = require('path');
const axios = require('axios');

// إعدادات API
const API_CONFIG = {
  baseURL: 'http://localhost:5000/api',
  adminEmail: 'ahmedelshkhwy@gmail.com',
  adminPassword: 'LMred$$22332233'
};

class ProductImageUpdater {
  constructor() {
    this.authToken = null;
    this.productsData = null;
    this.updatedCount = 0;
    this.errorCount = 0;
  }

  async init() {
    console.log('🔗 اختبار الاتصال بـ API...');
    
    try {
      const response = await axios.get(`${API_CONFIG.baseURL}/health`);
      console.log('✅ API يعمل بشكل صحيح');
    } catch (error) {
      throw new Error('❌ لا يمكن الاتصال بـ API. تأكد من تشغيل الخادم');
    }

    // تسجيل الدخول
    await this.login();
    
    // قراءة بيانات المنتجات
    await this.loadProductsData();
  }

  async login() {
    console.log('🔐 تسجيل الدخول كمسؤول...');
    
    try {
      const response = await axios.post(`${API_CONFIG.baseURL}/auth/login`, {
        email: API_CONFIG.adminEmail,
        password: API_CONFIG.adminPassword
      });

      this.authToken = response.data.token;
      console.log('✅ تم تسجيل الدخول بنجاح');
    } catch (error) {
      throw new Error('❌ فشل في تسجيل الدخول: ' + (error.response?.data?.message || error.message));
    }
  }

  async loadProductsData() {
    console.log('📖 قراءة بيانات المنتجات المحدثة...');
    
    try {
      const filePath = path.join(__dirname, 'products-db.json');
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      
      this.productsData = data.products;
      console.log(`📦 تم تحميل ${this.productsData.length} منتج`);
    } catch (error) {
      throw new Error('❌ فشل في قراءة ملف المنتجات: ' + error.message);
    }
  }

  async updateProductImage(product) {
    try {
      const response = await axios.put(
        `${API_CONFIG.baseURL}/admin/products/${product.id}`,
        {
          image: product.image
        },
        {
          headers: {
            'Authorization': `Bearer ${this.authToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return { success: true, product: response.data };
    } catch (error) {
      console.error(`❌ خطأ في تحديث المنتج ${product.id}: ${error.response?.data?.message || error.message}`);
      return { success: false, error: error.response?.data?.message || error.message };
    }
  }

  async updateAllImages() {
    console.log('🚀 بدء تحديث صور المنتجات...');
    console.log('=' .repeat(50));

    const startTime = Date.now();

    for (let i = 0; i < this.productsData.length; i++) {
      const product = this.productsData[i];
      
      console.log(`🔄 [${i + 1}/${this.productsData.length}] تحديث: ${product.name}`);
      
      const result = await this.updateProductImage(product);
      
      if (result.success) {
        this.updatedCount++;
        console.log(`✅ [${i + 1}/${this.productsData.length}] تم تحديث: ${product.name}`);
      } else {
        this.errorCount++;
      }

      // عرض التقدم كل 100 منتج
      if ((i + 1) % 100 === 0) {
        const progress = ((i + 1) / this.productsData.length * 100).toFixed(1);
        console.log(`📊 التقدم: ${progress}% (${i + 1}/${this.productsData.length})`);
        console.log(`✅ تم تحديث: ${this.updatedCount} | ❌ أخطاء: ${this.errorCount}`);
      }

      // تأخير قصير لتجنب الحمل الزائد على الخادم
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;

    console.log('=' .repeat(50));
    console.log('🎉 انتهاء التحديث!');
    console.log('=' .repeat(50));
    console.log('📊 الإحصائيات النهائية:');
    console.log(`   📦 إجمالي المنتجات: ${this.productsData.length}`);
    console.log(`   ✅ تم تحديث: ${this.updatedCount}`);
    console.log(`   ❌ أخطاء: ${this.errorCount}`);
    console.log(`   ⏱️ المدة: ${duration.toFixed(2)} ثانية`);
    console.log(`   🚀 معدل التحديث: ${(this.updatedCount / (duration / 60)).toFixed(1)} منتج/دقيقة`);

    // حفظ سجل التحديث
    const logData = {
      timestamp: new Date().toISOString(),
      totalProducts: this.productsData.length,
      updatedCount: this.updatedCount,
      errorCount: this.errorCount,
      duration: duration,
      averageRate: this.updatedCount / (duration / 60)
    };

    const logPath = path.join(__dirname, 'image-update-log.json');
    fs.writeFileSync(logPath, JSON.stringify(logData, null, 2));
    console.log(`📋 تم حفظ سجل التحديث: ${logPath}`);

    if (this.errorCount === 0) {
      console.log('✅ تم الانتهاء بنجاح!');
    } else {
      console.log('⚠️ تم الانتهاء مع بعض الأخطاء');
    }
  }
}

// تشغيل المحدث
async function main() {
  const updater = new ProductImageUpdater();
  
  try {
    await updater.init();
    await updater.updateAllImages();
  } catch (error) {
    console.error('💥 خطأ في التحديث:', error.message);
    process.exit(1);
  }
}

// التحقق من وجود ملف المنتجات
const productsFile = path.join(__dirname, 'products-db.json');
if (!fs.existsSync(productsFile)) {
  console.error('❌ ملف products-db.json غير موجود');
  process.exit(1);
}

main();
