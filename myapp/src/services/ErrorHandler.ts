/**
 * 🛡️ Error Handling Service
 * خدمة مركزية لمعالجة الأخطاء بشكل موحد ومتسق
 */

import { Alert } from 'react-native';

// أنواع الأخطاء المختلفة
export enum ErrorType {
  NETWORK = 'NETWORK',
  AUTHENTICATION = 'AUTHENTICATION',
  VALIDATION = 'VALIDATION',
  SERVER = 'SERVER',
  UNKNOWN = 'UNKNOWN',
  PERMISSION = 'PERMISSION',
  NOT_FOUND = 'NOT_FOUND'
}

// واجهة الخطأ المعياري
export interface AppError {
  type: ErrorType;
  message: string;
  details?: any;
  statusCode?: number;
  timestamp: Date;
}

// خدمة معالجة الأخطاء
export class ErrorHandler {
  
  /**
   * تحويل الخطأ إلى نوع موحد
   */
  static parseError(error: any): AppError {
    const timestamp = new Date();
    
    // التحقق من نوع الخطأ
    if (error.response) {
      // خطأ من الخادم
      const statusCode = error.response.status;
      const message = error.response.data?.message || 'حدث خطأ في الخادم';
      
      switch (statusCode) {
        case 400:
          return {
            type: ErrorType.VALIDATION,
            message: message || 'بيانات غير صحيحة',
            details: error.response.data,
            statusCode,
            timestamp
          };
        
        case 401:
          return {
            type: ErrorType.AUTHENTICATION,
            message: message || 'يجب تسجيل الدخول',
            details: error.response.data,
            statusCode,
            timestamp
          };
        
        case 403:
          return {
            type: ErrorType.PERMISSION,
            message: message || 'غير مصرح بهذا الإجراء',
            details: error.response.data,
            statusCode,
            timestamp
          };
        
        case 404:
          return {
            type: ErrorType.NOT_FOUND,
            message: message || 'المورد غير موجود',
            details: error.response.data,
            statusCode,
            timestamp
          };
        
        case 500:
        case 502:
        case 503:
          return {
            type: ErrorType.SERVER,
            message: 'خطأ في الخادم، حاول مرة أخرى لاحقاً',
            details: error.response.data,
            statusCode,
            timestamp
          };
        
        default:
          return {
            type: ErrorType.SERVER,
            message: message || 'حدث خطأ غير متوقع',
            details: error.response.data,
            statusCode,
            timestamp
          };
      }
    }
    
    if (error.request) {
      // خطأ في الشبكة
      return {
        type: ErrorType.NETWORK,
        message: 'تحقق من اتصال الإنترنت',
        details: error.request,
        timestamp
      };
    }
    
    // خطأ عام
    return {
      type: ErrorType.UNKNOWN,
      message: error.message || 'حدث خطأ غير متوقع',
      details: error,
      timestamp
    };
  }

  /**
   * عرض الخطأ للمستخدم
   */
  static showError(error: AppError, options?: {
    title?: string;
    showDetails?: boolean;
    onRetry?: () => void;
  }) {
    const title = options?.title || this.getErrorTitle(error.type);
    const message = error.message;
    
    const buttons: any[] = [
      { text: 'موافق', style: 'default' }
    ];
    
    if (options?.onRetry) {
      buttons.unshift({
        text: 'إعادة المحاولة',
        onPress: options.onRetry
      });
    }
    
    Alert.alert(title, message, buttons);
  }

  /**
   * معالجة شاملة للخطأ (تحويل + عرض)
   */
  static handle(error: any, options?: {
    title?: string;
    showAlert?: boolean;
    onRetry?: () => void;
    logError?: boolean;
  }): AppError {
    const appError = this.parseError(error);
    
    // تسجيل الخطأ (في التطوير أو لأغراض التتبع)
    if (options?.logError !== false) {
      this.logError(appError);
    }
    
    // عرض الخطأ للمستخدم
    if (options?.showAlert !== false) {
      this.showError(appError, {
        title: options?.title,
        onRetry: options?.onRetry
      });
    }
    
    return appError;
  }

  /**
   * معالجة خاصة لأخطاء API
   */
  static handleApiError(error: any, context?: string): AppError {
    const appError = this.parseError(error);
    
    // إضافة سياق للخطأ
    if (context) {
      appError.details = {
        ...appError.details,
        context
      };
    }
    
    this.logError(appError);
    return appError;
  }

  /**
   * معالجة أخطاء المصادقة
   */
  static handleAuthError(error: any): AppError {
    const appError = this.parseError(error);
    
    if (appError.type === ErrorType.AUTHENTICATION) {
      // يمكن إضافة منطق إضافي هنا مثل تسجيل الخروج التلقائي
      // AuthContext.logout();
    }
    
    return appError;
  }

  /**
   * الحصول على عنوان مناسب للخطأ
   */
  private static getErrorTitle(type: ErrorType): string {
    switch (type) {
      case ErrorType.NETWORK:
        return 'مشكلة في الاتصال';
      case ErrorType.AUTHENTICATION:
        return 'خطأ في المصادقة';
      case ErrorType.VALIDATION:
        return 'بيانات غير صحيحة';
      case ErrorType.SERVER:
        return 'خطأ في الخادم';
      case ErrorType.PERMISSION:
        return 'غير مصرح';
      case ErrorType.NOT_FOUND:
        return 'غير موجود';
      default:
        return 'خطأ';
    }
  }

  /**
   * تسجيل الخطأ للمراقبة والتتبع
   */
  private static logError(error: AppError) {
    if (__DEV__) {
      console.group(`🚨 ${error.type} Error - ${error.timestamp.toISOString()}`);
      console.error('Message:', error.message);
      if (error.statusCode) {
        console.error('Status Code:', error.statusCode);
      }
      if (error.details) {
        console.error('Details:', error.details);
      }
      console.groupEnd();
    }
    
    // في الإنتاج، يمكن إرسال الأخطاء لخدمة مراقبة مثل Crashlytics
    // CrashlyticsService.recordError(error);
  }
}

// مساعدات سريعة للاستخدام المباشر
export const handleError = ErrorHandler.handle;
export const handleApiError = ErrorHandler.handleApiError;
export const handleAuthError = ErrorHandler.handleAuthError;
export const showError = ErrorHandler.showError;
export const parseError = ErrorHandler.parseError;
