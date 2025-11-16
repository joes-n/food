import { useState } from 'react';
import { uploadService } from '../services/uploadService';
import { toast } from 'react-toastify';

interface ImageUploadProps {
  onUploadComplete: (url: string) => void;
  currentImage?: string;
  label?: string;
  restaurantId: string;
}

export function ImageUpload({ onUploadComplete, currentImage, label = 'Upload Image', restaurantId }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImage || null);
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    // Show preview immediately using local state
    const reader = new FileReader();
    reader.onloadend = () => {
      setLocalPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload file
    try {
      setUploading(true);
      const { url } = await uploadService.uploadImage(file, restaurantId);
      onUploadComplete(url);
      setUploadedUrl(url);
      setPreviewUrl(url);
      setLocalPreviewUrl(null);
      toast.success('Image uploaded successfully');
    } catch (error: any) {
      toast.error(error.message || 'Upload failed');
      setPreviewUrl(currentImage || null);
      setLocalPreviewUrl(null);
      setUploadedUrl(null);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      {label && <label className="label">{label}</label>}

      {(localPreviewUrl || previewUrl || currentImage || uploadedUrl) && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">Preview:</p>
          <img
            src={localPreviewUrl || uploadedUrl || previewUrl || currentImage}
            alt="Preview"
            className="w-full max-w-lg h-64 object-cover rounded-lg border-2 border-gray-200"
          />
        </div>
      )}

      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        disabled={uploading}
        className="input"
      />

      {uploading && (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <div className="spinner h-4 w-4"></div>
          <span>Uploading...</span>
        </div>
      )}
    </div>
  );
}