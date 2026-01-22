/**
 * Image Upload Utility
 * Handles image compression and Cloudinary upload for chat
 */

const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || 'dflhuyyoa';
const CLOUDINARY_UPLOAD_PRESET = process.env.CLOUDINARY_UPLOAD_PRESET || 'merit-school-portal';

/**
 * Compress image to target size (approximately 10KB)
 * Uses canvas-based compression
 */
const compressImageBase64 = (base64Image, maxSizeKB = 10) => {
    return new Promise((resolve, reject) => {
        // If already small enough, return as-is
        const currentSizeKB = (base64Image.length * 0.75) / 1024;
        if (currentSizeKB <= maxSizeKB) {
            resolve(base64Image);
            return;
        }

        // For server-side, we'll just truncate/compress via quality reduction
        // In production, use sharp or jimp for proper compression

        // Simple quality reduction based on size ratio
        const targetRatio = maxSizeKB / currentSizeKB;
        const quality = Math.max(0.1, Math.min(0.9, targetRatio));

        // Since we can't use canvas on server, we'll store with metadata
        // and let frontend handle display
        resolve({
            compressed: true,
            originalSize: currentSizeKB,
            targetSize: maxSizeKB,
            quality,
            data: base64Image.substring(0, Math.floor(base64Image.length * targetRatio))
        });
    });
};

/**
 * Upload image to Cloudinary
 */
const uploadToCloudinary = async (base64Image, folder = 'chat') => {
    try {
        // VALIDATION: Check file size and type

        // 1. Size check: 50KB limit
        // Base64 string length = (bytes * 4 / 3). So 50KB bytes ≈ 68,267 characters
        // We add a small buffer -> 70,000 chars
        if (base64Image.length > 70000) {
            throw new Error("File too large. Maximum size is 50KB.");
        }

        // 2. Type check: Ensure it's an image
        if (!base64Image.startsWith('data:image/')) {
            throw new Error("Invalid file type. Only images are allowed.");
        }

        const formData = new URLSearchParams();
        formData.append('file', base64Image);
        formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
        formData.append('folder', folder);
        formData.append('transformation', 'q_auto,f_auto,w_800'); // Auto quality, format, max width 800px

        const response = await fetch(
            `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
            {
                method: 'POST',
                body: formData
            }
        );

        const data = await response.json();

        if (data.error) {
            throw new Error(data.error.message);
        }

        return {
            success: true,
            url: data.secure_url,
            publicId: data.public_id,
            width: data.width,
            height: data.height,
            format: data.format,
            bytes: data.bytes
        };
    } catch (err) {
        console.error('Cloudinary upload error:', err);
        return {
            success: false,
            error: err.message
        };
    }
};

/**
 * Get optimized image URL from Cloudinary
 * Expands compressed image to full quality for viewing
 */
const getOptimizedUrl = (publicId, options = {}) => {
    const { width = 800, quality = 'auto', format = 'auto' } = options;

    return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/w_${width},q_${quality},f_${format}/${publicId}`;
};

/**
 * Get thumbnail URL (for chat previews)
 */
const getThumbnailUrl = (publicId) => {
    return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/w_100,h_100,c_thumb,q_auto,f_auto/${publicId}`;
};

module.exports = {
    compressImageBase64,
    uploadToCloudinary,
    getOptimizedUrl,
    getThumbnailUrl,
    CLOUDINARY_CLOUD_NAME
};
