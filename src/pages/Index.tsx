import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { PictureGrid } from "@/components/PictureGrid";
import { PictureUpload } from "@/components/PictureUpload";
import { AuthModal } from "@/components/AuthModal";
import { supabase } from "@/integrations/supabase/client";
import { User, Baby, LogOut } from "lucide-react";

const Index = () => {
  const [mode, setMode] = useState<"kid" | "parent">("kid");
  const [showAuth, setShowAuth] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setMode("kid");
  };

  const handleModeSwitch = (newMode: "kid" | "parent") => {
    if (newMode === "parent" && !user) {
      setShowAuth(true);
    } else {
      setMode(newMode);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Picture Choice
          </h1>
          
          <div className="flex items-center gap-2">
            <Button
              variant={mode === "kid" ? "default" : "outline"}
              onClick={() => setMode("kid")}
              className="h-12 px-6 text-lg"
            >
              <Baby className="w-5 h-5 mr-2" />
              Kid Mode
            </Button>
            <Button
              variant={mode === "parent" ? "default" : "outline"}
              onClick={() => handleModeSwitch("parent")}
              className="h-12 px-6 text-lg"
            >
              <User className="w-5 h-5 mr-2" />
              Parent Mode
            </Button>
            {user && (
              <Button
                variant="ghost"
                onClick={handleSignOut}
                className="h-12 px-4"
              >
                <LogOut className="w-5 h-5" />
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {mode === "kid" ? (
          <div>
            <h2 className="text-4xl md:text-5xl font-bold text-center mb-8 text-foreground">
              What would you like to do?
            </h2>
            <PictureGrid refresh={refresh} />
          </div>
        ) : (
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-8 text-foreground">
              Upload Pictures
            </h2>
            <PictureUpload onUploadSuccess={() => setRefresh(prev => prev + 1)} />
          </div>
        )}
      </main>

      <AuthModal open={showAuth} onOpenChange={setShowAuth} />
    </div>
  );
};

export default Index;
