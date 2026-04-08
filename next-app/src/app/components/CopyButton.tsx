"use client";

import { useState } from "react";
import TwEmoji from "./ui/TwEmoji";

interface Props {
  address: string;
}

export default function CopyButton({ address }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(address).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <button
      className={`copy-btn${copied ? " copied" : ""}`}
      onClick={handleCopy}
    >
      {copied ? (
        <>
          <TwEmoji emoji="✅" size={14} /> 복사 완료!
        </>
      ) : (
        <>
          <TwEmoji emoji="📋" size={14} /> 주소 복사
        </>
      )}
    </button>
  );
}
