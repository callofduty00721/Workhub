import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 text-center">
      <p className="text-6xl font-extrabold text-gradient">404</p>
      <h1 className="text-xl font-semibold">Page not found</h1>
      <p className="max-w-sm text-sm text-muted-foreground">The page you&apos;re looking for doesn&apos;t exist or has been moved.</p>
      <Button variant="gradient" asChild>
        <Link to="/">Back to Home</Link>
      </Button>
    </div>
  );
}
