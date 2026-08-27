import { BadgeCheck } from "lucide-react";

export function VerifiedBadge({
  isVerified,
  type,
}: {
  isVerified: boolean;
  type?: string;
}) {
  if (!isVerified) return null;
  return (
    <BadgeCheck
      className="w-4 h-4 inline-block ml-1"
      style={{ color: type === "partner" ? "hsl(112,100%,54%)" : "#1d9bf0" }}
      fill="currentColor"
    />
  );
}
