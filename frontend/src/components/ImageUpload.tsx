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

    // Show preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload file
    try {
      setUploading(true);
      const { url } = await uploadService.uploadImage(file, restaurantId);
      onUploadComplete(url);
      toast.success('Image uploaded successfully');
    } catch (error: any) {
      toast.error(error.message || 'Upload failed');
      setPreviewUrl(currentImage || null);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      {label && <label className="label">{label}</label>}

      {previewUrl && (
        <div className="mb-4">
          <img
            src={previewUrl}
            alt="Preview"
            className="max-w-md h-48 object-cover rounded-lg"
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