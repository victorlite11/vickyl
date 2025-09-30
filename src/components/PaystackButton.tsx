// Add TypeScript declaration for PaystackPop
declare global {
  interface Window {
    PaystackPop: any;
  }
}
import React from 'react';
import { Button } from '@/components/ui/button';

const PAYSTACK_PUBLIC_KEY = 'YOUR_PAYSTACK_PUBLIC_KEY'; // Replace with your actual key

interface PaystackButtonProps {
  email: string;
  amount: number;
  onSuccess: (response: any) => void;
  children?: React.ReactNode;
}

const PaystackButton: React.FC<PaystackButtonProps> = ({ email, amount, onSuccess, children }) => {
  const handlePay = () => {
    const handler = window.PaystackPop && window.PaystackPop.setup({
      key: PAYSTACK_PUBLIC_KEY,
      email,
      amount: amount * 100, // Paystack expects amount in kobo
      currency: 'NGN',
      callback: function(response) {
        onSuccess(response);
      },
      onClose: function() {
        // Optionally handle close
      }
    });
    if (handler) handler.openIframe();
  };

  return (
    <Button size="sm" className="bg-green-600 text-white" onClick={handlePay}>
      {children || 'Pay & Renew'}
    </Button>
  );
};

export default PaystackButton;
