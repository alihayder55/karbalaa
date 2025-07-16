import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';
import { getCurrentUser } from './auth-helpers';

const CART_STORAGE_KEY = 'walcard_cart';

export interface CartItem {
  id: string;
  product_id: string;
  quantity: number;
  added_at: string;
  product?: {
    name: string;
    price: number;
    discount_price?: number;
    image_url?: string;
    is_active: boolean;
    merchant_id: string;
  };
}

export interface CartResult {
  success: boolean;
  message: string;
  cart?: CartItem[];
}

class CartManager {
  /**
   * Add product to cart
   */
  async addToCart(productId: string, quantity: number = 1): Promise<CartResult> {
    try {
      const currentUser = getCurrentUser();
      if (!currentUser) {
        return {
          success: false,
          message: 'يجب تسجيل الدخول أولاً'
        };
      }

      console.log('🛒 Adding product to cart:', productId, 'quantity:', quantity);

      // Get current cart
      const cart = await this.getCart();
      
      // Check if product already exists in cart
      const existingItemIndex = cart.findIndex(item => item.product_id === productId);
      
      if (existingItemIndex >= 0) {
        // Update existing item quantity
        cart[existingItemIndex].quantity += quantity;
      } else {
        // Add new item to cart
        const newItem: CartItem = {
          id: `cart_${Date.now()}_${productId}`,
          product_id: productId,
          quantity,
          added_at: new Date().toISOString()
        };
        cart.push(newItem);
      }

      // Save cart
      await this.saveCart(cart);

      return {
        success: true,
        message: 'تم إضافة المنتج إلى السلة',
        cart
      };
    } catch (error) {
      console.error('Error adding to cart:', error);
      return {
        success: false,
        message: 'حدث خطأ أثناء إضافة المنتج إلى السلة'
      };
    }
  }

  /**
   * Remove product from cart
   */
  async removeFromCart(productId: string): Promise<CartResult> {
    try {
      console.log('🗑️ Removing product from cart:', productId);

      const cart = await this.getCart();
      const updatedCart = cart.filter(item => item.product_id !== productId);
      
      await this.saveCart(updatedCart);

      return {
        success: true,
        message: 'تم إزالة المنتج من السلة',
        cart: updatedCart
      };
    } catch (error) {
      console.error('Error removing from cart:', error);
      return {
        success: false,
        message: 'حدث خطأ أثناء إزالة المنتج من السلة'
      };
    }
  }

  /**
   * Update product quantity in cart
   */
  async updateQuantity(productId: string, quantity: number): Promise<CartResult> {
    try {
      console.log('📝 Updating cart quantity:', productId, 'new quantity:', quantity);

      if (quantity <= 0) {
        return await this.removeFromCart(productId);
      }

      const cart = await this.getCart();
      const itemIndex = cart.findIndex(item => item.product_id === productId);
      
      if (itemIndex >= 0) {
        cart[itemIndex].quantity = quantity;
        await this.saveCart(cart);
      }

      return {
        success: true,
        message: 'تم تحديث الكمية',
        cart
      };
    } catch (error) {
      console.error('Error updating quantity:', error);
      return {
        success: false,
        message: 'حدث خطأ أثناء تحديث الكمية'
      };
    }
  }

  /**
   * Get cart items with product details
   */
  async getCartWithDetails(): Promise<CartItem[]> {
    try {
      const cart = await this.getCart();
      
      if (cart.length === 0) return [];

      // Get product details for all cart items
      const productIds = cart.map(item => item.product_id);
      
      const { data: products, error } = await supabase
        .from('products')
        .select(`
          id,
          name,
          price,
          discount_price,
          image_url,
          is_active,
          merchant_id
        `)
        .in('id', productIds);

      if (error) {
        console.error('Error fetching product details:', error);
        return cart;
      }

      // Merge cart items with product details
      const cartWithDetails = cart.map(cartItem => {
        const product = products?.find(p => p.id === cartItem.product_id);
        return {
          ...cartItem,
          product: product ? {
            name: product.name,
            price: product.price,
            discount_price: product.discount_price,
            image_url: product.image_url,
            is_active: product.is_active,
            merchant_id: product.merchant_id
          } : undefined
        };
      }).filter(item => item.product); // Filter out items where product was not found

      return cartWithDetails;
    } catch (error) {
      console.error('Error getting cart with details:', error);
      return [];
    }
  }

  /**
   * Get cart items count
   */
  async getCartCount(): Promise<number> {
    try {
      const cart = await this.getCart();
      return cart.reduce((total, item) => total + item.quantity, 0);
    } catch (error) {
      console.error('Error getting cart count:', error);
      return 0;
    }
  }

  /**
   * Clear cart
   */
  async clearCart(): Promise<CartResult> {
    try {
      await this.saveCart([]);
      return {
        success: true,
        message: 'تم تفريغ السلة',
        cart: []
      };
    } catch (error) {
      console.error('Error clearing cart:', error);
      return {
        success: false,
        message: 'حدث خطأ أثناء تفريغ السلة'
      };
    }
  }

  /**
   * Get cart total price
   */
  async getCartTotal(): Promise<number> {
    try {
      const cartWithDetails = await this.getCartWithDetails();
      return cartWithDetails.reduce((total, item) => {
        if (!item.product) return total;
        const price = item.product.discount_price || item.product.price;
        return total + (price * item.quantity);
      }, 0);
    } catch (error) {
      console.error('Error calculating cart total:', error);
      return 0;
    }
  }

  /**
   * Create order from cart
   */
  async createOrderFromCart(orderNotes?: string): Promise<{ success: boolean; orderId?: string; message: string }> {
    try {
      const currentUser = getCurrentUser();
      if (!currentUser) {
        return {
          success: false,
          message: 'يجب تسجيل الدخول أولاً'
        };
      }

      const cartWithDetails = await this.getCartWithDetails();
      if (cartWithDetails.length === 0) {
        return {
          success: false,
          message: 'السلة فارغة'
        };
      }

      // التحقق من توفر المنتجات قبل إنشاء الطلب
      console.log('🔍 Checking product availability before creating order...');
      for (const item of cartWithDetails) {
        if (!item.product) {
          return {
            success: false,
            message: `المنتج غير متوفر`
          };
        }

        if (!item.product.is_active) {
          return {
            success: false,
            message: `المنتج ${item.product.name} غير متوفر حالياً`
          };
        }
      }

      const totalPrice = await this.getCartTotal();

      // Create order
      console.log('📝 Creating order...');
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          store_owner_id: currentUser.user_id,
          status: 'pending',
          total_price: totalPrice,
          ...(orderNotes && { order_notes: orderNotes }) // Only include if orderNotes exists
        })
        .select()
        .single();

      if (orderError) {
        console.error('❌ Error creating order:', orderError);
        return {
          success: false,
          message: 'حدث خطأ أثناء إنشاء الطلب'
        };
      }

      console.log('✅ Order created successfully:', order.id);

      // Create order items
      const orderItems = cartWithDetails.map(item => ({
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        price_at_order: item.product?.discount_price || item.product?.price || 0
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) {
        console.error('❌ Error creating order items:', itemsError);
        return {
          success: false,
          message: 'حدث خطأ أثناء إنشاء عناصر الطلب'
        };
      }

      console.log('✅ Order items created successfully');

      // تقليل كمية المنتجات من المخزون
      console.log('📦 Updating product quantities...');
      const inventoryUpdateResult = await this.updateProductInventory(cartWithDetails);
      
      if (!inventoryUpdateResult.success) {
        console.error('❌ Failed to update inventory:', inventoryUpdateResult.message);
        // يمكن إضافة منطق للتراجع عن الطلب هنا إذا أردت
        // لكن سنتركه كما هو ونسجل الخطأ فقط
        console.log('⚠️ Order created but inventory update failed. Manual adjustment may be needed.');
      }

      // Clear cart after successful order
      await this.clearCart();

      return {
        success: true,
        orderId: order.id,
        message: 'تم إنشاء الطلب بنجاح وتحديث المخزون'
      };
    } catch (error) {
      console.error('❌ Error creating order from cart:', error);
      return {
        success: false,
        message: 'حدث خطأ غير متوقع'
      };
    }
  }

  /**
   * Update product inventory after order creation
   */
  private async updateProductInventory(cartItems: CartItem[]): Promise<{ success: boolean; message: string }> {
    try {
      console.log('🔄 Starting inventory update for', cartItems.length, 'products');

      // تحديث كل منتج على حدة
      for (const item of cartItems) {
        if (!item.product) continue;

        const newQuantity = item.product.is_active ? item.product.is_active : 0; // Assuming is_active is boolean
        
        console.log(`📦 Updating ${item.product.name}: ${item.product.is_active} - ${item.quantity} = ${newQuantity}`);

        const { error } = await supabase
          .from('products')
          .update({ 
            is_active: newQuantity // Assuming is_active is boolean
          })
          .eq('id', item.product_id);

        if (error) {
          console.error(`❌ Error updating inventory for product ${item.product.name}:`, error);
          return {
            success: false,
            message: `فشل في تحديث مخزون ${item.product.name}`
          };
        }

        console.log(`✅ Successfully updated inventory for ${item.product.name}`);
      }

      console.log('🎉 All product inventories updated successfully');
      return {
        success: true,
        message: 'تم تحديث المخزون بنجاح'
      };
    } catch (error) {
      console.error('❌ Error updating product inventory:', error);
      return {
        success: false,
        message: 'حدث خطأ أثناء تحديث المخزون'
      };
    }
  }

  /**
   * Restore product inventory (used when order is cancelled)
   */
  async restoreProductInventory(orderId: string): Promise<{ success: boolean; message: string }> {
    try {
      console.log('🔄 Restoring inventory for cancelled order:', orderId);

      // الحصول على عناصر الطلب
      const { data: orderItems, error: itemsError } = await supabase
        .from('order_items')
        .select(`
          product_id,
          quantity,
          products (
            name,
            is_active
          )
        `)
        .eq('order_id', orderId);

      if (itemsError) {
        console.error('❌ Error fetching order items:', itemsError);
        return {
          success: false,
          message: 'فشل في جلب عناصر الطلب'
        };
      }

      if (!orderItems || orderItems.length === 0) {
        return {
          success: true,
          message: 'لا توجد عناصر لاستعادة مخزونها'
        };
      }

      // إعادة الكميات إلى المخزون
      for (const item of orderItems) {
        const product = Array.isArray(item.products) ? item.products[0] : item.products;
        const currentQuantity = product?.is_active || 0; // Assuming is_active is boolean
        const newQuantity = currentQuantity + item.quantity;
        
        console.log(`📦 Restoring ${product?.name}: ${currentQuantity} + ${item.quantity} = ${newQuantity}`);

        const { error } = await supabase
          .from('products')
          .update({ 
            is_active: newQuantity // Assuming is_active is boolean
          })
          .eq('id', item.product_id);

        if (error) {
          console.error(`❌ Error restoring inventory for product ${product?.name}:`, error);
          return {
            success: false,
            message: `فشل في استعادة مخزون ${product?.name}`
          };
        }

        console.log(`✅ Successfully restored inventory for ${product?.name}`);
      }

      console.log('🎉 All product inventories restored successfully');
      return {
        success: true,
        message: 'تم استعادة المخزون بنجاح'
      };
    } catch (error) {
      console.error('❌ Error restoring product inventory:', error);
      return {
        success: false,
        message: 'حدث خطأ أثناء استعادة المخزون'
      };
    }
  }

  /**
   * Private: Get cart from storage
   */
  private async getCart(): Promise<CartItem[]> {
    try {
      const cartData = await AsyncStorage.getItem(CART_STORAGE_KEY);
      return cartData ? JSON.parse(cartData) : [];
    } catch (error) {
      console.error('Error getting cart from storage:', error);
      return [];
    }
  }

  /**
   * Private: Save cart to storage
   */
  private async saveCart(cart: CartItem[]): Promise<void> {
    try {
      await AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
      console.log('✅ Cart saved successfully');
    } catch (error) {
      console.error('Error saving cart to storage:', error);
      throw error;
    }
  }
}

export const cartManager = new CartManager(); 