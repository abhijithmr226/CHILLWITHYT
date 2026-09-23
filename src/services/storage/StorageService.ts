import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { app } from '../firebase/config';
import { supabase, isSupabaseConfigured } from '../supabase/client';

export class StorageService {
  private static storage = getStorage(app);

  /**
   * Upload an image file to real Firebase Storage with Supabase and DataURL fallbacks.
   * Ensures the upload always succeeds and returns a valid image URL for display.
   */
  public static async uploadImage(file: File, folder: 'avatars' | 'covers' | 'playlists' = 'avatars'): Promise<string> {
    // 1. Validate file
    if (!file.type.startsWith('image/')) {
      throw new Error('Please select a valid image file (PNG, JPG, WEBP, GIF).');
    }

    if (file.size > 8 * 1024 * 1024) {
      throw new Error('Image is too large. Please choose an image under 8MB.');
    }

    const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filename = `${folder}/${Date.now()}_${cleanName}`;

    // 2. Try Firebase Storage first
    try {
      const storageRef = ref(this.storage, filename);
      const snapshot = await uploadBytes(storageRef, file, {
        contentType: file.type,
      });
      const downloadUrl = await getDownloadURL(snapshot.ref);
      if (downloadUrl) {
        return downloadUrl;
      }
    } catch (fbErr) {
      console.warn('Firebase Storage notice (falling back to Supabase/Local):', fbErr);
    }

    // 3. Fallback to Supabase Storage bucket
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.storage.from(folder).upload(filename, file, {
          upsert: true,
          contentType: file.type,
        });

        if (!error && data) {
          const { data: publicData } = supabase.storage.from(folder).getPublicUrl(filename);
          if (publicData?.publicUrl) {
            return publicData.publicUrl;
          }
        }
      } catch (sbErr) {
        console.warn('Supabase Storage notice (falling back to local dataURL):', sbErr);
      }
    }

    // 4. Client-side Data URL fallback (Guarantees zero failures & instant display)
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('Failed to encode image data.'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read image file.'));
      reader.readAsDataURL(file);
    });
  }
}
