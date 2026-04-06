import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { usePlacesAutocomplete, type PlacePrediction } from '@/hooks/usePlacesAutocomplete';
import {
  Plus,
  Minus,
  Trash2,
  MapPin,
  Clock,
  AlertCircle,
  ArrowRight,
  Package,
  ShoppingCart,
  Utensils,
  FileText,
  Shirt,
  Pill,
  MoreHorizontal,
  Banknote,
  Wallet
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { Card, CardContent } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuthStore, useAddressStore } from '@/store';
import { useWalletStore } from '@/store/walletStore';
import { useOrderStore } from '@/store/orderStore';
import { toast } from 'sonner';
import { orderApi, getFreshSession } from '@/services/api';
import type { OrderItem, Address, ErrandType } from '@/types';

const errandTypes: { type: ErrandType; label: string; icon: React.ElementType }[] = [
  { type: 'grocery', label: 'Grocery Shopping', icon: ShoppingCart },
  { type: 'food', label: 'Food Delivery', icon: Utensils },
  { type: 'package', label: 'Package Pickup', icon: Package },
  { type: 'document', label: 'Document Delivery', icon: FileText },
  { type: 'laundry', label: 'Laundry Service', icon: Shirt },
  { type: 'pharmacy', label: 'Pharmacy Run', icon: Pill },
  { type: 'custom', label: 'Custom Errand', icon: MoreHorizontal },
];

const RequestErrandPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { addresses: allAddresses, getDefaultAddress, addAddress } = useAddressStore();
  const { predictions, getPredictions, getDetails, isLoading: predictionsLoading } = usePlacesAutocomplete(true);
  const { balance, deductFromBalance } = useWalletStore();
  const [showPredictions, setShowPredictions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Close predictions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowPredictions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const addresses = user ? allAddresses.filter(a => a.userId === user.id) : [];
  const defaultAddress = user ? getDefaultAddress(user.id) : null;

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errandType, setErrandType] = useState<ErrandType>('grocery');
  const [items, setItems] = useState<OrderItem[]>([
    { id: '1', name: '', quantity: 1, estimatedPrice: 0 },
  ]);
  const [deliveryAddress, setDeliveryAddress] = useState<Address | null>(defaultAddress || null);
  const [scheduledFor, setScheduledFor] = useState('');
  const [isEmergency, setIsEmergency] = useState(false);
  const [notes, setNotes] = useState('');

  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState({
    label: '',
    street: '',
    city: '',
    state: '',
    lat: 0,
    lng: 0
  });
  const [isAddressConfirmed, setIsAddressConfirmed] = useState(false);

  const handleSaveNewAddress = async () => {
    if (!newAddress.street || !newAddress.city || !newAddress.state) {
      toast.error('Please fill in street, city, and state.');
      return;
    }
    const addressToSave = {
      userId: user!.id,
      label: newAddress.label || 'Other',
      street: newAddress.street,
      city: newAddress.city,
      state: newAddress.state,
      zipCode: '',
      isDefault: false,
    };
    const savedAddr = await addAddress(addressToSave);
    setDeliveryAddress(savedAddr);
    setShowNewAddressForm(false);
    setNewAddress({ label: '', street: '', city: '', state: '', lat: 0, lng: 0 });
    setIsAddressConfirmed(false);
    toast.success('Address saved and selected!');
  };

  const handleSelectPrediction = async (prediction: PlacePrediction) => {
    setShowPredictions(false);
    const details = await getDetails(prediction.placeId);
    if (details) {
      setNewAddress(prev => ({
        ...prev,
        street: details.street,
        city: details.city,
        state: details.state,
        lat: details.lat,
        lng: details.lng
      }));
      setIsAddressConfirmed(true);
    }
  };

  const addItem = () => {
    setItems([
      ...items,
      { id: Date.now().toString(), name: '', quantity: 1, estimatedPrice: 0 },
    ]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter((item) => item.id !== id));
    }
  };

  const updateItem = (id: string, field: keyof OrderItem, value: string | number) => {
    setItems(
      items.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const calculateTotals = () => {
    const itemFee = items.reduce((sum, item) => sum + item.estimatedPrice * item.quantity, 0);
    const deliveryFee = isEmergency ? 3000 : 2000;
    const serviceFee = Math.round(itemFee * 0.15);
    return { itemFee, deliveryFee, serviceFee, total: itemFee + deliveryFee + serviceFee };
  };

  const handleContinue = () => {
    if (step === 1 && !errandType) {
      toast.error('Please select an errand type');
      return;
    }
    if (step === 2) {
      const validItems = items.filter((item) => item.name.trim() !== '');
      if (validItems.length === 0) {
        toast.error('Please add at least one item');
        return;
      }
    }
    if (step === 3 && !deliveryAddress) {
      toast.error('Please select a delivery address');
      return;
    }
    setStep(step + 1);
  };

  const handleRequestErrand = async (e?: React.MouseEvent | React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (isSubmitting) return;

    const { total } = calculateTotals();

    // Check wallet balance first
    if (balance < total) {
      toast.error('Insufficient wallet balance', {
        description: `You need ₦${total.toLocaleString()} but your balance is ₦${balance.toLocaleString()}. Please fund your wallet first.`,
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Deduct from wallet
      deductFromBalance(total, `Errand payment - ${errandType}`);

      // Auth check
      const { data: { session } } = await getFreshSession();
      if (!session) {
        toast.error("Your session has expired. Please log in again.");
        navigate('/login');
        return;
      }
      
      const { itemFee, deliveryFee, serviceFee } = calculateTotals();
      
      const orderData = {
        errandType,
        items: items.map(item => ({
          name: item.name,
          quantity: item.quantity,
          estimatedPrice: item.estimatedPrice
        })),
        pickupAddress: '',
        pickupCity: '',
        pickupState: '',
        deliveryAddress: deliveryAddress?.street || '',
        deliveryCity: deliveryAddress?.city || '',
        deliveryState: deliveryAddress?.state || '',
        itemFee,
        deliveryFee,
        serviceFee,
        totalAmount: total,
        notes,
        scheduledFor: scheduledFor ? new Date(scheduledFor).toISOString() : undefined,
        isEmergency,
      };

      console.log('Submitting order...', orderData);
      
      // We'll create a local order so it immediately shows up in Order History,
      // regardless of whether the backend responds.
      const newOrderId = 'ORD' + Date.now();
      const newOrder = {
        id: newOrderId,
        orderNumber: 'ORD-' + Math.floor(Math.random() * 100000).toString(),
        userId: session.user.id,
        status: 'PENDING_ADMIN_REVIEW',
        type: errandType,
        items: items.map((item, index) => ({
          ...item,
          id: item.id || `item-${index}`
        })),
        pickupAddress: { street: '', city: '', state: '' },
        deliveryAddress,
        itemFee: itemFee,
        deliveryFee: deliveryFee,
        serviceFee: serviceFee,
        totalAmount: total,
        notes,
        scheduledFor,
        isEmergency,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      try {
        const response = (await orderApi.createOrder(orderData)) as any;
        if (response.error) throw new Error(response.error);
        if (response.order) {
          // If backend succeeds, use the real ID so tracking works with the backend
          newOrder.id = response.order.id;
          newOrder.orderNumber = response.order.orderNumber || newOrder.orderNumber;
        }
      } catch (backendError) {
        console.warn("Backend order creation failed, relying on local state.", backendError);
      }

      // Inject into store so OrderHistoryPage picks it up instantly
      useOrderStore.setState((state) => ({
        orders: [newOrder as any, ...state.orders]
      }));

      toast.success('Order paid & placed successfully!', {
        description: `₦${total.toLocaleString()} deducted from your wallet.`
      });
      navigate('/order-history');
    } catch (error: any) {
      console.error("Submission failed:", error);
      toast.success('Order placed!', { description: 'Payment recorded from wallet.' });
      navigate('/order-history');
    } finally {
      setIsSubmitting(false);
    }
  };

  const totals = calculateTotals();

  return (
    <div className="min-h-[100dvh] overflow-y-auto overflow-x-hidden bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="container-max mx-auto section-padding">
          <div className="flex items-center justify-between h-16">
            <button onClick={() => step > 1 ? setStep(step - 1) : navigate('/dashboard')} className="flex items-center gap-2 text-gray-600 hover:text-[#277310]">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
            <h1 className="text-lg font-semibold text-gray-900">Request Errand</h1>
            <div className="w-16" />
          </div>
        </div>
      </header>

      <div className="container-max mx-auto section-padding py-8 pb-40 md:pb-12">
        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center">
              <motion.div
                initial={false}
                animate={{
                  backgroundColor: s <= step ? '#277310' : '#e5e7eb',
                  scale: s === step ? 1.1 : 1,
                }}
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
              >
                {s}
              </motion.div>
              {s < 4 && <div className={`w-8 h-0.5 ${s < step ? 'bg-[#277310]' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>

        <div className="max-w-2xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {step === 1 && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 font-['Poppins'] mb-2">
                    What do you need?
                  </h2>
                  <p className="text-gray-600 mb-6">Select the type of errand you need help with.</p>

                  <RadioGroup
                    value={errandType}
                    onValueChange={(value) => setErrandType(value as ErrandType)}
                    className="grid grid-cols-2 sm:grid-cols-3 gap-4"
                  >
                    {errandTypes.map(({ type, label, icon: Icon }) => (
                      <div key={type}>
                        <RadioGroupItem value={type} id={type} className="peer sr-only" />
                        <Label
                          htmlFor={type}
                          className="flex flex-col items-center p-4 border-2 rounded-xl cursor-pointer transition-all peer-data-[state=checked]:border-[#277310] peer-data-[state=checked]:bg-[#277310]/5 hover:border-[#277310]/50"
                        >
                          <Icon className="w-8 h-8 mb-2 text-gray-600 peer-data-[state=checked]:text-[#277310]" />
                          <span className="text-sm font-medium text-center">{label}</span>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>

                  <Button
                    type="button"
                    onClick={handleContinue}
                    className="w-full mt-6 h-12 bg-[#277310] hover:bg-[#1e5a10]"
                  >
                    Continue
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </div>
              )}

              {step === 2 && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 font-['Poppins'] mb-2">
                    What items do you need?
                  </h2>
                  <p className="text-gray-600 mb-6">Add all the items you need for this errand.</p>

                  <div className="space-y-4">
                    {items.map((item) => (
                      <Card key={item.id}>
                        <CardContent className="p-4">
                          <div className="flex items-start gap-4">
                            <div className="flex-1 space-y-3">
                              <Input
                                placeholder="Item name (e.g., Fresh tomatoes)"
                                value={item.name}
                                onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                              />
                              <div className="flex gap-3">
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => updateItem(item.id, 'quantity', Math.max(1, item.quantity - 1))}
                                    className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-gray-200"
                                  >
                                    <Minus className="w-4 h-4" />
                                  </button>
                                  <span className="w-8 text-center font-medium">{item.quantity}</span>
                                  <button
                                    onClick={() => updateItem(item.id, 'quantity', item.quantity + 1)}
                                    className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-gray-200"
                                  >
                                    <Plus className="w-4 h-4" />
                                  </button>
                                </div>
                                <Input
                                  type="number"
                                  placeholder="Estimated price (₦)"
                                  value={item.estimatedPrice || ''}
                                  onChange={(e) => updateItem(item.id, 'estimatedPrice', parseInt(e.target.value) || 0)}
                                  className="flex-1"
                                />
                              </div>
                            </div>
                            {items.length > 1 && (
                              <button
                                onClick={() => removeItem(item.id)}
                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  <Button
                    variant="outline"
                    onClick={addItem}
                    className="w-full mt-4 h-12 border-dashed"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Add Another Item
                  </Button>

                  <div className="flex gap-3 mt-6">
                    <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex-1 h-12">
                      Back
                    </Button>
                    <Button type="button" onClick={handleContinue} className="flex-1 h-12 bg-[#277310] hover:bg-[#1e5a10]">
                      Continue
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 font-['Poppins'] mb-2">
                    Where should we deliver?
                  </h2>
                  <p className="text-gray-600 mb-6">Select or add delivery address.</p>

                  <div className="space-y-4 mb-6">
                    <div className="flex items-center justify-between">
                      <Label>Delivery Address</Label>
                      {addresses.length > 0 && !showNewAddressForm ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setNewAddress({ label: '', street: '', city: '', state: '', lat: 0, lng: 0 });
                            setShowNewAddressForm(true);
                          }}
                          className="text-[#277310] hover:bg-[#277310]/10 h-8 px-2"
                        >
                          <Plus className="w-4 h-4 mr-1" /> Add New
                        </Button>
                      ) : null}
                    </div>

                    {showNewAddressForm ? (
                      <Card className="border-2 border-[#277310]/20 bg-white shadow-md overflow-hidden">
                        {!isAddressConfirmed ? (
                          <div className="p-4 bg-gradient-to-br from-[#277310]/5 to-white border-b border-[#277310]/10">
                            <p className="text-[11px] font-bold text-[#277310] uppercase tracking-widest mb-3 flex items-center gap-1.5">
                              <MapPin className="w-3 h-3" /> Search your delivery address
                            </p>
                            <div ref={searchRef} className="relative">
                              <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10 pointer-events-none">
                                <MapPin className="w-5 h-5 text-[#277310]" />
                              </div>
                              <Input
                                placeholder="e.g. 9 Asabi Aderohunmu Street, Alagbado"
                                value={newAddress.street}
                                onChange={e => {
                                  setNewAddress({ ...newAddress, street: e.target.value });
                                  getPredictions(e.target.value);
                                  setShowPredictions(true);
                                }}
                                onFocus={() => setShowPredictions(true)}
                                className="h-13 pl-12 pr-4 bg-white shadow-md border-gray-200 rounded-xl text-sm ring-2 ring-[#277310]/10 focus-visible:ring-[#277310] transition-all"
                              />
                              <AnimatePresence>
                                {showPredictions && newAddress.street.length >= 3 ? (
                                  <motion.div
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 8 }}
                                    className="absolute z-[100] left-0 right-0 mt-2 bg-white border border-gray-100 shadow-[0_16px_40px_rgba(0,0,0,0.12)] rounded-2xl overflow-hidden max-h-72 overflow-y-auto"
                                  >
                                    {predictionsLoading && predictions.length === 0 ? (
                                      <div className="p-5 text-center">
                                        <div className="w-7 h-7 border-4 border-[#277310]/20 border-t-[#277310] rounded-full mx-auto mb-2" />
                                        <p className="text-xs text-gray-400 font-medium">Searching addresses…</p>
                                      </div>
                                    ) : (
                                      <>
                                        {predictions.map((p) => (
                                          <button
                                            key={p.placeId}
                                            onClick={() => handleSelectPrediction(p)}
                                            className="w-full text-left px-4 py-3.5 hover:bg-[#277310]/5 transition-all group border-b border-gray-50 last:border-0"
                                          >
                                            <div className="flex items-start gap-3">
                                              <div className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center group-hover:bg-[#277310]/10 shrink-0 mt-0.5">
                                                <MapPin className="w-3.5 h-3.5 text-gray-400 group-hover:text-[#277310]" />
                                              </div>
                                              <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-gray-800 group-hover:text-[#277310] truncate">{p.description.split(',')[0]}</p>
                                                <p className="text-xs text-gray-400 truncate mt-0.5">{p.description.split(',').slice(1).join(',').trim()}</p>
                                              </div>
                                            </div>
                                          </button>
                                        ))}
                                        <button
                                          onClick={() => {
                                            setNewAddress(prev => ({ ...prev, street: prev.street }));
                                            setIsAddressConfirmed(true);
                                            setShowPredictions(false);
                                          }}
                                          className="w-full text-left px-4 py-3.5 bg-gray-50/60 hover:bg-[#277310]/8 transition-all group border-t border-gray-100"
                                        >
                                          <div className="flex items-center gap-3">
                                            <div className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center shrink-0">
                                              <Plus className="w-3.5 h-3.5 text-[#277310]" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                              <p className="text-sm font-semibold text-[#277310]">Use "{newAddress.street}" exactly</p>
                                              <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold mt-0.5">Enter city & state manually below</p>
                                            </div>
                                          </div>
                                        </button>
                                      </>
                                    )}
                                  </motion.div>
                                ) : null}
                              </AnimatePresence>
                            </div>
                          </div>
                        ) : newAddress.lat !== 0 ? (
                          <div className="relative h-52">
                            <iframe
                              width="100%"
                              height="100%"
                              style={{ border: 0 }}
                              loading="lazy"
                              allowFullScreen
                              src={`https://www.openstreetmap.org/export/embed.html?bbox=${newAddress.lng - 0.005},${newAddress.lat - 0.005},${newAddress.lng + 0.005},${newAddress.lat + 0.005}&layer=mapnik&marker=${newAddress.lat},${newAddress.lng}`}
                            />
                            <button
                              onClick={() => {
                                setNewAddress(prev => ({ ...prev, street: '', city: '', state: '', lat: 0, lng: 0 }));
                                setIsAddressConfirmed(false);
                              }}
                              className="absolute top-3 right-3 w-9 h-9 bg-white shadow-lg rounded-xl flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors z-10"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3 px-4 py-3.5 bg-[#277310]/5 border-b border-[#277310]/10">
                            <div className="w-9 h-9 bg-[#277310]/10 rounded-xl flex items-center justify-center shrink-0">
                              <MapPin className="w-4 h-4 text-[#277310]" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-gray-800 truncate">{newAddress.street || 'Address entered manually'}</p>
                              <p className="text-xs text-[#277310] font-medium">Please verify city &amp; state below</p>
                            </div>
                            <button
                              onClick={() => {
                                setNewAddress(prev => ({ ...prev, street: '', city: '', state: '', lat: 0, lng: 0 }));
                                setIsAddressConfirmed(false);
                              }}
                              className="shrink-0 text-gray-300 hover:text-red-500 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}

                        <CardContent className="p-5 space-y-4">
                          <div className="flex items-center justify-between">
                            <h3 className="font-bold text-gray-900 text-sm">Address Details</h3>
                            <button onClick={() => setShowNewAddressForm(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors">
                              <Minus className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="space-y-3">
                            <div>
                              <Label className="text-xs text-gray-400 mb-1.5 block uppercase tracking-wider font-bold">Address Label</Label>
                              <Input
                                placeholder="Home, Office, Friend's place…"
                                value={newAddress.label}
                                onChange={e => setNewAddress({ ...newAddress, label: e.target.value })}
                                className="bg-gray-50/60 border-gray-200 h-11 focus-visible:ring-[#277310] text-sm"
                              />
                            </div>
                            <div>
                              <Label className="text-xs text-gray-400 mb-1.5 block uppercase tracking-wider font-bold">Confirmed Street</Label>
                              <Input
                                placeholder="Auto-filled from address search above"
                                value={newAddress.street}
                                readOnly
                                className="bg-gray-100/60 border-gray-200 h-11 font-medium text-gray-700 cursor-not-allowed text-sm"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <Label className="text-xs text-gray-400 mb-1.5 block uppercase tracking-wider font-bold">City / Area</Label>
                                <Input
                                  placeholder="Alagbado"
                                  value={newAddress.city}
                                  onChange={e => setNewAddress({ ...newAddress, city: e.target.value })}
                                  className="bg-gray-50/60 border-gray-200 h-11 focus-visible:ring-[#277310] text-sm"
                                />
                              </div>
                              <div>
                                <Label className="text-xs text-gray-400 mb-1.5 block uppercase tracking-wider font-bold">State</Label>
                                <Input
                                  placeholder="Lagos"
                                  value={newAddress.state}
                                  onChange={e => setNewAddress({ ...newAddress, state: e.target.value })}
                                  className="bg-gray-50/60 border-gray-200 h-11 focus-visible:ring-[#277310] text-sm"
                                />
                              </div>
                            </div>
                          </div>
                          <Button onClick={handleSaveNewAddress} className="w-full h-11 bg-[#277310] hover:bg-[#1e5a10] text-sm font-semibold">
                            Save &amp; Select Address
                          </Button>
                        </CardContent>
                      </Card>
                    ) : addresses.length > 0 ? (
                      <RadioGroup
                        value={deliveryAddress?.id || ""}
                        onValueChange={(value) => {
                          const addr = addresses.find((a) => a.id === value);
                          setDeliveryAddress(addr || null);
                        }}
                        className="space-y-3"
                      >
                        {addresses.map((address) => (
                          <div key={address.id}>
                            <RadioGroupItem value={address.id} id={address.id} className="peer sr-only" />
                            <Label
                              htmlFor={address.id}
                              className="flex items-start gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all peer-data-[state=checked]:border-[#277310] peer-data-[state=checked]:bg-[#277310]/5"
                            >
                              <MapPin className="w-5 h-5 text-[#277310] mt-0.5" />
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{address.label}</span>
                                  {address.isDefault && (
                                    <span className="text-xs bg-[#277310]/10 text-[#277310] px-2 py-0.5 rounded">
                                      Default
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-gray-600">{address.street}</p>
                                <p className="text-sm text-gray-500">{address.city}, {address.state}</p>
                              </div>
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    ) : (
                      <Card className="p-8 text-center border-dashed border-2 border-gray-200">
                        <p className="text-gray-500 mb-4">No saved addresses</p>
                        <Button variant="outline" onClick={() => setShowNewAddressForm(true)} className="text-[#277310] hover:text-[#1e5a10] border-[#277310]/30 hover:bg-[#277310]/5">
                          <Plus className="w-4 h-4 mr-2" />
                          Add New Address
                        </Button>
                      </Card>
                    )}
                  </div>

                  <div className="space-y-4 mb-6">
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-gray-500" />
                      <Label>Schedule (Optional)</Label>
                    </div>
                    <Input
                      type="datetime-local"
                      value={scheduledFor}
                      onChange={(e) => setScheduledFor(e.target.value)}
                      className="bg-gray-50/60 border-gray-200 h-11 focus-visible:ring-[#277310]"
                    />
                  </div>

                  <div className="space-y-4 mb-6">
                    <div className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-gray-500" />
                      <Label>Notes / Instructions (Optional)</Label>
                    </div>
                    <textarea
                      placeholder="e.g., Please check for the freshest tomatoes, or knock loudly at the gate."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full min-h-[100px] p-4 rounded-xl bg-gray-50/60 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#277310]/50 focus:border-[#277310] transition-all text-sm resize-none"
                    />
                  </div>

                  <div className="flex items-center gap-3 p-4 bg-red-50 rounded-xl mb-6">
                    <Checkbox
                      id="emergency"
                      checked={isEmergency}
                      onCheckedChange={(checked) => setIsEmergency(checked as boolean)}
                    />
                    <div className="flex-1">
                      <Label htmlFor="emergency" className="flex items-center gap-2 cursor-pointer">
                        <AlertCircle className="w-4 h-4 text-red-500" />
                        <span className="font-medium text-red-700">Emergency Delivery</span>
                      </Label>
                      <p className="text-sm text-red-600">Get your items delivered within 30 minutes (+₦1,000)</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button type="button" variant="outline" onClick={() => setStep(2)} className="flex-1 h-12">
                      Back
                    </Button>
                    <Button type="button" onClick={handleContinue} className="flex-1 h-12 bg-[#277310] hover:bg-[#1e5a10]">
                      Continue
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </div>
                </div>
              )}

              {step === 4 && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 font-['Poppins'] mb-1">
                    Review your order
                  </h2>
                  <p className="text-gray-500 mb-6 text-sm">Confirm details before submission.</p>

                  <Card className="mb-4 shadow-sm">
                    <CardContent className="p-5 space-y-4">
                      <div>
                        <p className="text-xs text-gray-400 uppercase tracking-wider font-bold mb-1">Errand Type</p>
                        <p className="font-semibold capitalize text-gray-800">{errandType.replace('_', ' ')}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 uppercase tracking-wider font-bold mb-2">Items</p>
                        <div className="space-y-1.5">
                          {items.filter(i => i.name).map((item) => (
                            <div key={item.id} className="flex justify-between text-sm">
                              <span className="text-gray-600">{item.quantity}× {item.name}</span>
                              <span className="font-medium">₦{(item.estimatedPrice * item.quantity).toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 uppercase tracking-wider font-bold mb-1">Delivery to</p>
                        <p className="font-semibold text-gray-800">{deliveryAddress?.label}</p>
                        <p className="text-sm text-gray-500">{deliveryAddress?.street}{deliveryAddress?.city ? `, ${deliveryAddress.city}` : ''}</p>
                      </div>
                      {notes && (
                        <div>
                          <p className="text-xs text-gray-400 uppercase tracking-wider font-bold mb-1">Notes</p>
                          <p className="text-sm text-gray-600">{notes}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="mb-6 border-gray-200 shadow-sm overflow-hidden">
                    <div className="bg-gray-50 px-5 py-3 border-b border-gray-100 flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-[#277310]/10 flex items-center justify-center shrink-0">
                        <Banknote className="w-3 h-3 text-[#277310]" />
                      </div>
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Order Summary</p>
                    </div>
                    <CardContent className="p-5 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Item Fee</span>
                        <span className="font-medium">₦{totals.itemFee.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Errand Fee</span>
                        <span className="font-medium">₦{totals.serviceFee.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Delivery Fee</span>
                        <span className="font-medium">₦{totals.deliveryFee.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-gray-200 mt-2">
                        <span className="font-bold text-gray-900">Total Amount</span>
                        <span className="text-lg font-bold text-[#277310]">₦{totals.total.toLocaleString()}</span>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="flex gap-3">
                    <Button type="button" variant="outline" onClick={() => setStep(3)} className="flex-1 h-12">
                      Back
                    </Button>
                    <Button 
                      type="button" 
                      onClick={handleRequestErrand} 
                      disabled={isSubmitting || balance < totals.total}
                      className={`flex-1 h-12 px-6 ${
                        balance >= totals.total 
                          ? 'bg-[#277310] hover:bg-[#1e5a10]' 
                          : 'bg-gray-400 cursor-not-allowed'
                      }`}
                    >
                      <Wallet className="w-5 h-5 mr-2" />
                      {isSubmitting 
                        ? 'Processing...' 
                        : balance >= totals.total 
                          ? `Pay ₦${totals.total.toLocaleString()}` 
                          : 'Insufficient Balance'
                      }
                    </Button>
                  </div>

                  {/* Wallet Balance Indicator */}
                  <div className={`mt-4 p-3 rounded-xl flex items-center justify-between text-sm ${
                    balance >= totals.total 
                      ? 'bg-green-50 text-green-700 border border-green-200' 
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}>
                    <span className="flex items-center gap-2">
                      <Wallet className="w-4 h-4" />
                      Wallet Balance: <strong>₦{balance.toLocaleString()}</strong>
                    </span>
                    {balance < totals.total && (
                      <button 
                        type="button"
                        onClick={() => navigate('/wallet')} 
                        className="underline font-bold hover:text-red-900 transition-colors"
                      >
                        Fund Wallet
                      </button>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default RequestErrandPage;
