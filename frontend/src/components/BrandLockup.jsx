import { useState } from "react";

export const BRAND_NAME = "SnapSpend";
export const BRAND_USER_NAME = `${BRAND_NAME} User`;

function BrandMark({ size = 18 }) {
  const [useFallback, setUseFallback] = useState(false);

  if (!useFallback) {
    return (
      <img
        src="/branding/logo.png"
        alt=""
        aria-hidden="true"
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          display: "block",
          borderRadius: "inherit",
        }}
        onError={() => setUseFallback(true)}
      />
    );
  }

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M16.75 5.5V7.15" stroke="white" strokeWidth="1.9" strokeLinecap="round" />
      <path d="M8.25 16.85V18.5" stroke="white" strokeWidth="1.9" strokeLinecap="round" />
      <path
        d="M16.3 7.2H10.75C9.05 7.2 7.9 8.15 7.9 9.55C7.9 13.15 16.1 10.95 16.1 14.55C16.1 16.05 14.85 16.8 12.95 16.8H7.7"
        stroke="white"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function BrandLockup({
  containerClassName,
  markClassName,
  nameClassName,
  size = 18,
}) {
  return (
    <div className={containerClassName}>
      <div className={markClassName}>
        <BrandMark size={size} />
      </div>
      <span className={nameClassName}>{BRAND_NAME}</span>
    </div>
  );
}
