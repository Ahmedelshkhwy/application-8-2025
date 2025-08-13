const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

// تحميل متغيرات البيئة
require('dotenv').config();

class DatabaseImageUpdater {
  constructor() {
    this.productsData = null;
    this.updatedCount = 0;
    this.errorCount = 0;
    this.imageMapping = new Map();
  }

  async init() {
    console.log('🔗 الاتصال بقاعدة البيانات...');
    console.log('📊 MONGODB_URI:', process.env.MONGODB_URI ? 'موجود' : 'غير موجود');
    
    try {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log('✅ تم الاتصال بقاعدة البيانات بنجاح');
    } catch (error) {
      throw new Error('❌ فشل في الاتصال بقاعدة البيانات: ' + error.message);
    }

    // قراءة بيانات المنتجات وإنشاء خريطة للصور
    await this.loadProductsData();
  }

  async loadProductsData() {
    console.log('📖 قراءة بيانات المنتجات المحدثة...');
    
    try {
      const filePath = path.join(__dirname, 'products-db.json');
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      
      this.productsData = data.products;
      console.log(`📦 تم تحميل ${this.productsData.length} منتج من الملف`);

      // إنشاء خريطة للصور بناءً على اسم المنتج
      this.productsData.forEach(product => {
        this.imageMapping.set(product.name, product.image);
      });

      console.log(`🗺️ تم إنشاء خريطة للصور: ${this.imageMapping.size} منتج`);
    } catch (error) {
      throw new Error('❌ فشل في قراءة ملف المنتجات: ' + error.message);
    }
  }

  async updateAllImages() {
    console.log('🚀 بدء تحديث صور المنتجات في قاعدة البيانات...');
    console.log('=' .repeat(50));

    const startTime = Date.now();

    try {
      const Product = require('./dist/models/product.model').default;
      
      // جلب جميع المنتجات من قاعدة البيانات
      const dbProducts = await Product.find({});
      console.log(`📦 تم جلب ${dbProducts.length} منتج من قاعدة البيانات`);

      for (let i = 0; i < dbProducts.length; i++) {
        const dbProduct = dbProducts[i];
        
        console.log(`🔄 [${i + 1}/${dbProducts.length}] معالجة: ${dbProduct.name}`);
        
        // البحث عن الصورة المطابقة في الخريطة
        const newImage = this.imageMapping.get(dbProduct.name);
        
        if (newImage && newImage !== dbProduct.image) {
          try {
            // تحديث الصورة
            await Product.findByIdAndUpdate(dbProduct._id, { image: newImage });
            this.updatedCount++;
            console.log(`✅ [${i + 1}/${dbProducts.length}] تم تحديث: ${dbProduct.name}`);
          } catch (error) {
            this.errorCount++;
            console.error(`❌ خطأ في تحديث ${dbProduct.name}: ${error.message}`);
          }
        } else if (!newImage) {
          console.log(`⚠️ [${i + 1}/${dbProducts.length}] لم يتم العثور على صورة لـ: ${dbProduct.name}`);
        } else {
          console.log(`ℹ️ [${i + 1}/${dbProducts.length}] الصورة محدثة بالفعل: ${dbProduct.name}`);
        }

        // عرض التقدم كل 100 منتج
        if ((i + 1) % 100 === 0) {
          const progress = ((i + 1) / dbProducts.length * 100).toFixed(1);
          console.log(`📊 التقدم: ${progress}% (${i + 1}/${dbProducts.length})`);
          console.log(`✅ تم تحديث: ${this.updatedCount} | ❌ أخطاء: ${this.errorCount}`);
        }
      }

      const endTime = Date.now();
      const duration = (endTime - startTime) / 1000;

      console.log('=' .repeat(50));
      console.log('🎉 انتهاء التحديث!');
      console.log('=' .repeat(50));
      console.log('📊 الإحصائيات النهائية:');
      console.log(`   📦 إجمالي المنتجات في قاعدة البيانات: ${dbProducts.length}`);
      console.log(`   📦 إجمالي المنتجات في الملف: ${this.productsData.length}`);
      console.log(`   ✅ تم تحديث: ${this.updatedCount}`);
      console.log(`   ❌ أخطاء: ${this.errorCount}`);
      console.log(`   ⏱️ المدة: ${duration.toFixed(2)} ثانية`);
      console.log(`   🚀 معدل التحديث: ${(this.updatedCount / (duration / 60)).toFixed(1)} منتج/دقيقة`);

      // حفظ سجل التحديث
      const logData = {
        timestamp: new Date().toISOString(),
        dbProducts: dbProducts.length,
        fileProducts: this.productsData.length,
        updatedCount: this.updatedCount,
        errorCount: this.errorCount,
        duration: duration,
        averageRate: this.updatedCount / (duration / 60)
      };

      const logPath = path.join(__dirname, 'db-image-update-log.json');
      fs.writeFileSync(logPath, JSON.stringify(logData, null, 2));
      console.log(`📋 تم حفظ سجل التحديث: ${logPath}`);

      if (this.errorCount === 0) {
        console.log('✅ تم الانتهاء بنجاح!');
      } else {
        console.log('⚠️ تم الانتهاء مع بعض الأخطاء');
      }

    } catch (error) {
      console.error('💥 خطأ في معالجة قاعدة البيانات:', error.message);
      throw error;
    }
  }

  async disconnect() {
    await mongoose.disconnect();
    console.log('🔌 تم قطع الاتصال بقاعدة البيانات');
  }
}

// تشغيل المحدث
async function main() {
  const updater = new DatabaseImageUpdater();
  
  try {
    await updater.init();
    await updater.updateAllImages();
    await updater.disconnect();
  } catch (error) {
    console.error('💥 خطأ في التحديث:', error.message);
    await updater.disconnect();
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
