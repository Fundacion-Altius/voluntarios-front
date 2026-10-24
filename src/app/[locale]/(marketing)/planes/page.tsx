import type { Metadata } from "next";
import Plans from "@/components/klaruk/Plans";
import Faq from "@/components/klaruk/Faq";
import { TRIAL_URL } from "@/components/klaruk/links";

export const metadata: Metadata = { title: "Planes y precios · Klaruk" };
const Y = () => <span className="yes" aria-label="Incluido">✓</span>;
const N = () => <span className="no" aria-label="No incluido">—</span>;
const rows: [string, number][] = [
  ["Usuarios ilimitados", 0], ["Asistente de IA y agentes", 0], ["Actividades, turnos y portal del voluntariado", 0], ["Gamificación", 0], ["Socios y exportación", 0], ["Mensajería con chat interno", 0],
  ["Subvenciones y fondos", 1], ["Plantillas de justificación", 1], ["Exportación a formatos de financiadores", 1], ["Aviso de socios que se van", 1],
  ["Paneles de impacto e informes PDF", 2], ["Análisis de socios", 2], ["Captación de fondos privados y europeos", 2], ["Soporte prioritario", 2], ["Protección de datos reforzada", 2],
  ["Varias organizaciones con vista conjunta", 3],
];
const faq = [
  { q: "¿Cómo sé que me compensa?", a: <p><em>Un ejemplo:</em> si dedicáis unas 10 horas al mes a gestión y valoráis esa hora en 12–15 €, son 120–150 € al mes. Básico y Estándar cuestan menos que eso.</p> },
  { q: "¿Pagamos por cada persona que lo use?", a: <p>No. Todos los planes tienen usuarios ilimitados.</p> },
  { q: "¿Necesitamos saber de tecnología?", a: <p>No. Lo que haces con clics también se lo puedes pedir a la IA con tus palabras.</p> },
  { q: "¿La IA tiene coste extra? ¿Qué pasa si la uso mucho?", a: <p>No tiene coste extra: va incluida. Si la usáis mucho, os avisamos y os proponemos el plan que mejor encaja. Nunca cobramos nada automáticamente ni bloqueamos vuestros datos.</p> },
  { q: "¿Qué pasa con nuestros datos?", a: <p>Son vuestros y podéis exportarlos cuando queráis.</p> },
  { q: "¿Podemos cambiar de plan o dejarlo?", a: <p>Sí. En el pago mensual no hay permanencia y podéis cambiar de plan cuando queráis. La puesta en marcha acompañada es opcional.</p> },
  { q: "¿Podemos pagar de una vez al año?", a: <p>Sí, el pago anual es opcional: pagáis 10 meses y tenéis 12.</p> },
];

export default function Planes() {
  return (
    <>
      <section className="wrap page-head center">
        <h1>Menos horas de papeleo, más horas para tu misión.</h1>
        <p className="lead">Klaruk es el sistema operativo de tu ONG: socios, voluntariado, subvenciones y actividades en un solo sitio. Si te ahorra 10 horas al mes, ya vale más de lo que cuesta.</p>
        <p className="lead">Con un asistente de IA que hace lo mismo que tú con clics.</p>
      </section>
      <section className="wrap center-block"><Plans /></section>
      <section className="wrap section">
        <h2>Compara los planes</h2>
        <div className="table-wrap" tabIndex={0} role="region" aria-label="Tabla comparativa de planes">
          <table>
            <thead><tr><th scope="col"><span className="sr">Característica</span></th><th scope="col">Básico</th><th scope="col" className="rec-col">Estándar</th><th scope="col">Completo</th><th scope="col">Federación</th></tr></thead>
            <tbody>
              <tr><th scope="row">Precio mensual</th><td>39 €</td><td className="rec-col">99 €</td><td>149 €</td><td>Hablemos</td></tr>
              <tr><th scope="row">Precio anual</th><td>390 €</td><td className="rec-col">990 €</td><td>1.490 €</td><td>Hablemos</td></tr>
              {rows.map(([r, from]) => (
                <tr key={r}><th scope="row">{r}</th>{[0, 1, 2, 3].map((c) => <td key={c} className={c === 1 ? "rec-col" : undefined}>{c >= from ? <Y /> : <N />}</td>)}</tr>
              ))}
              <tr><th scope="row">Puesta en marcha</th><td>Tú mismo, gratis</td><td className="rec-col">Acompañada opcional</td><td>Acompañada opcional</td><td>A medida</td></tr>
            </tbody>
          </table>
        </div>
      </section>
      <section className="wrap section narrow">
        <h2>Preguntas frecuentes</h2>
        <Faq items={faq} openFirst />
      </section>
      <section className="closing">
        <div className="wrap center">
          <h2>¿Lo vemos con vuestros datos?</h2>
          <a className="btn btn-primary" href={TRIAL_URL}>Prueba 15 días gratis</a>
          <p className="meta">Klaruk es un producto de <a href="https://shiftcitizen.com">ShiftCitizen</a>.</p>
        </div>
      </section>
    </>
  );
}
