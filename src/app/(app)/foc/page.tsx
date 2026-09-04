import { PageHeader } from "@/components/layout/PageHeader";
import { PageContainer } from "@/components/layout/PageContainer";
import { Card } from "@/components/ui/Card";
import { requireProfile } from "@/lib/auth/session";
import { focContent } from "@/content/foc";
import { t } from "@/i18n/t";

export default async function FocPage() {
  const profile = await requireProfile();

  return (
    <>
      <PageHeader kicker="El material i el vestit" title={t.nav.foc} userName={profile.full_name} />
      <PageContainer>
        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>

          <section>
            <h3 style={{ fontSize: 20, marginBottom: 12 }}>{focContent.material.title}</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {focContent.material.items.map((item) => (
                <Card key={item.name} style={{ padding: "14px 16px", gap: 4 }}>
                  <div style={{ fontFamily: "var(--font-heading)", fontSize: 16 }}>{item.name}</div>
                  <div style={{ fontSize: 13, opacity: 0.75 }}>{item.description}</div>
                </Card>
              ))}
            </div>
          </section>

          <section>
            <h3 style={{ fontSize: 20, marginBottom: 12 }}>{focContent.rentar.title}</h3>
            <Card style={{ padding: "14px 16px", gap: 10 }}>
              <div style={{ fontSize: 14 }}><strong>Pas previ:</strong> {focContent.rentar.pasPrvi}</div>
              <div style={{ fontSize: 14 }}><strong>1.</strong> {focContent.rentar.passos[0]}</div>
              <div style={{ fontSize: 14 }}><strong>2.</strong> {focContent.rentar.passos[1]}</div>
              <div style={{ fontSize: 14 }}>
                <strong>3. {focContent.rentar.rentadora.titol}</strong>
                <ul style={{ margin: "6px 0 0", paddingLeft: 20, fontSize: 14, display: "flex", flexDirection: "column", gap: 2 }}>
                  {focContent.rentar.rentadora.punts.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              </div>
              <div style={{ fontSize: 14 }}><strong>4.</strong> {focContent.rentar.passos[2]}</div>
            </Card>
          </section>

          <section>
            <h3 style={{ fontSize: 20, marginBottom: 12 }}>{focContent.tips.title}</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {focContent.tips.items.map((tip) => (
                <div
                  key={tip.n}
                  style={{ display: "flex", gap: 12, padding: "14px 16px", background: "var(--color-accent-100)", borderRadius: 24 }}
                >
                  <div style={{ width: 28, height: 28, flex: "none", borderRadius: "50%", background: "var(--color-accent-500)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-heading)", fontSize: 13 }}>
                    {tip.n}
                  </div>
                  <div>
                    <div style={{ fontFamily: "var(--font-heading)", fontSize: 15 }}>{tip.title}</div>
                    <div style={{ fontSize: 13, opacity: 0.75, marginTop: 2 }}>{tip.text}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>

        </div>
      </PageContainer>
    </>
  );
}
