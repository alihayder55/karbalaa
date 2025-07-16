import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  Alert,
  Dimensions,
  Platform,
  Animated,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import FavoriteButton from '../../components/FavoriteButton';

const { width } = Dimensions.get('window');

interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  discount_price?: number;
  image_url?: string;
  is_active: boolean;
  category_id: string;
  merchant_id: string;
  category?: {
    name: string;
    name_ar?: string;
  };
}

interface Category {
  id: string;
  name: string;
  description?: string;
  image_URL?: string; // <-- update to match DB
}

interface SubCategory {
  id: string;
  name: string;
  parent_id: string;
  image_url?: string;
}

export default function StoreOwnerSearch() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const initialQuery = params.query as string || '';
  const initialCategory = params.category as string || 'all';
  
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [showSubCategories, setShowSubCategories] = useState(false);
  const [categoryAnimations] = useState(new Map());

  useEffect(() => {
    loadCategories();
    if (initialQuery) {
      performSearch(initialQuery);
    } else if (initialCategory !== 'all') {
      loadCategoryProducts(initialCategory);
    }
  }, [initialQuery, initialCategory]);

  const loadCategories = async () => {
    try {
      console.log('🔍 Loading categories...');
      const { data, error } = await supabase
        .from('product_categories')
        .select('id, name, description, image_URL')
        .order('name');
      if (error) {
        console.error('❌ Error loading categories:', error);
        setCategories([]);
        return;
      }
      console.log('✅ Categories loaded:', data?.length || 0);
      setCategories(data || []);
    } catch (error) {
      console.error('❌ Exception loading categories:', error);
      setCategories([]);
    }
  };

  const loadSubCategories = async (parentId: string) => {
    try {
      const { data: subCategoriesData, error: subCategoriesError } = await supabase
        .from('product_categories')
        .select('id, name, parent_id, image_url')
        .eq('parent_id', parentId)
        .order('name');

      if (subCategoriesError) {
        console.error('Error loading sub-categories:', subCategoriesError);
        setSubCategories([]);
      } else {
        console.log('✅ Sub-categories loaded:', subCategoriesData?.length || 0);
        setSubCategories(subCategoriesData || []);
      }
    } catch (error) {
      console.error('Error loading sub-categories:', error);
      setSubCategories([]);
    }
  };

  const loadCategoryProducts = async (categoryId: string) => {
    if (categoryId === 'all') {
      await loadAllProducts();
      return;
    }

    try {
      setSearching(true);
      console.log('🔍 Loading products for category:', categoryId);
      
      const { data, error } = await supabase
        .from('products')
        .select(`
          id,
          name,
          description,
          price,
          discount_price,
          image_url,
          is_active,
          category_id,
          merchant_id
        `)
        .eq('is_active', true)
        .eq('category_id', categoryId)
        .order('name');

      if (error) {
        console.error('Error loading category products:', error);
        throw error;
      }

      console.log('✅ Category products loaded:', data?.length || 0);
      setProducts(data || []);
    } catch (error) {
      console.error('Error loading category products:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء تحميل منتجات الفئة');
    } finally {
      setSearching(false);
    }
  };

  const loadAllProducts = async () => {
    try {
      setSearching(true);
      console.log('🔍 Loading all products...');
      
      const { data, error } = await supabase
        .from('products')
        .select(`
          id,
          name,
          description,
          price,
          discount_price,
          image_url,
          is_active,
          category_id,
          merchant_id
        `)
        .eq('is_active', true)
        .order('name')
        .limit(50);

      if (error) {
        console.error('Error loading all products:', error);
        throw error;
      }

      console.log('✅ All products loaded:', data?.length || 0);
      setProducts(data || []);
    } catch (error) {
      console.error('Error loading all products:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء تحميل المنتجات');
    } finally {
      setSearching(false);
    }
  };

  const performSearch = async (query: string) => {
    try {
      setSearching(true);
      console.log('🔍 Searching for:', query, 'in category:', selectedCategory);
      
      let supabaseQuery = supabase
        .from('products')
        .select(`
          id,
          name,
          description,
          price,
          discount_price,
          image_url,
          is_active,
          category_id,
          merchant_id
        `)
        .eq('is_active', true);

      if (selectedCategory !== 'all') {
        supabaseQuery = supabaseQuery.eq('category_id', selectedCategory);
      }

      if (query && query.trim()) {
        supabaseQuery = supabaseQuery.or(`name.ilike.%${query}%,description.ilike.%${query}%`);
      }

      const { data, error } = await supabaseQuery.order('name').limit(100);

      if (error) {
        console.error('Error searching products:', error);
        throw error;
      }

      console.log('✅ Search results:', data?.length || 0, 'products');
      setProducts(data || []);
    } catch (error) {
      console.error('Error searching products:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء البحث');
    } finally {
      setSearching(false);
    }
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      performSearch(searchQuery.trim());
    }
  };

  const handleCategorySelect = async (categoryId: string) => {
    setSelectedCategory(categoryId);
    setSelectedSubCategory('');
    setShowSubCategories(false);
    
    if (categoryId !== 'all') {
      await loadSubCategories(categoryId);
      setShowSubCategories(true);
    }
    
    await loadCategoryProducts(categoryId);
  };

  const handleSubCategorySelect = (subCategoryId: string) => {
    setSelectedSubCategory(subCategoryId);
    // Load products for sub-category
    loadCategoryProducts(subCategoryId);
  };

  const handleProductPress = (product: Product) => {
    router.push({
      pathname: '/store-owner/(modals)/product-details',
      params: { productId: product.id }
    });
  };

  const formatPrice = (price: number) => {
    return `${price.toLocaleString()} د.ع`;
  };

  const getDiscountPercentage = (originalPrice: number, discountPrice: number) => {
    return Math.round(((originalPrice - discountPrice) / originalPrice) * 100);
  };

  const renderCategoryItem = (category: Category, isActive: boolean) => (
    <TouchableOpacity
      key={category.id}
      style={[styles.categoryCard, isActive && styles.categoryCardActive]}
      onPress={() => handleCategorySelect(category.id)}
    >
      <View style={styles.categoryIcon}>
        {category.image_URL ? (
          <Image
            source={{ uri: category.image_URL }}
            style={{ width: 32, height: 32, borderRadius: 16 }}
            resizeMode="cover"
          />
        ) : (
          <MaterialIcons 
            name="category" 
            size={24} 
            color={isActive ? '#fff' : '#40E0D0'} 
          />
        )}
      </View>
      <Text style={[styles.categoryName, isActive && styles.categoryNameActive]}>
        {category.name}
      </Text>
    </TouchableOpacity>
  );

  const renderSubCategoryItem = (subCategory: SubCategory, isActive: boolean) => (
    <TouchableOpacity
      key={subCategory.id}
      style={[styles.subCategoryCard, isActive && styles.subCategoryCardActive]}
      onPress={() => handleSubCategorySelect(subCategory.id)}
    >
      <Text style={[styles.subCategoryName, isActive && styles.subCategoryNameActive]}>
        {subCategory.name}
      </Text>
    </TouchableOpacity>
  );

  const renderProductItem = (product: Product) => (
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
        <View style={styles.favoriteButton}>
          <FavoriteButton 
            productId={product.id} 
            key={`favorite-${product.id}`}
            onToggle={(isFavorite) => {
              console.log(`Favorite toggled for product ${product.id}: ${isFavorite}`);
            }}
          />
        </View>
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
        <View style={styles.availabilityContainer}>
          <MaterialIcons 
            name={product.is_active ? "check-circle" : "cancel"} 
            size={14} 
            color={product.is_active ? "#28A745" : "#DC3545"} 
          />
          <Text style={[
            styles.availabilityText,
            { color: product.is_active ? "#28A745" : "#DC3545" }
          ]}>
            {product.is_active ? 'متوفر' : 'غير متوفر'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>البحث</Text>
          <View style={styles.headerSpacer} />
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <MaterialIcons name="search" size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="ابحث عن المنتجات..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity 
              style={styles.clearButton}
              onPress={() => setSearchQuery('')}
            >
              <MaterialIcons name="close" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity 
          style={styles.searchButton}
          onPress={handleSearch}
        >
          <MaterialIcons name="search" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Categories */}
        <View style={styles.categoriesSection}>
          <Text style={styles.sectionTitle}>الفئات ({categories.length})</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.categoriesScroll}
            contentContainerStyle={styles.categoriesContainer}
          >
            <TouchableOpacity
              style={[
                styles.categoryCard,
                selectedCategory === 'all' && styles.categoryCardActive
              ]}
              onPress={() => handleCategorySelect('all')}
            >
              <View style={styles.categoryIcon}>
                <MaterialIcons 
                  name="apps" 
                  size={24} 
                  color={selectedCategory === 'all' ? '#fff' : '#40E0D0'} 
                />
              </View>
              <Text style={[styles.categoryName, selectedCategory === 'all' && styles.categoryNameActive]}>
                الكل
              </Text>
            </TouchableOpacity>
            
            {categories.length === 0 ? (
              <View style={styles.emptyCategoriesContainer}>
                <Text style={styles.emptyCategoriesText}>لا توجد فئات متاحة</Text>
                <Text style={styles.emptyCategoriesSubtext}>عدد الفئات المحملة: {categories.length}</Text>
              </View>
            ) : (
              categories.map((category) => renderCategoryItem(category, selectedCategory === category.id))
            )}
          </ScrollView>
        </View>

        {/* Sub Categories */}
        {showSubCategories && subCategories.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="subdirectory-arrow-right" size={24} color="#40E0D0" />
              <Text style={styles.sectionTitle}>الفئات الفرعية</Text>
            </View>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.subCategoriesScroll}
            >
              {subCategories.map((subCategory) => renderSubCategoryItem(subCategory, selectedSubCategory === subCategory.id))}
            </ScrollView>
          </View>
        )}

        {/* Products */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="inventory" size={24} color="#40E0D0" />
            <Text style={styles.sectionTitle}>
              المنتجات ({products.length})
            </Text>
          </View>
          
          {searching ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#40E0D0" />
              <Text style={styles.loadingText}>جاري البحث...</Text>
            </View>
          ) : products.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialIcons name="search-off" size={64} color="#ccc" />
              <Text style={styles.emptyText}>لا توجد منتجات</Text>
              <Text style={styles.emptySubtext}>جرب البحث بكلمات مختلفة</Text>
            </View>
          ) : (
            <View style={styles.productsGrid}>
              {products.map(renderProductItem)}
            </View>
          )}
        </View>
        
        {/* Bottom Spacing for Tab Bar */}
        <View style={styles.bottomSpacing} />
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
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSpacer: {
    width: 40,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 8,
  },
  clearButton: {
    padding: 4,
  },
  searchButton: {
    backgroundColor: '#40E0D0',
    padding: 12,
    borderRadius: 12,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
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
  categoriesScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  categoryCard: {
    alignItems: 'center',
    padding: 16,
    marginRight: 12,
    backgroundColor: '#fff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    minWidth: 80,
  },
  categoryCardActive: {
    backgroundColor: '#40E0D0',
  },
  categoryIcon: {
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  categoryNameActive: {
    color: '#fff',
  },
  subCategoriesScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  subCategoryCard: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 20,
  },
  subCategoryCardActive: {
    backgroundColor: '#40E0D0',
  },
  subCategoryName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  subCategoryNameActive: {
    color: '#fff',
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
  favoriteButton: {
    position: 'absolute',
    top: 8,
    left: 8,
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
    marginBottom: 4,
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
  productMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 12,
    color: '#666',
  },
  availabilityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  availabilityText: {
    fontSize: 12,
    marginLeft: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  emptyCategoriesContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyCategoriesText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  emptyCategoriesSubtext: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  categoriesSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  categoriesContainer: {
    alignItems: 'center',
  },
  bottomSpacing: {
    height: 120,
  },
}); 