import apiClient from '../config/axios';
import { ErrorHandler } from '../services/ErrorHandler';
import {
    AddToCartRequest,
    ApplyDiscountRequest,
    CategoryInput,
    DiscountInput,
    LoginData,
    OrderInput,
    OTPSendRequest,
    OTPVerificationRequest,
    PaymentInput,
    ProductInput,
    ResetPasswordRequest,
    UpdateCartRequest,
    UserRegistrationData
} from '../types/modules';

// Helper function to get base URL for images from environment
const getImageBaseURL = (): string => {
  const apiUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (apiUrl) {
    // Remove '/api' from the end if it exists to get the server base URL
    return apiUrl.replace('/api', '');
  }
  return 'http://localhost:5000'; // fallback
};

// ==================== AUTHENTICATION API ====================

// تسجيل مستخدم جديد
export const registerUser = async (data: UserRegistrationData) => {
  try {
    const response = await apiClient.post('/auth/register', data);
    return response.data;
  } catch (error) {
    throw ErrorHandler.handleApiError(error, 'تسجيل مستخدم جديد');
  }
};

// تسجيل الدخول
export const loginUser = async (data: LoginData) => {
  try {
    const response = await apiClient.post('/auth/login', data);
    return response.data;
  } catch (error) {
    throw ErrorHandler.handleApiError(error, 'تسجيل الدخول');
  }
};

// إرسال OTP للتسجيل
export const sendOTPForRegister = async (data: OTPSendRequest) => {
  try {
    const response = await apiClient.post('/otp/send/register', data);
    return response.data;
  } catch (error) {
    throw ErrorHandler.handleApiError(error, 'إرسال OTP للتسجيل');
  }
};

// إرسال OTP لاستعادة كلمة المرور
export const sendOTPForResetPassword = async (email: string) => {
  try {
    const response = await apiClient.post('/otp/send/reset-password', { email });
    return response.data;
  } catch (error) {
    throw ErrorHandler.handleApiError(error, 'إرسال OTP لاستعادة كلمة المرور');
  }
};

// التحقق من OTP
export const verifyOTP = async (data: OTPVerificationRequest) => {
  try {
    const response = await apiClient.post('/otp/verify', data);
    return response.data;
  } catch (error) {
    throw ErrorHandler.handleApiError(error, 'التحقق من OTP');
  }
};

// إعادة إرسال OTP
export const resendOTP = async (otpId: string) => {
  try {
    const response = await apiClient.post('/otp/resend', { otpId });
    return response.data;
  } catch (error) {
    throw ErrorHandler.handleApiError(error, 'إعادة إرسال OTP');
  }
};

// إعادة تعيين كلمة المرور
export const resetPassword = async (data: ResetPasswordRequest) => {
  try {
    const response = await apiClient.post('/auth/reset-password', data);
    return response.data;
  } catch (error) {
    throw ErrorHandler.handleApiError(error, 'إعادة تعيين كلمة المرور');
  }
};

// ==================== PRODUCTS API ====================

// جلب جميع المنتجات
export const getAllProducts = async (filters?: { 
  category?: string; 
  search?: string; 
  isActive?: boolean; 
  isFeatured?: boolean;
  brand?: string;
  limit?: number 
}) => {
  try {
    let url = '/products';
    const queryParams = new URLSearchParams();

    if (filters?.category) {
      queryParams.append('category', filters.category);
    }
    if (filters?.search) {
      queryParams.append('search', filters.search);
    }
    if (filters?.isActive !== undefined) {
      queryParams.append('isActive', filters.isActive.toString());
    }
    if (filters?.isFeatured !== undefined) {
      queryParams.append('isFeatured', filters.isFeatured.toString());
    }
    if (filters?.brand) {
      queryParams.append('brand', filters.brand);
    }
    if (filters?.limit) {
      queryParams.append('limit', filters.limit.toString());
    }

    if (queryParams.toString()) {
      url += `?${queryParams.toString()}`;
    }

    const response = await apiClient.get(url);
    return response.data;
  } catch (error) {
    throw ErrorHandler.handleApiError(error, 'جلب جميع المنتجات');
  }
};

// جلب المنتجات المميزة للصفحة الرئيسية
export const getFeaturedProducts = async (limit: number = 8) => {
  try {
    return await getAllProducts({ 
      isActive: true, 
      isFeatured: true, 
      limit 
    });
  } catch (error) {
    throw ErrorHandler.handleApiError(error, 'جلب المنتجات المميزة');
  }
};

// جلب منتج واحد
export const getProductById = async (productId: string) => {
  try {
    const response = await apiClient.get(`/products/${productId}`);
    return response.data;
  } catch (error) {
    throw ErrorHandler.handleApiError(error, 'جلب تفاصيل المنتج');
  }
};

// إضافة منتج جديد (للمدراء فقط)
export const createProduct = async (data: ProductInput, token: string) => {
  try {
    const response = await apiClient.post('/products', data, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    throw ErrorHandler.handleApiError(error, 'إضافة منتج جديد');
  }
};

// ==================== CATEGORIES API ====================

// جلب جميع الفئات
export const getAllCategories = async () => {
  const response = await apiClient.get('/categories');
  return response.data;
};

// جلب فئة معينة
export const getCategoryById = async (id: string) => {
  const response = await apiClient.get(`/categories/${id}`);
  return response.data;
};

// إنشاء فئة جديدة (للمدراء فقط)
export const createCategory = async (data: CategoryInput, token: string) => {
  const response = await apiClient.post('/categories', data, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

// تحديث فئة (للمدراء فقط)
export const updateCategory = async (id: string, data: CategoryInput, token: string) => {
  const response = await apiClient.put(`/categories/${id}`, data, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

// حذف فئة (للمدراء فقط)
export const deleteCategory = async (id: string, token: string) => {
  const response = await apiClient.delete(`/categories/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

// ==================== CART API ====================

// جلب السلة
export const getCart = async (token: string) => {
  const response = await apiClient.get('/cart', {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

// إضافة منتج للسلة
export const addToCart = async (data: AddToCartRequest, token: string) => {
  const response = await apiClient.post('/cart', data, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

// حذف منتج من السلة
export const removeFromCart = async (productId: string, token: string) => {
  const response = await apiClient.delete(`/cart/${productId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

// تحديث كمية منتج في السلة
export const updateCartItemQuantity = async (productId: string, data: UpdateCartRequest, token: string) => {
  const response = await apiClient.put(`/cart/${productId}`, data, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

// جلب جميع السلال (للمدراء فقط)
export const getAllCarts = async (token: string) => {
  const response = await apiClient.get('/cart/admin', {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

// ==================== ORDERS API ====================

// جلب جميع الطلبات (للمدراء فقط)
export const getAllOrders = async (token: string) => {
  const response = await apiClient.get('/orders', {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

// إنشاء طلب جديد
export const createOrder = async (data: OrderInput, token: string) => {
  const response = await apiClient.post('/orders', data, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

// جلب طلبات المستخدم
export const getMyOrders = async (token: string) => {
  try {
    console.log('🔗 Fetching orders...');
    
    const response = await apiClient.get('/orders/my-orders', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ Orders fetched successfully');
    return response.data;
    
  } catch (error: any) {
    console.error('❌ Error fetching orders:', error.message);
    throw new Error('فشل في تحميل الطلبات: ' + (error.message || 'خطأ في الشبكة'));
  }
};

// جلب تفاصيل طلب معين
export const getOrderById = async (orderId: string, token: string) => {
  const response = await apiClient.get(`/orders/${orderId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

// إلغاء طلب
export const cancelOrder = async (orderId: string, token: string) => {
  const response = await apiClient.delete(`/orders/${orderId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

// ==================== PAYMENT API ====================

// معالجة عملية الدفع
export const processPayment = async (data: PaymentInput, token: string) => {
  const response = await apiClient.post('/payment', data, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

// ==================== USER API ====================

// جلب ملف المستخدم الشخصي
export const getUserProfile = async (token: string) => {
  const response = await apiClient.get('/user/profile', {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

// ==================== DISCOUNTS API ====================

// جلب الخصومات المتاحة
export const getAvailableDiscounts = async (token: string) => {
  const response = await apiClient.get('/discount', {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

// تطبيق خصم على طلب
export const applyDiscount = async (data: ApplyDiscountRequest, token: string) => {
  const response = await apiClient.post('/discount/apply', data, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

// جلب جميع الخصومات (للمدراء فقط)
export const getAllDiscounts = async (token: string) => {
  const response = await apiClient.get('/discount/admin/all', {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

// إنشاء خصم جديد (للمدراء فقط)
export const createDiscount = async (data: DiscountInput, token: string) => {
  const response = await apiClient.post('/discount/admin/create', data, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

// تحديث خصم (للمدراء فقط)
export const updateDiscount = async (id: string, data: DiscountInput, token: string) => {
  const response = await apiClient.put(`/discount/admin/${id}`, data, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

// حذف خصم (للمدراء فقط)
export const deleteDiscount = async (id: string, token: string) => {
  const response = await apiClient.delete(`/discount/admin/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

// تفعيل/إلغاء تفعيل خصم (للمدراء فقط)
export const toggleDiscount = async (id: string, token: string) => {
  const response = await apiClient.patch(`/discount/admin/${id}/toggle`, {}, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

// ==================== OFFERS API ====================

// جلب العروض المتاحة
export const getOffers = async (token: string) => {
  try {
    const response = await apiClient.get('/offers', {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 15000, // 15 ثانية timeout
    });
    
    // التحقق من صحة الاستجابة
    if (!response.data) {
      throw new Error('لم يتم استلام بيانات من الخادم');
    }
    
    // معالجة البيانات وتنظيفها
    const data = response.data;
    
    // إذا كانت الاستجابة تحتوي على خطأ
    if (data.success === false) {
      throw new Error(data.message || 'خطأ من الخادم');
    }
    
    // التأكد من وجود العروض
    if (data.offers && Array.isArray(data.offers)) {
      // تنظيف URL الصور
      data.offers = data.offers.map((offer: any) => {
        if (offer.image && typeof offer.image === 'string') {
          // إصلاح مسار الصورة
          if (!offer.image.startsWith('http') && !offer.image.startsWith('https')) {
            if (offer.image.startsWith('/')) {
              offer.image = `${getImageBaseURL()}${offer.image}`;
            } else {
              offer.image = `${getImageBaseURL()}/uploads/${offer.image}`;
            }
          }
        }
        
        // إصلاح مسار صورة المنتج
        if (offer.product && offer.product.image && typeof offer.product.image === 'string') {
          if (!offer.product.image.startsWith('http') && !offer.product.image.startsWith('https')) {
            if (offer.product.image.startsWith('/')) {
              offer.product.image = `${getImageBaseURL()}${offer.product.image}`;
            } else {
              offer.product.image = `${getImageBaseURL()}/uploads/${offer.product.image}`;
            }
          }
        }
        
        return offer;
      });
    }
    
    return data;
  } catch (error: any) {
    console.error('Error in getOffers:', error);
    
    // معالجة أنواع مختلفة من الأخطاء
    if (error.code === 'ECONNABORTED') {
      throw new Error('انتهت مهلة الانتظار');
    } else if (error.response) {
      // خطأ من الخادم
      const message = error.response.data?.message || `خطأ من الخادم: ${error.response.status}`;
      throw new Error(message);
    } else if (error.request) {
      // لا توجد استجابة من الخادم
      throw new Error('لا يمكن الوصول إلى الخادم');
    } else {
      // خطأ آخر
      throw new Error(error.message || 'خطأ غير متوقع');
    }
  }
};

// جلب عروض منتج معين
export const getProductOffers = async (productId: string, token: string) => {
  const response = await apiClient.get(`/offers/product/${productId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

// جلب عروض فئة معينة
export const getCategoryOffers = async (categoryId: string, token: string) => {
  const response = await apiClient.get(`/offers/category/${categoryId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

// حساب السعر مع الخصم
export const calculatePriceWithDiscount = async (productId: string, token: string, discountCode?: string) => {
  const data: any = { productId };
  if (discountCode) {data.discountCode = discountCode;}
  
  const response = await apiClient.post('/offers/calculate-price', data, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

// ==================== ADMIN API ====================

// إحصائيات لوحة التحكم (للمدراء فقط)
export const getAdminStats = async (token: string) => {
  const response = await apiClient.get('/admin/dashboard/stats', {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

// ==================== ACCOUNTING API ====================

// لوحة تحكم المحاسبة
export const getAccountingDashboard = async (period: 'daily' | 'monthly' | 'yearly' = 'monthly', token: string) => {
  const response = await apiClient.get(`/accounting/dashboard?period=${period}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

// إحصائيات المبيعات
export const getSalesStats = async (token: string, startDate?: string, endDate?: string, period: 'daily' | 'monthly' | 'yearly' = 'daily') => {
  let url = `/accounting/sales/stats?period=${period}`;
  if (startDate) {url += `&startDate=${startDate}`;}
  if (endDate) {url += `&endDate=${endDate}`;}
  
  const response = await apiClient.get(url, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

// تقرير المبيعات حسب المنتجات
export const getProductSales = async (token: string, startDate?: string, endDate?: string, limit: number = 20) => {
  let url = `/accounting/sales/products?limit=${limit}`;
  if (startDate) {url += `&startDate=${startDate}`;}
  if (endDate) {url += `&endDate=${endDate}`;}
  
  const response = await apiClient.get(url, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

// تقرير الإيرادات حسب الفئات
export const getCategorySales = async (token: string, startDate?: string, endDate?: string) => {
  let url = '/accounting/sales/categories';
  if (startDate) {url += `?startDate=${startDate}`;}
  if (endDate) {url += `${startDate ? '&' : '?'}endDate=${endDate}`;}
  
  const response = await apiClient.get(url, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

// تقرير الخصومات المستخدمة
export const getDiscountUsage = async (token: string, startDate?: string, endDate?: string) => {
  let url = '/accounting/discounts/usage';
  if (startDate) {url += `?startDate=${startDate}`;}
  if (endDate) {url += `${startDate ? '&' : '?'}endDate=${endDate}`;}
  
  const response = await apiClient.get(url, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

// تقرير العملاء
export const getCustomerReport = async (token: string, startDate?: string, endDate?: string, limit: number = 50) => {
  let url = `/accounting/customers?limit=${limit}`;
  if (startDate) {url += `&startDate=${startDate}`;}
  if (endDate) {url += `&endDate=${endDate}`;}
  
  const response = await apiClient.get(url, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

// تقرير الأرباح والخسائر
export const getProfitLossReport = async (token: string, startDate?: string, endDate?: string) => {
  let url = '/accounting/profit-loss';
  if (startDate) {url += `?startDate=${startDate}`;}
  if (endDate) {url += `${startDate ? '&' : '?'}endDate=${endDate}`;}
  
  const response = await apiClient.get(url, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

// ==================== SYSTEM API ====================

// فحص حالة النظام
export const healthCheck = async () => {
  const response = await apiClient.get('/health');
  return response.data;
};