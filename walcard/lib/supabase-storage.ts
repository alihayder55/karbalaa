import { supabase } from './supabase';
import * as FileSystem from 'expo-file-system';

// Upload image to Supabase Storage
export async function uploadImageToStorage(
  imageUri: string, 
  bucketName: string, 
  folderPath: string,
  fileName?: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    console.log('Starting image upload to Supabase Storage...');
    console.log('Image URI:', imageUri);
    console.log('Bucket:', bucketName);
    console.log('Folder:', folderPath);

    // Generate unique filename if not provided
    const uniqueFileName = fileName || `image_${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
    const filePath = `${folderPath}/${uniqueFileName}`;

    console.log('File path:', filePath);

    // Convert image to base64
    const base64Image = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    console.log('Image converted to base64, size:', base64Image.length);

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, decode(base64Image), {
        contentType: 'image/jpeg',
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Supabase storage upload error:', error);
      return { success: false, error: error.message };
    }

    console.log('Upload successful, data:', data);

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);

    const publicUrl = urlData.publicUrl;
    console.log('Public URL:', publicUrl);

    return { success: true, url: publicUrl };
  } catch (error: any) {
    console.error('Error uploading image to storage:', error);
    return { success: false, error: error.message };
  }
}

// Helper function to decode base64
function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Upload store image specifically for store owners
export async function uploadStoreImage(
  imageUri: string, 
  userId: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  const bucketName = 'forstore';
  const folderPath = `store-images/${userId}`;
  const fileName = `store_${Date.now()}.jpg`;

  return await uploadImageToStorage(imageUri, bucketName, folderPath, fileName);
}

// Upload identity image for verification
export async function uploadIdentityImage(
  imageUri: string, 
  userId: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  const bucketName = 'forstore';
  const folderPath = `identity-images/${userId}`;
  const fileName = `identity_${Date.now()}.jpg`;

  return await uploadImageToStorage(imageUri, bucketName, folderPath, fileName);
}

// Upload merchant business image
export async function uploadBusinessImage(
  imageUri: string, 
  userId: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  const bucketName = 'forstore';
  const folderPath = `business-images/${userId}`;
  const fileName = `business_${Date.now()}.jpg`;

  return await uploadImageToStorage(imageUri, bucketName, folderPath, fileName);
}

// Upload merchant store image
export async function uploadMerchantStoreImage(
  imageUri: string, 
  userId: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  const bucketName = 'forstore';
  const folderPath = `merchant-store-images/${userId}`;
  const fileName = `merchant_store_${Date.now()}.jpg`;

  return await uploadImageToStorage(imageUri, bucketName, folderPath, fileName);
}

// Delete image from storage
export async function deleteImageFromStorage(
  bucketName: string, 
  filePath: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.storage
      .from(bucketName)
      .remove([filePath]);

    if (error) {
      console.error('Error deleting image from storage:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error deleting image:', error);
    return { success: false, error: error.message };
  }
}

// Get image URL from storage
export function getImageUrl(bucketName: string, filePath: string): string {
  const { data } = supabase.storage
    .from(bucketName)
    .getPublicUrl(filePath);
  
  return data.publicUrl;
} 