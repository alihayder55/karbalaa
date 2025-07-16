import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  Dimensions,
  Platform,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';

const { width } = Dimensions.get('window');

interface Category {
  id: string;
  name: string;
  name_ar?: string;
  description?: string;
  image_url?: string;
  product_count?: number;
}

interface FeaturedProduct {
  id: string;
  name: string;
  description?: string;
  price: number;
  discount_price?: number;
  image_url?: string;
  category_id: string;
  category?: {
    name: string;
    name_ar?: string;
  };
}

export default function ExploreScreen() {
  const router = useRouter();
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<FeaturedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(true);

  useEffect(() => {
    loadCategories();
    loadFeaturedProducts();
  }, []);

  const loadCategories = async () => {
    try {
      setCategoriesLoading(true);
      console.log('🔍 Loading categories for explore...');
      
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('product_categories')
        .select('id, name, name_ar, description, image_url')
        .is('parent_id', null)
        .order('name')
        .limit(8);

      if (categoriesError) {
        console.error('Error loading categories:', categoriesError);
        setCategories([]);
      } else {
        console.log('✅ Categories loaded for explore:', categoriesData?.length || 0);
        setCategories(categoriesData || []);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      setCategories([]);
    } finally {
      setCategoriesLoading(false);
      setLoading(false);
    }
  };

  const loadFeaturedProducts = async () => {
    try {
      setProductsLoading(true);
      console.log('🔍 Loading featured products...');
      
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select(`
          id,
          name,
          description,
          price,
          discount_price,
          image_url,
          category_id,
          product_categories!inner(name, name_ar)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(6);

      if (productsError) {
        console.error('Error loading featured products:', productsError);
        setFeaturedProducts([]);
      } else {
        console.log('✅ Featured products loaded:', productsData?.length || 0);
        setFeaturedProducts(productsData || []);
      }
    } catch (error) {
      console.error('Error loading featured products:', error);
      setFeaturedProducts([]);
    } finally {
      setProductsLoading(false);
      setLoading(false);
    }
  };

  const handleCategoryPress = (category: Category) => {
    router.push({
      pathname: '/store-owner/search',
      params: { category: category.id }
    });
  };

  const handleProductPress = (product: FeaturedProduct) => {
    router.push({
      pathname: '/store-owner/(modals)/product-details',
      params: { productId: product.id }
    });
  };

  const handleSearchPress = () => {
    router.push('/store-owner/search');
  };

  const formatPrice = (price: number) => {
    return `${price.toLocaleString()} د.ع`;
  };

  const getDiscountPercentage = (originalPrice: number, discountPrice: number) => {
    return Math.round(((originalPrice - discountPrice) / originalPrice) * 100);
  };

  const renderCategoryItem = (category: Category) => (
    <TouchableOpacity
      key={category.id}
      style={styles.categoryCard}
      onPress={() => handleCategoryPress(category)}
    >
      <View style={styles.categoryImageContainer}>
        {category.image_url ? (
          <Image
            source={{ uri: category.image_url }}
            style={styles.categoryImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.categoryImagePlaceholder}>
            <MaterialIcons name="category" size={32} color="#40E0D0" />
          </View>
        )}
      </View>
      <Text style={styles.categoryName} numberOfLines={2}>
        {category.name_ar || category.name}
      </Text>
      {category.description && (
        <Text style={styles.categoryDescription} numberOfLines={1}>
          {category.description}
        </Text>
      )}
    </TouchableOpacity>
  );

  const renderFeaturedProduct = (product: FeaturedProduct) => (
    <TouchableOpacity
      key={product.id}
      style={styles.productCard}
      onPress={() => handleProductPress(product)}
    >
      <View style={styles.productImageContainer}>
        {product.image_url ? (
          <Image
            source={{ uri: product.image_url }}
            style={styles.productImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.productImagePlaceholder}>
            <MaterialIcons name="inventory" size={40} color="#666" />
          </View>
        )}
        {product.discount_price && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>
              {getDiscountPercentage(product.price, product.discount_price)}%
            </Text>
          </View>
        )}
      </View>
      
      <View style={styles.productContent}>
        <Text style={styles.productName} numberOfLines={2}>
          {product.name}
        </Text>
        {product.description && (
          <Text style={styles.productDescription} numberOfLines={1}>
            {product.description}
          </Text>
        )}
        <View style={styles.productPriceContainer}>
          {product.discount_price ? (
            <>
              <Text style={styles.discountPrice}>
                {formatPrice(product.discount_price)}
              </Text>
              <Text style={styles.originalPrice}>
                {formatPrice(product.price)}
              </Text>
            </>
          ) : (
            <Text style={styles.productPrice}>
              {formatPrice(product.price)}
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>استكشف المنتجات</Text>
          <TouchableOpacity
            style={styles.searchButton}
            onPress={handleSearchPress}
          >
            <MaterialIcons name="search" size={24} color="#40E0D0" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Categories Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="category" size={24} color="#40E0D0" />
            <Text style={styles.sectionTitle}>الفئات</Text>
          </View>
          
          {categoriesLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#40E0D0" />
              <Text style={styles.loadingText}>جاري تحميل الفئات...</Text>
            </View>
          ) : (
            <View style={styles.categoriesGrid}>
              {categories.map(renderCategoryItem)}
            </View>
          )}
        </View>

        {/* Featured Products Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="star" size={24} color="#40E0D0" />
            <Text style={styles.sectionTitle}>منتجات مميزة</Text>
          </View>
          
          {productsLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#40E0D0" />
              <Text style={styles.loadingText}>جاري تحميل المنتجات...</Text>
            </View>
          ) : (
            <View style={styles.productsGrid}>
              {featuredProducts.map(renderFeaturedProduct)}
            </View>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="flash-on" size={24} color="#40E0D0" />
            <Text style={styles.sectionTitle}>إجراءات سريعة</Text>
          </View>
          <View style={styles.quickActions}>
            <TouchableOpacity style={styles.actionCard}>
              <MaterialIcons name="local-offer" size={32} color="#40E0D0" />
              <Text style={styles.actionText}>العروض الخاصة</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard}>
              <MaterialIcons name="trending-up" size={32} color="#40E0D0" />
              <Text style={styles.actionText}>الأكثر مبيعاً</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard}>
              <MaterialIcons name="new-releases" size={32} color="#40E0D0" />
              <Text style={styles.actionText}>وصل حديثاً</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  searchButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
  categoryCard: {
    width: (width - 60) / 3,
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  categoryImageContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginBottom: 8,
    overflow: 'hidden',
  },
  categoryImage: {
    width: '100%',
    height: '100%',
  },
  categoryImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 4,
  },
  categoryDescription: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
  productCard: {
    width: (width - 60) / 2,
    backgroundColor: '#fff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  productImageContainer: {
    position: 'relative',
    height: 120,
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  productImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#ff4757',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  discountText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  productContent: {
    padding: 12,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  productDescription: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  productPriceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  productPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#40E0D0',
  },
  discountPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#40E0D0',
  },
  originalPrice: {
    fontSize: 12,
    color: '#999',
    textDecorationLine: 'line-through',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  actionCard: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginTop: 8,
    textAlign: 'center',
  },
});
