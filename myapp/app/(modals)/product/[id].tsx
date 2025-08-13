import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Dimensions,
  Platform,
  StatusBar,
  SafeAreaView,
  TextInput,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Product } from '../../../src/types/modules';
import { getProductById, getCategoryById, getAllProducts } from '../../../src/api/api';
import { useCart } from '../../../src/contexts/cartcontext';
import { useAuth } from '../../../src/contexts/AuthContext';

const PRIMARY = '#23B6C7';
const PINK = '#E94B7B';
const BG = '#E6F3F7';
const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ProductDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { addToCart, state } = useCart();
  const { token } = useAuth();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [categoryName, setCategoryName] = useState<string>('منتجات طبية');
  const [loading, setLoading] = useState(true);
  const [imageLoading, setImageLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // إضافة البحث
  const [search, setSearch] = useState('');
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);

  // حساب عدد العناصر في السلة
  const cartItemCount = state.items.reduce((total, item) => total + item.quantity, 0);
  
  // حساب كمية هذا المنتج في السلة
  const existingInCart = state.items.find(item => item.id === product?._id);
  const quantityInCart = existingInCart ? existingInCart.quantity : 0;

  useEffect(() => {
    if (id) {
      loadProductDetails();
    }
    loadAllProducts(); // تحميل جميع المنتجات للبحث
  }, [id]);

  // تحميل جميع المنتجات للبحث
  const loadAllProducts = async () => {
    try {
      const products = await getAllProducts();
      setAllProducts(products || []);
    } catch (error) {
      console.error('خطأ في تحميل المنتجات للبحث:', error);
    }
  };

  // فلترة المنتجات للبحث
  const filteredProducts = useMemo(() => {
    if (!search.trim()) {
      return [];
    }
    
    const searchTerm = search.toLowerCase().trim();
    return allProducts.filter((product: Product) => 
      product?.name?.toLowerCase().includes(searchTerm) ||
      product?.description?.toLowerCase().includes(searchTerm) ||
      product?.category?.toLowerCase().includes(searchTerm)
    );
  }, [allProducts, search]);

  const loadProductDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (typeof id === 'string') {
        const productData = await getProductById(id);
        setProduct(productData);

         // جلب اسم الكاتيجوري
        if (productData.category) {
          await loadCategoryName(productData.category);
        }
      }
      
    } catch (err) {
      console.error('خطأ في تحميل تفاصيل المنتج:', err);
      setError('فشل في تحميل تفاصيل المنتج');
    } finally {
      setLoading(false);
    }
  };

  const loadCategoryName = async (categoryId: string) => {
  try {
    const categoryData = await getCategoryById(categoryId);
    setCategoryName(categoryData.name || 'منتجات طبية');
  } catch (err) {
    setCategoryName(getCategoryDisplayName(categoryId));
  }
};
  
  // دالة لتحويل ID الكاتيجوري إلى اسم معروض في حالة فشل جلب البيانات
  const getCategoryDisplayName = (categoryId: string): string => {
    const categoryMap: { [key: string]: string } = {
      'medicine': 'أدوية',
      'cold_medicine': 'أدوية البرد والزكام',
      'pain_relief': 'مسكنات الألم',
      'vitamins': 'فيتامينات ومكملات',
      'skin_care': 'العناية بالبشرة',
      'baby_care': 'منتجات الأطفال',
      'dental_care': 'العناية بالأسنان',
      'first_aid': 'الإسعافات الأولية',
      'medical_devices': 'أجهزة طبية',
      'personal_care': 'العناية الشخصية'
    };
    
    return categoryMap[categoryId] || 'منتجات طبية';
  };

  async function handleAddToCart() {
    if (!product) return;

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

    // التحقق من المخزون
    if (product.stock <= 0) {
      Alert.alert('نفذ المخزون', 'هذا المنتج غير متوفر حالياً');
      return;
    }

    // التحقق من الحد الأقصى
    if (quantityInCart >= product.stock) {
      Alert.alert(
        'وصلت للحد الأقصى',
        `لا يمكن إضافة المزيد من "${product.name}"\n\nالمخزون المتاح: ${product.stock}\nالكمية في السلة: ${quantityInCart}`
      );
      return;
    }

    try {
      const success = addToCart({
        id: product._id || '',
        name: product.name || 'منتج غير محدد',
        price: product.price || 0,
        quantity: 1,
        stock: product.stock
      });

      if (success) {
        Alert.alert('تمت الإضافة', `تمت إضافة "${product.name}" إلى السلة`);
      }
    } catch (error: any) {
      Alert.alert('خطأ', error.message || 'فشل في إضافة المنتج للسلة');
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
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
      <SafeAreaView style={styles.container}>
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
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={PRIMARY} />
      
      {/* الهيدر */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => {
            // إغلاق جميع الشاشات المودال والعودة للصفحة الرئيسية
            router.dismissAll();
            router.replace('/(tabs)/home');
          }} 
          style={styles.backButton}
        >
          <Ionicons name="close" size={24} color="white" />
        </TouchableOpacity>
        
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#888" />
          <TextInput
            style={styles.searchInput}
            placeholder="ابحث عن المنتجات..."
            placeholderTextColor="#888"
            value={search}
            onChangeText={(text) => {
              setSearch(text);
              setShowSearchResults(text.length > 0);
            }}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
          />
          {search.length > 0 && (
            <TouchableOpacity 
              style={styles.clearButton}
              onPress={() => {
                setSearch('');
                setShowSearchResults(false);
              }}
            >
              <Ionicons name="close-circle" size={20} color="#888" />
            </TouchableOpacity>
          )}
        </View>
        
        <TouchableOpacity 
          style={styles.cartButton} 
          onPress={() => router.push('/(tabs)/cart')}
        >
          <Ionicons name="cart-outline" size={24} color="white" />
          {cartItemCount > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{cartItemCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* نتائج البحث */}
      {showSearchResults && search.length > 0 && (
        <View style={styles.searchResultsContainer}>
          <View style={styles.searchResultsHeader}>
            <Text style={styles.searchResultsText}>
              {filteredProducts.length === 0 
                ? 'لم يتم العثور على منتجات'
                : `تم العثور على ${filteredProducts.length} منتج`
              }
            </Text>
            {filteredProducts.length === 0 && (
              <Text style={styles.searchSuggestion}>
                جرب البحث بكلمات أخرى أو تحقق من الإملاء
              </Text>
            )}
          </View>
          
          {filteredProducts.length > 0 && (
            <FlatList
              data={filteredProducts.slice(0, 10)} // أول 10 نتائج
              style={styles.searchResultsList}
              showsVerticalScrollIndicator={false}
              keyExtractor={(item) => item._id || Math.random().toString()}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.searchResultItem}
                  onPress={() => {
                    setSearch('');
                    setShowSearchResults(false);
                    router.push(`/(modals)/product/${item._id}` as any);
                  }}
                >
                  <Image 
                    source={{ uri: item.image || 'https://placehold.co/50x50/23B6C7/ffffff?text=Product' }}
                    style={styles.searchResultImage}
                  />
                  <View style={styles.searchResultInfo}>
                    <Text style={styles.searchResultName} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={styles.searchResultPrice}>
                      {(item.price || 0).toFixed(2)} ر.س
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#888" />
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      )}

      {/* المحتوى القابل للسكرول */}
      <ScrollView style={[styles.scrollView, showSearchResults && styles.scrollViewBlurred]} showsVerticalScrollIndicator={false}>
        
        {/* صورة المنتج */}
        <View style={styles.imageContainer}>
          <Image
            source={{ 
              uri: product.image || 'https://placehold.co/400x400/23B6C7/ffffff?text=Product' 
            }}
            style={styles.productImage}
            onLoadStart={() => setImageLoading(true)}
            onLoadEnd={() => setImageLoading(false)}
          />
          {imageLoading && (
            <View style={styles.imageLoadingOverlay}>
              <ActivityIndicator size="large" color={PRIMARY} />
            </View>
          )}
          
          {/* زر تكبير الصورة */}
          <TouchableOpacity style={styles.zoomButton}>
            <Ionicons name="expand-outline" size={20} color="white" />
          </TouchableOpacity>
        </View>

        {/* لايبل Top Sellers */}
        <View style={styles.topSellerContainer}>
          <Ionicons name="trending-up" size={16} color="#FF6B35" />
          <Text style={styles.topSellerText}>Top Sellers • +100 sold in last 7 days</Text>
        </View>

        {/* اسم المنتج والسعر */}
        <View style={styles.productInfoContainer}>
          <Text style={styles.productName}>{product.name}</Text>
          <View style={styles.priceContainer}>
            <Text style={styles.productPrice}>{(product.price || 0).toFixed(2)} ر.س</Text>
            <Text style={styles.taxLabel}>شامل الضريبة</Text>
          </View>
        </View>

        {/* لايبلز الخدمات */}
        <View style={styles.servicesContainer}>
          <View style={styles.serviceItem}>
            <Ionicons name="shield-checkmark" size={16} color="#4CAF50" />
            <Text style={styles.serviceText}>توصيل آمن للمنزل</Text>
          </View>
          <View style={styles.serviceItem}>
            <Ionicons name="card" size={16} color="#2196F3" />
            <Text style={styles.serviceText}>الدفع عند الاستلام</Text>
          </View>
        </View>

        {/* كونتينر الأيقونات الثلاثة */}
        <View style={styles.featuresContainer}>
          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Ionicons name="shield-checkmark" size={24} color={PRIMARY} />
            </View>
            <Text style={styles.featureTitle}>ضمان الجودة</Text>
            <Text style={styles.featureDesc}>منتج أصلي 100%</Text>
          </View>
          
          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Ionicons name="lock-closed" size={24} color={PRIMARY} />
            </View>
            <Text style={styles.featureTitle}>أمان تام</Text>
            <Text style={styles.featureDesc}>معتمد طبياً</Text>
          </View>
          
          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Ionicons name="cube" size={24} color={PRIMARY} />
            </View>
            <Text style={styles.featureTitle}>تخزين آمن</Text>
            <Text style={styles.featureDesc}>ظروف مثالية</Text>
          </View>
        </View>

        {/* About Product */}
        <View style={styles.aboutContainer}>
          <Text style={styles.aboutTitle}>About Product</Text>
          <Text style={styles.aboutText}>
            {product.description || 'هذا منتج طبي عالي الجودة يلبي أعلى معايير السلامة والفعالية. تم اختباره واعتماده من قبل الجهات الطبية المختصة.'}
          </Text>
          
          <View style={styles.productDetails}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>الفئة:</Text>
              <Text style={styles.detailValue}>{categoryName || 'منتجات طبية'}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>المخزون:</Text>
              <Text style={[styles.detailValue, { color: product.stock > 10 ? '#4CAF50' : '#FF9800' }]}>
                {product.stock > 10 ? 'متوفر' : `${product.stock} متبقي`}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>التقييم:</Text>
              <View style={styles.ratingContainer}>
                {[1,2,3,4,5].map((star) => (
                  <Ionicons 
                    key={star} 
                    name={star <= 4 ? "star" : "star-outline"} 
                    size={14} 
                    color="#FFD700" 
                  />
                ))}
                <Text style={styles.ratingText}>(4.0)</Text>
              </View>
            </View>
          </View>
        </View>

        {/* مساحة إضافية للفوتر */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* الفوتر الثابت */}
      <View style={styles.footer}>
        <View style={styles.footerContent}>
          <View style={styles.priceSection}>
            <Text style={styles.footerPrice}>{(product.price || 0).toFixed(2)} ر.س</Text>
            <Text style={styles.footerPriceLabel}>السعر الإجمالي</Text>
          </View>
          
          <TouchableOpacity 
            style={[
              styles.addToCartBtn,
              (product.stock <= 0 || quantityInCart >= product.stock) && styles.addToCartBtnDisabled
            ]}
            onPress={handleAddToCart}
            disabled={product.stock <= 0 || quantityInCart >= product.stock}
          >
            <Ionicons name="cart" size={18} color="white" style={{ marginRight: 8 }} />
            <Text style={styles.addToCartText}>
              {product.stock <= 0 ? 'نفذ المخزون' : 
               quantityInCart >= product.stock ? 'لا يوجد مخزون' : 
               quantityInCart > 0 ? 'إضافة المزيد' : 'أضف للسلة'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: PRIMARY,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 16,
    color: '#ff6b6b',
    fontSize: 16,
    textAlign: 'center',
  },
  retryBtn: {
    backgroundColor: PRIMARY,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  retryBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  header: {
    backgroundColor: PRIMARY,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 8,
  },
  cartButton: {
    position: 'relative',
    padding: 8,
    marginLeft: 12,
  },
  cartBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
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
  scrollView: {
    flex: 1,
  },
  imageContainer: {
    position: 'relative',
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  productImage: {
    width: SCREEN_WIDTH - 32,
    height: SCREEN_WIDTH - 32,
    borderRadius: 16,
    backgroundColor: '#f5f5f5',
  },
  imageLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 16,
  },
  zoomButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 8,
  },
  topSellerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF3E0',
    marginHorizontal: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginTop: 8,
  },
  topSellerText: {
    marginLeft: 8,
    color: '#FF6B35',
    fontSize: 12,
    fontWeight: '600',
  },
  productInfoContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  productName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
    textAlign: 'center',
  },
  priceContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  productPrice: {
    fontSize: 28,
    fontWeight: '800',
    color: PRIMARY,
    marginBottom: 4,
  },
  taxLabel: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  servicesContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 16,
    marginBottom: 24,
    gap: 24,
  },
  serviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  serviceText: {
    marginLeft: 6,
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
  },
  featuresContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  featureItem: {
    alignItems: 'center',
    flex: 1,
    backgroundColor: '#fff',
    paddingVertical: 20,
    paddingHorizontal: 8,
    borderRadius: 16,
    marginHorizontal: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  featureIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: `${PRIMARY}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
    textAlign: 'center',
  },
  featureDesc: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
  },
  aboutContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  aboutTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: PRIMARY,
    marginBottom: 12,
  },
  aboutText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
    marginBottom: 16,
  },
  productDetails: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    marginLeft: 8,
    fontSize: 12,
    color: '#666',
  },
  footer: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: -2 },
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
    fontSize: 12,
    color: '#666',
  },
  addToCartBtn: {
    backgroundColor: PINK,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    elevation: 4,
    shadowColor: PINK,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  addToCartBtnDisabled: {
    backgroundColor: '#ccc',
  },
  addToCartText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#222',
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  clearButton: {
    padding: 4,
    marginLeft: 8,
  },
  searchResultsContainer: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    maxHeight: 400,
    zIndex: 1000,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  searchResultsHeader: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  searchResultsText: {
    fontSize: 16,
    fontWeight: '600',
    color: PRIMARY,
    textAlign: 'center',
  },
  searchSuggestion: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
    fontStyle: 'italic',
  },
  searchResultsList: {
    maxHeight: 300,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  searchResultImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    marginRight: 12,
  },
  searchResultInfo: {
    flex: 1,
    marginRight: 8,
  },
  searchResultName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  searchResultPrice: {
    fontSize: 12,
    color: PRIMARY,
    fontWeight: '500',
  },
  scrollViewBlurred: {
    opacity: 0.3,
  },
});
