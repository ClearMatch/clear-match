/*
  # Profile Management Features Migration
  
  Adds profile management functionality including:
  1. Additional profile fields (occupation, profile_pic_url)
  2. Storage bucket for profile avatars
  3. Profile update policies
  4. Updated trigger for profile timestamps
*/

-- Add new columns to profiles table (idempotent)
DO $$ 
BEGIN
    -- Add occupation column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'occupation'
    ) THEN
        ALTER TABLE profiles ADD COLUMN occupation text;
    END IF;
    
    -- Add profile_pic_url column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'profile_pic_url'
    ) THEN
        ALTER TABLE profiles ADD COLUMN profile_pic_url text;
    END IF;
END $$;

-- Create storage bucket for avatars (idempotent)
DO $$
BEGIN
    -- Check if bucket exists before creating
    IF NOT EXISTS (
        SELECT 1 FROM storage.buckets WHERE id = 'avatars'
    ) THEN
        INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
        VALUES (
            'avatars',
            'avatars',
            true,  -- Public bucket so we can display avatars
            5242880,  -- 5MB limit
            ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
        );
    END IF;
END $$;

-- Add RLS policies for storage bucket (idempotent)
DO $$
BEGIN
    -- Check if policy exists before creating (SELECT policy)
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = 'Users can view avatar images'
    ) THEN
        CREATE POLICY "Users can view avatar images"
        ON storage.objects FOR SELECT
        TO authenticated
        USING (bucket_id = 'avatars');
    END IF;
    
    -- Check if policy exists before creating (INSERT policy)
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = 'Users can upload their own avatar'
    ) THEN
        CREATE POLICY "Users can upload their own avatar"
        ON storage.objects FOR INSERT
        TO authenticated
        WITH CHECK (
            bucket_id = 'avatars' 
            AND (storage.foldername(name))[1] = auth.uid()::text
        );
    END IF;
    
    -- Check if policy exists before creating (UPDATE policy)
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = 'Users can update their own avatar'
    ) THEN
        CREATE POLICY "Users can update their own avatar"
        ON storage.objects FOR UPDATE
        TO authenticated
        USING (
            bucket_id = 'avatars' 
            AND (storage.foldername(name))[1] = auth.uid()::text
        );
    END IF;
    
    -- Check if policy exists before creating (DELETE policy)
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = 'Users can delete their own avatar'
    ) THEN
        CREATE POLICY "Users can delete their own avatar"
        ON storage.objects FOR DELETE
        TO authenticated
        USING (
            bucket_id = 'avatars' 
            AND (storage.foldername(name))[1] = auth.uid()::text
        );
    END IF;
END $$;

-- Add profile update policies (idempotent)
DO $$
BEGIN
    -- Check if policy exists before creating
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'profiles' 
        AND policyname = 'Users can update their own profile'
    ) THEN
        CREATE POLICY "Users can update their own profile"
        ON profiles FOR UPDATE
        TO authenticated
        USING (id = auth.uid())
        WITH CHECK (id = auth.uid());
    END IF;
END $$;

-- Add trigger for profile updated_at (idempotent)
DO $$
BEGIN
    -- Check if trigger exists before creating
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'update_profiles_updated_at'
    ) THEN
        CREATE TRIGGER update_profiles_updated_at
        BEFORE UPDATE ON profiles
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at();
    END IF;
END $$;