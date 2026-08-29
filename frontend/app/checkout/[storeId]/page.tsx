import CheckoutPage from "@/components/checkout/CheckoutPage";

interface PageProps {
  params: Promise<{ storeId: string }>;
  searchParams: Promise<{ items?: string; itemId?: string; quantity?: string }>;
}

export default async function Page({ params, searchParams }: PageProps) {
  const { storeId } = await params;
  const { items, itemId, quantity } = await searchParams;

  if (itemId) {
    return (
      <CheckoutPage
        storeId={Number(storeId)}
        directItem={{ itemId: Number(itemId), quantity: Number(quantity ?? 1) }}
      />
    );
  }

  const selectedItemIds = items ? items.split(",").map(Number) : [];
  return <CheckoutPage storeId={Number(storeId)} selectedItemIds={selectedItemIds} />;
}