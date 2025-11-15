import { QrCode, Shield, SmartphoneCharging } from "lucide-react";

interface QRPaymentCalloutProps {
  standName: string;
}

export function QRPaymentCallout({ standName }: QRPaymentCalloutProps) {
  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-200 p-6 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="bg-blue-100 p-3 rounded-lg flex-shrink-0">
          <QrCode className="h-8 w-8 text-blue-700" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-blue-900 mb-2">
            Purchase Process: Pay on Site!
          </h3>
          <p className="text-sm text-blue-800 mb-4">
            Scan the QR code at <strong>{standName}</strong> to complete your secure payment.
          </p>
          
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <SmartphoneCharging className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-900">Quick & Easy</p>
                <p className="text-xs text-blue-700">Simply scan the QR code with your phone camera</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-900">Secure Payment</p>
                <p className="text-xs text-blue-700">Protected transaction through our secure payment system</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-4 pt-4 border-t border-blue-200">
        <p className="text-xs text-blue-700 italic">
          💡 Pro tip: Have your phone ready when you arrive to speed up the checkout process
        </p>
      </div>
    </div>
  );
}
