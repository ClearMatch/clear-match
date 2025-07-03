"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Upload } from "lucide-react";

export function ProfileEditForm() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    occupation: "",
    profilePicture: null as File | null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const router = useRouter();

  // Load existing profile data
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await fetch("/api/profile", {
          credentials: 'include', // Include cookies
        });
        
        if (response.ok) {
          const profile = await response.json();
          setFormData({
            firstName: profile.first_name || "",
            lastName: profile.last_name || "",
            occupation: profile.occupation || "",
            profilePicture: null,
          });
          if (profile.profile_pic_url) {
            setPreviewUrl(profile.profile_pic_url);
          }
        }
      } catch (error) {
        // Silently fail - profile loading is non-critical
      } finally {
        setIsLoadingProfile(false);
      }
    };

    if (user) {
      loadProfile();
    }
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "File size must be under 5MB",
          variant: "destructive",
        });
        return;
      }

      // Check file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Error",
          description: "Please upload a valid image file (jpg, jpeg, png, gif, webp)",
          variant: "destructive",
        });
        return;
      }

      setFormData(prev => ({
        ...prev,
        profilePicture: file
      }));

      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // First, upload profile picture if provided
      if (formData.profilePicture) {
        const formDataUpload = new FormData();
        formDataUpload.append("file", formData.profilePicture);

        const uploadResponse = await fetch("/api/profile/avatar", {
          method: "POST",
          credentials: 'include',
          body: formDataUpload,
        });

        if (!uploadResponse.ok) {
          const uploadError = await uploadResponse.text();
          throw new Error("Failed to upload profile picture");
        }
      }

      // Update profile data
      const profileData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        occupation: formData.occupation,
      };

      const response = await fetch("/api/profile", {
        method: "PUT",
        credentials: 'include',
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(profileData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        
        // Try to parse as JSON for better error message
        try {
          const errorJson = JSON.parse(errorText);
          throw new Error(errorJson.error || `HTTP ${response.status}: ${errorText}`);
        } catch {
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
      }

      const result = await response.json();

      toast({
        title: "Success",
        description: "Profile updated successfully!",
      });

      // Trigger header refresh by dispatching a custom event
      window.dispatchEvent(new CustomEvent('profileUpdated'));
      
      // Navigate back to previous page or dashboard
      router.push("/dashboard");
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    router.push("/dashboard");
  };

  if (isLoadingProfile) {
    return (
      <div className="p-4 bg-white shadow-lg rounded-lg">
        <h1 className="font-bold text-md mb-4">Edit Profile</h1>
        <div className="flex items-center justify-center py-8">
          <div className="text-gray-500">Loading profile...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white shadow-lg rounded-lg">
      <h1 className="font-bold text-md mb-4">Edit Profile</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Profile Picture Upload */}
        <div className="flex flex-col items-center space-y-4">
          <Avatar className="h-24 w-24">
            <AvatarImage 
              src={previewUrl || undefined} 
              alt="Profile Preview" 
            />
            <AvatarFallback className="bg-[#E8EBF4]">
              <User className="h-8 w-8 text-gray-600" />
            </AvatarFallback>
          </Avatar>
          
          <div className="flex flex-col items-center">
            <Label htmlFor="profilePicture" className="cursor-pointer">
              <div className="flex items-center space-x-2 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-md transition-colors">
                <Upload className="h-4 w-4" />
                <span>Upload Photo</span>
              </div>
            </Label>
            <Input
              id="profilePicture"
              name="profilePicture"
              type="file"
              accept=".jpg,.jpeg,.png,.gif,.webp"
              onChange={handleFileChange}
              className="hidden"
            />
            <p className="text-sm text-gray-500 mt-1">
              Max file size: 5MB. Supported formats: JPG, PNG, GIF, WebP
            </p>
          </div>
        </div>

        {/* Form Fields */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="firstName">First Name</Label>
            <Input
              id="firstName"
              name="firstName"
              type="text"
              value={formData.firstName}
              onChange={handleInputChange}
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="lastName">Last Name</Label>
            <Input
              id="lastName"
              name="lastName"
              type="text"
              value={formData.lastName}
              onChange={handleInputChange}
              className="mt-1"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="occupation">Occupation</Label>
          <Input
            id="occupation"
            name="occupation"
            type="text"
            value={formData.occupation}
            onChange={handleInputChange}
            className="mt-1"
          />
        </div>

        <hr className="color-black" />
        
        {/* Action Buttons */}
        <div className="flex justify-center space-x-8 pt-6">
          <Button
            type="button"
            variant="outline"
            className="w-40"
            onClick={handleCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            className="bg-black text-white w-40"
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? "Saving..." : "Save"}
          </Button>
        </div>
      </form>
    </div>
  );
}