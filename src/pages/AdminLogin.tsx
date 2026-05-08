import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader, AlertCircle } from "lucide-react";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const { signIn, signUp, isSigningIn, isSigningUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const isLoading = isSignUp ? isSigningUp : isSigningIn;

  const validateForm = (): boolean => {
    setError("");

    if (!email) {
      setError("Email is required");
      return false;
    }

    if (!email.includes("@")) {
      setError("Please enter a valid email");
      return false;
    }

    if (!password) {
      setError("Password is required");
      return false;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      if (isSignUp) {
        await signUp({ email, password });
        toast({
          title: "Success",
          description: "Account created! Please sign in.",
        });
        setIsSignUp(false);
        setPassword("");
      } else {
        await signIn({ email, password });
        navigate("/admin");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Authentication failed";
      setError(message);
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] selection:bg-white selection:text-black">
      <main className="flex min-h-[70vh] items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="font-display text-4xl font-black text-white mb-2 tracking-tighter uppercase">2FLY X</h1>
          <h2 className="font-mono-cyber text-sm text-white/50 tracking-[0.3em] uppercase">System Admin</h2>
          <p className="mt-4 text-xs font-body text-white/30">
            {isSignUp ? "[ INITIATE NEW ADMIN ]" : "[ AUTHENTICATE TO CONTINUE ]"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Error Message */}
          {error && (
            <div className="border border-white/20 bg-white/5 rounded-none p-3 flex gap-2 items-start">
              <AlertCircle className="w-4 h-4 text-white/70 flex-shrink-0 mt-0.5" />
              <p className="text-sm font-mono-cyber text-white/70">{error}</p>
            </div>
          )}

          {/* Email Input */}
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="admin@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError("");
              }}
              disabled={isLoading}
              autoComplete="email"
            />
          </div>

          {/* Password Input */}
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError("");
              }}
              disabled={isLoading}
              minLength={6}
              autoComplete={isSignUp ? "new-password" : "current-password"}
            />
            {isSignUp && (
              <p className="text-xs text-muted-foreground">
                Must be at least 6 characters
              </p>
            )}
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="holo-btn w-full"
            disabled={isLoading}
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader className="w-4 h-4 mr-2 animate-spin" />
                {isSignUp ? "Creating Account..." : "Signing In..."}
              </>
            ) : isSignUp ? (
              "Create Admin Account"
            ) : (
              "Sign In to Admin"
            )}
          </Button>
        </form>

        {/* Toggle Sign Up / Sign In */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-background px-2 text-muted-foreground">or</span>
          </div>
        </div>

        <button
          onClick={() => {
            setIsSignUp(!isSignUp);
            setError("");
            setPassword("");
          }}
          disabled={isLoading}
          className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
        >
          {isSignUp
            ? "Already have an account? Sign in instead"
            : "Don't have an account? Create one"}
        </button>

        {/* Security Note */}
        <div className="p-3 border border-white/10 bg-white/5 font-mono-cyber text-[10px] text-white/40 text-center tracking-widest uppercase">
          [ STRICTLY CLASSIFIED ACCESS ONLY ]
        </div>
      </div>
      </main>
    </div>
  );
}
