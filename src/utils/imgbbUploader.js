// server/src/utils/imgbbUploader.js
const imgbbUploader = require('imgbb-uploader');

const uploadToImgBB = async (imageBase64) => {
  try {
    // Remove data:image/...;base64, prefix if exists
    let base64Image = imageBase64;
    if (imageBase64.includes(';base64,')) {
      base64Image = imageBase64.split(';base64,')[1];
    }

    const response = await imgbbUploader({
      apiKey: process.env.IMGBB_API_KEY,
      base64string: base64Image
    });

    
    console.log('✅ Image uploaded to:', response.url);
    return response.url;
  } catch (error) {
    console.error('ImgBB upload error:', error);
    throw new Error('Failed to upload image: ' + error.message);
  }
};

module.exports = { uploadToImgBB };