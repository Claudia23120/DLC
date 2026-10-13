import { PageHeader } from "@/components/layout/PageHeader";
import { PageContainer } from "@/components/layout/PageContainer";
import { ShopView } from "@/components/shop/ShopView";
import { requireProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { getShopPaymentInfo, listCatalog, listMyOrders } from "@/lib/data/shop";
import { t } from "@/i18n/t";

export default async function ShopPage() {
  const profile = await requireProfile();
  const supabase = await createClient();
  const [catalog, orders] = await Promise.all([
    listCatalog(supabase),
    listMyOrders(supabase, profile.id),
  ]);

  return (
    <>
      <PageHeader kicker={t.nav.colla} title={t.shop.title} showBack userName={profile.full_name} />
      <PageContainer>
        <ShopView
          catalog={catalog}
          orders={orders}
          payment={getShopPaymentInfo()}
          memberName={profile.full_name}
        />
      </PageContainer>
    </>
  );
}
