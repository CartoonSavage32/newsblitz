"use client";

// About page redirects to feedback page
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function About() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace("/feedback");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-primary"></div>
    </div>
  );
}

