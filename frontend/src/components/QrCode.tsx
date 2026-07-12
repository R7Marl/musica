"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

export function QrCode({ value }: { value: string }) {
  const [source, setSource] = useState("");

  useEffect(() => {
    QRCode.toDataURL(value, {
      margin: 1,
      width: 180,
      color: { dark: "#101820", light: "#ffffff" },
    }).then(setSource);
  }, [value]);

  if (!source) {
    return <div className="qr-placeholder" />;
  }

  return <img alt={`QR ${value}`} className="qr-image" src={source} />;
}
