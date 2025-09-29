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

export const PictureUpload = ({ onUploadSuccess }: PictureUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [name, setName] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
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

    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("pictures")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("pictures")
        .getPublicUrl(fileName);

      const { error: dbError } = await supabase.from("pictures").insert({
        user_id: user.id,
        name: name || file.name,
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
