/**
 * 🏥 Category Screen
 * شاشة عرض منتجات فئة معينة
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Image,
  TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCart } from '../../../src/contexts/cartcontext';
import { useAuth } from '../../../src/contexts/AuthContext';
import { getAllProducts } from '../../../src/api/api';
import { getCategoryData, getCategoryName, getCategoryColor } from '../../../src/data/categories';
import { Product } from '../../../src/types/modules';
import { ErrorComponent } from '../../../src/components/ErrorComponents';

const PRIMARY = '#23B6C7';
const PINK = '#E94B7B';
const BG = '#E6F3F7';

export default function CategoryScreen() {
  const { categoryId } = useLocalSearchParams();
  const router = useRouter();
  const { addToCart, state } = useCart();
  const { token } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // بيانات الفئة الحالية
  const categoryData = getCategoryData(categoryId as string);
  const categoryName = getCategoryName(categoryId as string);
  const categoryColor = getCategoryColor(categoryId as string);

  // فلترة المنتجات حسب البحث
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) {
      return products;
    }
    
    const searchTerm = searchQuery.toLowerCase().trim();
    return products.filter((product: Product) => 
      product?.name?.toLowerCase().includes(searchTerm) ||
      product?.description?.toLowerCase().includes(searchTerm)
    );
  }, [products, searchQuery]);

  useEffect(() => {
    loadCategoryProducts();
  }, [categoryId]);

  const loadCategoryProducts = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // جلب المنتجات مع فلترة حسب الفئة
      const categoryProducts = await getAllProducts({ 
        category: categoryId as string,
        isActive: true 
      });

      setProducts(categoryProducts || []);
    } catch (err) {
      console.error('Error loading category products:', err);
      setError('فشل في تحميل منتجات الفئة');
    } finally {
      setIsLoading(false);
    }
  };

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

    if (product.stock <= 0) {
      Alert.alert('نفذ المخزون', 'هذا المنتج غير متوفر حالياً');
      return;
    }

    try {
      await addToCart({
        id: product._id,
        name: product.name,
        price: product.price,
        image: product.image,
        stock: product.stock,
        quantity: 1
      });

      Alert.alert('تم الإضافة', 'تم إضافة المنتج إلى السلة بنجاح');
    } catch (error) {
      Alert.alert('خطأ', 'فشل في إضافة المنتج للسلة');
    }
  };

  const handleProductPress = (product: Product) => {
    router.push(`/(modals)/product/${product._id}` as any);
  };

  const renderProduct = ({ item }: { item: Product }) => {
    const isInCart = state.items.some(cartItem => cartItem.id === item._id);
    
    return (
      <TouchableOpacity
        style={styles.productCard}
        onPress={() => handleProductPress(item)}
        activeOpacity={0.7}
      >
        <Image
          source={{ uri: item.image || 'https://via.placeholder.com/150' }}
          style={styles.productImage}
          resizeMode="cover"
        />
        
        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={2}>
            {item.name}
          </Text>
          
          <Text style={styles.productDescription} numberOfLines={1}>
            {item.description}
          </Text>
          
          <View style={styles.productFooter}>
            <View style={styles.priceContainer}>
              <Text style={styles.productPrice}>
                {item.price?.toFixed(2)} ر.س
              </Text>
              <Text style={styles.stockInfo}>
                المخزون: {item.stock}
              </Text>
            </View>
            
            <TouchableOpacity
              style={[
                styles.addToCartBtn,
                (item.stock <= 0 || isInCart) && styles.addToCartBtnDisabled
              ]}
              onPress={() => handleAddToCart(item)}
              disabled={item.stock <= 0 || isInCart}
            >
              <Ionicons 
                name={isInCart ? "checkmark" : "add"} 
                size={16} 
                color="white" 
              />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={categoryColor} />
        <View style={[styles.header, { backgroundColor: categoryColor }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{categoryName}</Text>
          <View style={styles.headerSpacer} />
        </View>
        
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={categoryColor} />
          <Text style={[styles.loadingText, { color: categoryColor }]}>
            جاري تحميل المنتجات...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={categoryColor} />
        <View style={[styles.header, { backgroundColor: categoryColor }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{categoryName}</Text>
          <View style={styles.headerSpacer} />
        </View>
        
        <ErrorComponent 
          message={error}
          onRetry={loadCategoryProducts}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={categoryColor} />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: categoryColor }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{categoryName}</Text>
        <TouchableOpacity onPress={loadCategoryProducts} style={styles.refreshButton}>
          <Ionicons name="refresh" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Category Info */}
      {categoryData && (
        <View style={styles.categoryInfoSection}>
          <Image
            source={categoryData.image}
            style={styles.categoryBanner}
            resizeMode="cover"
          />
          <View style={styles.categoryInfoOverlay}>
            <Text style={styles.categoryDescription}>
              {categoryData.description}
            </Text>
            <Text style={styles.productsCount}>
              {filteredProducts.length} منتج متاح
            </Text>
          </View>
        </View>
      )}

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={`البحث في ${categoryName}...`}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#999"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Products List */}
      <FlatList
        data={filteredProducts}
        renderItem={renderProduct}
        keyExtractor={(item) => item._id}
        numColumns={2}
        contentContainerStyle={styles.productsList}
        columnWrapperStyle={styles.productsRow}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="cube-outline" size={64} color="#ccc" />
            <Text style={styles.emptyTitle}>
              {searchQuery ? 'لا توجد منتجات تطابق البحث' : 'لا توجد منتجات في هذه الفئة'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery ? 'جرب البحث بكلمات أخرى' : 'سيتم إضافة منتجات قريباً'}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    paddingTop: 50,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginHorizontal: 20,
  },
  refreshButton: {
    padding: 8,
  },
  headerSpacer: {
    width: 40,
  },
  categoryInfoSection: {
    position: 'relative',
    height: 120,
    marginBottom: 20,
  },
  categoryBanner: {
    width: '100%',
    height: '100%',
  },
  categoryInfoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 15,
  },
  categoryDescription: {
    color: 'white',
    fontSize: 14,
    marginBottom: 5,
  },
  productsCount: {
    color: 'white',
    fontSize: 12,
    opacity: 0.8,
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  clearButton: {
    padding: 5,
  },
  productsList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  productsRow: {
    justifyContent: 'space-between',
  },
  productCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    width: '48%',
  },
  productImage: {
    width: '100%',
    height: 120,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  productInfo: {
    padding: 12,
  },
  productName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
    lineHeight: 18,
  },
  productDescription: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceContainer: {
    flex: 1,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: PRIMARY,
    marginBottom: 2,
  },
  stockInfo: {
    fontSize: 10,
    color: '#999',
  },
  addToCartBtn: {
    backgroundColor: PRIMARY,
    borderRadius: 8,
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addToCartBtnDisabled: {
    backgroundColor: '#ccc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});
