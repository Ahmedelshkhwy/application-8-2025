#!/bin/bash

# Security Audit Script for Al-Shafi Medical App
# This script checks for potential security issues before committing code

echo "🔒 بدء فحص الأمان لتطبيق صيدليات الشافي..."
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track issues
ISSUES_FOUND=0

echo -e "\n📋 فحص الملفات الحساسة..."

# Check for sensitive files
SENSITIVE_FILES=(
    ".env"
    ".env.local"
    ".env.production"
    ".env.staging"
    ".env.development"
    "secrets.json"
    "firebase-config.js"
    "google-services.json"
    "GoogleService-Info.plist"
    "aws-config.json"
    "database.json"
    "private-key.json"
    "service-account-key.json"
)

# Check for files with specific names
for file in "${SENSITIVE_FILES[@]}"; do
    if find . -name "$file" -type f 2>/dev/null | grep -q .; then
        echo -e "${RED}❌ تحذير: تم العثور على ملف حساس: $file${NC}"
        ISSUES_FOUND=$((ISSUES_FOUND + 1))
    fi
done

# Check for files with patterns (using -wholename for paths)
SENSITIVE_PATTERNS=(
    "*/config/keys.js"
    "*/config/secrets.js"
    "*/src/config/keys.js"
    "*/src/secrets/*"
    "*/*.keystore"
    "*/*.p12" 
    "*/*.pem"
    "*/android/app/my-upload-key.keystore"
)

for pattern in "${SENSITIVE_PATTERNS[@]}"; do
    if find . -wholename "$pattern" -type f 2>/dev/null | grep -q .; then
        echo -e "${RED}❌ تحذير: تم العثور على ملف حساس بالنمط: $pattern${NC}"
        ISSUES_FOUND=$((ISSUES_FOUND + 1))
    fi
done

# Check for extension-based sensitive files
SENSITIVE_EXTENSIONS=(
    "*.keystore"
    "*.jks"
    "*.p12"
    "*.pfx"
    "*.pem"
    "*.key"
    "*.crt"
    "*.cert"
)

for ext in "${SENSITIVE_EXTENSIONS[@]}"; do
    results=$(find . -name "$ext" -type f 2>/dev/null | grep -v node_modules | grep -v .expo)
    if [ ! -z "$results" ]; then
        echo -e "${RED}❌ تحذير: تم العثور على ملفات بالامتداد $ext:${NC}"
        echo "$results" | head -3
        ISSUES_FOUND=$((ISSUES_FOUND + 1))
    fi
done

echo -e "\n�️  فحص المجلدات الحساسة..."

# Check for sensitive directories
SENSITIVE_DIRECTORIES=(
    "./secrets"
    "./config/secrets"
    "./src/secrets"
    "./.aws"
    "./certificates"
    "./keys"
    "./private"
)

for dir in "${SENSITIVE_DIRECTORIES[@]}"; do
    if [ -d "$dir" ]; then
        echo -e "${YELLOW}⚠️  تحذير: تم العثور على مجلد حساس: $dir${NC}"
        # Count files in sensitive directory
        file_count=$(find "$dir" -type f 2>/dev/null | wc -l)
        if [ $file_count -gt 0 ]; then
            echo -e "${RED}   📁 المجلد يحتوي على $file_count ملف${NC}"
            ISSUES_FOUND=$((ISSUES_FOUND + 1))
        fi
    fi
done

echo -e "\n�🔍 فحص المفاتيح والأسرار في الكود..."

# Check for hardcoded secrets in source files
SECRET_PATTERNS=(
    "api_key\s*[:=]\s*['\"][^'\"]*['\"]"
    "apikey\s*[:=]\s*['\"][^'\"]*['\"]"
    "secret\s*[:=]\s*['\"][^'\"]*['\"]"
    "password\s*[:=]\s*['\"][^'\"]*['\"]"
    "token\s*[:=]\s*['\"][^'\"]*['\"]"
    "private_key\s*[:=]\s*['\"][^'\"]*['\"]"
    "client_secret\s*[:=]\s*['\"][^'\"]*['\"]"
    "auth_token\s*[:=]\s*['\"][^'\"]*['\"]"
    "access_token\s*[:=]\s*['\"][^'\"]*['\"]"
    "firebase.*api.*key"
    "mongodb://[^'\"\s]*"
    "mysql://[^'\"\s]*"
    "postgres://[^'\"\s]*"
)

for pattern in "${SECRET_PATTERNS[@]}"; do
    # Search in JavaScript/TypeScript files
    results=$(grep -r -i -E --include="*.js" --include="*.ts" --include="*.jsx" --include="*.tsx" \
        --exclude-dir=node_modules \
        --exclude-dir=.expo \
        --exclude-dir=dist \
        --exclude-dir=.git \
        "$pattern" . 2>/dev/null || true)
    
    if [ ! -z "$results" ]; then
        echo -e "${YELLOW}⚠️  تحذير: تم العثور على نمط مشبوه '$pattern':${NC}"
        # Show first 3 lines but hide actual values for security
        echo "$results" | head -3 | sed 's/['\''"][^'\''"]*/[HIDDEN]/g'
        ISSUES_FOUND=$((ISSUES_FOUND + 1))
    fi
done

echo -e "\n🗜️  فحص الملفات المضغوطة والباك أب..."

# Check for backup and compressed files that might contain sensitive data
BACKUP_PATTERNS=(
    "*.backup"
    "*.bak"
    "*.old"
    "*.orig"
    "*.save"
    "*.tmp"
    "*.zip"
    "*.tar"
    "*.tar.gz"
    "*.rar"
    "*.7z"
)

for pattern in "${BACKUP_PATTERNS[@]}"; do
    results=$(find . -name "$pattern" -type f 2>/dev/null | grep -v node_modules | grep -v .expo | head -5)
    if [ ! -z "$results" ]; then
        echo -e "${YELLOW}⚠️  تحذير: تم العثور على ملفات backup/مضغوطة:${NC}"
        echo "$results"
        echo -e "${YELLOW}   تأكد من أن هذه الملفات لا تحتوي على معلومات حساسة${NC}"
    fi
done

echo -e "\n🌐 فحص عناوين URL والـ endpoints..."

# Check for hardcoded URLs that might contain sensitive info
URL_RESULTS=$(grep -r -i --include="*.js" --include="*.ts" --include="*.jsx" --include="*.tsx" \
    --exclude-dir=node_modules \
    --exclude-dir=.expo \
    "http[s]*://.*\(localhost\|127\.0\.0\.1\|192\.168\)" . || true)

if [ ! -z "$URL_RESULTS" ]; then
    echo -e "${YELLOW}⚠️  تحذير: تم العثور على عناوين URL محلية:${NC}"
    echo "$URL_RESULTS" | head -3
fi

echo -e "\n📝 فحص التعليقات المشبوهة..."

# Check for TODO/FIXME comments that might contain sensitive info
COMMENT_RESULTS=$(grep -r -i --include="*.js" --include="*.ts" --include="*.jsx" --include="*.tsx" \
    --exclude-dir=node_modules \
    "TODO.*\(password\|key\|secret\|token\)\|FIXME.*\(password\|key\|secret\|token\)" . || true)

if [ ! -z "$COMMENT_RESULTS" ]; then
    echo -e "${YELLOW}⚠️  تحذير: تم العثور على تعليقات مشبوهة:${NC}"
    echo "$COMMENT_RESULTS"
fi

echo -e "\n🔐 فحص ملف package.json..."

# Check package.json for sensitive information
if [ -f "package.json" ]; then
    if grep -q "password\|secret\|token\|key" package.json; then
        echo -e "${RED}❌ تحذير: package.json قد يحتوي على معلومات حساسة${NC}"
        ISSUES_FOUND=$((ISSUES_FOUND + 1))
    fi
fi

echo -e "\n📱 فحص إعدادات Expo..."

# Check app.json/app.config.js for sensitive data
if [ -f "app.json" ]; then
    if grep -q "secret\|key\|password" app.json; then
        echo -e "${YELLOW}⚠️  تحذير: app.json قد يحتوي على معلومات حساسة${NC}"
    fi
fi

echo -e "\n🛡️  فحص أذونات التطبيق..."

# Check for potentially dangerous permissions
if [ -f "app.json" ]; then
    DANGEROUS_PERMISSIONS=(
        "android.permission.WRITE_EXTERNAL_STORAGE"
        "android.permission.READ_EXTERNAL_STORAGE" 
        "android.permission.CAMERA"
        "android.permission.RECORD_AUDIO"
        "android.permission.READ_CONTACTS"
        "android.permission.ACCESS_FINE_LOCATION"
    )
    
    for perm in "${DANGEROUS_PERMISSIONS[@]}"; do
        if grep -q "$perm" app.json; then
            echo -e "${YELLOW}⚠️  تنبيه: التطبيق يطلب إذن: $perm${NC}"
        fi
    done
fi

echo -e "\n📊 النتائج النهائية:"
echo "==================="

if [ $ISSUES_FOUND -eq 0 ]; then
    echo -e "${GREEN}✅ ممتاز! لم يتم العثور على مشاكل أمنية كبيرة${NC}"
    echo -e "${GREEN}✅ المشروع آمن للرفع على GitHub${NC}"
else
    echo -e "${RED}❌ تم العثور على $ISSUES_FOUND مشكلة أمنية محتملة${NC}"
    echo -e "${RED}❌ يرجى مراجعة المشاكل المذكورة أعلاه قبل الرفع${NC}"
fi

echo -e "\n📋 توصيات إضافية:"
echo "==================="
echo "• تأكد من وجود .env في .gitignore"
echo "• استخدم متغيرات البيئة للمفاتيح الحساسة"
echo "• لا تضع كلمات مرور أو مفاتيح في الكود مباشرة"
echo "• استخدم GitHub Secrets للـ CI/CD"
echo "• فعل two-factor authentication على GitHub"

exit $ISSUES_FOUND