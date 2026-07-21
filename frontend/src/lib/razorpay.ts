declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open: () => void };
  }
}

let loadPromise: Promise<void> | null = null;

export function loadRazorpayScript(): Promise<void> {
  if (window.Razorpay) return Promise.resolve();

  loadPromise ??= new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Razorpay checkout script"));
    document.body.appendChild(script);
  });

  return loadPromise;
}

interface RazorpayOrder {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
}

interface RazorpayVerifyPayload {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export async function payWithRazorpay(opts: {
  createOrder: () => Promise<RazorpayOrder>;
  verify: (payload: RazorpayVerifyPayload) => Promise<unknown>;
  description: string;
  prefill: { name: string; email: string };
  onSuccess: () => void;
}) {
  await loadRazorpayScript();
  const order = await opts.createOrder();

  const razorpay = new window.Razorpay({
    key: order.keyId,
    amount: order.amount,
    currency: order.currency,
    order_id: order.orderId,
    name: "MahaHub",
    description: opts.description,
    handler: async (response: RazorpayVerifyPayload) => {
      await opts.verify(response);
      opts.onSuccess();
    },
    prefill: opts.prefill,
    theme: { color: "#2563EB" },
  });
  razorpay.open();
}
