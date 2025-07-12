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
  SafeAreaView,
  Dimensions,
  Platform,
} from 'react-native';
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
  available_quantity: number;
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
  name_ar?: string;
  description?: string;
}

export default function StoreOwnerSearch() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const initialQuery = params.query as string || '';
  const initialCategory = params.category as string || 'all';
  
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    loadCategories();
    if (initialQuery) {
      performSearch(initialQuery);
    } else if (initialCategory !== 'all') {
      // عرض منتجات الفئة حتى لو لم يكن هناك نص بحث
      loadCategoryProducts(initialCategory);
    }
  }, [initialQuery, initialCategory]);

  const loadCategories = async () => {
    try {
      console.log('🔍 Loading categories...');
      
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('product_categories')
        .select('id, name, description')
        .order('name');

      if (categoriesError) {
        console.error('Error loading categories:', categoriesError);
        setCategories([]);
      } else {
        console.log('✅ Categories loaded:', categoriesData?.length || 0);
        setCategories(categoriesData || []);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      setCategories([]);
    }
  };

  const loadCategoryProducts = async (categoryId: string) => {
    if (categoryId === 'all') {
      // تحميل جميع المنتجات
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
          available_quantity,
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
          available_quantity,
          category_id,
          merchant_id
        `)
        .eq('is_active', true)
        .order('name')
        .limit(50); // تحديد لتجنب تحميل آلاف المنتجات

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
          available_quantity,
          category_id,
          merchant_id
        `)
        .eq('is_active', true);

      // إضافة فلتر الفئة إذا تم تحديد فئة معينة
      if (selectedCategory !== 'all') {
        supabaseQuery = supabaseQuery.eq('category_id', selectedCategory);
      }

      // إضافة البحث النصي إذا كان هناك نص بحث
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
    console.log('🔍 Search button pressed, query:', searchQuery);
    if (searchQuery.trim()) {
      performSearch(searchQuery.trim());
    } else {
      // إذا لم يكن هناك نص بحث، عرض منتجات الفئة المحددة
      loadCategoryProducts(selectedCategory);
    }
  };

  const handleCategorySelect = (categoryId: string) => {
    console.log('🏷️ Category selected:', categoryId);
    setSelectedCategory(categoryId);
    
    if (searchQuery.trim()) {
      // إذا كان هناك نص بحث، ابحث في الفئة الجديدة
      performSearch(searchQuery.trim());
    } else {
      // إذا لم يكن هناك نص بحث، عرض منتجات الفئة
      loadCategoryProducts(categoryId);
    }
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

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <MaterialIcons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>البحث</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
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
              onPress={() => {
                setSearchQuery('');
                // عرض منتجات الفئة المحددة بعد مسح البحث
                loadCategoryProducts(selectedCategory);
              }}
            >
              <MaterialIcons name="close" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={styles.searchButton}
          onPress={handleSearch}
          disabled={searching}
        >
          {searching ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <MaterialIcons name="search" size={20} color="#fff" />
          )}
        </TouchableOpacity>
      </View>

      {/* Categories Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesContainer}
        contentContainerStyle={styles.categoriesContent}
      >
        <TouchableOpacity
          style={[
            styles.categoryButton,
            selectedCategory === 'all' && styles.categoryButtonActive
          ]}
          onPress={() => handleCategorySelect('all')}
        >
          <Text style={[
            styles.categoryButtonText,
            selectedCategory === 'all' && styles.categoryButtonTextActive
          ]}>
            الكل
          </Text>
        </TouchableOpacity>
        
        {categories.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryButton,
              selectedCategory === category.id && styles.categoryButtonActive
            ]}
            onPress={() => handleCategorySelect(category.id)}
          >
            <Text style={[
              styles.categoryButtonText,
              selectedCategory === category.id && styles.categoryButtonTextActive
            ]}>
              {category.name_ar || category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Results */}
      <ScrollView style={styles.resultsContainer} showsVerticalScrollIndicator={false}>
        {searching ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FF6B35" />
            <Text style={styles.loadingText}>جاري البحث...</Text>
          </View>
        ) : products.length === 0 && (searchQuery.trim() || selectedCategory !== 'all') ? (
          <View style={styles.emptyContainer}>
            <MaterialIcons name="search-off" size={80} color="#ccc" />
            <Text style={styles.emptyTitle}>لا توجد نتائج</Text>
            <Text style={styles.emptyText}>
              {searchQuery.trim() 
                ? `لم يتم العثور على منتجات تطابق "${searchQuery}"`
                : 'لا توجد منتجات في هذه الفئة'
              }
            </Text>
          </View>
        ) : !searchQuery.trim() && selectedCategory === 'all' && products.length === 0 ? (
          <View style={styles.initialContainer}>
            <MaterialIcons name="search" size={80} color="#ccc" />
            <Text style={styles.initialTitle}>ابحث عن المنتجات</Text>
            <Text style={styles.initialText}>
              اكتب اسم المنتج أو الوصف للعثور على ما تبحث عنه، أو اختر فئة لعرض منتجاتها
            </Text>
          </View>
        ) : (
          <View style={styles.productsContainer}>
            <Text style={styles.resultsCount}>
              {searchQuery.trim() 
                ? `تم العثور على ${products.length} منتج`
                : selectedCategory === 'all'
                  ? `عرض ${products.length} منتج`
                  : `${products.length} منتج في هذه الفئة`
              }
            </Text>
            
            <View style={styles.productsGrid}>
              {products.map((product) => (
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
                        <MaterialIcons name="inventory" size={40} color="#ccc" />
                      </View>
                    )}
                    {product.discount_price && (
                      <View style={styles.discountBadge}>
                        <Text style={styles.discountText}>
                          {getDiscountPercentage(product.price, product.discount_price)}%
                        </Text>
                      </View>
                    )}
                    <View style={styles.favoriteButtonContainer}>
                      <FavoriteButton 
                        productId={product.id} 
                        size={18}
                        showToast={false}
                        style={styles.favoriteButtonStyle}
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
                    <Text style={styles.productQuantity}>
                      المتوفر: {product.available_quantity} قطعة
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  placeholder: {
    width: 40,
  },
  searchContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    paddingHorizontal: 16,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
    textAlign: 'right',
    marginLeft: 8,
  },
  clearButton: {
    padding: 4,
  },
  searchButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoriesContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  categoriesContent: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  categoryButtonActive: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35',
  },
  categoryButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  categoryButtonTextActive: {
    color: '#fff',
  },
  resultsContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  initialContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  initialTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  initialText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  productsContainer: {
    padding: 20,
  },
  resultsCount: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
    textAlign: 'center',
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  productCard: {
    width: (width - 60) / 2,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productImageContainer: {
    height: 120,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  productImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  discountText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  favoriteButtonContainer: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteButtonStyle: {
    padding: 0,
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
    marginBottom: 8,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF6B35',
  },
  discountPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF6B35',
    marginRight: 8,
  },
  originalPrice: {
    fontSize: 12,
    color: '#999',
    textDecorationLine: 'line-through',
  },
  productQuantity: {
    fontSize: 12,
    color: '#666',
  },
  productCategory: {
    fontSize: 11,
    color: '#999',
    marginTop: 4,
  },
}); 