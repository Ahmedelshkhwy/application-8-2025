# Al-Shafi Medical App 🏥

تطبيق الشافي الطبي - منصة شاملة للتجارة الإلكترونية للمنتجات الطبية

## 🚀 المميزات

- 🛒 سلة تسوق متقدمة
- 💳 نظام دفع آمن
- 📱 واجهة مستخدم حديثة ومتجاوبة
- 🔐 نظام مصادقة آمن مع OTP
- 📊 لوحة تحكم إدارية
- 🎯 نظام عروض وخصومات
- 📈 نظام محاسبة وتقارير
- 🌐 دعم اللغة العربية

## 🛠️ التقنيات المستخدمة

- **Frontend**: React Native + Expo
- **Language**: TypeScript
- **State Management**: Zustand
- **Navigation**: Expo Router
- **Styling**: NativeWind (Tailwind CSS)
- **HTTP Client**: Axios
- **Forms**: React Hook Form

## 📦 التثبيت والتشغيل

### المتطلبات
- Node.js (v18 أو أحدث)
- npm أو yarn
- Expo CLI

### خطوات التثبيت

1. **استنساخ المشروع**
```bash
git clone https://github.com/YOUR_USERNAME/al-shafi-medical-app.git
cd al-shafi-medical-app
```

2. **تثبيت المكتبات**
```bash
npm install
# أو
yarn install
```

3. **إعداد متغيرات البيئة**
```bash
cp .env.example .env
```
ثم قم بتعديل ملف `.env` وإضافة القيم الصحيحة:
```env
EXPO_PUBLIC_API_BASE_URL=http://your-server-url:port
MOYASAR_API_KEY=your_moyasar_key
# ... باقي المتغيرات
```

4. **تشغيل التطبيق**
```bash
npx expo start
```

## 📱 كيفية الاستخدام

### للمستخدمين
1. إنشاء حساب جديد أو تسجيل الدخول
2. تصفح المنتجات والفئات
3. إضافة المنتجات إلى السلة
4. إتمام عملية الشراء
5. تتبع الطلبات

### للإدارة
1. تسجيل الدخول بحساب المدير
2. إدارة المنتجات والفئات
3. مراقبة الطلبات والمبيعات
4. إنشاء العروض والخصومات
5. عرض التقارير والإحصائيات

## 🏗️ هيكل المشروع

```
src/
├── api/              # استدعاءات API
├── components/       # المكونات المشتركة
├── config/          # إعدادات التطبيق
├── screens/         # شاشات التطبيق
├── store/           # إدارة الحالة
├── types/           # تعريفات TypeScript
└── utils/           # الوظائف المساعدة
```

## 🔧 إعدادات التطوير

### متغيرات البيئة المطلوبة
- `EXPO_PUBLIC_API_BASE_URL`: عنوان API الخلفي
- `MOYASAR_API_KEY`: مفتاح بوابة الدفع
- متغيرات Firebase للمصادقة

### أوامر مفيدة
```bash
# تشغيل مع تنظيف الذاكرة المؤقتة
npx expo start --clear

# بناء التطبيق للأندرويد
npx expo build:android

# بناء التطبيق لـ iOS
npx expo build:ios
```

## 🤝 المساهمة

نرحب بالمساهمات! يرجى اتباع هذه الخطوات:

1. Fork المشروع
2. إنشاء branch جديد (`git checkout -b feature/amazing-feature`)
3. Commit التغييرات (`git commit -m 'Add amazing feature'`)
4. Push إلى Branch (`git push origin feature/amazing-feature`)
5. فتح Pull Request

## 📄 الترخيص

هذا المشروع مرخص تحت [MIT License](LICENSE)

## 📞 التواصل

- Email: contact@alshafi.sa
- موقع الويب: https://alshafi.sa

---

Made with ❤️ for Al-Shafi Medical