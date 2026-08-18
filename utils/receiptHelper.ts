import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Alert, Platform } from 'react-native';

const RECEIPTS_DIR = `${FileSystem.documentDirectory}receipts/`;

// Ensure receipts directory exists
export const ensureReceiptDirectoryExists = async (): Promise<void> => {
  try {
    const dirInfo = await FileSystem.getInfoAsync(RECEIPTS_DIR);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(RECEIPTS_DIR, { intermediates: true });
    }
  } catch (err) {
    console.warn('Failed to create receipts directory:', err);
  }
};

/**
 * Pick image from photo gallery
 */
export const pickReceiptFromGallery = async (): Promise<string | null> => {
  try {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        'Permission Required',
        'Please allow access to your photo library to attach receipt photos.'
      );
      return null;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.85,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return null;
    }

    const sourceUri = result.assets[0].uri;
    return await saveReceiptImagePermanently(sourceUri);
  } catch (error) {
    console.error('Failed to pick receipt from gallery:', error);
    Alert.alert('Error', 'Unable to pick image from gallery.');
    return null;
  }
};

/**
 * Take photo using camera
 */
export const takeReceiptPhoto = async (): Promise<string | null> => {
  try {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        'Permission Required',
        'Please allow camera access to take receipt photos.'
      );
      return null;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.85,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return null;
    }

    const sourceUri = result.assets[0].uri;
    return await saveReceiptImagePermanently(sourceUri);
  } catch (error) {
    console.error('Failed to take photo with camera:', error);
    Alert.alert('Error', 'Unable to capture photo with camera.');
    return null;
  }
};

/**
 * Save image to app's permanent document directory so it survives cache clears
 */
export const saveReceiptImagePermanently = async (sourceUri: string): Promise<string> => {
  try {
    await ensureReceiptDirectoryExists();
    const extension = sourceUri.split('.').pop() || 'jpg';
    const fileName = `receipt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${extension}`;
    const destinationUri = `${RECEIPTS_DIR}${fileName}`;

    await FileSystem.copyAsync({
      from: sourceUri,
      to: destinationUri,
    });

    return destinationUri;
  } catch (err) {
    console.warn('Failed to copy receipt permanently, using sourceUri fallback:', err);
    return sourceUri;
  }
};

/**
 * Share receipt image
 */
export const shareReceiptImage = async (imageUri: string, title?: string): Promise<boolean> => {
  try {
    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) {
      Alert.alert('Sharing Unavailable', 'Sharing is not supported on this device.');
      return false;
    }

    await Sharing.shareAsync(imageUri, {
      mimeType: 'image/jpeg',
      dialogTitle: title ? `Share Receipt: ${title}` : 'Share Receipt Image',
    });
    return true;
  } catch (err) {
    console.error('Failed to share receipt image:', err);
    return false;
  }
};
