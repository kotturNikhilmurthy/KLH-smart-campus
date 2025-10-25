import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const AuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const isSuccess = searchParams.get("success");
    const token = searchParams.get("token");
  const rawProfile = searchParams.get("profile");

    if (isSuccess !== "true" || !token || !rawProfile) {
      toast.error("Authentication failed. Please try again.");
      navigate("/auth", { replace: true });
      return;
    }

    try {
      const profile = JSON.parse(rawProfile);

      localStorage.setItem("authToken", token);
      localStorage.setItem("userProfile", JSON.stringify(profile));
      localStorage.setItem("userEmail", profile.email ?? "");
      localStorage.setItem("userRole", profile.role ?? "student");

      toast.success(`Welcome back, ${profile.name?.split(" ")[0] ?? "user"}!`);
      navigate("/dashboard", { replace: true });
    } catch (error) {
      console.error("Failed to parse OAuth profile", error);
      toast.error("We couldn't finish signing you in. Please try again.");
      navigate("/auth", { replace: true });
    }
  }, [navigate, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="text-sm text-muted-foreground">Completing your sign in…</p>
      </div>
    </div>
  );
};

export default AuthCallback;
