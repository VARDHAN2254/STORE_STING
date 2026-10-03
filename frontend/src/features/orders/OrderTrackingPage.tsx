import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle2, Clock, Truck, ShieldCheck, Box, Package, ArrowRight, Sparkles } from 'lucide-react';
import { OrderDetailData } from '../../types';
import { api } from '../../services/api';

const ORDER_STAGES = [
  { key: 'ORDER_PLACED', label: 'Order Confirmed', icon: <CheckCircle2 className="w-5 h-5" /> },
  { key: 'INVENTORY_VERIFIED', label: 'Inventory Reserved', icon: <Box className="w-5 h-5" /> },
  { key: 'PAYMENT_AUTHORIZED', label: 'Payment Authorized', icon: <ShieldCheck className="w-5 h-5" /> },
  { key: 'PACKED', label: 'Preparing Shipment', icon: <Package className="w-5 h-5" /> },
  { key: 'SHIPPED', label: 'In Transit', icon: <Truck className="w-5 h-5" /> },
  { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', icon: <Clock className="w-5 h-5" /> },
  { key: 'DELIVERED', label: 'Delivered', icon: <Sparkles className="w-5 h-5" /> },
];

export const OrderTrackingPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [orderData, setOrderData] = useState<OrderDetailData | null>(null);
  const [liveEvents, setLiveEvents] = useState<any[]>([]);
  const [currentStatus, setCurrentStatus] = useState<string>('CREATED');
  const [isLoading, setIsLoading] = useState(true);

  // Initial fetch
  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    api.getOrderDetail(id)
      .then((data) => {
        setOrderData(data);
        setCurrentStatus(data.order.status);
        setLiveEvents(data.events || []);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [id]);

  // Server-Sent Events (SSE) Live Stream connection
  useEffect(() => {
    if (!id) return;

    const eventSource = new EventSource(`/api/orders/${id}/stream`);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'connected') return;

        if (data.state) {
          setCurrentStatus(data.state);
        }

        setLiveEvents((prev) => [
          ...prev,
          {
            agent: data.agent,
            state: data.state,
            payload: data.payload,
            timestamp: new Date().toISOString(),
          },
        ]);

        // Refetch full order data on delivery or major state change
        if (data.state === 'DELIVERED' || data.state === 'SHIPPED') {
          api.getOrderDetail(id).then(setOrderData).catch(console.error);
        }
      } catch (err) {
        console.error('SSE parse error', err);
      }
    };

    eventSource.onerror = () => {
      // EventSource reconnects automatically
    };

    return () => {
      eventSource.close();
    };
  }, [id]);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 animate-pulse space-y-6">
        <div className="h-8 bg-mist rounded-xl w-1/3" />
        <div className="h-48 bg-mist rounded-3xl" />
        <div className="h-64 bg-mist rounded-3xl" />
      </div>
    );
  }

  if (!orderData) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <h2 className="font-display font-bold text-2xl text-ink">Order not found</h2>
        <Link to="/" className="mt-4 inline-block text-xs font-semibold text-mint-dark underline">
          Return Home
        </Link>
      </div>
    );
  }

  const { order, items, shipment } = orderData;

  const getStageIndex = (status: string) => {
    const idx = ORDER_STAGES.findIndex((s) => s.key === status);
    return idx === -1 ? 0 : idx;
  };

  const currentStageIdx = getStageIndex(currentStatus);

  const formatPrice = (val: string | number) => {
    const num = typeof val === 'string' ? parseFloat(val) : val;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(num);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Header with Order Number & Live SSE Status Badge */}
      <div className="bg-surface border border-ink-border/60 rounded-3xl p-6 sm:p-8 shadow-soft-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-mint-dark mb-1">
            <span className="w-2 h-2 rounded-full bg-mint animate-pulse" />
            <span>LIVE TELEMETRY STREAMING</span>
          </div>
          <h1 className="font-display font-black text-2xl sm:text-3xl text-ink">
            ORDER #{order.order_number}
          </h1>
          <p className="text-xs text-ink-muted mt-1">
            Placed on {new Date(order.created_at).toLocaleString()} • Recipient: {order.customer_name}
          </p>
        </div>

        <div className="text-left sm:text-right">
          <span className="text-[10px] uppercase font-bold tracking-wider text-ink-muted block">
            Status
          </span>
          <span className="inline-block mt-1 px-4 py-1.5 rounded-full text-xs font-extrabold bg-mint-light text-ink border border-mint">
            {currentStatus.replace('_', ' ')}
          </span>
        </div>
      </div>

      {/* Progress Stage Tracker */}
      <div className="bg-surface border border-ink-border/60 rounded-3xl p-6 sm:p-8 shadow-soft-sm space-y-6">
        <h3 className="font-display font-extrabold text-lg text-ink">
          Order Progress
        </h3>

        <div className="space-y-4">
          {ORDER_STAGES.map((stg, idx) => {
            const isCompleted = idx <= currentStageIdx;
            const isCurrent = idx === currentStageIdx;

            return (
              <div key={stg.key} className="flex items-start space-x-4">
                <div
                  className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${
                    isCompleted
                      ? 'bg-ink text-surface shadow-sm'
                      : 'bg-mist text-ink-muted border border-ink-border/60'
                  }`}
                >
                  {stg.icon}
                </div>

                <div className="flex-1 min-w-0 pt-1">
                  <div className="flex items-center space-x-2">
                    <span className={`text-xs font-bold ${isCompleted ? 'text-ink' : 'text-ink-muted'}`}>
                      {stg.label}
                    </span>
                    {isCurrent && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-mint text-ink">
                        In Progress
                      </span>
                    )}
                  </div>
                  {isCompleted && (
                    <p className="text-[11px] text-ink-muted mt-0.5">
                      Verified by autonomous commerce pipeline
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Shipment & Logistics Details Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Carrier Details */}
        <div className="bg-surface border border-ink-border/60 rounded-3xl p-6 shadow-soft-sm space-y-3">
          <div className="flex items-center space-x-2">
            <Truck className="w-5 h-5 text-ink" />
            <h4 className="font-display font-bold text-base text-ink">Dispatch & Carrier</h4>
          </div>

          <div className="space-y-2 text-xs text-ink-muted pt-2 border-t border-ink-border/50">
            <div className="flex justify-between">
              <span>Carrier:</span>
              <span className="font-bold text-ink">{shipment?.carrier || order.shipping_partner || 'HyperLoop Drone Express'}</span>
            </div>
            <div className="flex justify-between">
              <span>Tracking Number:</span>
              <span className="font-mono font-bold text-ink">{shipment?.tracking_number || order.tracking_number || 'TRK-STING-2050-LIVE'}</span>
            </div>
            <div className="flex justify-between">
              <span>Estimated Delivery:</span>
              <span className="font-bold text-ink">Within {order.estimated_delivery_days} Days</span>
            </div>
          </div>
        </div>

        {/* Financial Summary */}
        <div className="bg-surface border border-ink-border/60 rounded-3xl p-6 shadow-soft-sm space-y-3">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-ink" />
            <h4 className="font-display font-bold text-base text-ink">Payment & Totals</h4>
          </div>

          <div className="space-y-2 text-xs text-ink-muted pt-2 border-t border-ink-border/50">
            <div className="flex justify-between">
              <span>Payment Mode:</span>
              <span className="font-bold text-ink">{order.payment_method}</span>
            </div>
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span className="font-semibold text-ink">{formatPrice(order.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Delivery Charge:</span>
              <span className="font-semibold text-ink">{parseFloat(order.shipping) === 0 ? 'FREE' : formatPrice(order.shipping)}</span>
            </div>
            <div className="flex justify-between pt-1 border-t border-ink-border/40 text-sm font-extrabold text-ink">
              <span>Total Paid:</span>
              <span>{formatPrice(order.total)}</span>
            </div>
          </div>
        </div>

      </div>

      {/* Ordered Products Items */}
      <div className="bg-surface border border-ink-border/60 rounded-3xl p-6 shadow-soft-sm space-y-4">
        <h4 className="font-display font-bold text-base text-ink">
          Items in this Package ({items.length})
        </h4>

        <div className="divide-y divide-ink-border/40">
          {items.map((item) => (
            <div key={item.id} className="py-3 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {item.image && (
                  <img src={item.image} alt={item.product_name} className="w-12 h-12 object-cover rounded-xl bg-pearl" />
                )}
                <div>
                  <h5 className="font-display font-bold text-xs sm:text-sm text-ink">{item.product_name}</h5>
                  <span className="text-[11px] text-ink-muted">Qty: {item.quantity} • SKU: {item.sku}</span>
                </div>
              </div>
              <span className="font-display font-bold text-xs sm:text-sm text-ink">{formatPrice(item.total_price)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="text-center pt-4">
        <Link
          to="/"
          className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-full bg-mist text-ink hover:bg-pearl text-xs font-semibold"
        >
          <span>Continue Shopping</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

    </div>
  );
};
