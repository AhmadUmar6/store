import { Suspense } from "react";
import dynamic from "next/dynamic";

// Dynamically import the client component with no SSR
const CheckoutSuccessContent = dynamic(
  () => import("./CheckoutSuccessContent"),
  { ssr: false, loading: () => <div>Loading...</div> }
);

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CheckoutSuccessContent />
    </Suspense>
  );
}
