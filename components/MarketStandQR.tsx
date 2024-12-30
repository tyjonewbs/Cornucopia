'use client';

import QRCode from "react-qr-code";

interface MarketStandQRProps {
  marketStandId: string;
  size?: number;
}

export function MarketStandQR({ marketStandId, size = 128 }: MarketStandQRProps) {
  // Create a URL that includes the market stand ID
  const qrValue = `${process.env.NEXT_PUBLIC_APP_URL}/market-stand/${marketStandId}`;

  return (
    <div className="bg-white p-4 rounded-lg inline-block">
      <QRCode
        value={qrValue}
        size={size}
        style={{ height: "auto", maxWidth: "100%", width: "100%" }}
        viewBox={`0 0 ${size} ${size}`}
      />
    </div>
  );
}
