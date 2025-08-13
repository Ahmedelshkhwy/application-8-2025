import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Platform,
  Alert,
  ActivityIndicator,
  TextInput,
  Modal,
  RefreshControl,
  FlatList,
  Image,
  ScrollView,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/contexts/AuthContext';
import { useRouter } from 'expo-router';
import { Discount, Product } from '../../src/types/modules';

const PRIMARY = '#23B6C7';
const PINK = '#E94B7B';
const BG = '#E6F3F7';
// استخدام متغيرات البيئة للـ API
const API_BASE = process.env.EXPO_PUBLIC_API_ADMIN_URL || 'http://192.168.8.87:5000/api/admin';

export default function AdminDiscountsScreen() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<Discount | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerMode, setDatePickerMode] = useState<'start' | 'end'>('start');
  const [showProductSelector, setShowProductSelector] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [searchTimeout, setSearchTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  // حالة النموذج المحسنة
  const [formData, setFormData] = useState({
    title: '',
    name: '',
    description: '',
    code: '',
    discountType: 'percentage',
    discountPercentage: '',
    productId: '',
    minAmount: '',
    maxDiscount: '',
    usageLimit: '',
    startDate: new Date(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // أسبوع من الآن
    validUntil: '',
  });

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      Alert.alert('غير مصرح', 'هذه الصفحة للمسؤولين فقط');
      router.back();
      return;
    }
    loadData();
  }, [user]);

  // دالة البحث في المنتجات
  const searchProducts = async (query: string) => {
    if (query.trim().length < 2) {
      setFilteredProducts(products);
      return;
    }

    setIsSearching(true);
    try {
      const API_PRODUCTS = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.8.87:5000/api';
      const response = await fetch(`${API_PRODUCTS}/products?search=${encodeURIComponent(query)}&isActive=true&limit=50`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const searchResults = data?.products || data?.data || data || [];
        setFilteredProducts(Array.isArray(searchResults) ? searchResults : []);
        
        // تحديث قائمة المنتجات الكاملة إذا وُجدت منتجات جديدة
        const newProducts = searchResults.filter((product: Product) => 
          !products.some(p => p._id === product._id)
        );
        if (newProducts.length > 0) {
          setProducts(prev => [...prev, ...newProducts]);
        }
      }
    } catch (error) {
      console.error('خطأ في البحث:', error);
      // في حالة الخطأ، استخدم الفلترة المحلية
      const localResults = products.filter(product => 
        product.name.toLowerCase().includes(query.toLowerCase()) ||
        product.description?.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredProducts(localResults);
    } finally {
      setIsSearching(false);
    }
  };

  // فلترة المنتجات عند تغيير الفئة أو البحث
  useEffect(() => {
    let filtered = products;
    
    // فلترة حسب الفئة
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }
    
    // فلترة حسب البحث
    if (productSearchQuery.trim()) {
      if (productSearchQuery.trim().length >= 2) {
        // البحث المباشر في الخادم
        searchProducts(productSearchQuery);
        return;
      } else {
        // فلترة محلية للاستعلامات القصيرة
        filtered = filtered.filter(product => 
          product.name.toLowerCase().includes(productSearchQuery.toLowerCase()) ||
          product.description?.toLowerCase().includes(productSearchQuery.toLowerCase())
        );
      }
    }
    
    setFilteredProducts(filtered);
  }, [products, selectedCategory, productSearchQuery]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      console.log('🔄 بدء تحميل البيانات...');
      
      // تحميل الخصومات مع populate للمنتجات
      const discountsResponse = await fetch(`${API_BASE}/discounts?populate=product`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      // تحميل جميع المنتجات النشطة - استخدام مسار المنتجات الصحيح
      const API_PRODUCTS = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.8.87:5000/api';
      const productsResponse = await fetch(`${API_PRODUCTS}/products?isActive=true&limit=100`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('📊 حالة الاستجابات:', {
        discounts: discountsResponse.status,
        products: productsResponse.status
      });

      if (discountsResponse.ok && productsResponse.ok) {
        const discountsData = await discountsResponse.json();
        const productsData = await productsResponse.json();
        
        console.log('📦 البيانات المستلمة:', {
          discountsCount: discountsData?.discounts?.length || discountsData?.length || 0,
          productsCount: productsData?.products?.length || productsData?.length || 0
        });
        
        // معالجة الخصومات
        const discountsList = discountsData?.discounts || discountsData?.data || discountsData || [];
        setDiscounts(Array.isArray(discountsList) ? discountsList : []);
        
        // معالجة المنتجات
        const productsList = productsData?.products || productsData?.data || productsData || [];
        setProducts(Array.isArray(productsList) ? productsList : []);
        
        console.log('✅ تم تحميل البيانات بنجاح:', {
          discounts: Array.isArray(discountsList) ? discountsList.length : 0,
          products: Array.isArray(productsList) ? productsList.length : 0
        });
        
      } else {
        const discountError = !discountsResponse.ok ? await discountsResponse.text() : 'OK';
        const productError = !productsResponse.ok ? await productsResponse.text() : 'OK';
        
        console.error('❌ فشل في تحميل البيانات:', {
          discountsStatus: discountsResponse.status,
          productsStatus: productsResponse.status,
          discountError,
          productError
        });
        
        Alert.alert('خطأ', 'فشل في تحميل البيانات من الخادم');
      }
    } catch (error) {
      console.error('💥 خطأ في تحميل البيانات:', error);
      Alert.alert('خطأ', 'فشل في الاتصال بالخادم. تحقق من الاتصال بالإنترنت.');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleAddDiscount = () => {
    setEditingDiscount(null);
    const now = new Date();
    const endDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // أسبوع من الآن
    
    setFormData({
      title: '',
      name: '',
      description: '',
      code: '',
      discountType: 'percentage',
      discountPercentage: '',
      productId: '',
      minAmount: '',
      maxDiscount: '',
      usageLimit: '',
      startDate: now,
      endDate: endDate,
      validUntil: endDate.toISOString().split('T')[0],
    });
    setShowAddModal(true);
  };

  const handleEditDiscount = (discount: Discount) => {
    setEditingDiscount(discount);
    const validDate = discount.validUntil ? new Date(discount.validUntil) : new Date();
    const startDate = new Date(); // التاريخ الحالي كتاريخ بداية افتراضي
    
    setFormData({
      title: discount.title || discount.name || '',
      name: discount.name || discount.title || '',
      description: discount.description || '',
      code: discount.code || '',
      discountType: discount.discountType || 'percentage',
      discountPercentage: (discount.discountPercentage || discount.discountValue || 0).toString(),
      productId: discount.productId || (discount.applicableProducts && discount.applicableProducts[0]) || '',
      minAmount: (discount.minAmount || '').toString(),
      maxDiscount: (discount.maxDiscount || '').toString(),
      usageLimit: (discount.usageLimit || '').toString(),
      startDate: startDate,
      endDate: validDate,
      validUntil: discount.validUntil ? discount.validUntil.split('T')[0] : '',
    });
    setShowAddModal(true);
  };

  const handleDeleteDiscount = async (discount: Discount) => {
    Alert.alert(
      'حذف الخصم',
      `هل أنت متأكد من حذف "${discount.title}"؟`,
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(`${API_BASE}/discounts/${discount._id}`, {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
              });

              if (response.ok) {
                Alert.alert('تم الحذف', 'تم حذف الخصم بنجاح');
                loadData();
              } else {
                Alert.alert('خطأ', 'فشل في حذف الخصم');
              }
            } catch (error) {
              console.error('خطأ في حذف الخصم:', error);
              Alert.alert('خطأ', 'فشل في حذف الخصم');
            }
          },
        },
      ]
    );
  };

  const handleSaveDiscount = async () => {
    if (!formData.title || !formData.name || !formData.description || !formData.discountPercentage || !formData.productId) {
      Alert.alert('خطأ', 'يرجى ملء جميع الحقول المطلوبة (العنوان، الاسم، الوصف، نسبة الخصم، المنتج)');
      return;
    }

    const selectedProduct = products.find(p => p._id === formData.productId);
    if (!selectedProduct) {
      Alert.alert('خطأ', 'المنتج المحدد غير موجود');
      return;
    }

    const discountPercentage = parseFloat(formData.discountPercentage);
    if (discountPercentage <= 0 || discountPercentage >= 100) {
      Alert.alert('خطأ', 'نسبة الخصم يجب أن تكون بين 1 و 99');
      return;
    }

    // التحقق من صحة التواريخ
    if (formData.endDate <= formData.startDate) {
      Alert.alert('خطأ', 'تاريخ الانتهاء يجب أن يكون بعد تاريخ البداية');
      return;
    }

    // حساب السعر بعد الخصم
    const originalPrice = selectedProduct.price;
    const discountPrice = originalPrice - (originalPrice * discountPercentage / 100);

    try {
      // إعداد البيانات المطلوبة للباك إند (تطابق النموذج الصحيح)
      const discountData = {
        title: formData.title.trim(),
        name: formData.name.trim() || formData.title.trim(),
        description: formData.description.trim(),
        code: formData.code.trim() || undefined,
        discountType: 'percentage' as const,
        discountValue: discountPercentage,
        discountPercentage: discountPercentage,
        originalPrice: originalPrice,
        discountPrice: discountPrice,
        productId: formData.productId,
        minAmount: formData.minAmount ? parseFloat(formData.minAmount) : 0,
        maxDiscount: formData.maxDiscount ? parseFloat(formData.maxDiscount) : null,
        usageLimit: formData.usageLimit ? parseInt(formData.usageLimit) : undefined,
        startDate: formData.startDate.toISOString(),
        endDate: formData.endDate.toISOString(),
        validUntil: formData.endDate.toISOString(),
        applicableProducts: [formData.productId],
        applicableCategories: [],
        isActive: true
      };

      console.log('📤 إرسال بيانات العرض:', discountData);

      const url = editingDiscount 
        ? `${API_BASE}/discounts/${editingDiscount._id}`
        : `${API_BASE}/discounts`;
      
      const method = editingDiscount ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(discountData),
      });

      if (response.ok) {
        Alert.alert(
          'تم الحفظ',
          editingDiscount ? 'تم تحديث الخصم بنجاح' : 'تم إضافة الخصم بنجاح'
        );
        setShowAddModal(false);
        loadData();
      } else {
        const errorData = await response.json();
        Alert.alert('خطأ', errorData.message || 'فشل في حفظ الخصم');
      }
    } catch (error) {
      console.error('خطأ في حفظ الخصم:', error);
      Alert.alert('خطأ', 'فشل في حفظ الخصم');
    }
  };

  const filteredDiscounts = discounts.filter(discount => {
    const matchesSearch = (discount.title?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
                         (discount.description?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
                         (discount.product?.name?.toLowerCase() || '').includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const renderDiscount = ({ item }: { item: Discount }) => {
    // العثور على المنتج من قائمة المنتجات المحلية
    const associatedProduct = products.find(p => 
      p._id === item.productId || 
      (item.applicableProducts && item.applicableProducts.includes(p._id))
    );
    
    // استخدام المنتج المرتبط أو المنتج من الـ populate
    const displayProduct = associatedProduct || item.product;
    
    return (
      <View style={styles.discountCard}>
        <View style={styles.discountHeader}>
          <View style={styles.discountBadge}>
            <Text style={styles.discountPercentage}>
              {item.discountPercentage || item.discountValue || 0}%
            </Text>
            <Text style={styles.discountLabel}>خصم</Text>
          </View>
          <View style={styles.statusContainer}>
            <View style={[
              styles.statusBadge, 
              item.isActive ? styles.activeBadge : styles.inactiveBadge
            ]}>
              <Text style={styles.statusText}>
                {item.isActive ? 'نشط' : 'غير نشط'}
              </Text>
            </View>
          </View>
          <View style={styles.discountActions}>
            <TouchableOpacity 
              style={styles.editBtn}
              onPress={() => handleEditDiscount(item)}
            >
              <Ionicons name="create-outline" size={20} color={PRIMARY} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.deleteBtn}
              onPress={() => handleDeleteDiscount(item)}
            >
              <Ionicons name="trash-outline" size={20} color={PINK} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.productInfo}>
          <Image 
            source={{ 
              uri: displayProduct?.image || 'https://placehold.co/300x200?text=Product' 
            }} 
            style={styles.productImage}
          />
          <View style={styles.productDetails}>
            <Text style={styles.discountTitle}>
              {item.title || item.name || '---'}
            </Text>
            <Text style={styles.productName}>
              {displayProduct?.name || 'منتج غير محدد'}
            </Text>
            <Text style={styles.productCategory}>
              الفئة: {displayProduct?.category || '---'}
            </Text>
            <Text style={styles.discountDescription}>
              {item.description || '---'}
            </Text>
            {item.code && (
              <Text style={styles.discountCode}>
                كود الخصم: {item.code}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.priceInfo}>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>السعر الأصلي:</Text>
            <Text style={styles.originalPrice}>
              {(item.originalPrice || displayProduct?.price || 0).toFixed(2)} ريال
            </Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>السعر بعد الخصم:</Text>
            <Text style={styles.discountPrice}>
              {(item.discountPrice || 
                ((displayProduct?.price || 0) - 
                 ((displayProduct?.price || 0) * (item.discountPercentage || item.discountValue || 0) / 100))
              ).toFixed(2)} ريال
            </Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>التوفير:</Text>
            <Text style={styles.savingAmount}>
              {(
                (item.originalPrice || displayProduct?.price || 0) - 
                (item.discountPrice || 
                 ((displayProduct?.price || 0) - 
                  ((displayProduct?.price || 0) * (item.discountPercentage || item.discountValue || 0) / 100)))
              ).toFixed(2)} ريال
            </Text>
          </View>
          
          {/* عرض الحدود إذا كانت موجودة */}
          {(item.minAmount && item.minAmount > 0) && (
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>الحد الأدنى:</Text>
              <Text style={styles.limitText}>{item.minAmount} ريال</Text>
            </View>
          )}
          {item.maxDiscount && (
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>الحد الأقصى:</Text>
              <Text style={styles.limitText}>{item.maxDiscount} ريال</Text>
            </View>
          )}
          {item.usageLimit && (
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>حد الاستخدام:</Text>
              <Text style={styles.limitText}>{item.usageLimit} مرة</Text>
            </View>
          )}
        </View>

        <View style={styles.datesInfo}>
          <View style={styles.dateRow}>
            <Ionicons name="calendar-outline" size={16} color={PRIMARY} />
            <Text style={styles.dateLabel}>تاريخ البداية:</Text>
            <Text style={styles.dateValue}>
              {item.startDate ? new Date(item.startDate).toLocaleDateString('ar-SA') : '---'}
            </Text>
          </View>
          <View style={styles.dateRow}>
            <Ionicons name="calendar-outline" size={16} color={PINK} />
            <Text style={styles.dateLabel}>تاريخ الانتهاء:</Text>
            <Text style={styles.dateValue}>
              {(item.endDate || item.validUntil) ? 
                new Date(item.endDate || item.validUntil || '').toLocaleDateString('ar-SA') : '---'}
            </Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.createdAt}>
            تم الإنشاء: {item.createdAt ? new Date(item.createdAt).toLocaleDateString('ar-SA') : '---'}
          </Text>
          <View style={styles.totalSavings}>
            <Text style={styles.totalLabel}>إجمالي التوفير</Text>
            <Text style={styles.totalValue}>
              {(
                (item.originalPrice || displayProduct?.price || 0) - 
                (item.discountPrice || 
                 ((displayProduct?.price || 0) - 
                  ((displayProduct?.price || 0) * (item.discountPercentage || item.discountValue || 0) / 100)))
              ).toFixed(2)} ر.س
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderProduct = ({ item }: { item: Product }) => (
    <TouchableOpacity
      key={item._id}
      style={[
        styles.productCard,
        formData.productId === item._id && styles.productCardSelected
      ]}
      onPress={() => {
        setFormData({ ...formData, productId: item._id });
        setShowProductSelector(false);
      }}
    >
      <Image 
        source={{ uri: item.image || 'https://placehold.co/100x100?text=Product' }} 
        style={styles.productCardImage}
      />
      <View style={styles.productCardInfo}>
        <Text style={[
          styles.productCardName,
          formData.productId === item._id && styles.productCardNameSelected
        ]}>
          {item.name}
        </Text>
        <Text style={[
          styles.productCardPrice,
          formData.productId === item._id && styles.productCardPriceSelected
        ]}>
          {item.price.toFixed(2)} ريال
        </Text>
      </View>
      {formData.productId === item._id && (
        <View style={styles.selectedBadge}>
          <Ionicons name="checkmark" size={16} color="white" />
        </View>
      )}
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor={PRIMARY} />
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>إدارة الخصومات</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator size="large" color={PRIMARY} />
          <Text style={{ marginTop: 16, color: PRIMARY, fontSize: 16 }}>جاري تحميل الخصومات...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={PRIMARY} />
      
      {/* الهيدر */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>إدارة الخصومات</Text>
        <TouchableOpacity 
          style={styles.addButton} 
          onPress={handleAddDiscount}
        >
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* شريط البحث */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="البحث في الخصومات..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#999"
        />
        <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
      </View>

      {/* قائمة الخصومات */}
      <FlatList
        data={filteredDiscounts}
        renderItem={renderDiscount}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.discountsList}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            colors={[PRIMARY]}
            tintColor={PRIMARY}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="pricetag-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>
              {searchQuery ? 'لا توجد خصومات تطابق البحث' : 'لا توجد خصومات'}
            </Text>
          </View>
        }
      />

      {/* نافذة إضافة/تعديل الخصم */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {editingDiscount ? 'تعديل الخصم' : 'إضافة خصم جديد'}
            </Text>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setShowAddModal(false)}
            >
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
            {/* قسم المعلومات الأساسية */}
            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>📝 معلومات العرض</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>عنوان العرض *</Text>
                <TextInput
                  style={styles.premiumInput}
                  placeholder="مثال: خصم خاص على الفيتامينات"
                  value={formData.title}
                  onChangeText={(text) => setFormData({ ...formData, title: text })}
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>اسم الخصم *</Text>
                <TextInput
                  style={styles.premiumInput}
                  placeholder="مثال: VITAMIN_DISCOUNT"
                  value={formData.name}
                  onChangeText={(text) => setFormData({ ...formData, name: text })}
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>كود الخصم</Text>
                <TextInput
                  style={styles.premiumInput}
                  placeholder="مثال: SAVE25 (اختياري)"
                  value={formData.code}
                  onChangeText={(text) => setFormData({ ...formData, code: text })}
                  placeholderTextColor="#999"
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>وصف العرض *</Text>
                <TextInput
                  style={[styles.premiumInput, styles.textArea]}
                  placeholder="وصف تفصيلي للعرض وشروطه..."
                  value={formData.description}
                  onChangeText={(text) => setFormData({ ...formData, description: text })}
                  multiline
                  numberOfLines={3}
                  placeholderTextColor="#999"
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>نسبة الخصم (%) *</Text>
                <TextInput
                  style={styles.premiumInput}
                  placeholder="مثال: 25"
                  value={formData.discountPercentage}
                  onChangeText={(text) => setFormData({ ...formData, discountPercentage: text })}
                  keyboardType="numeric"
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>الحد الأدنى لمبلغ الطلب (ريال)</Text>
                <TextInput
                  style={styles.premiumInput}
                  placeholder="مثال: 100 (اتركه فارغاً لعدم وجود حد أدنى)"
                  value={formData.minAmount}
                  onChangeText={(text) => setFormData({ ...formData, minAmount: text })}
                  keyboardType="numeric"
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>الحد الأقصى للخصم (ريال)</Text>
                <TextInput
                  style={styles.premiumInput}
                  placeholder="مثال: 50 (اتركه فارغاً لعدم وجود حد أقصى)"
                  value={formData.maxDiscount}
                  onChangeText={(text) => setFormData({ ...formData, maxDiscount: text })}
                  keyboardType="numeric"
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>حد الاستخدام</Text>
                <TextInput
                  style={styles.premiumInput}
                  placeholder="مثال: 100 (عدد مرات الاستخدام المسموحة)"
                  value={formData.usageLimit}
                  onChangeText={(text) => setFormData({ ...formData, usageLimit: text })}
                  keyboardType="numeric"
                  placeholderTextColor="#999"
                />
              </View>
            </View>

            {/* قسم اختيار المنتج */}
            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>🛍️ اختيار المنتج</Text>
              
              <TouchableOpacity 
                style={[styles.selectorButton, formData.productId && styles.selectorButtonSelected]}
                onPress={() => setShowProductSelector(!showProductSelector)}
              >
                <Ionicons 
                  name="cube-outline" 
                  size={20} 
                  color={formData.productId ? 'white' : PRIMARY} 
                />
                <Text style={[
                  styles.selectorButtonText,
                  formData.productId && styles.selectorButtonTextSelected
                ]}>
                  {formData.productId 
                    ? products.find(p => p._id === formData.productId)?.name || 'منتج محدد'
                    : 'اختر المنتج *'
                  }
                </Text>
                <Ionicons 
                  name={showProductSelector ? "chevron-up" : "chevron-down"} 
                  size={20} 
                  color={formData.productId ? 'white' : PRIMARY} 
                />
              </TouchableOpacity>

              {showProductSelector && (
                <View style={styles.productSelectorContainer}>
                  {/* شريط البحث في المنتجات */}
                  <View style={styles.productSearchContainer}>
                    <TextInput
                      style={styles.productSearchInput}
                      placeholder="البحث في المنتجات..."
                      value={productSearchQuery}
                      onChangeText={(text) => {
                        setProductSearchQuery(text);
                        
                        // إلغاء التايمر السابق
                        if (searchTimeout) {
                          clearTimeout(searchTimeout);
                        }
                        
                        // تعيين تايمر جديد للبحث المتأخر
                        const newTimeout = setTimeout(() => {
                          if (text.trim().length >= 2) {
                            searchProducts(text);
                          }
                        }, 500);
                        
                        setSearchTimeout(newTimeout);
                      }}
                      placeholderTextColor="#999"
                    />
                    <Ionicons name="search" size={16} color="#999" />
                    {isSearching && (
                      <ActivityIndicator 
                        size="small" 
                        color={PRIMARY} 
                        style={{ marginLeft: 8 }} 
                      />
                    )}
                    {productSearchQuery.length > 0 && !isSearching && (
                      <TouchableOpacity 
                        onPress={() => {
                          setProductSearchQuery('');
                          if (searchTimeout) {
                            clearTimeout(searchTimeout);
                          }
                        }}
                        style={styles.clearSearchButton}
                      >
                        <Ionicons name="close-circle" size={20} color="#999" />
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* فلترة حسب الفئة */}
                  <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    style={styles.categoryFilter}
                  >
                    <TouchableOpacity
                      style={[styles.categoryButton, selectedCategory === 'all' && styles.categoryButtonActive]}
                      onPress={() => setSelectedCategory('all')}
                    >
                      <Text style={[styles.categoryButtonText, selectedCategory === 'all' && styles.categoryButtonTextActive]}>
                        الكل
                      </Text>
                    </TouchableOpacity>
                    {[...new Set(products.map(p => p.category))].map((category) => (
                      <TouchableOpacity
                        key={category}
                        style={[styles.categoryButton, selectedCategory === category && styles.categoryButtonActive]}
                        onPress={() => setSelectedCategory(category)}
                      >
                        <Text style={[styles.categoryButtonText, selectedCategory === category && styles.categoryButtonTextActive]}>
                          {category}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>

                  {/* شبكة المنتجات */}
                  <View style={styles.productGrid}>
                    {filteredProducts.length > 0 ? (
                      filteredProducts.map((product) => (
                        <TouchableOpacity
                          key={product._id}
                          style={[
                            styles.productCard,
                            formData.productId === product._id && styles.productCardSelected
                          ]}
                          onPress={() => {
                            setFormData({ ...formData, productId: product._id });
                            setShowProductSelector(false);
                          }}
                        >
                          <Image 
                            source={{ uri: product.image || 'https://placehold.co/100x100?text=Product' }} 
                            style={styles.productCardImage}
                          />
                          <View style={styles.productCardInfo}>
                            <Text style={[
                              styles.productCardName,
                              formData.productId === product._id && styles.productCardNameSelected
                            ]}>
                              {product.name}
                            </Text>
                            <Text style={[
                              styles.productCardCategory,
                              formData.productId === product._id && styles.productCardCategorySelected
                            ]}>
                              {product.category}
                            </Text>
                            <Text style={[
                              styles.productCardPrice,
                              formData.productId === product._id && styles.productCardPriceSelected
                            ]}>
                              {product.price.toFixed(2)} ريال
                            </Text>
                          </View>
                          {formData.productId === product._id && (
                            <View style={styles.selectedBadge}>
                              <Ionicons name="checkmark" size={16} color="white" />
                            </View>
                          )}
                        </TouchableOpacity>
                      ))
                    ) : (
                      <View style={styles.noProductsFound}>
                        <Ionicons name="search-outline" size={32} color="#ccc" />
                        <Text style={styles.noProductsText}>لا توجد منتجات تطابق البحث</Text>
                      </View>
                    )}
                  </View>
                </View>
              )}
            </View>

            {/* معاينة السعر */}
            {formData.productId && formData.discountPercentage && (
              <View style={styles.formSection}>
                <Text style={styles.sectionTitle}>💰 معاينة السعر</Text>
                <View style={styles.pricePreview}>
                  {(() => {
                    const selectedProduct = products.find(p => p._id === formData.productId);
                    const discountPercentage = parseFloat(formData.discountPercentage);
                    const maxDiscount = formData.maxDiscount ? parseFloat(formData.maxDiscount) : null;
                    const minAmount = formData.minAmount ? parseFloat(formData.minAmount) : 0;
                    
                    if (selectedProduct && discountPercentage > 0 && discountPercentage < 100) {
                      const originalPrice = selectedProduct.price;
                      let discountAmount = originalPrice * (discountPercentage / 100);
                      
                      // تطبيق الحد الأقصى للخصم
                      if (maxDiscount && discountAmount > maxDiscount) {
                        discountAmount = maxDiscount;
                      }
                      
                      const finalPrice = originalPrice - discountAmount;
                      const actualDiscountPercentage = Math.round((discountAmount / originalPrice) * 100);
                      
                      return (
                        <View>
                          <View style={styles.previewRow}>
                            <View style={styles.priceItem}>
                              <Text style={styles.previewLabel}>السعر الأصلي</Text>
                              <Text style={styles.originalPriceText}>{originalPrice.toFixed(2)} ريال</Text>
                            </View>
                            <View style={styles.priceArrow}>
                              <Ionicons name="arrow-forward" size={20} color={PRIMARY} />
                            </View>
                            <View style={styles.priceItem}>
                              <Text style={styles.previewLabel}>السعر النهائي</Text>
                              <Text style={styles.finalPriceText}>{finalPrice.toFixed(2)} ريال</Text>
                            </View>
                          </View>
                          <View style={styles.previewDetails}>
                            <Text style={styles.previewDetailText}>
                              • الخصم الفعلي: {discountAmount.toFixed(2)} ريال ({actualDiscountPercentage}%)
                            </Text>
                            {maxDiscount && discountAmount >= maxDiscount && (
                              <Text style={styles.maxDiscountNote}>
                                ⚠️ تم تطبيق الحد الأقصى للخصم ({maxDiscount} ريال)
                              </Text>
                            )}
                            {minAmount > 0 && (
                              <Text style={styles.minAmountNote}>
                                📝 الحد الأدنى للطلب: {minAmount} ريال
                              </Text>
                            )}
                          </View>
                        </View>
                      );
                    }
                    return (
                      <Text style={styles.noPreview}>اختر منتج وأدخل نسبة الخصم لرؤية المعاينة</Text>
                    );
                  })()}
                </View>
              </View>
            )}

            {/* قسم التواريخ */}
            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>📅 فترة العرض</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>تاريخ البداية</Text>
                <TextInput
                  style={styles.premiumInput}
                  placeholder="YYYY-MM-DD (مثال: 2024-01-15)"
                  value={formData.startDate.toISOString().split('T')[0]}
                  onChangeText={(text) => {
                    const date = new Date(text);
                    if (!isNaN(date.getTime())) {
                      setFormData({ ...formData, startDate: date });
                    }
                  }}
                  placeholderTextColor="#999"
                />
                <Text style={styles.dateHelper}>
                  التاريخ الحالي: {formData.startDate.toLocaleDateString('ar-SA')}
                </Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>تاريخ الانتهاء</Text>
                <TextInput
                  style={styles.premiumInput}
                  placeholder="YYYY-MM-DD (مثال: 2024-01-22)"
                  value={formData.endDate.toISOString().split('T')[0]}
                  onChangeText={(text) => {
                    const date = new Date(text);
                    if (!isNaN(date.getTime())) {
                      setFormData({ ...formData, endDate: date });
                    }
                  }}
                  placeholderTextColor="#999"
                />
                <Text style={styles.dateHelper}>
                  التاريخ الحالي: {formData.endDate.toLocaleDateString('ar-SA')}
                </Text>
              </View>

              {/* أزرار سريعة لفترات محددة */}
              <View style={styles.quickDateButtons}>
                <Text style={styles.quickDateLabel}>فترات سريعة:</Text>
                <View style={styles.quickButtonsRow}>
                  <TouchableOpacity 
                    style={styles.quickButton}
                    onPress={() => {
                      const start = new Date();
                      const end = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
                      setFormData({ ...formData, startDate: start, endDate: end });
                    }}
                  >
                    <Text style={styles.quickButtonText}>أسبوع</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.quickButton}
                    onPress={() => {
                      const start = new Date();
                      const end = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
                      setFormData({ ...formData, startDate: start, endDate: end });
                    }}
                  >
                    <Text style={styles.quickButtonText}>شهر</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.quickButton}
                    onPress={() => {
                      const start = new Date();
                      const end = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
                      setFormData({ ...formData, startDate: start, endDate: end });
                    }}
                  >
                    <Text style={styles.quickButtonText}>3 أشهر</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* زر الحفظ */}
            <TouchableOpacity 
              style={[
                styles.premiumSaveButton,
                (!formData.title || !formData.name || !formData.description || !formData.discountPercentage || !formData.productId) && styles.disabledButton
              ]}
              onPress={handleSaveDiscount}
              disabled={!formData.title || !formData.name || !formData.description || !formData.discountPercentage || !formData.productId}
            >
              <Ionicons name="checkmark-circle" size={24} color="white" />
              <Text style={styles.saveButtonText}>
                {editingDiscount ? 'تحديث العرض' : 'إنشاء العرض'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* منتقي التاريخ */}
      {showDatePicker && Platform.OS === 'ios' && (
        <Modal transparent={true} animationType="slide">
          <View style={styles.datePickerModal}>
            <View style={styles.datePickerContainer}>
              <View style={styles.datePickerHeader}>
                <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                  <Text style={styles.datePickerCancel}>إلغاء</Text>
                </TouchableOpacity>
                <Text style={styles.datePickerTitle}>
                  {datePickerMode === 'start' ? 'تاريخ البداية' : 'تاريخ الانتهاء'}
                </Text>
                <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                  <Text style={styles.datePickerDone}>تم</Text>
                </TouchableOpacity>
              </View>
              {/* سيتم إضافة DateTimePicker هنا إذا كان متاحاً */}
            </View>
          </View>
        </Modal>
      )}
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
    paddingTop: Platform.OS === 'ios' ? 60 : (Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 20 : 50),
    paddingHorizontal: 20,
    paddingVertical: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  addButton: {
    padding: 8,
  },
  container: {
    flex: 1,
    padding: 20,
  },
  searchContainer: {
    backgroundColor: 'white',
    margin: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    textAlign: 'right',
  },
  searchIcon: {
    marginLeft: 8,
  },
  discountsList: {
    padding: 16,
  },
  discountCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginBottom: 16,
    padding: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  discountHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  discountBadge: {
    backgroundColor: PINK,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: 'center',
  },
  discountPercentage: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  discountLabel: {
    color: 'white',
    fontSize: 10,
  },
  discountActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editBtn: {
    padding: 8,
  },
  deleteBtn: {
    padding: 8,
  },
  productInfo: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  productDetails: {
    flex: 1,
  },
  discountTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  productName: {
    fontSize: 14,
    color: PRIMARY,
    marginBottom: 4,
  },
  discountDescription: {
    fontSize: 12,
    color: '#666',
  },
  priceInfo: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 12,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  priceLabel: {
    fontSize: 14,
    color: '#666',
  },
  originalPrice: {
    fontSize: 14,
    color: '#999',
    textDecorationLine: 'line-through',
  },
  discountPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: PINK,
  },
  validUntil: {
    fontSize: 12,
    color: '#888',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: BG,
  },
  modalHeader: {
    backgroundColor: PRIMARY,
    paddingHorizontal: 20,
    paddingVertical: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  closeButton: {
    padding: 8,
  },
  formContainer: {
    padding: 0,
  },
  // أنماط النموذج البريميوم
  formSection: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    marginHorizontal: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'right',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    marginBottom: 8,
    textAlign: 'right',
  },
  premiumInput: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    textAlign: 'right',
    borderWidth: 1,
    borderColor: '#E9ECEF',
    color: '#333',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  selectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    justifyContent: 'space-between',
  },
  selectorButtonSelected: {
    backgroundColor: PRIMARY,
    borderColor: PRIMARY,
  },
  selectorButtonText: {
    fontSize: 16,
    color: '#666',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 10,
  },
  selectorButtonTextSelected: {
    color: 'white',
  },
  productGrid: {
    marginTop: 12,
    gap: 12,
  },
  productCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    position: 'relative',
  },
  productCardSelected: {
    backgroundColor: PRIMARY,
    borderColor: PRIMARY,
  },
  productCardImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 12,
  },
  productCardInfo: {
    flex: 1,
  },
  productCardName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  productCardNameSelected: {
    color: 'white',
  },
  productCardCategory: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  productCardCategorySelected: {
    color: 'rgba(255,255,255,0.7)',
  },
  productCardPrice: {
    fontSize: 12,
    color: '#666',
  },
  productCardPriceSelected: {
    color: 'rgba(255,255,255,0.8)',
  },
  selectedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    padding: 4,
  },
  productSelectorContainer: {
    marginTop: 12,
  },
  productSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  productSearchInput: {
    flex: 1,
    fontSize: 14,
    textAlign: 'right',
    paddingVertical: 4,
  },
  clearSearchButton: {
    marginLeft: 8,
    padding: 4,
  },
  categoryFilter: {
    marginBottom: 12,
  },
  categoryButton: {
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  categoryButtonActive: {
    backgroundColor: PRIMARY,
    borderColor: PRIMARY,
  },
  categoryButtonText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  categoryButtonTextActive: {
    color: 'white',
  },
  noProductsFound: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  noProductsText: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  pricePreview: {
    backgroundColor: '#F0F8FF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: PRIMARY,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priceItem: {
    flex: 1,
    alignItems: 'center',
  },
  priceArrow: {
    marginHorizontal: 16,
  },
  previewLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  originalPriceText: {
    fontSize: 16,
    color: '#999',
    textDecorationLine: 'line-through',
    fontWeight: '600',
  },
  finalPriceText: {
    fontSize: 18,
    color: PINK,
    fontWeight: 'bold',
  },
  noPreview: {
    textAlign: 'center',
    color: '#999',
    fontStyle: 'italic',
  },
  dateContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  dateButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  dateInfo: {
    marginLeft: 12,
    flex: 1,
  },
  dateLabel: {
    fontSize: 12,
    color: '#666',
    flex: 1,
  },
  dateValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  premiumSaveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PRIMARY,
    borderRadius: 16,
    padding: 18,
    margin: 20,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    gap: 12,
  },
  disabledButton: {
    backgroundColor: '#CCC',
    elevation: 2,
  },
  // أنماط منتقي التاريخ
  datePickerModal: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  datePickerContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34,
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  datePickerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  datePickerCancel: {
    fontSize: 16,
    color: '#666',
  },
  datePickerDone: {
    fontSize: 16,
    color: PRIMARY,
    fontWeight: 'bold',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // أنماط الكارد المحسن
  statusContainer: {
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  activeBadge: {
    backgroundColor: '#4CAF50',
  },
  inactiveBadge: {
    backgroundColor: '#FF9800',
  },
  statusText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  productCategory: {
    fontSize: 12,
    color: '#888',
    marginBottom: 2,
  },
  savingAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  datesInfo: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  createdAt: {
    fontSize: 10,
    color: '#999',
  },
  totalSavings: {
    alignItems: 'flex-end',
  },
  totalLabel: {
    fontSize: 10,
    color: '#666',
    marginBottom: 2,
  },
  totalValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  dateHelper: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'right',
  },
  quickDateButtons: {
    marginTop: 16,
  },
  quickDateLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    marginBottom: 8,
    textAlign: 'right',
  },
  quickButtonsRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
  },
  quickButton: {
    flex: 1,
    backgroundColor: PRIMARY,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  quickButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  previewDetails: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
  },
  previewDetailText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  maxDiscountNote: {
    fontSize: 11,
    color: '#FF9800',
    fontWeight: '600',
    marginBottom: 4,
  },
  minAmountNote: {
    fontSize: 11,
    color: '#2196F3',
    fontWeight: '600',
  },
  discountCode: {
    fontSize: 11,
    color: '#9C27B0',
    fontWeight: '600',
    marginTop: 4,
    backgroundColor: '#F3E5F5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  limitText: {
    fontSize: 12,
    color: '#FF5722',
    fontWeight: '600',
  },
});