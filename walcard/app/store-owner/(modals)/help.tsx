import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

const faqData: FAQItem[] = [
  {
    id: '1',
    question: 'كيف يمكنني إضافة منتجات جديدة؟',
    answer: 'يمكنك إضافة منتجات جديدة من خلال الذهاب إلى صفحة المنتجات والضغط على زر "إضافة منتج جديد". ثم قم بملء جميع المعلومات المطلوبة وحفظ المنتج.',
    category: 'المنتجات'
  },
  {
    id: '2',
    question: 'كيف يمكنني إدارة الطلبات؟',
    answer: 'يمكنك إدارة الطلبات من خلال صفحة الطلبات حيث ستجد جميع الطلبات مع حالاتها المختلفة. يمكنك عرض تفاصيل كل طلب والرد على العملاء.',
    category: 'الطلبات'
  },
  {
    id: '3',
    question: 'كيف يمكنني تحديث معلومات المحل؟',
    answer: 'يمكنك تحديث معلومات المحل من خلال الذهاب إلى الإعدادات ثم "تعديل الملف الشخصي" حيث يمكنك تحديث جميع المعلومات المطلوبة.',
    category: 'الحساب'
  },
  {
    id: '4',
    question: 'كيف يمكنني التواصل مع الدعم الفني؟',
    answer: 'يمكنك التواصل مع الدعم الفني من خلال صفحة "تواصل معنا" أو عبر البريد الإلكتروني الموجود في صفحة الإعدادات.',
    category: 'الدعم'
  },
  {
    id: '5',
    question: 'كيف يمكنني إدارة المخزون؟',
    answer: 'يمكنك إدارة المخزون من خلال صفحة المنتجات حيث يمكنك تحديث الكميات المتوفرة وإضافة منتجات جديدة أو حذف المنتجات غير المتوفرة.',
    category: 'المنتجات'
  },
  {
    id: '6',
    question: 'كيف يمكنني عرض إحصائيات المبيعات؟',
    answer: 'يمكنك عرض إحصائيات المبيعات من خلال صفحة الإحصائيات حيث ستجد تقارير مفصلة عن المبيعات والأرباح.',
    category: 'التقارير'
  }
];

const categories = ['الكل', 'المنتجات', 'الطلبات', 'الحساب', 'الدعم', 'التقارير'];

export default function StoreOwnerHelp() {
  const [selectedCategory, setSelectedCategory] = useState('الكل');
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);

  const filteredFAQs = selectedCategory === 'الكل' 
    ? faqData 
    : faqData.filter(faq => faq.category === selectedCategory);

  const toggleFAQ = (id: string) => {
    setExpandedFAQ(expandedFAQ === id ? null : id);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.push('/store-owner')}>
          <Text style={styles.backButtonText}>العودة</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>مركز المساعدة</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Welcome Section */}
        <View style={styles.welcomeCard}>
          <View style={styles.welcomeIcon}>
            <MaterialIcons name="help" size={40} color="#40E0D0" />
          </View>
          <Text style={styles.welcomeTitle}>كيف يمكننا مساعدتك؟</Text>
          <Text style={styles.welcomeText}>
            ابحث عن إجابة لسؤالك أو تصفح الأسئلة الشائعة أدناه
          </Text>
        </View>

        {/* Search Section */}
        <View style={styles.searchCard}>
          <View style={styles.searchHeader}>
            <MaterialIcons name="search" size={20} color="#40E0D0" />
            <Text style={styles.searchTitle}>البحث السريع</Text>
          </View>
          <Text style={styles.searchText}>
            اكتب كلمة مفتاحية للعثور على الإجابة المناسبة
          </Text>
          <TouchableOpacity style={styles.searchButton}>
            <MaterialIcons name="search" size={20} color="#fff" />
            <Text style={styles.searchButtonText}>البحث في المساعدة</Text>
          </TouchableOpacity>
        </View>

        {/* Categories */}
        <View style={styles.categoriesCard}>
          <View style={styles.categoriesHeader}>
            <MaterialIcons name="category" size={20} color="#40E0D0" />
            <Text style={styles.categoriesTitle}>تصفح حسب الفئة</Text>
          </View>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.categoriesScroll}
            contentContainerStyle={styles.categoriesContainer}
          >
            {categories.map((category) => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryChip,
                  selectedCategory === category && styles.categoryChipActive
                ]}
                onPress={() => setSelectedCategory(category)}
              >
                <Text style={[
                  styles.categoryChipText,
                  selectedCategory === category && styles.categoryChipTextActive
                ]}>
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* FAQ Section */}
        <View style={styles.faqCard}>
          <View style={styles.faqHeader}>
            <MaterialIcons name="question-answer" size={20} color="#40E0D0" />
            <Text style={styles.faqTitle}>الأسئلة الشائعة</Text>
          </View>
          
          {filteredFAQs.map((faq) => (
            <View key={faq.id} style={styles.faqItem}>
              <TouchableOpacity
                style={styles.faqQuestion}
                onPress={() => toggleFAQ(faq.id)}
              >
                <View style={styles.faqQuestionContent}>
                  <MaterialIcons name="help-outline" size={20} color="#666" />
                  <Text style={styles.faqQuestionText}>{faq.question}</Text>
                </View>
                <MaterialIcons 
                  name={expandedFAQ === faq.id ? "expand-less" : "expand-more"} 
                  size={24} 
                  color="#666" 
                />
              </TouchableOpacity>
              
              {expandedFAQ === faq.id && (
                <View style={styles.faqAnswer}>
                  <Text style={styles.faqAnswerText}>{faq.answer}</Text>
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Contact Section */}
        <View style={styles.contactCard}>
          <View style={styles.contactHeader}>
            <MaterialIcons name="contact-support" size={20} color="#40E0D0" />
            <Text style={styles.contactTitle}>لا تجد إجابة؟</Text>
          </View>
          
          <Text style={styles.contactText}>
            إذا لم تجد إجابة لسؤالك، يمكنك التواصل مع فريق الدعم الفني
          </Text>
          
          <View style={styles.contactButtons}>
            <TouchableOpacity style={styles.contactButton}>
              <MaterialIcons name="email" size={20} color="#40E0D0" />
              <Text style={styles.contactButtonText}>البريد الإلكتروني</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.contactButton}>
              <MaterialIcons name="phone" size={20} color="#40E0D0" />
              <Text style={styles.contactButtonText}>الهاتف</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsCard}>
          <View style={styles.quickActionsHeader}>
            <MaterialIcons name="flash-on" size={20} color="#40E0D0" />
            <Text style={styles.quickActionsTitle}>إجراءات سريعة</Text>
          </View>
          
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity style={styles.quickActionItem} onPress={() => router.push('/store-owner/orders')}>
              <MaterialIcons name="list" size={24} color="#40E0D0" />
              <Text style={styles.quickActionText}>عرض الطلبات</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.quickActionItem} onPress={() => router.push('/store-owner/(modals)/settings')}>
              <MaterialIcons name="settings" size={24} color="#40E0D0" />
              <Text style={styles.quickActionText}>الإعدادات</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.quickActionItem} onPress={() => router.push('/store-owner/(modals)/edit-profile')}>
              <MaterialIcons name="person" size={24} color="#40E0D0" />
              <Text style={styles.quickActionText}>تعديل الملف الشخصي</Text>
            </TouchableOpacity>
            
            {/* زر إضافة منتج وزر التقارير معطلين حالياً */}
            {/*
            <TouchableOpacity style={[styles.quickActionItem, { opacity: 0.5 }]} disabled>
              <MaterialIcons name="add" size={24} color="#40E0D0" />
              <Text style={styles.quickActionText}>إضافة منتج</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.quickActionItem, { opacity: 0.5 }]} disabled>
              <MaterialIcons name="assessment" size={24} color="#40E0D0" />
              <Text style={styles.quickActionText}>التقارير</Text>
            </TouchableOpacity>
            */}
          </View>
        </View>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#40E0D0',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  scrollView: {
    flex: 1,
  },
  welcomeCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  welcomeIcon: {
    marginBottom: 16,
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  welcomeText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  searchCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  searchTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  searchText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  searchButton: {
    backgroundColor: '#40E0D0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  categoriesCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoriesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  categoriesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  categoriesScroll: {
    flexGrow: 0,
  },
  categoriesContainer: {
    paddingRight: 0,
  },
  categoryChip: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  categoryChipActive: {
    backgroundColor: '#40E0D0',
    borderColor: '#40E0D0',
  },
  categoryChipText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  categoryChipTextActive: {
    color: '#fff',
  },
  faqCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  faqTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  faqItem: {
    marginBottom: 12,
  },
  faqQuestion: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  faqQuestionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  faqQuestionText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 12,
    flex: 1,
  },
  faqAnswer: {
    paddingHorizontal: 32,
    paddingBottom: 12,
  },
  faqAnswerText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  contactCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  contactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  contactText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  contactButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  contactButtonText: {
    fontSize: 14,
    color: '#40E0D0',
    fontWeight: '600',
    marginLeft: 8,
  },
  quickActionsCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickActionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  quickActionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionItem: {
    width: '48%',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  quickActionText: {
    fontSize: 12,
    color: '#333',
    marginTop: 8,
    fontWeight: '500',
  },
}); 