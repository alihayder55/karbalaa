import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
  SafeAreaView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import FavoriteButton from '../../components/FavoriteButton';
import { getCurrentUser } from '../../lib/auth-helpers';
import { cartManager } from '../../lib/cart-manager';

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
}

interface News {
  id: string;
  title: string;
  content: string;
  image_url?: string;
  created_at: string;
}

interface StoreOwner {
  id: string;
  store_name: string;
  store_type: string;
  address: string;
  nearest_landmark: string;
  work_days: string;
  open_time: string;
  close_time: string;
  storefront_image?: string;
  user_id: string;
}

interface Category {
  id: string;
  name: string;
  description?: string;
  icon?: string;
}

export default function StoreOwnerHome() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]); // حفظ جميع المنتجات
  const [news, setNews] = useState<News[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [storeOwner, setStoreOwner] = useState<StoreOwner | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searching, setSearching] = useState(false);
  const [showingResults, setShowingResults] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadProducts(),
        loadNews(),
        loadCategories(),
        loadStoreOwnerInfo(),
        loadCartCount(),
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
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
        .order('name')
        .limit(50);

      if (error) throw error;
      setProducts(data || []);
      setAllProducts(data || []); // حفظ نسخة من جميع المنتجات
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const loadNews = async () => {
    try {
      const { data, error } = await supabase
        .from('news')
        .select('*')
        .limit(5);

      if (error) throw error;
      setNews(data || []);
    } catch (error) {
      console.error('Error loading news:', error);
    }
  };

  const loadCategories = async () => {
    try {
      console.log('🔍 Loading categories from database...');
      
      const { data, error } = await supabase
        .from('product_categories')
        .select('id, name, description')
        .order('name');

      if (error) {
        console.error('❌ Error loading categories:', error);
        setCategories([]);
      } else {
        console.log('✅ Categories loaded:', data?.length || 0);
        setCategories(data || []);
      }
    } catch (error) {
      console.error('❌ Exception loading categories:', error);
      setCategories([]);
    }
  };

  const loadStoreOwnerInfo = async () => {
    try {
      const currentUser = getCurrentUser();
      if (!currentUser) {
        console.log('❌ No user session found, redirecting to login');
        router.replace('/onboarding/welcome');
        return;
      }

      console.log('✅ Loading store owner info for user:', currentUser.user_id);
      
      const { data, error } = await supabase
        .from('store_owners')
        .select('*')
        .eq('user_id', currentUser.user_id)
        .single();

      if (error) {
        console.error('Error loading store owner info:', error);
        if (error.code === 'PGRST116') {
          console.log('❌ Store owner record not found');
          Alert.alert(
            'خطأ',
            'لم يتم العثور على بيانات المحل. يرجى التحقق من نوع الحساب.',
            [
              {
                text: 'موافق',
                onPress: () => router.replace('/onboarding/welcome')
              }
            ]
          );
        }
        return;
      }

      setStoreOwner(data);
      console.log('✅ Store owner info loaded:', data.store_name);
    } catch (error) {
      console.error('Error loading store owner info:', error);
    }
  }

  const loadCartCount = async () => {
    try {
      const count = await cartManager.getCartCount();
      setCartCount(count);
    } catch (error) {
      console.error('Error loading cart count:', error);
    }
  };

  // البحث في المنتجات
  const performSearch = async (query: string) => {
    if (!query.trim()) {
      // إذا لم يكن هناك نص بحث، عرض النتائج حسب الفئة المحددة
      filterByCategory(selectedCategory);
      return;
    }

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
        `);

      // إضافة فلتر الفئة إذا تم تحديد فئة معينة
      if (selectedCategory !== 'all') {
        supabaseQuery = supabaseQuery.eq('category_id', selectedCategory);
      }

      // إضافة البحث النصي
      supabaseQuery = supabaseQuery.or(`name.ilike.%${query}%,description.ilike.%${query}%`);

      const { data, error } = await supabaseQuery.order('name').limit(100);

      if (error) {
        console.error('Error searching products:', error);
        throw error;
      }

      console.log('✅ Search results:', data?.length || 0, 'products');
      setProducts(data || []);
      setShowingResults(true);
    } catch (error) {
      console.error('Error searching products:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء البحث');
    } finally {
      setSearching(false);
    }
  };

  // فلترة حسب الفئة
  const filterByCategory = async (categoryId: string) => {
    if (categoryId === 'all') {
      setProducts(allProducts);
      setShowingResults(false);
      return;
    }

    try {
      setSearching(true);
      console.log('🏷️ Filtering by category:', categoryId);
      
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
        .eq('category_id', categoryId)
        .order('name');

      if (error) {
        console.error('Error filtering by category:', error);
        throw error;
      }

      console.log('✅ Category results:', data?.length || 0, 'products');
      setProducts(data || []);
      setShowingResults(true);
    } catch (error) {
      console.error('Error filtering by category:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء تحميل منتجات الفئة');
    } finally {
      setSearching(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleSearch = () => {
    console.log('🔍 Search button pressed, query:', searchQuery);
    performSearch(searchQuery.trim());
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setProducts(allProducts);
    setShowingResults(false);
  };

  const handleProductPress = (product: Product) => {
    router.push({
      pathname: '/store-owner/(modals)/product-details',
      params: { productId: product.id }
    });
  };

  const handleNewsPress = (newsItem: News) => {
    router.push({
      pathname: '/store-owner/(modals)/news-details',
      params: { newsId: newsItem.id }
    });
  };

  const handleCartPress = () => {
    router.push('/store-owner/cart');
  };

  const handleCategoryPress = (category: Category) => {
    console.log('🏷️ Category pressed:', category.name);
    setSelectedCategory(category.id);
    setSearchQuery(''); // مسح البحث عند اختيار فئة
    filterByCategory(category.id);
  };

  const formatPrice = (price: number) => {
    return `${price.toLocaleString()} د.ع`;
  };

  const getDiscountPercentage = (originalPrice: number, discountPrice: number) => {
    return Math.round(((originalPrice - discountPrice) / originalPrice) * 100);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B35" />
          <Text style={styles.loadingText}>جاري التحميل...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <MaterialIcons name="store" size={24} color="#FF6B35" />
            <Text style={styles.welcomeText}>مرحباً بك</Text>
            {storeOwner && (
              <Text style={styles.storeNameText}>{storeOwner.store_name}</Text>
            )}
          </View>
          <TouchableOpacity onPress={handleCartPress} style={styles.cartButton}>
            <MaterialIcons name="shopping-cart" size={24} color="#333" />
            {cartCount > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{cartCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <MaterialIcons name="search" size={20} color="#999" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="ابحث عن المنتجات..."
              placeholderTextColor="#999"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
            />
            {(searchQuery.length > 0 || showingResults) && (
              <TouchableOpacity onPress={handleClearSearch} style={styles.clearButton}>
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

        {/* Categories */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>الفئات الرئيسية</Text>
            {showingResults && (
              <TouchableOpacity onPress={handleClearSearch}>
                <Text style={styles.seeAllText}>عرض الكل</Text>
              </TouchableOpacity>
            )}
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesContainer}>
            {/* زر الكل */}
            <TouchableOpacity 
              style={[
                styles.categoryCard,
                selectedCategory === 'all' && styles.categoryCardActive
              ]}
              onPress={() => {
                setSelectedCategory('all');
                setSearchQuery('');
                filterByCategory('all');
              }}
            >
              <MaterialIcons 
                name="category" 
                size={32} 
                color={selectedCategory === 'all' ? '#fff' : '#FF6B35'} 
              />
              <Text style={[
                styles.categoryText,
                selectedCategory === 'all' && styles.categoryTextActive
              ]}>
                الكل
              </Text>
            </TouchableOpacity>

            {categories.length > 0 ? (
              categories.map((category, index) => (
                <TouchableOpacity 
                  key={category.id} 
                  style={[
                    styles.categoryCard,
                    selectedCategory === category.id && styles.categoryCardActive
                  ]}
                  onPress={() => handleCategoryPress(category)}
                >
                  <MaterialIcons 
                    name={getCategoryIcon(index)} 
                    size={32} 
                    color={selectedCategory === category.id ? '#fff' : getCategoryColor(index)} 
                  />
                  <Text style={[
                    styles.categoryText,
                    selectedCategory === category.id && styles.categoryTextActive
                  ]}>
                    {category.name}
                  </Text>
                </TouchableOpacity>
              ))
            ) : (
              // رسالة تحميل أو عدم وجود فئات
              <View style={styles.noCategoriesContainer}>
                <MaterialIcons name="category" size={40} color="#ccc" />
                <Text style={styles.noCategoriesText}>
                  {loading ? 'جاري تحميل الفئات...' : 'لا توجد فئات متاحة'}
                </Text>
              </View>
            )}
          </ScrollView>
        </View>

        {/* Results Header */}
        {showingResults && (
          <View style={styles.resultsHeader}>
            <Text style={styles.resultsCount}>
              {searchQuery.trim() 
                ? `نتائج البحث عن "${searchQuery}": ${products.length} منتج`
                : selectedCategory !== 'all'
                  ? `منتجات الفئة: ${products.length} منتج`
                  : `عرض ${products.length} منتج`
              }
            </Text>
          </View>
        )}

        {/* Products Grid */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {showingResults 
                ? 'النتائج' 
                : 'المنتجات المتوفرة'
              }
            </Text>
            {!showingResults && (
              <TouchableOpacity onPress={() => router.push('/store-owner/search')}>
                <Text style={styles.seeAllText}>عرض المزيد</Text>
              </TouchableOpacity>
            )}
          </View>

          {searching ? (
            <View style={styles.searchingContainer}>
              <ActivityIndicator size="large" color="#FF6B35" />
              <Text style={styles.searchingText}>جاري البحث...</Text>
            </View>
          ) : products.length === 0 && showingResults ? (
            <View style={styles.noResultsContainer}>
              <MaterialIcons name="search-off" size={60} color="#ccc" />
              <Text style={styles.noResultsTitle}>لا توجد نتائج</Text>
              <Text style={styles.noResultsText}>
                {searchQuery.trim() 
                  ? `لم يتم العثور على منتجات تطابق "${searchQuery}"`
                  : 'لا توجد منتجات في هذه الفئة'
                }
              </Text>
            </View>
          ) : (
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
          )}
        </View>

        {/* Latest News - إخفاء الأخبار عند عرض النتائج */}
        {!showingResults && news.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>أحدث الأخبار</Text>
              <TouchableOpacity>
                <Text style={styles.seeAllText}>عرض الكل</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {news.map((newsItem) => (
                <TouchableOpacity
                  key={newsItem.id}
                  style={styles.newsCard}
                  onPress={() => handleNewsPress(newsItem)}
                >
                  {newsItem.image_url && (
                    <Image
                      source={{ uri: newsItem.image_url }}
                      style={styles.newsImage}
                      resizeMode="cover"
                    />
                  )}
                  <View style={styles.newsContent}>
                    <Text style={styles.newsTitle} numberOfLines={2}>
                      {newsItem.title}
                    </Text>
                    <Text style={styles.newsDate}>
                      {new Date(newsItem.created_at).toLocaleDateString('ar-IQ')}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// Helper functions for category icons and colors
const getCategoryIcon = (index: number) => {
  const icons = ['restaurant', 'local-grocery-store', 'checkroom', 'phone-android', 'home', 'sports-soccer'];
  return icons[index % icons.length];
};

const getCategoryColor = (index: number) => {
  const colors = ['#FF6B35', '#28A745', '#6F42C1', '#17A2B8', '#FFC107', '#DC3545'];
  return colors[index % colors.length];
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 16,
    color: '#666',
    marginLeft: 8,
  },
  storeNameText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  cartButton: {
    position: 'relative',
    padding: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  cartBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#FF6B35',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    paddingHorizontal: 16,
    height: 48,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
    textAlign: 'right',
  },
  searchButton: {
    padding: 8,
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearButton: {
    padding: 8,
  },
  categoryCardActive: {
    backgroundColor: '#FF6B35',
  },
  categoryTextActive: {
    color: '#fff',
  },
  resultsHeader: {
    paddingHorizontal: 20,
    paddingBottom: 10,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  resultsCount: {
    fontSize: 16,
    color: '#666',
  },
  searchingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  searchingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  noResultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 10,
  },
  noResultsText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 5,
    paddingHorizontal: 20,
  },
  noCategoriesContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  noCategoriesText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 10,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statCard: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  categoriesContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  categoryCard: {
    width: 120,
    height: 120,
    backgroundColor: '#fff',
    borderRadius: 16,
    marginRight: 15,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  categoryText: {
    fontSize: 12,
    color: '#333',
    marginTop: 8,
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  seeAllText: {
    fontSize: 14,
    color: '#FF6B35',
    fontWeight: '600',
  },
  newsCard: {
    width: 280,
    backgroundColor: '#fff',
    borderRadius: 16,
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
    marginBottom: 16, // Added margin for spacing between news cards
  },
  newsImage: {
    width: '100%',
    height: 140,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  newsContent: {
    padding: 16,
  },
  newsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  newsDate: {
    fontSize: 12,
    color: '#999',
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  productCard: {
    width: (width - 60) / 2,
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
    flexDirection: 'column', // Added for layout
    justifyContent: 'space-between', // Added for layout
  },
  productImageContainer: {
    height: 140,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
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
  productContent: {
    padding: 12,
  },
  productName: {
    fontSize: 14,
    fontWeight: 'bold',
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
    marginBottom: 4,
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
    fontSize: 14,
    color: '#999',
    textDecorationLine: 'line-through',
  },
  productQuantity: {
    fontSize: 12,
    color: '#666',
  },
  favoriteButtonContainer: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  favoriteButtonStyle: {
    // This style is for the button itself, not the container
  },
  storeInfoSection: {
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  storeInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  storeInfoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
  },
  storeInfoContent: {
    gap: 12,
  },
  storeName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  storeType: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  storeAddress: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  storeHours: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  workDays: {
    fontSize: 14,
    color: '#666',
  },
}); 