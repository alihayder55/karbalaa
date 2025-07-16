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
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import FavoriteButton from '../../components/FavoriteButton';
import { getCurrentUser } from '../../lib/auth-helpers';
import { cartManager } from '../../lib/cart-manager';
import { getArabicTextStyles } from '../../lib/rtl-config';

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
      const { data: productsData, error: productsError } = await supabase
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

      if (productsError) {
        console.error('Error loading products:', productsError);
        return;
      }

      setProducts(productsData || []);
      setAllProducts(productsData || []); // حفظ نسخة من جميع المنتجات
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
        console.error('❌ Search error:', error);
        setProducts([]);
      } else {
        console.log('✅ Search results:', data?.length || 0);
        setProducts(data || []);
        setShowingResults(true);
      }
    } catch (error) {
      console.error('❌ Search exception:', error);
      setProducts([]);
    } finally {
      setSearching(false);
    }
  };

  const filterByCategory = async (categoryId: string) => {
    try {
      setSelectedCategory(categoryId);
      console.log('🔍 Filtering by category:', categoryId);
      
      if (categoryId === 'all') {
        setProducts(allProducts);
        setShowingResults(false);
        return;
      }

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
        .eq('category_id', categoryId)
        .eq('is_active', true)
        .order('name')
        .limit(100);

      if (error) {
        console.error('❌ Category filter error:', error);
        setProducts([]);
      } else {
        console.log('✅ Category filter results:', data?.length || 0);
        setProducts(data || []);
        setShowingResults(true);
      }
    } catch (error) {
      console.error('❌ Category filter exception:', error);
      setProducts([]);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleSearch = () => {
    performSearch(searchQuery);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setShowingResults(false);
    filterByCategory(selectedCategory);
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
    router.push({
      pathname: '/store-owner/search',
      params: { categoryId: category.id }
    });
  };

  const handleViewAllCategories = () => {
    router.push('/store-owner/search');
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
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#40E0D0" />
          <Text style={styles.loadingText}>جاري التحميل...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.logoContainer}>
            <View style={styles.logoIcon}>
              <MaterialIcons name="store" size={28} color="#fff" />
            </View>
            <View style={styles.logoTextContainer}>
              <Text style={styles.logoText}>ولكارد</Text>
              <Text style={styles.logoSubtext}>منصة التجارة بالجملة</Text>
            </View>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.iconButton} onPress={handleCartPress}>
              <MaterialIcons name="shopping-cart" size={24} color="#40E0D0" />
              {cartCount > 0 && (
                <View style={styles.cartBadge}>
                  <Text style={styles.cartBadgeText}>{cartCount}</Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton}>
              <MaterialIcons name="notifications-none" size={24} color="#40E0D0" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Welcome Section - Minimized */}
        <View style={styles.welcomeSection}>
          <View style={styles.welcomeContent}>
            <Text style={styles.welcomeTitle}>مرحباً بك في ولكارد</Text>
            <Text style={styles.welcomeSubtitle}>
              {storeOwner ? `مرحباً بك في ${storeOwner.store_name}` : 'اكتشف أفضل المنتجات بالجملة'}
            </Text>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchSection}>
          <View style={styles.searchContainer}>
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
              <TouchableOpacity onPress={handleClearSearch}>
                <MaterialIcons name="clear" size={20} color="#666" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Categories */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <MaterialIcons name="category" size={24} color="#40E0D0" />
              <Text style={styles.sectionTitle}>الفئات ({categories.length})</Text>
            </View>
            <TouchableOpacity style={styles.viewAllButton} onPress={handleViewAllCategories}>
              <Text style={styles.viewAllText}>عرض الكل</Text>
              <MaterialIcons name="arrow-forward-ios" size={16} color="#40E0D0" />
            </TouchableOpacity>
          </View>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.categoriesScroll}
            contentContainerStyle={styles.categoriesContainer}
          >
            <TouchableOpacity
              style={[
                styles.categoryChip,
                selectedCategory === 'all' && styles.categoryChipActive
              ]}
              onPress={() => filterByCategory('all')}
            >
              <Text style={[
                styles.categoryChipText,
                selectedCategory === 'all' && styles.categoryChipTextActive
              ]}>
                الكل
              </Text>
            </TouchableOpacity>
            {categories.length === 0 ? (
              <View style={styles.emptyCategoriesContainer}>
                <Text style={styles.emptyCategoriesText}>لا توجد فئات متاحة</Text>
                <Text style={styles.emptyCategoriesSubtext}>عدد الفئات المحملة: {categories.length}</Text>
              </View>
            ) : (
              categories.map((category, index) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryChip,
                    selectedCategory === category.id && styles.categoryChipActive
                  ]}
                  onPress={() => filterByCategory(category.id)}
                >
                  <Text style={[
                    styles.categoryChipText,
                    selectedCategory === category.id && styles.categoryChipTextActive
                  ]}>
                    {category.name}
                  </Text>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>

        {/* Products */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <MaterialIcons name="inventory" size={24} color="#40E0D0" />
              <Text style={styles.sectionTitle}>
                {showingResults ? 'نتائج البحث' : 'المنتجات'}
              </Text>
            </View>
            <Text style={styles.productsCount}>{products.length} منتج</Text>
          </View>
          
          {searching ? (
            <View style={styles.searchingContainer}>
              <ActivityIndicator size="large" color="#40E0D0" />
              <Text style={styles.searchingText}>جاري البحث...</Text>
            </View>
          ) : products.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialIcons name="inventory" size={80} color="#ccc" />
              <Text style={styles.emptyTitle}>لا توجد منتجات</Text>
              <Text style={styles.emptyText}>
                {showingResults ? 'لم يتم العثور على منتجات تطابق البحث' : 'لم يتم العثور على منتجات بعد'}
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
                        <MaterialIcons name="inventory" size={32} color="#666" />
                      </View>
                    )}
                    <View style={styles.productActions}>
                      <FavoriteButton 
                        productId={product.id}
                        size={18}
                        showToast={true}
                        key={`favorite-${product.id}`}
                        onToggle={(isFavorite) => {
                          console.log(`Favorite toggled for product ${product.id}: ${isFavorite}`);
                        }}
                      />
                      {product.discount_price && (
                        <View style={styles.discountBadge}>
                          <Text style={styles.discountText}>
                            {getDiscountPercentage(product.price, product.discount_price)}%
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                  
                  <View style={styles.productContent}>
                    <Text style={styles.productName} numberOfLines={2}>
                      {product.name}
                    </Text>
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
              ))}
            </View>
          )}
        </View>

        {/* News Section */}
        {news.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <MaterialIcons name="article" size={24} color="#40E0D0" />
                <Text style={styles.sectionTitle}>الأخبار والعروض</Text>
              </View>
            </View>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.newsScroll}
              contentContainerStyle={styles.newsContainer}
            >
              {news.map((newsItem) => (
                <TouchableOpacity
                  key={newsItem.id}
                  style={styles.newsCard}
                  onPress={() => handleNewsPress(newsItem)}
                >
                  <View style={styles.newsImageContainer}>
                    {newsItem.image_url ? (
                      <Image
                        source={{ uri: newsItem.image_url }}
                        style={styles.newsImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={styles.newsImagePlaceholder}>
                        <MaterialIcons name="article" size={32} color="#666" />
                      </View>
                    )}
                  </View>
                  <View style={styles.newsContent}>
                    <Text style={styles.newsTitle} numberOfLines={2}>
                      {newsItem.title}
                    </Text>
                    <Text style={styles.newsExcerpt} numberOfLines={3}>
                      {newsItem.content}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Bottom Spacing */}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 6,
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 4, // was 12, further reduced
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#40E0D0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoTextContainer: {
    flexDirection: 'column',
  },
  logoText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  logoSubtext: {
    fontSize: 12,
    color: '#666',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    position: 'relative',
  },
  cartBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#ff4757',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  welcomeSection: {
    paddingHorizontal: 20,
    paddingVertical: 2, // was 4, minimized
    backgroundColor: 'linear-gradient(135deg, #40E0D0 0%, #1ABC9C 100%)',
  },
  welcomeContent: {
    alignItems: 'center',
  },
  welcomeTitle: {
    fontSize: 18, // was 28, reduced
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 2, // was 8, reduced
  },
  welcomeSubtitle: {
    fontSize: 12, // was 16, reduced
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 0, // was 24, removed
  },
  welcomeStats: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    padding: 16,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  searchSection: {
    paddingHorizontal: 20,
    paddingVertical: 2, // was 4, further reduced
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewAllText: {
    fontSize: 14,
    color: '#40E0D0',
    fontWeight: '600',
  },
  productsCount: {
    fontSize: 14,
    color: '#666',
  },
  categoriesScroll: {
    marginHorizontal: -20,
  },
  categoriesContainer: {
    paddingHorizontal: 20,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  categoryChipActive: {
    backgroundColor: '#40E0D0',
    borderColor: '#40E0D0',
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  categoryChipTextActive: {
    color: '#fff',
  },
  searchingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  searchingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
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
  productActions: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    gap: 8,
  },
  discountBadge: {
    backgroundColor: '#ff4757',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  discountText: {
    fontSize: 10,
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
    marginBottom: 8,
    lineHeight: 18,
  },
  productPriceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#40E0D0',
  },
  discountPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#40E0D0',
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
  newsScroll: {
    marginHorizontal: -20,
  },
  newsContainer: {
    paddingHorizontal: 20,
  },
  newsCard: {
    width: 280,
    marginRight: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  newsImageContainer: {
    height: 120,
  },
  newsImage: {
    width: '100%',
    height: '100%',
  },
  newsImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
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
  newsExcerpt: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  bottomSpacing: {
    height: 120,
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
  availabilityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 4,
  },
  availabilityText: {
    fontSize: 12,
    fontWeight: '600',
  },
}); 