"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function TutorRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/learn/pronunciation");
  }, [router]);
  return (
    <div className="min-h-[40vh] flex items-center justify-center">
      <p className="text-muted-foreground">Redirecting to pronunciation drills…</p>
    </div>
  );
}
