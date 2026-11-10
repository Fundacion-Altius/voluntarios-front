import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import Faq from "@/components/klaruk/Faq";
import FeatureCard from "@/components/klaruk/FeatureCard";
import ScatterToOne from "@/components/klaruk/ScatterToOne";
import { TRIAL_URL } from "@/components/klaruk/links";
import type { FeatureGroup } from "@/components/klaruk/features";

// All copy: messages/*.json -> klaruk.home, klaruk.features, klaruk.faq, klaruk.cta.
export default async function Home({ params }: { params: { locale: string } }) {
  setRequestLocale(params.locale);
  const t = await getTranslations("klaruk");
  const h = (k: string) => t(`home.${k}`);
  const CTA = t("cta");
  // Lists are stored as objects keyed "1", "2"... (next-intl message types do not allow arrays).
  const groups = Object.values(t.raw("features.groups") as Record<string, { title: string; benefit: string; items: Record<string, string> }>)
    .map((g): FeatureGroup => ({ ...g, items: Object.values(g.items) }));
  const faq = Object.values(t.raw("faq") as Record<string, { q: string; a: string }>).map((x) => ({ q: x.q, a: <p>{x.a}</p> }));
  return (
    <>
      <section className="hero-band">
        <div className="hero wrap">
        <div className="hero-text">
          <h1 className="hero-title">{h("heroTitle")}</h1>
          <p className="lead">{h("heroLead")}</p>
          <div className="actions">
            <a className="btn btn-primary" href={TRIAL_URL}>{CTA}</a>
            <Link className="btn btn-secondary" href="/planes">{h("seePlans")}</Link>
          </div>
          <ul className="pills" aria-label={h("pillsLabel")}>
            <li>{h("pills.users")}</li><li>{h("pills.ai")}</li><li>{h("pills.lang")}</li><li>{h("pills.data")}</li>
          </ul>
        </div>
        <figure className="shot">
          <div className="shot-bar" aria-hidden="true"><span /><span /><span /></div>
          {/* Demo data only (Fundación Altius demo tenant). */}
          {/* eslint-disable-next-line @next/next/no-img-element -- static marketing asset, sized below */}
          <img src="/klaruk/panel-demo.png" width={1440} height={900} alt={h("shotAlt")} fetchPriority="high" />
        </figure>
        </div>
      </section>

      <section className="band">
        <div className="wrap">
          <h2>{h("painsTitle")}</h2>
          <div className="grid3 pains">
            <div className="card">{h("pain1")}</div>
            <div className="card">{h("pain2")}</div>
            <div className="card card-accent">{h("pain3")}</div>
          </div>
        </div>
      </section>

      <section className="wrap section story">
        <div className="story-text">
          <h2>{h("storyTitle")}</h2>
          <p className="lead">{h("storyLead")}</p>
          <p>{h("storyBy")}</p>
        </div>
        <ScatterToOne />
      </section>

      <section className="band band-tint" id="funcionalidades" aria-labelledby="features-title">
        <div className="wrap">
        <h2 id="features-title">{t("features.title")}</h2>
        <p className="lead features-sub">{t("features.subtitle")}</p>
        <div className="features-grid">
          {groups.map((f, i) => <FeatureCard key={f.title} f={f} index={i} />)}
        </div>
        </div>
      </section>

      <section className="band">
        <div className="wrap hours">
          <div className="hours-fig" aria-hidden="true">
            <p className="hours-num"><span>10</span> {h("hoursUnit")}</p>
            <p className="hours-note">{h("hoursNote")}</p>
          </div>
          <div className="hours-text">
            <h2>{h("hoursTitle")}</h2>
            <p className="lead">{t.rich("home.hoursLead", { b: (c) => <strong>{c}</strong> })}</p>
          </div>
        </div>
      </section>

      <section className="wrap section">
        <h2>{h("stepsTitle")}</h2>
        <ol className="steps">
          <li>{h("step1")}</li>
          <li>{h("step2")}</li>
          <li>{h("step3")}</li>
        </ol>
        <a className="btn btn-primary" href={TRIAL_URL}>{CTA}</a>
      </section>

      <section className="wrap section">
        <div className="grid2">
          <div className="card compare yes"><h3>{h("withTitle")}</h3><p>{h("withText")}</p></div>
          <div className="card compare no"><h3>{h("withoutTitle")}</h3><p>{h("withoutText")}</p></div>
        </div>
      </section>

      <section className="wrap section faq-split">
        <div className="faq-side">
          <h2>{h("faqTitle")}</h2>
          <div className="card faq-card">
            <p><strong>{h("faqCardTitle")}</strong></p>
            <p>{h("faqCardText")}</p>
            <Link href="/planes">{h("faqCardLink")}</Link>
          </div>
        </div>
        <Faq items={faq} />
      </section>

      <section className="closing closing-dark">
        <div className="wrap center">
          <h2>{h("closingTitle")}</h2>
          <div className="actions center">
            <a className="btn btn-primary" href={TRIAL_URL}>{CTA}</a>
            <Link className="btn btn-secondary" href="/planes">{h("closingPlans")}</Link>
          </div>
          <p className="meta">{h("closingMeta")}</p>
        </div>
      </section>
    </>
  );
}
