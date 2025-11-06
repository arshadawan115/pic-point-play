import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, Image as ImageIcon } from "lucide-react";

interface PictureUploadProps {
  onUploadSuccess: () => void;
}

// Validation constants
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_NAME_LENGTH = 100;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

export const PictureUpload = ({ onUploadSuccess }: PictureUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [name, setName] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file size
      if (selectedFile.size > MAX_FILE_SIZE) {
        toast.error("File too large (max 5MB)");
        e.target.value = "";
        return;
      }

      // Validate file type
      if (!ALLOWED_TYPES.includes(selectedFile.type)) {
        toast.error("Invalid file type. Please upload JPEG, PNG, GIF, or WEBP images only");
        e.target.value = "";
        return;
      }

      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast.error("Please select an image");
      return;
    }

    // Validate name length
    if (name.length > MAX_NAME_LENGTH) {
      toast.error(`Name too long (max ${MAX_NAME_LENGTH} characters)`);
      return;
    }

    // Double-check file validations
    if (file.size > MAX_FILE_SIZE) {
      toast.error("File too large (max 5MB)");
      return;
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error("Invalid file type");
      return;
    }

    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Sanitize and validate file extension
      const fileExt = file.name.split(".").pop()?.toLowerCase();
      if (!fileExt || !['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExt)) {
        throw new Error("Invalid file extension");
      }

      const fileName = `${user.id}/${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("pictures")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("pictures")
        .getPublicUrl(fileName);

      // Sanitize name: trim and limit length
      const sanitizedName = (name || file.name).trim().slice(0, MAX_NAME_LENGTH);

      const { error: dbError } = await supabase.from("pictures").insert({
        user_id: user.id,
        name: sanitizedName,
        image_url: publicUrl,
      });

      if (dbError) throw dbError;

      toast.success("Picture uploaded!");
      setName("");
      setFile(null);
      setPreview(null);
      onUploadSuccess();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card className="p-6">
      <form onSubmit={handleUpload} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-lg">Picture Name (optional)</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Park, Ice Cream, Beach"
            className="h-12 text-lg"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="picture" className="text-lg">Choose Picture</Label>
          <div className="flex flex-col items-center gap-4">
            {preview ? (
              <img
                src={preview}
                alt="Preview"
                className="w-full max-w-xs h-48 object-cover rounded-lg"
              />
            ) : (
              <div className="w-full max-w-xs h-48 border-2 border-dashed border-border rounded-lg flex items-center justify-center">
                <ImageIcon className="w-16 h-16 text-muted-foreground" />
              </div>
            )}
            <Input
              id="picture"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="h-12"
              required
            />
          </div>
        </div>

        <Button
          type="submit"
          disabled={uploading}
          className="w-full h-14 text-xl"
        >
          {uploading ? (
            "Uploading..."
          ) : (
            <>
              <Upload className="w-6 h-6 mr-2" />
              Upload Picture
            </>
          )}
        </Button>
      </form>
    </Card>
  );
};
