/**
 * 🚨 Error Display Components
 * مكونات لعرض الأخطاء بشكل موحد وجميل
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ErrorType } from '../services/ErrorHandler';

const PRIMARY = '#23B6C7';
const PINK = '#E94B7B';
const BG = '#E6F3F7';

interface ErrorComponentProps {
  error?: AppError | null;
  message?: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  showRetry?: boolean;
  compact?: boolean;
  iconName?: keyof typeof Ionicons.glyphMap;
}

export interface AppError {
  type: ErrorType;
  message: string;
  details?: any;
  statusCode?: number;
  timestamp: Date;
}

/**
 * مكون عرض الخطأ الأساسي
 */
export const ErrorComponent: React.FC<ErrorComponentProps> = ({
  error,
  message,
  onRetry,
  onDismiss,
  showRetry = true,
  compact = false,
  iconName
}) => {
  const errorMessage = error?.message || message || 'حدث خطأ غير متوقع';
  const errorIcon = iconName || getErrorIcon(error?.type);

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <Ionicons name={errorIcon} size={16} color={PINK} />
        <Text style={styles.compactText}>{errorMessage}</Text>
        {onRetry && (
          <TouchableOpacity onPress={onRetry} style={styles.compactRetryBtn}>
            <Ionicons name="refresh" size={14} color={PRIMARY} />
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Ionicons name={errorIcon} size={48} color={PINK} />
      </View>
      
      <Text style={styles.title}>
        {getErrorTitle(error?.type)}
      </Text>
      
      <Text style={styles.message}>
        {errorMessage}
      </Text>

      <View style={styles.buttonsContainer}>
        {onRetry && showRetry && (
          <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
            <Ionicons name="refresh" size={18} color="white" />
            <Text style={styles.retryButtonText}>إعادة المحاولة</Text>
          </TouchableOpacity>
        )}
        
        {onDismiss && (
          <TouchableOpacity style={styles.dismissButton} onPress={onDismiss}>
            <Text style={styles.dismissButtonText}>موافق</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

/**
 * مكون لعرض خطأ الشبكة
 */
export const NetworkErrorComponent: React.FC<{
  onRetry?: () => void;
}> = ({ onRetry }) => (
  <ErrorComponent
    message="تحقق من اتصال الإنترنت وحاول مرة أخرى"
    iconName="wifi-outline"
    onRetry={onRetry}
  />
);

/**
 * مكون لعرض خطأ عدم وجود البيانات
 */
export const NotFoundErrorComponent: React.FC<{
  message?: string;
  onGoBack?: () => void;
}> = ({ message = "المحتوى المطلوب غير موجود", onGoBack }) => (
  <ErrorComponent
    message={message}
    iconName="search-outline"
    onRetry={onGoBack}
    showRetry={!!onGoBack}
  />
);

/**
 * مكون لعرض خطأ المصادقة
 */
export const AuthErrorComponent: React.FC<{
  onLogin?: () => void;
}> = ({ onLogin }) => (
  <ErrorComponent
    message="يجب تسجيل الدخول للوصول لهذا المحتوى"
    iconName="log-in"
    onRetry={onLogin}
  />
);

/**
 * Hook لعرض رسائل الخطأ السريعة
 */
export const useErrorAlert = () => {
  const showError = (error: AppError | string, onRetry?: () => void) => {
    const message = typeof error === 'string' ? error : error.message;
    const title = typeof error === 'string' ? 'خطأ' : getErrorTitle(error.type);

    const buttons: any[] = [
      { text: 'موافق', style: 'default' }
    ];

    if (onRetry) {
      buttons.unshift({
        text: 'إعادة المحاولة',
        onPress: onRetry
      });
    }

    Alert.alert(title, message, buttons);
  };

  return { showError };
};

// Helper functions
const getErrorIcon = (type?: ErrorType): keyof typeof Ionicons.glyphMap => {
  switch (type) {
    case ErrorType.NETWORK:
      return 'wifi-outline';
    case ErrorType.AUTHENTICATION:
      return 'lock-closed-outline';
    case ErrorType.VALIDATION:
      return 'alert-circle-outline';
    case ErrorType.SERVER:
      return 'server-outline';
    case ErrorType.PERMISSION:
      return 'ban-outline';
    case ErrorType.NOT_FOUND:
      return 'search-outline';
    default:
      return 'alert-circle-outline';
  }
};

const getErrorTitle = (type?: ErrorType): string => {
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
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffebee',
    padding: 12,
    borderRadius: 8,
    marginVertical: 8,
  },
  iconContainer: {
    marginBottom: 20,
    padding: 20,
    backgroundColor: BG,
    borderRadius: 50,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  compactText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  buttonsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PRIMARY,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  dismissButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  dismissButtonText: {
    color: '#666',
    fontSize: 16,
  },
  compactRetryBtn: {
    padding: 4,
  },
});
