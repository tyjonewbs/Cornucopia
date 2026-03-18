'use client';

import { QRCodeSVG } from "qrcode.react";
import { Shield, SmartphoneCharging } from "lucide-react";

interface QRPaymentCalloutProps {
  standName: string;
  standId: string;
}

export function QRPaymentCallout({ standName, standId }: QRPaymentCalloutProps) {
  const qrUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://cornucopia.vercel.app'}/stand-portal/${standId}`;

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-200 p-6 shadow-sm">
      <div className="flex items-start gap-6">
        {/* QR Code */}
        <div className="bg-white p-4 rounded-lg border-2 border-blue-300 flex-shrink-0">
          <QRCodeSVG
            value={qrUrl}
            size={160}
            level="H"
            includeMargin={false}
          />
        </div>

        {/* Info */}
        <div className="flex-1">
          <h3 className="text-lg font-bold text-blue-900 mb-2">
            Scan to shop at {standName}
          </h3>
          <p className="text-sm text-blue-800 mb-4">
            Customers scan this QR code to browse and purchase your products
          </p>

          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <SmartphoneCharging className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-900">Quick & Easy</p>
                <p className="text-xs text-blue-700">Customers simply scan with their phone camera</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-900">Secure Payment</p>
                <p className="text-xs text-blue-700">Cash or card payments, all transactions protected</p>
              </div>
            </div>
          </div>

          {/* URL */}
          <div className="mt-4 pt-4 border-t border-blue-200">
            <p className="text-xs text-blue-700 font-mono break-all">
              {qrUrl}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
