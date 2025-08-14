/**
 * 🏥 Categories Data & Configuration
 * بيانات الفئات مع الصور والأيقونات
 */

export interface CategoryData {
  id: string;
  name: string;
  description: string;
  image: any; // require() للصورة
  icon: string; // اسم الأيقونة من Ionicons
  color: string; // لون الفئة
}

// بيانات الفئات مع الصور المتاحة
export const CATEGORIES_DATA: CategoryData[] = [
  {
    id: 'medicine',
    name: 'أدوية',
    description: 'أدوية ومستحضرات طبية',
    image: require('../../assets/images/medicin.jpg'),
    icon: 'medical-outline',
    color: '#4CAF50'
  },
  {
    id: 'baby_care',
    name: 'منتجات الأطفال',
    description: 'عناية ومنتجات الأطفال',
    image: require('../../assets/images/babycare.jpg'),
    icon: 'happy-outline',
    color: '#FF9800'
  },
  {
    id: 'family_care',
    name: 'العناية بالعائلة',
    description: 'منتجات العناية العائلية',
    image: require('../../assets/images/familycare.jpg'),
    icon: 'people-outline',
    color: '#2196F3'
  },
  {
    id: 'hair_care',
    name: 'العناية بالشعر',
    description: 'منتجات العناية بالشعر',
    image: require('../../assets/images/haircare.jpg'),
    icon: 'cut-outline',
    color: '#9C27B0'
  },
  {
    id: 'skin_care',
    name: 'العناية بالبشرة',
    description: 'منتجات العناية بالبشرة',
    image: require('../../assets/images/skincare.jpg'),
    icon: 'flower-outline',
    color: '#E91E63'
  }
];

// دالة للحصول على بيانات فئة معينة
export const getCategoryData = (categoryId: string): CategoryData | null => {
  return CATEGORIES_DATA.find(cat => cat.id === categoryId) || null;
};

// دالة للحصول على اسم الفئة
export const getCategoryName = (categoryId: string): string => {
  const category = getCategoryData(categoryId);
  return category?.name || 'فئة غير محددة';
};

// دالة للحصول على لون الفئة
export const getCategoryColor = (categoryId: string): string => {
  const category = getCategoryData(categoryId);
  return category?.color || '#23B6C7';
};
