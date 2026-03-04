-- Create the coupon-images bucket (public reads, 5MB limit)
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('coupon-images', 'coupon-images', true, 5242880)
ON CONFLICT (id) DO NOTHING;

-- Users can upload to their own folder: coupon-images/{userId}/*
CREATE POLICY "coupon-images: own upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'coupon-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Anyone can read coupon images (public bucket)
CREATE POLICY "coupon-images: public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'coupon-images');

-- Users can delete their own uploads
CREATE POLICY "coupon-images: own delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'coupon-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
