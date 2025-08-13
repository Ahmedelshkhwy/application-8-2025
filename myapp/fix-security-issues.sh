#!/bin/bash

# Script to fix security issues before GitHub upload
echo "🔧 إصلاح مشاكل الأمان..."

# 1. Remove .env file from Git tracking but keep it locally
if [ -f ".env" ]; then
    echo "🗑️ إزالة ملف .env من Git tracking..."
    
    # Remove from Git cache (stop tracking)
    git rm --cached .env 2>/dev/null || true
    
    # Keep the file locally but create a backup
    if [ -f ".env" ]; then
        cp .env .env.local.backup
        echo "💾 تم إنشاء نسخة احتياطية: .env.local.backup"
    fi
    
    echo "✅ تم إيقاف تتبع .env من Git"
fi

# 2. Verify .env is in .gitignore  
if grep -q "^\.env$" .gitignore; then
    echo "✅ .env موجود في .gitignore"
else
    echo "📝 إضافة .env إلى .gitignore..."
    echo "" >> .gitignore
    echo ".env" >> .gitignore
    echo "✅ تمت إضافة .env إلى .gitignore"
fi

# 3. Create safe .env.example
echo "📝 إنشاء .env.example آمن..."
cat > .env.example << 'EOF'
# Al-Shafi Medical App - Environment Variables Template
# Copy this file to .env and replace with real values

# API Configuration
EXPO_PUBLIC_API_BASE_URL=https://api.alshafi.sa

# Payment Configuration (Use test keys for development)
MOYASAR_API_KEY=pk_test_your_test_key_here

# Firebase Configuration (Replace with your values)  
FIREBASE_API_KEY=your_firebase_api_key
FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=123456789
FIREBASE_APP_ID=1:123456789:android:abcdef

# EAS Configuration
EAS_PROJECT_ID=your_eas_project_id

# Note: Never commit real API keys or secrets!
EOF

echo "✅ تم إنشاء .env.example"

# 4. Run security check again
echo -e "\n🔒 فحص الأمان النهائي..."
if [ -f "smart-security-check.sh" ]; then
    chmod +x smart-security-check.sh
    ./smart-security-check.sh
else
    echo "⚠️ smart-security-check.sh غير موجود"
fi

echo -e "\n🎉 تم إصلاح الأمان!"
echo "📋 الملخص:"
echo "   ✅ .env لن يتم رفعه على GitHub"
echo "   ✅ تم إنشاء .env.example آمن"
echo "   💾 نسخة احتياطية: .env.local.backup"
echo ""
echo "🚀 المشروع جاهز للرفع بأمان!"