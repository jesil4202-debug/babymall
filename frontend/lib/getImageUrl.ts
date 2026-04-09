type ImageInput =
  | string
  | {
      url?: string;
      publicId?: string;
      public_id?: string;
    }
  | null
  | undefined;

const FALLBACK_IMAGE = '/logo.png';

export const getImageUrl = (image: ImageInput): string => {
  if (!image) return FALLBACK_IMAGE;

  const rawValue =
    typeof image === 'string'
      ? image
      : image.url || image.publicId || image.public_id || '';

  if (!rawValue) return FALLBACK_IMAGE;
  if (rawValue.startsWith('http://') || rawValue.startsWith('https://')) return rawValue;

  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!baseUrl) return FALLBACK_IMAGE;

  const sanitized = rawValue.replace(/^\/+/, '');
  const normalizedPath = sanitized.startsWith('products/')
    ? sanitized
    : `products/products/${sanitized}`;

  return `${baseUrl}/storage/v1/object/public/products/${normalizedPath}`;
};

