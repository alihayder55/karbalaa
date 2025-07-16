import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Dimensions,
  SafeAreaView,
  StatusBar,
  Image
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const categories = [
  { id: 1, name: 'الإلكترونيات', icon: 'devices', color: '#40E0D0', gradient: ['#40E0D0', '#1ABC9C'] },
  { id: 2, name: 'الملابس', icon: 'checkroom', color: '#48C9B0', gradient: ['#48C9B0', '#16A085'] },
  { id: 3, name: 'الأحذية', icon: 'sports-soccer', color: '#1ABC9C', gradient: ['#1ABC9C', '#138D75'] },
  { id: 4, name: 'الأثاث', icon: 'chair', color: '#16A085', gradient: ['#16A085', '#117A65'] },
  { id: 5, name: 'الأدوات', icon: 'build', color: '#138D75', gradient: ['#138D75', '#0E6655'] },
  { id: 6, name: 'الطعام', icon: 'restaurant', color: '#117A65', gradient: ['#117A65', '#0B5345'] },
];

const featuredProducts = [
  { 
    id: 1, 
    name: 'هاتف ذكي', 
    price: '150,000 د.ع', 
    originalPrice: '180,000 د.ع',
    discount: '17%',
    image: 'phone',
    rating: 4.8,
    reviews: 124
  },
  { 
    id: 2, 
    name: 'لابتوب', 
    price: '800,000 د.ع', 
    originalPrice: '950,000 د.ع',
    discount: '16%',
    image: 'laptop',
    rating: 4.9,
    reviews: 89
  },
  { 
    id: 3, 
    name: 'سماعات', 
    price: '50,000 د.ع', 
    originalPrice: '75,000 د.ع',
    discount: '33%',
    image: 'headphones',
    rating: 4.7,
    reviews: 156
  },
];

const quickActions = [
  { id: 1, title: 'العروض الخاصة', subtitle: 'خصومات تصل لـ 50%', icon: 'local-offer', color: '#40E0D0' },
  { id: 2, title: 'الأكثر مبيعاً', subtitle: 'المنتجات الأكثر طلباً', icon: 'trending-up', color: '#1ABC9C' },
  { id: 3, title: 'وصل حديثاً', subtitle: 'أحدث المنتجات', icon: 'new-releases', color: '#16A085' },
];

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
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
            <TouchableOpacity style={styles.iconButton}>
              <MaterialIcons name="notifications-none" size={24} color="#40E0D0" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton}>
              <MaterialIcons name="search" size={24} color="#40E0D0" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <View style={styles.welcomeContent}>
            <Text style={styles.welcomeTitle}>مرحباً بك في ولكارد</Text>
            <Text style={styles.welcomeSubtitle}>اكتشف أفضل المنتجات بالجملة بأسعار منافسة</Text>
            <View style={styles.welcomeStats}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>500+</Text>
                <Text style={styles.statLabel}>منتج</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>50+</Text>
                <Text style={styles.statLabel}>فئة</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>1000+</Text>
                <Text style={styles.statLabel}>عميل</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Categories Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <MaterialIcons name="category" size={24} color="#40E0D0" />
              <Text style={styles.sectionTitle}>الفئات</Text>
            </View>
            <TouchableOpacity style={styles.viewAllButton}>
              <Text style={styles.viewAllText}>عرض الكل</Text>
              <MaterialIcons name="arrow-forward-ios" size={16} color="#40E0D0" />
            </TouchableOpacity>
          </View>
          <View style={styles.categoriesGrid}>
            {categories.map((category) => (
              <TouchableOpacity key={category.id} style={styles.categoryCard}>
                <View style={[styles.categoryIcon, { backgroundColor: category.color }]}>
                  <MaterialIcons name={category.icon as any} size={28} color="#fff" />
                </View>
                <Text style={styles.categoryName}>{category.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Featured Products */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <MaterialIcons name="star" size={24} color="#40E0D0" />
              <Text style={styles.sectionTitle}>منتجات مميزة</Text>
            </View>
            <TouchableOpacity style={styles.viewAllButton}>
              <Text style={styles.viewAllText}>عرض الكل</Text>
              <MaterialIcons name="arrow-forward-ios" size={16} color="#40E0D0" />
            </TouchableOpacity>
          </View>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.productsScroll}
            contentContainerStyle={styles.productsContainer}
          >
            {featuredProducts.map((product) => (
              <TouchableOpacity key={product.id} style={styles.productCard}>
                <View style={styles.productImageContainer}>
                  <View style={styles.productImage}>
                    <MaterialIcons name={product.image as any} size={40} color="#40E0D0" />
                  </View>
                  {product.discount && (
                    <View style={styles.discountBadge}>
                      <Text style={styles.discountText}>{product.discount}</Text>
                    </View>
                  )}
                </View>
                <View style={styles.productInfo}>
                  <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
                  <View style={styles.productRating}>
                    <MaterialIcons name="star" size={16} color="#FFD700" />
                    <Text style={styles.ratingText}>{product.rating}</Text>
                    <Text style={styles.reviewsText}>({product.reviews})</Text>
                  </View>
                  <View style={styles.priceContainer}>
                    <Text style={styles.productPrice}>{product.price}</Text>
                    {product.originalPrice && (
                      <Text style={styles.originalPrice}>{product.originalPrice}</Text>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <MaterialIcons name="flash-on" size={24} color="#40E0D0" />
              <Text style={styles.sectionTitle}>إجراءات سريعة</Text>
            </View>
          </View>
          <View style={styles.quickActions}>
            {quickActions.map((action) => (
              <TouchableOpacity key={action.id} style={styles.actionCard}>
                <View style={[styles.actionIcon, { backgroundColor: action.color }]}>
                  <MaterialIcons name={action.icon as any} size={24} color="#fff" />
                </View>
                <Text style={styles.actionTitle}>{action.title}</Text>
                <Text style={styles.actionSubtitle}>{action.subtitle}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

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
  },
  scrollView: {
    flex: 1,
  },
  welcomeSection: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    backgroundColor: 'linear-gradient(135deg, #40E0D0 0%, #1ABC9C 100%)',
  },
  welcomeContent: {
    alignItems: 'center',
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 24,
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
  categoryIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  productsScroll: {
    marginHorizontal: -20,
  },
  productsContainer: {
    paddingHorizontal: 20,
  },
  productCard: {
    width: 180,
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
  productImageContainer: {
    position: 'relative',
    padding: 16,
    alignItems: 'center',
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
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
  productInfo: {
    padding: 16,
    paddingTop: 0,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    lineHeight: 18,
  },
  productRating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  reviewsText: {
    fontSize: 12,
    color: '#666',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  productPrice: {
    fontSize: 16,
    color: '#40E0D0',
    fontWeight: 'bold',
  },
  originalPrice: {
    fontSize: 12,
    color: '#999',
    textDecorationLine: 'line-through',
  },
  quickActions: {
    flexDirection: 'row',
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
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  bottomSpacing: {
    height: 20,
  },
});
