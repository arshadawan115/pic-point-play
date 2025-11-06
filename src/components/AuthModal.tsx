import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AuthModal = ({ open, onOpenChange }: AuthModalProps) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isResetPassword, setIsResetPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isResetPassword) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/`,
        });
        if (error) throw error;
        toast.success("Password reset email sent! Check your inbox.");
        setIsResetPassword(false);
        setEmail("");
      } else if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        toast.success("Account created! You can now upload pictures.");
        onOpenChange(false);
        setEmail("");
        setPassword("");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back!");
        onOpenChange(false);
        setEmail("");
        setPassword("");
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {isResetPassword ? "Reset Password" : isSignUp ? "Create Parent Account" : "Parent Login"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleAuth} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-12"
            />
          </div>
          {!isResetPassword && (
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="h-12"
              />
            </div>
          )}
          <Button type="submit" disabled={loading} className="w-full h-12 text-lg">
            {loading ? "Please wait..." : isResetPassword ? "Send Reset Email" : isSignUp ? "Create Account" : "Login"}
          </Button>
          {!isResetPassword ? (
            <>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsSignUp(!isSignUp)}
                className="w-full"
              >
                {isSignUp ? "Already have an account? Login" : "Need an account? Sign up"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsResetPassword(true)}
                className="w-full text-sm"
              >
                Forgot Password?
              </Button>
            </>
          ) : (
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setIsResetPassword(false);
                setEmail("");
              }}
              className="w-full"
            >
              Back to Login
            </Button>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
};
