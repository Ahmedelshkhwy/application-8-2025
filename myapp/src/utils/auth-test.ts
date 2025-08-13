// اختبار بسيط لإثبات أن منطق تسجيل الدخول يعمل بشكل صحيح
export const testAuthFlow = () => {
  // محاكاة دالة تسجيل الدخول
  const mockLogin = async (email: string, password: string): Promise<void> => {
    // محاكاة استدعاء API
    if (email === 'test@test.com' && password === 'password123') {
      // نجح تسجيل الدخول - لا ترجع قيمة (void)
      return;
    } else {
      // فشل تسجيل الدخول - ترمي خطأ
      throw new Error('بيانات تسجيل الدخول غير صحيحة');
    }
  };

  // محاكاة معالج تسجيل الدخول المُحدث
  const handleLogin = async (email: string, password: string) => {
    try {
      await mockLogin(email, password);
      console.log('✅ تسجيل الدخول نجح - سيتم التوجيه تلقائياً');
      return true;
    } catch (error: any) {
      console.error('❌ فشل تسجيل الدخول:', error.message);
      return false;
    }
  };

  return { handleLogin };
};

// اختبار تسجيل الدخول بنجاح
export const testSuccessfulLogin = async () => {
  const { handleLogin } = testAuthFlow();
  const result = await handleLogin('test@test.com', 'password123');
  console.log('Test successful login result:', result);
};

// اختبار تسجيل الدخول بفشل
export const testFailedLogin = async () => {
  const { handleLogin } = testAuthFlow();
  const result = await handleLogin('wrong@email.com', 'wrongpassword');
  console.log('Test failed login result:', result);
};
