import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Product}  from '../../../src/types/modules';
import {
  Alert,
  FlatList,
  Image,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import * as Location from 'expo-location';
import { useCart } from '../../../src/contexts/cartcontext';
import { useAuth } from '../../../src/contexts/AuthContext';
import { useRouter } from 'expo-router';
import { getAllProducts } from '../../../src/api/api';
import { searchProducts } from '../../../src/services/product.service';
import { CategoriesSection } from '../../../src/components/CategoriesSection';
const PRIMARY = '#23B6C7'; // الأزرق الفاتح من الشعار
const PINK = '#E94B7B';    // الوردي من الشعار
const BG = '#E6F3F7';      // خلفية فاتحة



export default function HomeScreen() {
  const [search, setSearch] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [userLocation, setUserLocation] = useState<string>('اختر عنوانك');
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const ITEMS_PER_PAGE = 20;
  const { addToCart, state } = useCart();
  const { token } = useAuth();
  const router = useRouter();

  // حساب عدد العناصر في السلة
  const cartItemCount = state.items.reduce((total, item) => total + item.quantity, 0);

  useEffect(() => {
    loadProducts();
    loadUserLocation(); // تحميل الموقع تلقائياً عند بدء التطبيق
  }, []);

  // دالة جلب الموقع الحالي للمستخدم
  const loadUserLocation = async () => {
    setIsLoadingLocation(true);
    try {
      // طلب الصلاحية
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setUserLocation('لم يتم السماح بالوصول للموقع');
        return;
      }

      // جلب الموقع الحالي
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      // تحويل الإحداثيات إلى عنوان
      const reverseGeocode = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (reverseGeocode.length > 0) {
        const address = reverseGeocode[0];
        const formattedAddress = `${address.city || ''} ${address.district || ''} ${address.street || ''}`.trim();
        setUserLocation(formattedAddress || 'الموقع الحالي');
      } else {
        setUserLocation('الموقع الحالي');
      }
    } catch (error) {
      console.error('خطأ في جلب الموقع:', error);
      setUserLocation('فشل في تحديد الموقع');
    } finally {
      setIsLoadingLocation(false);
    }
  };

  // دالة النقر على بوكس الموقع
  const handleLocationPress = () => {
    Alert.alert(
      ' موقعك الحالي',
      '',
      [
        { text: 'إلغاء', style: 'cancel' },
        { text: 'تحديث الموقع', onPress: loadUserLocation },
        
      ]
    );
  };

  const loadProducts = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // استدعاء API - سنحتاج تحديث API لدعم pagination
      const data = await getAllProducts();
      setProducts(data|| []);
    } catch (err) {
      console.error('خطأ في تحميل المنتجات:', err);
      setError('فشل في تحميل المنتجات');
    } finally {
      setIsLoading(false);
    }
  };
  
  // فلترة المنتجات محلياً بناءً على البحث (سريع جداً)
  const filteredProducts = useMemo(() => {
    if (!search.trim()) {
      return products; // استخدام products المحلية بدلاً من getAllProducts()
    }
      
    const searchTerm = search.toLowerCase().trim();
    return products.filter((product: Product) => 
      product?.name?.toLowerCase().includes(searchTerm) ||
      product?.description?.toLowerCase().includes(searchTerm) ||
      product?.category?.toLowerCase().includes(searchTerm)
    );
  }, [products, search]); // تغيير dependency من getAllProducts إلى products

  
  
  // التحقق من وجود المزيد من المنتجات
 const loadMoreProducts = useCallback(() => {
    if (hasMore) {
      setPage(prevPage => prevPage + 1);
    }
  }, [hasMore]);

 

  const handleAddToCart = async (product: Product) => {
    if (!product) {
      Alert.alert('خطأ', 'المنتج غير متوفر');
      return;
    }

    if (!token) {
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

    // التحقق من المخزون
    if (product.stock <= 0) {
      Alert.alert('نفذ المخزون', 'هذا المنتج غير متوفر حالياً');
      return;
    }

    // التحقق من الحد الأقصى - إذا وصلت الكمية في السلة = المخزون
    const existingInCart = state.items.find(item => item.id === product._id);
    const currentQuantityInCart = existingInCart ? existingInCart.quantity : 0;
    
    if (currentQuantityInCart >= product.stock) {
      Alert.alert(
        'وصلت للحد الأقصى', 
        `لا يمكن إضافة المزيد من "${product.name}"\n\nالمخزون المتاح: ${product.stock}\nالكمية في السلة: ${currentQuantityInCart}`
      );
      return;
    }

    try {
      console.log('Adding product to cart:', product);
      const success = addToCart({
        id: product._id || '',
        name: product.name || 'منتج غير محدد',
        price: product.price || 0,
        quantity: 1,
        stock: product.stock
      });
      
      if (success) {
        Alert.alert('تمت الإضافة', `تمت إضافة "${product.name || 'المنتج'}" إلى السلة.`);
      }
    } catch (error: any) {
      console.error('Error adding to cart:', error);
      Alert.alert('خطأ', error.message || 'فشل في إضافة المنتج للسلة');
    }
  };

  // استخدام المنتجات المفلترة بدلاً من جميع المنتجات
  const displayedProducts = filteredProducts;

  // عرض كل صف فيه كارتين
  const renderRow = ({ item, index }: { item: Product; index: number }) => {
    if (!item || index % 2 !== 0) { return null; }
    const second = displayedProducts[index + 1];
    return (
      <View style={styles.cardsRow} key={item._id || `item-${index}`}>
        <ProductCard
          product={item}
          onAdd={() => handleAddToCart(item)}
          cartItems={state.items}
          onShowDetails={() => {
            setSelectedProduct(item);
            setShowProductModal(true);
          }}
        />
        {second ? (
          <ProductCard
            product={second}
            onAdd={() => handleAddToCart(second)}
            cartItems={state.items}
            onShowDetails={() => {
              setSelectedProduct(second);
              setShowProductModal(true);
            }}
          />
        ) : (
          <View style={{ flex: 1 }} />
        )}
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor={PRIMARY} />
        <View style={styles.header}>
          <Text style={styles.headerTitle}>صيدليات الشافي</Text>
        </View>
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator size="large" color={PRIMARY} />
          <Text style={{ marginTop: 16, color: PRIMARY, fontSize: 16 }}>جاري تحميل المنتجات...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor={PRIMARY} />
        <View style={styles.header}>
          <Text style={styles.headerTitle}>صيدليات الشافي</Text>
        </View>
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
          <Ionicons name="alert-circle-outline" size={60} color="#ff6b6b" />
          <Text style={{ marginTop: 16, color: '#ff6b6b', fontSize: 16, textAlign: 'center' }}>
            {error}
          </Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => loadProducts()}>
            <Text style={styles.retryBtnText}>إعادة المحاولة</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={PRIMARY} />
      {/* الهيدر */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>صيدليات الشافي</Text>
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
      {/* شريط الموقع */}
      
      {/* بوكس الموقع */}
      <View style={styles.locationBox}>
        <TouchableOpacity style={styles.locationContent} onPress={handleLocationPress}>
          <Ionicons name="location-outline" size={18} color={PRIMARY} />
          <View style={styles.locationTextContainer}>
            <Text style={styles.locationLabel}>التوصيل إلى</Text>
            <Text style={styles.locationAddress} numberOfLines={1}>
              {isLoadingLocation ? 'جاري تحديد الموقع...' : userLocation}
            </Text>
          </View>
          {isLoadingLocation ? (
            <ActivityIndicator size="small" color={PRIMARY} />
          ) : (
            <Ionicons name="chevron-down" size={14} color="#888" />
          )}
        </TouchableOpacity>
      </View>

      {/* اسم الشركة فوق شريط البحث */}
      <View style={styles.companyNameWrapper}>
        <Text style={styles.companyName}>ALSHAFI MEDICAL COMPANY</Text>
      </View>

      {/* شريط البحث */}
      <View style={styles.searchWrapper}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={22} color="#888" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="ابحث عن الأدوية أو المنتجات"
            placeholderTextColor="#888"
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
          />
          {search.length > 0 && (
            <TouchableOpacity 
              style={styles.clearButton}
              onPress={() => setSearch('')}
            >
              <Ionicons name="close-circle" size={20} color="#888" />
            </TouchableOpacity>
          )}
          <TouchableOpacity 
            style={styles.iconButton}
            onPress={() => Alert.alert('ماسح QR', 'سيتم إضافة ماسح QR قريباً')}
          >
            <MaterialIcons name="qr-code-scanner" size={22} color={PRIMARY} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.iconButton}
            onPress={() => router.push('/(tabs)/offers')}
          >
            <Ionicons name="heart-outline" size={22} color={PRIMARY} />
          </TouchableOpacity>
        </View>
      </View>

      {/* قسم الفئات */}
      {search.length === 0 && <CategoriesSection />}

      {/* نتائج البحث */}
      {search.length > 0 && (
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
      )}

      {/* الكروت */}
      <FlatList
        data={displayedProducts}
        renderItem={renderRow}
        keyExtractor={(item) => item._id || Math.random().toString()}
        contentContainerStyle={styles.cardsList}
        showsVerticalScrollIndicator={false}
        numColumns={1}
        refreshing={isLoading}
        onRefresh={() => loadProducts()}
        onEndReached={loadMoreProducts}
        onEndReachedThreshold={0.5}
        ItemSeparatorComponent={() => <View style={styles.cardSeparator} />}
        ListHeaderComponent={() => (
          <View style={styles.productsHeader}>
            <View style={styles.headerLine} />
            <Text style={styles.productsHeaderText}>
              {search.length > 0 ? 'نتائج البحث' : 'منتجاتنا المميزة'}
            </Text>
            <View style={styles.headerLine} />
          </View>
        )}
        ListEmptyComponent={
          !isLoading && displayedProducts.length === 0 && search.length > 0 ? (
            <View style={styles.emptySearchContainer}>
              <Ionicons name="search-outline" size={60} color="#ccc" />
              <Text style={styles.emptySearchText}>لم يتم العثور على منتجات</Text>
              <Text style={styles.emptySearchSubtext}>جرب البحث بكلمات مختلفة</Text>
            </View>
          ) : null
        }
        ListFooterComponent={
          hasMore && !isLoading ? (
            <View style={styles.loadMoreContainer}>
              <TouchableOpacity style={styles.loadMoreBtn} onPress={loadMoreProducts}>
                <Ionicons name="add-circle-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.loadMoreText}>تحميل المزيد</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.endOfProductsContainer}>
              <Ionicons name="checkmark-circle" size={24} color={PRIMARY} />
              <Text style={styles.endOfProductsText}>تم عرض جميع المنتجات</Text>
            </View>
          )
        }
      />

      {/* الفوتر */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>© 2025 جميع الحقوق محفوظة لصيدليات الشافي</Text>
      </View>


      
    </SafeAreaView>
  );
}

// مكون الكارت الواحد
function ProductCard({
  product,
  onAdd,
  cartItems,
  onShowDetails,
}: {
  product: Product;
  onAdd: () => void;
  cartItems: any[];
  onShowDetails: () => void;
}) {
  const router = useRouter(); // نقل useRouter داخل المكون
  
  // حساب الكمية في السلة
  const existingInCart = cartItems.find(item => item.id === product._id);
  const quantityInCart = existingInCart ? existingInCart.quantity : 0;
  
  // التحقق: إذا كانت الكمية في السلة = المخزون، منع الإضافة
  const isStockExhausted = quantityInCart >= product.stock;
  const canAdd = product.stock > 0 && !isStockExhausted;

  return (
    <View style={[styles.card, { position: 'relative' }]}>
      {/* طبقة خلفية متدرجة */}
      <View style={styles.cardGradientOverlay} />
      
      {/* أيقونة الفئة في الزاوية */}
      <View style={styles.categoryBadge}>
        <Ionicons name="medical" size={12} color={PRIMARY} />
      </View>

      {/* كونتينر الصورة مع تأثيرات */}
      <View style={styles.imageContainer}>
        <Image 
          source={{ uri: product.image || 'https://placehold.co/150x150/23B6C7/ffffff?text=Product' }} 
          style={styles.cardImg} 
        />
        
      </View>

      {/* معلومات المنتج */}
      <View style={styles.cardContent}>
        <Text style={styles.cardName}>{product.name || 'منتج غير محدد'}</Text>
        
        {/* تقييم وهمي للمنتج */}
        <View style={styles.ratingContainer}>
          <View style={styles.stars}>
            {[1,2,3,4,5].map((star) => (
              <Ionicons 
                key={star} 
                name={star <= 4 ? "star" : "star-outline"} 
                size={12} 
                color="#00eeffff" 
              />
            ))}
          </View>
          <Text style={styles.ratingText}>(4.0)</Text>
        </View>

        <Text style={styles.cardDescription} numberOfLines={1}>
          {product.description || 'منتج طبي عالي الجودة'}
        </Text>

        {/* زر معرفة المزيد */}
        <TouchableOpacity 
          style={styles.moreInfoBtn}
          onPress={() => {
            // التوجه لصفحة تفاصيل المنتج باستخدام Dynamic Route
            router.push(`/(modals)/product/${product._id}` as any);
          }}
          activeOpacity={0.7}
        >
          <Ionicons name="information-circle-outline" size={14} color={PRIMARY} />
          <Text style={styles.moreInfoText}>معرفة المزيد</Text>
        </TouchableOpacity>

        {/* حاوي السعر والمخزون */}
        <View style={styles.priceStockContainer}>
          <View style={styles.priceContainer}>
            <Text style={styles.cardPrice}>{(product.price || 0).toFixed(2)}</Text>
            <Text style={styles.currency}>ر.س</Text>
          </View>
          <View style={styles.stockBadge}>
            <Ionicons 
              name={product.stock > 10 ? "checkmark-circle" : "warning"} 
              size={12} 
              color={product.stock > 10 ? "#4CAF50" : "#FF9800"} 
            />
            <Text style={[styles.cardStock, { color: product.stock > 10 ? "#4CAF50" : "#FF9800" }]}>
              {product.stock > 10 ? 'متوفر' : `${product.stock} متبقي`}
            </Text>
          </View>
        </View>

        {quantityInCart > 0 && (
          <View style={styles.cartIndicator}>
            <Ionicons name="cart" size={12} color={PINK} />
            <Text style={styles.cartIndicatorText}>{quantityInCart} في السلة</Text>
          </View>
        )}
      </View>

      {/* زر الإضافة المحدث */}
      <TouchableOpacity 
        style={[
          styles.addBtn, 
          !canAdd && styles.addBtnDisabled,
          quantityInCart > 0 && styles.addBtnActive
        ]} 
        onPress={onAdd}
        disabled={!canAdd}
        activeOpacity={0.8}
      >
        <View style={styles.addBtnContent}>
          <Ionicons 
            name={quantityInCart > 0 ? "add-circle" : "cart-outline"} 
            size={16} 
            color="#fff" 
            style={{ marginRight: 4 }} 
          />
          <Text style={styles.addBtnText}>
            {product.stock <= 0 ? 'نفذ المخزون' : 
             isStockExhausted ? 'لا يوجد مخزون يكفي' : 
             quantityInCart > 0 ? 'إضافة المزيد' : 'أضف للسلة'}
          </Text>
        </View>
        {!canAdd && <View style={styles.addBtnOverlay} />}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BG,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  container: {
    flex: 1,
    padding: 18,
  },
  header: {
    backgroundColor: PRIMARY,
    paddingVertical: 12,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomLeftRadius: 50,
    borderBottomRightRadius: 50,
    borderTopLeftRadius: 50,
    borderTopRightRadius: 50,
    elevation: 4,
    shadowColor: '#hsla(190, 100%, 47%, 1.00)',
    shadowOpacity: 100,
    shadowRadius: 60,
    shadowOffset: { width: 0, height: 2 },
  },
  headerTitle: {
    color: '#fff',
    fontSize: 19,
    fontWeight: 'bold',
    letterSpacing: 3,
    fontFamily: Platform.OS === 'ios' ? 'AvenirNext-Bold' : 'sans-serif',
    flex: 1,
    textAlign: 'center',
  },
  cartButton: {
    position: 'relative',
    padding: 4,
  },
  cartBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
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
  locationBox: {
    backgroundColor: '#fff',
    marginHorizontal: 0,
    marginTop: 0,
    borderRadius: 0,
    elevation: 2,
    shadowColor: '#hsla(189, 88%, 47%, 1.00)',
    shadowOpacity: 0.8,
    shadowRadius: 1,
    shadowOffset: { width: 0, height: 4 },
  },
  locationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  locationTextContainer: {
    flex: 1,
    marginLeft: 8,
  },
  locationLabel: {
    fontSize: 10,
    color: '#888',
    marginBottom: 1,
  },
  locationAddress: {
    fontSize: 11,
    color: '#222',
    fontWeight: '500',
  },
  companyNameWrapper: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 4,
  },
  companyName: {
    color: PRIMARY,
    fontSize: 13,
    fontWeight: 'bold',
    letterSpacing: 1.5,
    fontFamily: Platform.OS === 'ios' ? 'AvenirNext-Bold' : 'sans-serif',
  },
  searchWrapper: {
    alignItems: 'center',
    marginBottom: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 8,
    width: '90%',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  searchIcon: {
    marginRight: 8,
    color: 'rgba(0, 217, 255, 1)',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#222',
    paddingVertical: 8,
  },
  iconButton: {
    padding: 3,
    marginLeft: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  cardsList: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  cardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 8,
  },
  card: {
    backgroundColor: '#rgba(6, 112, 138, 0.13)',
    borderRadius: 24,
    padding: 16,
    flex: 1,
    marginHorizontal: 4,
    elevation: 8,
    shadowColor: '#23B6C7',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    borderWidth: 1,
    borderColor: '#f0f8fa',
    transform: [{ scale: 1 }],
    overflow: 'hidden',
  },
  cardImg: {
    width: '100%',
    height: 140,
    borderRadius: 20,
    backgroundColor: '#f0f8fa',
  },
  cardGradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(35, 182, 199, 0.1)',
    borderRadius: 24,
  },
  categoryBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  imageContainer: {
    position: 'relative',
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 12,
  },
  
  cardContent: {
    paddingVertical: 8,
  },
  cardName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 6,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  ratingContainer: {
    paddingVertical: 4,
    backgroundColor: '#f0f4f7',
    borderRadius: 14,
    marginHorizontal: 18,
    marginBottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stars: {
    flexDirection: 'row',
    marginRight: 4,
  },
  ratingText: {
    fontSize: 12,
    color: '#666',
  },
  cardDescription: {
    fontSize: 11,
    color: '#666',
    marginBottom: 10,
    lineHeight: 16,
    textAlign: 'center',
    opacity: 0.8,
  },
  priceStockContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  cardPrice: {
    fontSize: 20,
    fontWeight: '800',
    color: PRIMARY,
    marginBottom: 6,
    textAlign: 'center',
    textShadowColor: 'rgba(35, 182, 199, 0.1)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  currency: {
    fontSize: 14,
    color: PRIMARY,
    fontWeight: '500',
    marginLeft: 4,
  },
  stockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(35, 182, 199, 0.1)',
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  cardStock: {
    fontSize: 10,
    color: '#888',
    marginBottom: 14,
    textAlign: 'center',
    fontWeight: '500',
  },
  cartIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(233, 75, 123, 0.1)',
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginTop: 8,
  },
  cartIndicatorText: {
    fontSize: 12,
    color: PINK,
    marginLeft: 4,
  },
  addBtn: {
    backgroundColor: PINK,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 20,
    elevation: 6,
    shadowColor: '#E94B7B',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    borderWidth: 1,
    borderColor: 'rgba(233, 75, 123, 0.1)',
    transform: [{ scale: 1 }],
  },
  addBtnDisabled: {
    backgroundColor: '#ccc',
  },
  addBtnActive: {
    backgroundColor: 'rgba(233, 75, 123, 0.8)',
  },
  addBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  addBtnOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 20,
  },
  footer: {
    backgroundColor: PRIMARY,
    paddingVertical: 0.5,
    alignItems: 'center',
    marginTop: 0.25,
  },
  footerText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
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
  loadMoreBtn: {
    backgroundColor: PRIMARY,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  loadMoreText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  cardSeparator: {
    height: 8,
  },
  productsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
    paddingHorizontal: 20,
  },
  headerLine: {
    flex: 1,
    height: 2,
    backgroundColor: `${PRIMARY}30`,
    borderRadius: 1,
  },
  productsHeaderText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: PRIMARY,
    marginHorizontal: 15,
    fontFamily: Platform.OS === 'ios' ? 'AvenirNext-Bold' : 'sans-serif',
    letterSpacing: 1,
  },
  loadMoreContainer: {
    padding: 20,
    alignItems: 'center',
  },
  endOfProductsContainer: {
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
  },
  endOfProductsText: {
    fontSize: 16,
    color: PRIMARY,
    marginTop: 8,
    fontWeight: '600',
    textAlign: 'center',
  },
  moreInfoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(35, 182, 199, 0.1)',
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginBottom: 10,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 1,
    shadowOffset: { width: 0, height: 1 },
  },
  moreInfoText: {
    fontSize: 12,
    color: PRIMARY,
    fontWeight: '600',
    marginLeft: 4,
  },
  clearButton: {
    padding: 4,
    marginRight: 8,
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
  emptySearchContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptySearchText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySearchSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
});



const bannerStyles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f4f7',
    borderRadius: 14,
    marginHorizontal: 18,
    marginBottom: 12,
    paddingVertical: 16,
  },
  text: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#222',
  },
});

