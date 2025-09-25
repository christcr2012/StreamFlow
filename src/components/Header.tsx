// src/components/Header.tsx
// The header component renders the small logo in the sidebar. Use the
// next/image component to take advantage of automatic image optimization.
import Image from "next/image";

export default function Header() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      {/* Use next/image instead of <img> for optimized loading */}
      <Image
        src="/logo.svg"
        alt="MV"
        width={56}
        height={56}
      />
    </div>
  );
}
