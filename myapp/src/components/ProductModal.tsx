import { Ionicons } from '@expo/vector-icons';
import React, { useState, useEffect } from 'react';
import {
  Alert,
  Image,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Dimensions,
  Button,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useCart } from '../../src/contexts/cartcontext';
import { useAuth } from '../../src/contexts/AuthContext';
import { getAllProducts } from '../../src/api/api';
import { Product } from '../../src/types/modules';

const PRIMARY = '#23B6C7';
const PINK = '#E94B7B';
const BG = '#E6F3F7';
const { width: SCREEN_WIDTH } = Dimensions.get('window');


// تعريف نوع الخصائص
type ProductModalProps = {
  product: Product | null;
  visible: boolean;
  onClose: () => void;
  onAddToCart: (product: Product) => Promise<void>;
};

// تعريف المكون
const ProductModal: React.FC<ProductModalProps> = ({ product, visible, onClose, onAddToCart }) => {
  // محتوى المكون
  return (
    visible && product ? (
      <View>
        <Text>{product.name}</Text>
        <Button title="أضف إلى السلة" onPress={() => onAddToCart(product)} />
        <Button title="إغلاق" onPress={onClose} />
      </View>
    ) : null
  );
};

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { addToCart, state } = useCart();
  const { token } = useAuth();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(true);
  

  useEffect(() => {
    loadProduct();
  }, [id]);

  const loadProduct = async () => {
    if (!id) return;
    
    setIsLoading(true);
    try {
      const allProducts = await getAllProducts();
      const foundProduct = allProducts.find((p: any) => p._id === id);
      
      if (!foundProduct) {
        throw new Error('المنتج غير موجود');
      }
      
      setProduct(foundProduct);
    } catch (err) {
      console.error('خطأ في تحميل المنتج:', err);
      setError('فشل في تحميل تفاصيل المنتج');
    } finally {
      setIsLoading(false);
    }
  };

  

  const handleAddToCart = async () => {
    if (!product || !token) {
      Alert.alert(
        'تسجيل الدخول مطلوب',
        'يجب تسجيل الدخول لإضافة منتجات للسلة',
        [
          { text: 'إلغاء', style: 'cancel' },
          { text: 'تسجيل دخول', onPress: () => {
            router.push('/(auth)/login/login');
          }}
        ]
      );
      return;
    }

    if (product.stock <= 0) {
      Alert.alert('نفذ المخزون', 'هذا المنتج غير متوفر حالياً');
      return;
    }

    const existingInCart = state.items.find(item => item.id === product._id);
    const currentQuantityInCart = existingInCart ? existingInCart.quantity : 0;
    
    if (currentQuantityInCart >= product.stock) {
      Alert.alert(
        'وصلت للحد الأقصى', 
        `لا يمكن إضافة المزيد من "${product.name}"`
      );
      return;
    }

    try {
      const success = addToCart({
        id: product._id,
        name: product.name,
        price: product.price,
        quantity: 1,
        stock: product.stock
      });
      
      if (success) {
        Alert.alert('تمت الإضافة', `تمت إضافة "${product.name}" إلى السلة.`);
      }
    } catch (error: any) {
      Alert.alert('خطأ', error.message || 'فشل في إضافة المنتج للسلة');
    }
  };

  const existingInCart = product ? state.items.find(item => item.id === product._id) : null;
  const quantityInCart = existingInCart ? existingInCart.quantity : 0;
  const canAdd = product ? product.stock > 0 && quantityInCart < product.stock : false;

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor={PRIMARY} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PRIMARY} />
          <Text style={styles.loadingText}>جاري تحميل تفاصيل المنتج...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !product) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor={PRIMARY} />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={60} color="#ff6b6b" />
          <Text style={styles.errorText}>{error || 'المنتج غير موجود'}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => router.back()}>
            <Text style={styles.retryBtnText}>العودة</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={PRIMARY} />
      
      {/* الهيدر مع شريط البحث */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        
        {/* شريط البحث */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color="rgba(255,255,255,0.7)" />
          <Text style={styles.searchPlaceholder}>ابحث عن المنتجات...</Text>
        </View>
        
        <TouchableOpacity 
          style={styles.cartButton} 
          onPress={() => router.push('/(tabs)/cart')}
        >
          <Ionicons name="cart-outline" size={24} color="white" />
          {state.items.length > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>
                {state.items.reduce((total, item) => total + item.quantity, 0)}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* المحتوى */}
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* صورة المنتج */}
        <View style={styles.imageSection}>
          <Image
            source={{ uri: product.image || 'https://placehold.co/400x400/23B6C7/ffffff?text=Product' }}
            style={styles.productImage}
            resizeMode="cover"
          />
          <TouchableOpacity style={styles.zoomButton}>
            <Ionicons name="expand-outline" size={20} color={PRIMARY} />
          </TouchableOpacity>
        </View>

        {/* لايبل Top Sellers */}
        <View style={styles.topSellersBadge}>
          <Ionicons name="trending-up" size={16} color="#FF6B35" />
          <Text style={styles.topSellersText}>Top Sellers • +100 sold in last 7 days</Text>
        </View>

        {/* اسم المنتج والسعر */}
        <View style={styles.productInfoCard}>
          <Text style={styles.productName}>{product.name}</Text>
          <View style={styles.priceRow}>
            <Text style={styles.price}>{product.price.toFixed(2)} ر.س</Text>
            <Text style={styles.taxIncluded}>شامل الضريبة</Text>
          </View>
        </View>

        {/* الخدمات */}
        <View style={styles.servicesRow}>
          <View style={styles.serviceCard}>
            <Ionicons name="shield-checkmark" size={20} color="#4CAF50" />
            <Text style={styles.serviceText}>توصيل آمن</Text>
          </View>
          <View style={styles.serviceCard}>
            <Ionicons name="card" size={20} color="#2196F3" />
            <Text style={styles.serviceText}>دفع عند الاستلام</Text>
          </View>
        </View>

        {/* الميزات */}
        <View style={styles.featuresCard}>
          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Ionicons name="shield-checkmark-outline" size={24} color={PRIMARY} />
            </View>
            <Text style={styles.featureTitle}>ضمان الجودة</Text>
            <Text style={styles.featureDesc}>أصلي 100%</Text>
          </View>

          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Ionicons name="lock-closed-outline" size={24} color={PRIMARY} />
            </View>
            <Text style={styles.featureTitle}>أمان تام</Text>
            <Text style={styles.featureDesc}>معتمد طبياً</Text>
          </View>

          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Ionicons name="cube-outline" size={24} color={PRIMARY} />
            </View>
            <Text style={styles.featureTitle}>تخزين آمن</Text>
            <Text style={styles.featureDesc}>ظروف مثالية</Text>
          </View>
        </View>

        {/* About Product */}
        <View style={styles.aboutCard}>
          <Text style={styles.aboutTitle}>About Product</Text>
          <Text style={styles.aboutDescription}>
            {product.description || 'منتج طبي عالي الجودة مصنوع من أفضل المواد الطبية المعتمدة عالمياً. يتميز بفعالية عالية وأمان تام في الاستخدام.'}
          </Text>

          <View style={styles.detailsSection}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>الفئة:</Text>
              <Text style={styles.detailValue}>{product.category || 'منتجات طبية'}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>المخزون:</Text>
              <Text style={[styles.detailValue, { 
                color: product.stock > 10 ? "#4CAF50" : "#FF9800" 
              }]}>
                {product.stock > 10 ? 'متوفر بكثرة' : `${product.stock} قطعة متبقية`}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>التقييم:</Text>
              <View style={styles.ratingRow}>
                <View style={styles.stars}>
                  {[1,2,3,4,5].map((star) => (
                    <Ionicons 
                      key={star} 
                      name={star <= 4 ? "star" : "star-outline"} 
                      size={14} 
                      color="#FFD700" 
                    />
                  ))}
                </View>
                <Text style={styles.ratingNumber}>(4.0)</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* الفوتر الثابت */}
      <View style={styles.footer}>
        <View style={styles.footerContent}>
          <View style={styles.priceSection}>
            <Text style={styles.footerPrice}>{product.price.toFixed(2)} ر.س</Text>
            <Text style={styles.footerPriceLabel}>السعر الإجمالي</Text>
          </View>
          
          <TouchableOpacity 
            style={[styles.addToCartBtn, !canAdd && styles.addToCartBtnDisabled]}
            onPress={handleAddToCart}
            disabled={!canAdd}
            activeOpacity={0.8}
          >
            <Ionicons 
              name={quantityInCart > 0 ? "add-circle" : "cart-outline"} 
              size={18} 
              color="#fff" 
            />
            <Text style={styles.addToCartText}>
              {product.stock <= 0 ? 'نفذ المخزون' : 
               quantityInCart >= product.stock ? 'لا يوجد مخزون كافي' : 
               quantityInCart > 0 ? 'إضافة المزيد' : 'أضف للسلة'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BG,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingText: {
    marginTop: 16,
    color: PRIMARY,
    fontSize: 16,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorText: {
    marginTop: 16,
    color: '#ff6b6b',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryBtn: {
    backgroundColor: PRIMARY,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  header: {
    backgroundColor: PRIMARY,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginHorizontal: 8,
  },
  searchPlaceholder: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  cartButton: {
    position: 'relative',
    padding: 8,
    marginLeft: 8,
  },
  cartBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: PINK,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  scrollContainer: {
    flex: 1,
  },
  imageSection: {
    position: 'relative',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: SCREEN_WIDTH - 32,
  },
  zoomButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    padding: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  topSellersBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginHorizontal: 16,
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  topSellersText: {
    fontSize: 12,
    color: '#FF6B35',
    fontWeight: '600',
    marginLeft: 6,
  },
  productInfoCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  productName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 12,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginTop: 8,
  },
  price: {
    fontSize: 26,
    fontWeight: 'bold',
    color: PRIMARY,
  },
  taxIncluded: {
    fontSize: 12,
    color: '#888',
    marginLeft: 8,
    marginBottom: 4,
  },
  servicesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginTop: 16,
  },
  serviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    flex: 1,
    marginHorizontal: 4,
  },
  serviceText: {
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 8,
    color: '#333',
  },
  featuresCard: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    paddingVertical: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  featureItem: {
    alignItems: 'center',
    flex: 1,
  },
  featureIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: `${PRIMARY}20`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  featureTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 4,
  },
  featureDesc: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
  },
  aboutCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  aboutTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  aboutDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: '#666',
    textAlign: 'justify',
    marginBottom: 16,
  },
  detailsSection: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f8f8',
  },
  detailLabel: {
    fontSize: 14,
    color: '#888',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stars: {
    flexDirection: 'row',
    marginRight: 4,
  },
  ratingNumber: {
    fontSize: 12,
    color: '#666',
  },
  bottomSpacer: {
    height: 100,
  },
  footer: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: -2 },
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  footerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priceSection: {
    flex: 1,
  },
  footerPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: PRIMARY,
  },
  footerPriceLabel: {
    fontSize: 11,
    color: '#888',
    marginTop: 2,
  },
  addToCartBtn: {
    backgroundColor: PINK,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
    elevation: 4,
    shadowColor: '#E94B7B',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    minWidth: 150,
  },
  addToCartBtnDisabled: {
    backgroundColor: '#ccc',
    elevation: 0,
  },
  addToCartText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 6,
  },
});
