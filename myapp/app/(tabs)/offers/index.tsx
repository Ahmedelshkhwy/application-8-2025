import { Ionicons } from '@expo/vector-icons';
import React, { useState, useEffect } from 'react';
import {
  Alert,
  FlatList,
  Image,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { useCart } from '../../../src/contexts/cartcontext';
import { useAuth } from '../../../src/contexts/AuthContext';
import { useRouter } from 'expo-router';
import { getOffers } from '../../../src/api/api';
import { Discount } from '../../../src/types/modules';
import LoadingComponent from '../../../src/components/LoadingComponent';
import ErrorComponent from '../../../src/components/ErrorComponent';
import EmptyState from '../../../src/components/EmptyState';

const PRIMARY = '#23B6C7';
const PINK = '#E94B7B';
const BG = '#E6F3F7';
const { width } = Dimensions.get('window');

export default function OffersScreen() {
  const [offers, setOffers] = useState<Discount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [error, setError] = useState<string | null>(null);
  const { addToCart, state } = useCart();
  const { token } = useAuth();
  const router = useRouter();

  useEffect(() => {
    loadOffers();
  }, []);

  const loadOffers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (!token) {
        console.log('لا يوجد token، لا يمكن تحميل العروض');
        setOffers([]);
        return;
      }

      console.log('🔍 جلب العروض من الخادم...');
      
      // Get API base URL from environment variable
      const getAPIBaseURL = (): string => {
        const apiUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
        if (apiUrl) {
          return `${apiUrl}/admin`;
        }
        return 'http://localhost:5000/api/admin'; // fallback
      };
      
      const API_BASE = getAPIBaseURL();
      
      // محاولة جلب العروض من الباك إند مع timeout ومعالجة أفضل للأخطاء
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      
      try {
        // جلب مباشر من API الخصومات
        const directResponse = await fetch(`${API_BASE}/discounts`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          signal: controller.signal,
        });

        if (directResponse.ok) {
          const directData = await directResponse.json();
          clearTimeout(timeoutId);
          
          let offersArray: Discount[] = [];
          
          if (directData && directData.discounts && Array.isArray(directData.discounts)) {
            console.log('Setting offers from direct discounts API:', directData.discounts.length);
            offersArray = directData.discounts.filter((discount: Discount) => discount.isActive !== false);
          } else if (directData && Array.isArray(directData)) {
            console.log('Setting offers from direct array:', directData.length);
            offersArray = directData.filter((discount: Discount) => discount.isActive !== false);
          }
          
          setOffers(offersArray);
          return;
        }
        
        // إذا فشل، حاول استخدام getOffers
        const data = await getOffers(token);
        clearTimeout(timeoutId);
        
        console.log('Offers data received:', data);
        
        if (data && data.success === false) {
          throw new Error(data.message || 'خطأ من الخادم');
        }
        
        let offersArray: Discount[] = [];
        
        if (data && data.offers && Array.isArray(data.offers)) {
          console.log('Setting offers from data.offers:', data.offers.length);
          offersArray = data.offers;
        } else if (data && Array.isArray(data)) {
          console.log('Setting offers from direct array:', data.length);
          offersArray = data;
        } else {
          console.log('لا توجد عروض متاحة - البيانات المستلمة:', typeof data);
          offersArray = [];
        }
        
        // تنظيف البيانات وإزالة العناصر التالفة
        const cleanOffers = offersArray.filter(offer => {
          if (!offer || typeof offer !== 'object' || !offer._id) {
            console.warn('عرض تالف تم إزالته:', offer);
            return false;
          }
          return true;
        });
        
        console.log(`تم تحميل ${cleanOffers.length} عرض بنجاح`);
        setOffers(cleanOffers);
        
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        throw fetchError;
      }
      
    } catch (error: any) {
      console.error('خطأ في تحميل العروض:', error);
      
      if (error.name === 'AbortError') {
        setError('انتهت مهلة الانتظار، يرجى المحاولة مرة أخرى');
      } else if (error.message && error.message.includes('URI')) {
        setError('خطأ في معالجة البيانات، يرجى المحاولة مرة أخرى');
      } else if (error.message && error.message.includes('timeout')) {
        setError('انتهت مهلة الانتظار، يرجى المحاولة مرة أخرى');
      } else if (error.message) {
        setError(error.message);
      } else {
        setError('فشل في تحميل العروض من الخادم');
      }
      
      setOffers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadOffers();
    setRefreshing(false);
  };

  const handleAddToCart = async (offer: Discount) => {
    if (!token) {
      Alert.alert(
        'تسجيل الدخول مطلوب',
        'يجب تسجيل الدخول لإضافة منتجات للسلة',
        [
          { text: 'إلغاء', style: 'cancel' },
          { text: 'تسجيل دخول', onPress: () => router.push('/(auth)/login/login') }
        ]
      );
      return;
    }

    // التحقق من وجود البيانات المطلوبة
    if (!offer.product || !offer.product._id || !offer.product.name) {
      Alert.alert('خطأ', 'بيانات المنتج غير مكتملة');
      return;
    }

    try {
      const success = addToCart({
        id: offer.productId || offer.product._id,
        name: offer.product.name,
        price: offer.discountPrice || offer.product.price || 0,
        quantity: 1,
        stock: 999 // للعروض نفترض مخزون كبير
      });
      
      if (success) {
        Alert.alert('تمت الإضافة', `تمت إضافة "${offer.product.name}" إلى السلة.`);
      }
    } catch (error: any) {
      console.error('Error adding to cart:', error);
      Alert.alert('خطأ', error.message || 'فشل في إضافة المنتج للسلة');
    }
  };

  const categories = [
    { id: 'all', name: 'جميع العروض' },
    { id: 'vitamins', name: 'فيتامينات' },
    { id: 'painkillers', name: 'مسكنات' },
    { id: 'skincare', name: 'عناية بالبشرة' },
    { id: 'diabetes', name: 'أدوية السكري' },
    { id: 'antibiotics', name: 'مضادات حيوية' },
  ];

  const filteredOffers = selectedCategory === 'all' 
    ? offers 
    : offers.filter(offer => offer.category === selectedCategory || !offer.category);

  const renderOffer = ({ item }: { item: Discount }) => {
    return (
      <View style={styles.offerCard}>
        <Image 
          source={require('../../../assets/images/Alshafi.png')}
          style={styles.offerImage}
        />
        <View style={styles.discountBadge}>
          <Text style={styles.discountText}>{item.discountPercentage || 0}%</Text>
          <Text style={styles.discountLabel}>خصم</Text>
        </View>
        
        <View style={styles.offerContent}>
          <Text style={styles.offerTitle}>{item.title || 'عرض مميز'}</Text>
          <Text style={styles.offerDescription}>{item.description || 'وصف العرض غير متوفر'}</Text>
          
          <View style={styles.priceContainer}>
            {item.originalPrice && item.originalPrice > 0 && (
              <Text style={styles.originalPrice}>{item.originalPrice.toFixed(2)} ر.س</Text>
            )}
            {item.discountPrice && item.discountPrice > 0 && (
              <Text style={styles.discountPrice}>{item.discountPrice.toFixed(2)} ر.س</Text>
            )}
            {(!item.originalPrice || !item.discountPrice) && (
              <Text style={styles.discountPrice}>السعر غير محدد</Text>
            )}
          </View>
          
          <Text style={styles.validUntil}>صالح حتى: {item.validUntil ? new Date(item.validUntil).toLocaleDateString('ar-SA') : 'غير محدد'}</Text>
          
          <TouchableOpacity 
            style={styles.addToCartBtn}
            onPress={() => handleAddToCart(item)}
          >
            <Ionicons name="cart-outline" size={18} color="white" style={{ marginRight: 8 }} />
            <Text style={styles.addToCartText}>إضافة للسلة</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderCategory = ({ item }: { item: { id: string; name: string } }) => (
    <TouchableOpacity
      style={[
        styles.categoryBtn,
        selectedCategory === item.id && styles.categoryBtnActive
      ]}
      onPress={() => setSelectedCategory(item.id)}
    >
      <Text style={[
        styles.categoryText,
        selectedCategory === item.id && styles.categoryTextActive
      ]}>
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  // عرض Loading Component
  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor={PRIMARY} />
        <View style={styles.header}>
          <Text style={styles.headerTitle}>العروض والخصومات</Text>
        </View>
        <LoadingComponent 
          message="جاري تحميل العروض..."
          iconName="pricetag-outline"
        />
      </SafeAreaView>
    );
  }

  // عرض Error Component
  if (error) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor={PRIMARY} />
        <View style={styles.header}>
          <Text style={styles.headerTitle}>العروض والخصومات</Text>
        </View>
        <ErrorComponent 
          message={error}
          onRetry={loadOffers}
          iconName="alert-circle-outline"
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={PRIMARY} />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>العروض والخصومات</Text>
      </View>
      
      <View style={styles.container}>
        <FlatList
          data={categories}
          renderItem={renderCategory}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesList}
          contentContainerStyle={styles.categoriesContainer}
        />
        
        <FlatList
          data={filteredOffers}
          renderItem={renderOffer}
          keyExtractor={(item) => item._id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.offersContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[PRIMARY]}
              tintColor={PRIMARY}
            />
          }
          ListEmptyComponent={
            <EmptyState
              iconName="pricetag-outline"
              title="لا توجد عروض متاحة"
              subtitle="لا توجد عروض في هذه الفئة حالياً"
              onAction={loadOffers}
            />
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BG,
  },
  header: {
    backgroundColor: PRIMARY,
    paddingTop: Platform.OS === 'ios' ? 60 : 50,
    paddingBottom: 16,
    paddingHorizontal: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  container: {
    flex: 1,
  },
  categoriesList: {
    maxHeight: 80,
    backgroundColor: 'white',
    borderBottomWidth: 2,
    borderBottomColor: '#ddd',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    zIndex: 10,
  },
  categoriesContainer: {
    paddingHorizontal: 16,
    paddingVertical: 0,
  },
  categoryBtn: {
    paddingHorizontal: 19,
    paddingVertical: 5,
    marginRight: 12,
    borderRadius: 22,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#eee',
  },
  categoryBtnActive: {
    backgroundColor: PRIMARY,
    borderColor: PRIMARY,
  },
  categoryText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '600',
  },
  categoryTextActive: {
    color: 'white',
    fontWeight: 'bold',
  },
  offersContainer: {
    padding: 22,
  },
  offerCard: {
    backgroundColor: 'white',
    borderRadius: 19,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
    overflow: 'hidden',
  },
  offerImage: {
    width: '90%',
    height: 135,
    resizeMode: 'cover',
  },
  discountBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: PINK,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignItems: 'center',
  },
  discountText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  discountLabel: {
    color: 'white',
    fontSize: 10,
  },
  offerContent: {
    padding: 16,
  },
  offerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'darkblue',
    marginBottom: 8,
  },
  offerDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  originalPrice: {
    fontSize: 14,
    color: '#999',
    textDecorationLine: 'line-through',
    marginRight: 8,
  },
  discountPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: PRIMARY,
  },
  validUntil: {
    fontSize: 12,
    color: '#666',
    marginBottom: 16,
  },
  addToCartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PRIMARY,
    paddingVertical: 6,
  
    borderWidth: 0.7,
    borderColor: 'blue',
    borderRadius: 13,
   
  },
  addToCartText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
