import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { Wallet, Plus, CreditCard,  ArrowRight, ArrowDownRight, ArrowUpRight, History, University, Copy, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useWalletStore } from '@/store';
import { paymentApi } from '@/services/api';

const FLW_PUBLIC_KEY = import.meta.env.VITE_FLUTTERWAVE_PUBLIC_KEY;

function loadFlutterwaveScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if ((window as any).FlutterwaveCheckout) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.flutterwave.com/v3.js';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Flutterwave script'));
    document.body.appendChild(script);
  });
}

export default function WalletDashboard() {
  const { balance, transactions, fetchWallet } = useWalletStore();
  const [customAmount, setCustomAmount] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [amountToFund, setAmountToFund] = useState(0);
  const [fundingMethod, setFundingMethod] = useState<'card' | 'bank_transfer'>('card');
  const [scriptLoaded, setScriptLoaded] = useState(false);

  const paymentCompletedRef = useRef(false);
  const presetAmounts = [5000, 10000, 20000];

  useEffect(() => {
    loadFlutterwaveScript()
      .then(() => setScriptLoaded(true))
      .catch(() => console.warn('Flutterwave script failed to load'));
    fetchWallet();
  }, [fetchWallet]);

  const handleOpenModal = (amount: number) => {
    if (amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    setAmountToFund(amount);
    setIsModalOpen(true);
  };

  const handleFlutterwavePayment = useCallback(async () => {
    if (!scriptLoaded) {
      toast.error('Payment system loading. Please try again.');
      return;
    }

    setIsProcessing(true);

    try {
      const response = await paymentApi.initializeWalletFunding(amountToFund);
      if (response.error) {
        toast.error(response.error);
        setIsProcessing(false);
        return;
      }

      const initData = response.data as any;

      (window as any).FlutterwaveCheckout({
        public_key: FLW_PUBLIC_KEY,
        tx_ref: initData.tx_ref,
        amount: initData.amount,
        currency: initData.currency || 'NGN',
        payment_options: 'card,ussd,banktransfer',
        customer: initData.customer,
        callback: async (data: any) => {
          paymentCompletedRef.current = true;
          const verifyResponse = await paymentApi.verifyTransaction(data.transaction_id, data.tx_ref);
          if (!verifyResponse.error) {
            toast.success(`Successfully funded ₦${amountToFund.toLocaleString()}!`, {
              style: { background: '#277310', color: 'white', border: 'none' }
            });
            await fetchWallet();
          } else {
            toast.error('Payment verification failed. Contact support.');
          }
          setIsProcessing(false);
          setIsModalOpen(false);
          setCustomAmount('');
        },
        onclose: () => {
          if (!paymentCompletedRef.current) {
            toast.info('Payment cancelled');
          }
          setIsProcessing(false);
        },
        customizations: {
          title: 'ErrandHub Wallet',
          description: `Top up ₦${amountToFund.toLocaleString()}`,
        },
      });
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Failed to initialize payment');
      setIsProcessing(false);
    }
  }, [amountToFund, scriptLoaded, fetchWallet]);

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Balance Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full rounded-3xl bg-gradient-to-br from-[#277310] via-[#1e5a10] to-[#15460a] p-6 sm:p-8 text-white shadow-xl relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
        
        <div className="relative z-10 flex flex-col justify-between h-full space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-green-50">
              <Wallet className="w-5 h-5" />
              <span className="font-medium text-sm tracking-wide uppercase">Available Balance</span>
            </div>
            <div className="w-12 h-8 bg-white/20 rounded-md backdrop-blur-md flex items-center justify-center">
              <CreditCard className="w-4 h-4 text-white" />
            </div>
          </div>
          
          <div>
            <h1 className="text-3xl sm:text-5xl font-bold tracking-tight">
              <span className="text-green-300 mr-1">₦</span>
              {balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h1>
          </div>
        </div>
      </motion.div>

      {/* Quick Fund Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-gray-100"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Fund</h3>
        
        <div className="grid grid-cols-3 gap-3 mb-6">
          {presetAmounts.map((amount) => (
            <Button
              key={amount}
              variant="outline"
              className="h-12 border-gray-200 hover:border-[#277310] hover:bg-green-50 hover:text-[#277310] transition-colors"
              onClick={() => handleOpenModal(amount)}
            >
              ₦{amount.toLocaleString()}
            </Button>
          ))}
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="relative flex-1 min-w-0">
            <span className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium text-sm">₦</span>
            <Input
              type="number"
              placeholder="Enter amount"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              className="pl-7 sm:pl-8 h-10 sm:h-12 text-sm sm:text-lg border-gray-200 focus-visible:ring-[#277310]"
            />
          </div>
          <Button
            className="h-10 sm:h-12 px-3 sm:px-6 bg-[#277310] hover:bg-[#1e5a10] text-white rounded-xl shadow-md shrink-0"
            onClick={() => handleOpenModal(Number(customAmount))}
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Top Up</span>
            <span className="sm:hidden">Add</span>
          </Button>
        </div>
      </motion.div>

      {/* Recent Transactions Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-gray-100"
      >
        <div className="flex items-center gap-2 mb-4 sm:mb-6">
          <History className="w-5 h-5 text-gray-500" />
          <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
        </div>

        {transactions && transactions.length > 0 ? (
          <div className="space-y-4">
            {transactions.map((tx) => {
              const isCredit = tx.type === 'credit';
              const formattedDate = new Intl.DateTimeFormat('en-NG', {
                dateStyle: 'medium',
                timeStyle: 'short',
              }).format(new Date(tx.createdAt));

              return (
                <div key={tx.id} className="flex items-center justify-between p-4 rounded-xl border border-gray-50 bg-gray-50/50 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isCredit ? 'bg-green-100' : 'bg-red-100'}`}>
                      {isCredit ? (
                        <ArrowDownRight className="w-5 h-5 text-green-600" />
                      ) : (
                        <ArrowUpRight className="w-5 h-5 text-red-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{tx.description}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{formattedDate}</p>
                    </div>
                  </div>
                  <div className={`font-semibold text-base ${isCredit ? 'text-green-600' : 'text-red-600'}`}>
                    {isCredit ? '+' : '-'}₦{tx.amount.toLocaleString()}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>No recent transactions.</p>
          </div>
        )}
      </motion.div>

      {/* Mock Payment Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden rounded-2xl border-0">
          <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-6 text-white text-center">
            <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-md">
              <CreditCard className="w-6 h-6 text-white" />
            </div>
            <DialogTitle className="text-2xl font-bold mb-1">Complete Payment</DialogTitle>
            <DialogDescription className="text-gray-300">
              You are about to fund your wallet with a secure mock transaction.
            </DialogDescription>
          </div>
          
          <div className="p-6 space-y-6 bg-white">
            <div className="flex justify-between items-center py-4 border-b border-gray-100 border-dashed">
              <span className="text-gray-500">Amount to fund</span>
              <span className="text-2xl font-bold text-gray-900">₦{amountToFund.toLocaleString()}</span>
            </div>

            <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
              <button
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${fundingMethod === 'card' ? 'bg-white shadow pointer-events-none text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
                onClick={() => setFundingMethod('card')}
              >
                Card
              </button>
              <button
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${fundingMethod === 'bank_transfer' ? 'bg-white shadow pointer-events-none text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
                onClick={() => setFundingMethod('bank_transfer')}
              >
                Bank Transfer
              </button>
            </div>

            {fundingMethod === 'card' ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                  <p className="text-sm text-green-800 text-center">
                    Secure payment powered by <strong>Flutterwave</strong>. Pay with card, USSD, or bank transfer.
                  </p>
                </div>

                <Button
                  className="w-full h-14 text-lg bg-[#277310] hover:bg-[#1e5a10] shadow-lg shadow-[#277310]/20 rounded-xl"
                  onClick={handleFlutterwavePayment}
                  disabled={isProcessing || !scriptLoaded}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Opening secure checkout...
                    </>
                  ) : (
                    <>
                      Pay ₦{amountToFund.toLocaleString()} Securely
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </>
                  )}
                </Button>

                <div className="flex items-center justify-center gap-2 pt-2 text-xs text-gray-400">
                  <span className="font-bold text-gray-900">Powered by Flutterwave</span>
                </div>
              </motion.div>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <div className="bg-gray-50 rounded-xl p-4 space-y-4 border border-gray-100">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Bank Name</span>
                    <span className="font-semibold text-gray-900 flex items-center gap-1.5"><University className="w-4 h-4 text-amber-500" /> Zenith Bank</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Account Name</span>
                    <span className="font-semibold text-gray-900">ErrandHub Services</span>
                  </div>
                  <div className="flex justify-between items-center bg-white p-3 rounded-lg border border-gray-200">
                    <div>
                      <span className="text-xs text-gray-500 block mb-1">Account Number</span>
                      <span className="font-bold tracking-wider text-xl text-gray-900">1234567890</span>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-[#277310] hover:text-[#1e5a10] hover:bg-green-50"
                      onClick={() => {
                        navigator.clipboard.writeText("1234567890");
                        toast.success("Account number copied!");
                      }}
                    >
                      <Copy className="w-4 h-4 mr-2" /> Copy
                    </Button>
                  </div>
                </div>
                
                <Button
                  onClick={async () => {
                    setIsProcessing(true);
                    try {
                      // Record the bank-transfer funding attempt via the real API so the
                      // transaction exists in the DB and can be verified by an admin.
                      const response = await paymentApi.initializeWalletFunding(amountToFund);
                      if (response.error) {
                        toast.error(response.error || 'Could not log transfer. Please try again.');
                      } else {
                        setIsModalOpen(false);
                        setCustomAmount('');
                        toast.info('Transfer logged! Awaiting admin verification.', {
                          description: 'Your wallet will be credited once the transfer is confirmed.'
                        });
                      }
                    } catch {
                      toast.error('Network error. Please try again.');
                    } finally {
                      setIsProcessing(false);
                    }
                  }}
                  disabled={isProcessing}
                  className="w-full h-14 bg-amber-500 hover:bg-amber-600 text-white font-bold text-lg rounded-xl shadow-lg shadow-amber-500/20"
                >
                  {isProcessing ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    "I Have Made the Transfer"
                  )}
                </Button>
              </motion.div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
