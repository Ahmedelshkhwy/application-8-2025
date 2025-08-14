/**
 * 🎨 Categories Component
 * مكون عرض الفئات الأفقي في الصفحة الرئيسية
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  FlatList,
  StyleSheet,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { CATEGORIES_DATA, CategoryData } from '../data/categories';

const { width } = Dimensions.get('window');
const PRIMARY = '#23B6C7';

interface CategoriesProps {
  style?: any;
}

export const CategoriesSection: React.FC<CategoriesProps> = ({ style }) => {
  const router = useRouter();

  const handleCategoryPress = (category: CategoryData) => {
    // التنقل لصفحة الفئة مع تمرير معرف الفئة
    router.push(`/(modals)/category/${category.id}` as any);
  };

  const renderCategory = ({ item }: { item: CategoryData }) => (
    <TouchableOpacity
      style={styles.categoryItem}
      onPress={() => handleCategoryPress(item)}
      activeOpacity={0.7}
    >
      <View style={[styles.categoryImageContainer, { borderColor: item.color }]}>
        <Image
          source={item.image}
          style={styles.categoryImage}
          resizeMode="cover"
        />
        <View style={[styles.categoryOverlay, { backgroundColor: item.color + '20' }]}>
          <Ionicons 
            name={item.icon as any} 
            size={20} 
            color={item.color} 
          />
        </View>
      </View>
      <Text style={styles.categoryName} numberOfLines={2}>
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, style]}>
      <View style={styles.header}>
        <Text style={styles.title}>تسوق حسب الفئة</Text>
        <TouchableOpacity 
          onPress={() => router.push('/(tabs)/categories' as any)}
          style={styles.seeAllButton}
        >
          <Text style={styles.seeAllText}>عرض الكل</Text>
          <Ionicons name="chevron-forward" size={16} color={PRIMARY} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={CATEGORIES_DATA}
        renderItem={renderCategory}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoriesList}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    paddingVertical: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  seeAllText: {
    fontSize: 14,
    color: PRIMARY,
    marginRight: 4,
  },
  categoriesList: {
    paddingHorizontal: 20,
  },
  separator: {
    width: 15,
  },
  categoryItem: {
    alignItems: 'center',
    width: 80,
  },
  categoryImageContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    overflow: 'hidden',
    borderWidth: 2,
    position: 'relative',
    marginBottom: 8,
  },
  categoryImage: {
    width: '100%',
    height: '100%',
  },
  categoryOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  categoryName: {
    fontSize: 12,
    textAlign: 'center',
    color: '#666',
    lineHeight: 14,
  },
});

export default CategoriesSection;
