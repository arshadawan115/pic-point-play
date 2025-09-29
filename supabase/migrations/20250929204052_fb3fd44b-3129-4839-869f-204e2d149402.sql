-- Create storage bucket for pictures
INSERT INTO storage.buckets (id, name, public)
VALUES ('pictures', 'pictures', true);

-- Create pictures table
CREATE TABLE public.pictures (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  image_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pictures ENABLE ROW LEVEL SECURITY;

-- Allow anyone to view pictures (kids don't need to be logged in)
CREATE POLICY "Anyone can view pictures"
ON public.pictures
FOR SELECT
USING (true);

-- Only authenticated users (parents) can upload
CREATE POLICY "Authenticated users can insert pictures"
ON public.pictures
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Only the uploader can delete their pictures
CREATE POLICY "Users can delete their own pictures"
ON public.pictures
FOR DELETE
USING (auth.uid() = user_id);

-- Storage policies for pictures bucket
CREATE POLICY "Anyone can view pictures in storage"
ON storage.objects
FOR SELECT
USING (bucket_id = 'pictures');

CREATE POLICY "Authenticated users can upload pictures"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'pictures' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own pictures from storage"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'pictures' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);