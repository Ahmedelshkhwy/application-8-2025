/**
 * 🎯 Custom Hook لمعالجة الأخطاء
 * Hook مخصص لإدارة الأخطاء في المكونات بشكل سهل ومتسق
 */

import { useState, useCallback } from 'react';
import { ErrorHandler, AppError, ErrorType } from '../services/ErrorHandler';

export interface UseErrorHandlerReturn {
  error: AppError | null;
  isLoading: boolean;
  clearError: () => void;
  handleError: (error: any, options?: {
    showAlert?: boolean;
    context?: string;
  }) => AppError;
  executeWithErrorHandling: <T>(
    asyncFn: () => Promise<T>,
    options?: {
      showAlert?: boolean;
      context?: string;
      onSuccess?: (result: T) => void;
      onError?: (error: AppError) => void;
    }
  ) => Promise<T | null>;
}

/**
 * Hook لمعالجة الأخطاء في المكونات
 */
export const useErrorHandler = (): UseErrorHandlerReturn => {
  const [error, setError] = useState<AppError | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const handleError = useCallback((
    rawError: any, 
    options?: {
      showAlert?: boolean;
      context?: string;
    }
  ): AppError => {
    const appError = ErrorHandler.parseError(rawError);
    
    // إضافة السياق إذا توفر
    if (options?.context) {
      appError.details = {
        ...appError.details,
        context: options.context
      };
    }

    setError(appError);

    // عرض التنبيه إذا كان مطلوباً
    if (options?.showAlert !== false) {
      ErrorHandler.showError(appError);
    }

    // تسجيل الخطأ سيتم في parseError تلقائياً

    return appError;
  }, []);

  const executeWithErrorHandling = useCallback(async <T>(
    asyncFn: () => Promise<T>,
    options?: {
      showAlert?: boolean;
      context?: string;
      onSuccess?: (result: T) => void;
      onError?: (error: AppError) => void;
    }
  ): Promise<T | null> => {
    setIsLoading(true);
    clearError();

    try {
      const result = await asyncFn();
      options?.onSuccess?.(result);
      return result;
    } catch (rawError) {
      const appError = handleError(rawError, {
        showAlert: options?.showAlert,
        context: options?.context
      });
      options?.onError?.(appError);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [handleError, clearError]);

  return {
    error,
    isLoading,
    clearError,
    handleError,
    executeWithErrorHandling
  };
};

/**
 * Hook مخصص للعمليات التي تتطلب مصادقة
 */
export const useAuthErrorHandler = () => {
  const baseHandler = useErrorHandler();

  const handleAuthError = useCallback((
    rawError: any,
    options?: {
      showAlert?: boolean;
      context?: string;
      onAuthRequired?: () => void;
    }
  ): AppError => {
    const appError = ErrorHandler.handleAuthError(rawError);
    
    // إذا كان خطأ مصادقة، يمكن تنفيذ إجراء إضافي
    if (appError.type === ErrorType.AUTHENTICATION) {
      options?.onAuthRequired?.();
    }

    if (options?.showAlert !== false) {
      ErrorHandler.showError(appError);
    }

    return appError;
  }, []);

  return {
    ...baseHandler,
    handleAuthError
  };
};

/**
 * Hook مخصص لعمليات API
 */
export const useApiErrorHandler = () => {
  const baseHandler = useErrorHandler();

  const handleApiError = useCallback((
    rawError: any,
    context?: string
  ): AppError => {
    return ErrorHandler.handleApiError(rawError, context);
  }, []);

  const executeApiCall = useCallback(async <T>(
    apiCall: () => Promise<T>,
    options?: {
      context?: string;
      showAlert?: boolean;
      onSuccess?: (result: T) => void;
      onError?: (error: AppError) => void;
    }
  ): Promise<T | null> => {
    return baseHandler.executeWithErrorHandling(apiCall, {
      showAlert: options?.showAlert,
      context: options?.context,
      onSuccess: options?.onSuccess,
      onError: options?.onError
    });
  }, [baseHandler]);

  return {
    ...baseHandler,
    handleApiError,
    executeApiCall
  };
};
