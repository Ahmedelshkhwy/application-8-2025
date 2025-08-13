# Al-Shafi Medical Platform 🏥

منصة الشافي الطبية المتكاملة - تشمل تطبيق الموبايل والـ Backend API

## 📁 هيكل المشروع

```
al-shafi-platform/
├── myapp/             # تطبيق React Native
│   ├── src/
│   ├── package.json
│   └── ...
├── backend/           # Node.js API Server
│   ├── src/
│   ├── package.json
│   └── ...
├── README.md
└── .gitignore
```

## 🚀 المميزات

### Frontend (React Native App)
- 🛒 سلة تسوق متقدمة
- 💳 نظام دفع آمن مع Moyasar
- 📱 واجهة مستخدم حديثة ومتجاوبة
- 🔐 نظام مصادقة آمن مع OTP
- 🌐 دعم اللغة العربية

### Backend (Node.js API)
- 🔗 RESTful API
- 🔐 JWT Authentication
- 📊 نظام محاسبة وتقارير
- 🎯 إدارة العروض والخصومات
- 📧 نظام OTP عبر البريد الإلكتروني

## 🛠️ التقنيات المستخدمة

### Frontend
- React Native + Expo
- TypeScript
- Zustand (State Management)
- NativeWind (Styling)
- Axios (HTTP Client)

### Backend
- Node.js + Express
- TypeScript
- MongoDB/MySQL (Database)
- JWT (Authentication)
- Nodemailer (Email Service)

## 📦 التثبيت والتشغيل

### المتطلبات
- Node.js (v18 أو أحدث)
- npm أو yarn
- Expo CLI
- MongoDB أو MySQL

### خطوات التثبيت

1. **استنساخ المشروع**
```bash
git clone https://github.com/YOUR_USERNAME/al-shafi-platform.git
cd al-shafi-platform
```

2. **تثبيت مكتبات Myapp**
```bash
cd myapp
npm install
cp .env.example .env
# قم بتعديل ملف .env
```

3. **تثبيت مكتبات Backend**
```bash
cd ../backend
npm install
cp .env.example .env
# قم بتعديل ملف .env
```

4. **تشغيل Backend**
```bash
cd backend
npm run dev
```

5. **تشغيل Myapp**
```bash
cd myapp
npx expo start
```

## 🔧 إعدادات التطوير

### Myapp Environment Variables
```env
EXPO_PUBLIC_API_BASE_URL=http://localhost:5000
MOYASAR_API_KEY=your_moyasar_key
```

### Backend Environment Variables
```env
PORT=5000
DATABASE_URL=your_database_url
JWT_SECRET=your_jwt_secret
EMAIL_SERVICE=gmail
EMAIL_USER=your_email
EMAIL_PASS=your_app_password
```

## 🚀 النشر

### Myapp (Expo)
```bash
cd myapp
npx expo build:android
npx expo build:ios
```

### Backend
```bash
cd backend
npm run build
npm start
```

## 🤝 المساهمة

نرحب بالمساهمات في كلا المشروعين!

## 📞 التواصل

- Email: contact@alshafi.sa
- موقع الويب: https://alshafi.sa

---

Made with ❤️ for Al-Shafi Medical Platform