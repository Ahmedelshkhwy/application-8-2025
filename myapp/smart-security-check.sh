#!/bin/bash

# Smart Security Checker - Al-Shafi Medical App
# Enhanced version that reduces false positives

echo "🔒 فحص الأمان الذكي لتطبيق صيدليات الشافي..."
echo "============================================"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

ISSUES_FOUND=0

echo -e "\n📋 فحص الملفات الحساسة..."

# Critical files that should never be committed
CRITICAL_FILES=(
    ".env"
    ".env.local" 
    ".env.production"
    "google-services.json"
    "GoogleService-Info.plist"
    "firebase-config.js"
    "aws-config.json"
    "database.json"
    "secrets.json"
)

for file in "${CRITICAL_FILES[@]}"; do
    if find . -name "$file" -type f 2>/dev/null | grep -q .; then
        echo -e "${RED}❌ ملف حساس: $file${NC}"
        ISSUES_FOUND=$((ISSUES_FOUND + 1))
    fi
done

echo -e "\n🔑 فحص المفاتيح الحقيقية فقط..."

# Only check for actual API keys and secrets (not form fields)
check_real_secrets() {
    # Look for actual API keys with realistic patterns
    api_keys=$(grep -r -i -E \
        --include="*.js" --include="*.ts" --include="*.jsx" --include="*.tsx" \
        --exclude-dir=node_modules --exclude-dir=.expo --exclude-dir=.git \
        "(api[_-]?key|firebase[_-]?api)['\"\s]*[:=]['\"\s]*['\"][a-zA-Z0-9_-]{20,}['\"]" . 2>/dev/null | \
        grep -v -E "(useState|interface|type|example|test|mock|placeholder)")
    
    if [ ! -z "$api_keys" ]; then
        echo -e "${RED}❌ مفاتيح API حقيقية تم العثور عليها:${NC}"
        echo "$api_keys" | head -2 | sed 's/[a-zA-Z0-9_-]\{15,\}/[HIDDEN_KEY]/g'
        ISSUES_FOUND=$((ISSUES_FOUND + 1))
    fi
    
    # Look for database connection strings
    db_strings=$(grep -r -i -E \
        --include="*.js" --include="*.ts" --include="*.jsx" --include="*.tsx" \
        --exclude-dir=node_modules --exclude-dir=.expo \
        "(mongodb|mysql|postgres)://[^'\"\s]*:[^'\"\s]*@" . 2>/dev/null)
    
    if [ ! -z "$db_strings" ]; then
        echo -e "${RED}❌ نصوص اتصال قاعدة بيانات:${NC}"
        echo "$db_strings" | sed 's/\/\/[^:]*:[^@]*@/\/\/[USER]:[PASS]@/g'
        ISSUES_FOUND=$((ISSUES_FOUND + 1))
    fi
    
    # Look for JWT tokens or long tokens
    tokens=$(grep -r -i -E \
        --include="*.js" --include="*.ts" --include="*.jsx" --include="*.tsx" \
        --exclude-dir=node_modules --exclude-dir=.expo \
        "(token|bearer)['\"\s]*[:=]['\"\s]*['\"][a-zA-Z0-9_.-]{50,}['\"]" . 2>/dev/null | \
        grep -v -E "(useState|interface|type|example|test)")
    
    if [ ! -z "$tokens" ]; then
        echo -e "${RED}❌ رموز مميزة طويلة (محتملة):${NC}"
        echo "$tokens" | head -2 | sed 's/[a-zA-Z0-9_.-]\{20,\}/[HIDDEN_TOKEN]/g'
        ISSUES_FOUND=$((ISSUES_FOUND + 1))
    fi
}

check_real_secrets

echo -e "\n🌐 فحص URLs المحلية..."

local_urls=$(grep -r -i -E \
    --include="*.js" --include="*.ts" --include="*.jsx" --include="*.tsx" \
    --exclude-dir=node_modules --exclude-dir=.expo \
    "https?://['\"]?(localhost|127\.0\.0\.1|192\.168\.)" . 2>/dev/null)

if [ ! -z "$local_urls" ]; then
    echo -e "${YELLOW}⚠️ عناوين URL محلية:${NC}"
    echo "$local_urls" | head -3
    echo -e "${BLUE}💡 تأكد من استخدام متغيرات البيئة للإنتاج${NC}"
fi

echo -e "\n📱 فحص ملفات التكوين..."

# Check for secrets in config files
if [ -f "app.json" ]; then
    config_secrets=$(grep -i -E "(secret|private.*key|api.*key)" app.json | grep -v -E "(name|description)")
    if [ ! -z "$config_secrets" ]; then
        echo -e "${YELLOW}⚠️ معلومات محتملة في app.json:${NC}"
        echo "$config_secrets"
    fi
fi

echo -e "\n📊 النتيجة النهائية:"
echo "=================="

if [ $ISSUES_FOUND -eq 0 ]; then
    echo -e "${GREEN}✅ ممتاز! المشروع آمن للرفع${NC}"
    echo -e "${GREEN}🚀 يمكن رفع المشروع على GitHub بأمان${NC}"
else
    echo -e "${RED}❌ $ISSUES_FOUND مشكلة أمنية تحتاج مراجعة${NC}"
    echo -e "${YELLOW}🔧 أصلح المشاكل أعلاه قبل الرفع${NC}"
fi

echo -e "\n💡 نصائح سريعة:"
echo "• استخدم .env للمفاتيح الحساسة"
echo "• تأكد من وجود .env في .gitignore"  
echo "• استخدم متغيرات البيئة في الإنتاج"

exit $ISSUES_FOUND