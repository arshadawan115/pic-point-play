import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Sparkles, Heart } from "lucide-react";
import { cn } from "@/lib/utils";

interface Picture {
  id: string;
  name: string | null;
  image_url: string;
}

interface PictureGridProps {
  refresh: number;
}

export const PictureGrid = ({ refresh }: PictureGridProps) => {
  const [pictures, setPictures] = useState<Picture[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPictures();
  }, [refresh]);

  const loadPictures = async () => {
    try {
      const { data, error } = await supabase
        .from("pictures")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPictures(data || []);
    } catch (error: any) {
      toast.error("Failed to load pictures");
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (id: string) => {
    setSelectedId(id);
    toast.success("Great choice!", {
      icon: <Heart className="w-5 h-5 text-success" />,
      duration: 2000,
    });
    
    // Reset selection after animation
    setTimeout(() => setSelectedId(null), 1000);
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-2xl text-muted-foreground">Loading pictures...</p>
      </div>
    );
  }

  if (pictures.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-3xl text-muted-foreground mb-4">No pictures yet!</p>
        <p className="text-xl text-muted-foreground">Ask a parent to upload some pictures.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-4">
      {pictures.map((picture) => (
        <button
          key={picture.id}
          onClick={() => handleSelect(picture.id)}
          className={cn(
            "relative group overflow-hidden rounded-2xl transition-all duration-300",
            "hover:scale-105 active:scale-95",
            "focus:outline-none focus:ring-4 focus:ring-primary",
            selectedId === picture.id && "animate-celebration animate-pulse-glow"
          )}
        >
          <div className="aspect-square relative">
            <img
              src={picture.image_url}
              alt={picture.name || "Picture"}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            
            {selectedId === picture.id && (
              <div className="absolute inset-0 flex items-center justify-center bg-success/20 animate-bounce-in">
                <Sparkles className="w-24 h-24 text-success" />
              </div>
            )}
          </div>
          
          {picture.name && (
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-foreground to-transparent">
              <p className="text-2xl font-bold text-background text-center">
                {picture.name}
              </p>
            </div>
          )}
        </button>
      ))}
    </div>
  );
};
