import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const Account = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({ name: "", email: "" });
  const [password, setPassword] = useState("");

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("name, email")
        .eq("id", user.id)
        .single();
      setProfile({
        name: data?.name || user.user_metadata?.name || "",
        email: data?.email || user.email || "",
      });
    };
    loadProfile();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      if (profile.email !== user.email) {
        const { error } = await supabase.auth.updateUser({ email: profile.email });
        if (error) throw error;
      }
      if (password) {
        if (password.length < 6) {
          toast({
            title: "Password too short",
            description: "Password must be at least 6 characters long",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
      }
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ name: profile.name, email: profile.email, updated_at: new Date().toISOString() })
        .eq("id", user.id);
      if (profileError) throw profileError;
      toast({ title: "Account updated" });
      setPassword("");
    } catch (error: any) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const updateField = (key: "name" | "email", value: string) => {
    setProfile((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-md mx-auto space-y-6">
        <h1 className={`text-3xl font-bold ${theme === "dark" ? "text-career-text-dark" : "text-career-text-light"}`}>Account Settings</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name" className="text-xs font-medium mb-1 block">Name</Label>
            <Input id="name" value={profile.name} onChange={(e) => updateField("name", e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="email" className="text-xs font-medium mb-1 block">Email</Label>
            <Input id="email" type="email" value={profile.email} onChange={(e) => updateField("email", e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="password" className="text-xs font-medium mb-1 block">New Password</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Leave blank to keep current" />
          </div>
          <Button type="submit" disabled={loading} className="bg-career-accent text-white">
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Account;
