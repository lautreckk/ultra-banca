'use client';

import { useState, useRef } from 'react';
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  label: string;
  recommendedSize: string;
  accept?: string;
  bucket?: string;
  folder?: string;
}

export function ImageUpload({
  value,
  onChange,
  label,
  recommendedSize,
  accept = 'image/png,image/jpeg,image/webp,image/svg+xml',
  bucket = 'platform-assets',
  folder = 'branding',
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const supabase = createClient();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError('Arquivo muito grande. Máximo 2MB.');
      return;
    }

    setError('');
    setIsUploading(true);

    try {
      // Generate unique filename
      const ext = file.name.split('.').pop();
      const filename = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;

      // Upload to Supabase Storage
      const { data, error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filename, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);

      const publicUrl = urlData.publicUrl;

      // Update preview and value
      setPreview(publicUrl);
      onChange(publicUrl);
    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : 'Erro ao fazer upload');
    } finally {
      setIsUploading(false);
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
  };

  const handleRemove = () => {
    setPreview(null);
    onChange('');
  };

  const displayUrl = preview || value;
  const isValidUrl = displayUrl && (displayUrl.startsWith('http') || displayUrl.startsWith('/'));

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-300">{label}</label>
      <p className="text-xs text-gray-500 mb-2">Tamanho recomendado: {recommendedSize}</p>

      <div className="flex gap-4">
        {/* Preview */}
        <div className="relative w-24 h-24 bg-gray-700 rounded-lg border-2 border-dashed border-gray-600 flex items-center justify-center overflow-hidden">
          {isValidUrl ? (
            <>
              <img
                src={displayUrl}
                alt="Preview"
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
              <button
                type="button"
                onClick={handleRemove}
                className="absolute top-1 right-1 p-1 bg-red-500 rounded-full hover:bg-red-600 transition-colors"
              >
                <X className="h-3 w-3 text-white" />
              </button>
            </>
          ) : (
            <ImageIcon className="h-8 w-8 text-gray-500" />
          )}
        </div>

        {/* Upload Area */}
        <div className="flex-1">
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            onChange={handleFileSelect}
            className="hidden"
            id={`upload-${label}`}
          />

          <label
            htmlFor={`upload-${label}`}
            className={`
              flex items-center justify-center gap-2 px-4 py-3
              bg-gray-700 border border-gray-600 rounded-lg
              cursor-pointer hover:bg-gray-600 transition-colors
              ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            {isUploading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                <span className="text-sm text-gray-400">Enviando...</span>
              </>
            ) : (
              <>
                <Upload className="h-5 w-5 text-gray-400" />
                <span className="text-sm text-gray-300">Fazer upload</span>
              </>
            )}
          </label>

          {/* Manual URL input */}
          <div className="mt-2">
            <input
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="Ou cole uma URL"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white text-sm rounded-md placeholder-gray-500"
            />
          </div>

          {error && (
            <p className="text-xs text-red-400 mt-1">{error}</p>
          )}
        </div>
      </div>
    </div>
  );
}
