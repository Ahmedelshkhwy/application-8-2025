# Security Guidelines - Al-Shafi Medical App 🔒

## ⚠️ معلومات هامة للأمان

### 🚫 **ممنوع منعاً باتاً رفعها على GitHub:**

1. **ملفات البيئة:**
   - `.env`
   - `.env.local`
   - `.env.production`
   - أي ملف يحتوي على `API_KEY` أو `SECRET`

2. **مفاتيح Firebase:**
   - `google-services.json`
   - `GoogleService-Info.plist`
   - `firebase-config.js`

3. **شهادات ومفاتيح:**
   - `*.keystore`
   - `*.p12`
   - `*.pem`
   - `private-key.json`

4. **إعدادات قواعد البيانات:**
   - أي connection strings
   - كلمات مرور قواعد البيانات
   - مفاتيح AWS/Azure

### ✅ **الطريقة الآمنة لإدارة المفاتيح:**

1. **استخدم متغيرات البيئة:**
```javascript
// ❌ خطأ - لا تفعل هذا
const API_KEY = "sk-1234567890abcdef";

// ✅ صحيح - افعل هذا
const API_KEY = process.env.EXPO_PUBLIC_API_KEY;
```

2. **ملف `.env.example`:**
```env
# نسخة آمنة للمشاركة
EXPO_PUBLIC_API_URL=https://api.example.com
EXPO_PUBLIC_APP_NAME=Al-Shafi Medical App
# لا تضع قيم حقيقية هنا!
```

3. **في الكود:**
```typescript
// استخدم Constants من expo-constants
import Constants from 'expo-constants';

const API_CONFIG = {
  baseURL: Constants.expoConfig?.extra?.apiUrl || 'https://api.alshafi.sa',
  timeout: 10000
};
```

### 🔍 **قائمة فحص قبل الرفع:**

- [ ] فحص عدم وجود ملفات `.env`
- [ ] التأكد من `.gitignore` محدث
- [ ] البحث عن كلمات مثل: `password`, `secret`, `key`, `token`
- [ ] فحص عدم وجود URLs محلية (localhost, 127.0.0.1)
- [ ] مراجعة التعليقات للتأكد من عدم وجود معلومات حساسة
- [ ] فحص `package.json` للتأكد من عدم وجود بيانات حساسة

### 🛡️ **الأذونات المطلوبة:**

```json
{
  "expo": {
    "plugins": [
      [
        "expo-location",
        {
          "locationAlwaysAndWhenInUsePermission": "تطبيق صيدليات الشافي يحتاج للموقع لتحديد عنوان التوصيل"
        }
      ]
    ]
  }
}
```

### 🚨 **في حالة تسريب مفتاح بالخطأ:**

1. **فوراً:**
   - غير المفتاح من المصدر (Firebase, AWS, إلخ)
   - احذف المفتاح من Git history
   ```bash
   git filter-branch --force --index-filter 'git rm --cached --ignore-unmatch path/to/sensitive/file' --prune-empty --tag-name-filter cat -- --all
   ```

2. **اتصل بالفريق فوراً**
3. **راجع Logs للتأكد من عدم استخدام المفتاح بشكل ضار**

### 📱 **نصائح للـ Production:**

1. **استخدم Expo Secrets:**
```bash
eas secret:create --scope project --name API_KEY --value your-secret-value
```

2. **فعل Code Signing:**
```json
{
  "build": {
    "production": {
      "android": {
        "buildType": "apk"
      }
    }
  }
}
```

3. **استخدم Certificate Pinning للـ API calls**

### 🔄 **مراجعة دورية:**

- [ ] مراجعة شهرية للأذونات
- [ ] تحديث المفاتيح كل 3 أشهر
- [ ] فحص Dependencies للثغرات
```bash
npm audit
expo doctor
```

### 📞 **جهات الاتصال للطوارئ:**

- **مدير الأمان:** security@alshafi.sa
- **فريق التطوير:** dev@alshafi.sa
- **الدعم الفني:** support@alshafi.sa

---
**تذكر: الأمان مسؤولية الجميع! 🛡️**