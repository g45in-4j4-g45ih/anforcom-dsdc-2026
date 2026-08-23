"use client";
import CheckoutPage from "@/components/Checkoutpage";

export default function CheckoutRoute() {
  return (
    <main className="min-h-screen bg-gray-50 py-10 px-4">
      <CheckoutPage
        order={{
          id: 1,
          name: "Nasi Ayam Hainan Maknyus",
          quantity: 1,
          unit: "porsi",
          pricePerUnit: 7000,
        }}
        store={{
          name: "Kedai Ayam Wuenak",
          addressText: "Jl. Contoh No. 10, Semarang",
          latitude: -6.9932,
          longitude: 110.4203,
          pickupStart: "10:00",
          pickupEnd: "22:00",
        }}
        onConfirm={(payload) => {
          console.log("Order dikonfirmasi:", payload);
          // TODO: POST ke Django buat create order beneran
        }}
      />
    </main>
  );
}