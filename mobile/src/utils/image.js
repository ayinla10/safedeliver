import * as ImageManipulator from 'expo-image-manipulator';

/**
 * Optimizes an image for high-speed upload and mobile viewing.
 * Resizes to a max dimension of 1200px and applies 70% JPEG compression.
 * @param {string} uri - The local URI of the image to optimize.
 * @returns {Promise<string>} - The optimized local URI.
 */
export const optimizeImage = async (uri) => {
  try {
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 1200 } }], // Resize down to 1200px width (aspect ratio preserved)
      { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
    );
    return result.uri;
  } catch (error) {
    console.error('Image optimization failed:', error);
    return uri; // Fallback to original if optimization fails
  }
};
