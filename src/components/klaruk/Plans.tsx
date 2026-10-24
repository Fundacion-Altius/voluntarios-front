"use client";
import { useState } from "react";
import { TRIAL_URL } from "./links";

type Plan = { name: string; m?: string; a?: string; for: string; items: string[]; alta: string; rec?: boolean };
const plans: Plan[] = [
  { name: "Básico", m: "39 €", a: "390 €", for: "Para asociaciones pequeñas que hoy lo llevan todo en Excel o WhatsApp y quieren ordenarse.", items: ["Actividades y turnos", "Portal del voluntariado", "Gamificación", "Socios y exportación", "Mensajería con chat interno", "Asistente de IA y agentes incluidos"], alta: "Alta: tú mismo, gratis." },
  { name: "Estándar", m: "99 €", a: "990 €", rec: true, for: "Para ONG con socios y voluntariado activos que quieren dejar de perseguir cuotas y hojas de cálculo.", items: ["Todo lo de Básico", "Subvenciones y fondos", "Plantillas de justificación", "Exportación a formatos de financiadores", "Aviso de socios que se van"], alta: "Puesta en marcha acompañada opcional." },
  { name: "Completo", m: "149 €", a: "1.490 €", for: "Para entidades con varios proyectos o sedes que necesitan todo conectado y con la IA trabajando a diario.", items: ["Todo lo de Estándar", "Paneles de impacto", "Informes PDF para financiadores", "Análisis de socios", "Captación de fondos privados y europeos", "Soporte prioritario", "Protección de datos reforzada"], alta: "Puesta en marcha acompañada opcional." },
  { name: "Federación", for: "Para federaciones y redes que dan servicio a muchas asociaciones a la vez.", items: ["Todo lo de Completo", "Para varias organizaciones", "Vista conjunta de toda la red"], alta: "Precio según el tamaño de la red." },
];

export default function Plans() {
  const [annual, setAnnual] = useState(false);
  return (
    <>
      <div className="toggle" role="group" aria-label="Forma de pago">
        <button type="button" aria-pressed={!annual} onClick={() => setAnnual(false)}>Mensual</button>
        <button type="button" aria-pressed={annual} onClick={() => setAnnual(true)}>Anual (2 meses gratis)</button>
      </div>
      <p className="note">Todos los planes incluyen usuarios ilimitados, IA y agentes. Pago anual: pagas 10 meses y tienes 12.</p>
      <div className="plans" aria-live="polite">
        {plans.map((p) => (
          <article key={p.name} className={`card plan${p.rec ? " rec" : ""}`} aria-label={p.rec ? `${p.name}, recomendado` : p.name}>
            {p.rec && <span className="rec-pill">Recomendado</span>}
            <h2>{p.name}</h2>
            <p className={`price${p.m ? "" : " talk"}`}>
              {p.m ? (<>{annual ? p.a : p.m} <small>{annual ? "/año" : "/mes"}</small></>) : "Hablemos"}
            </p>
            <p className="for">{p.for}</p>
            <ul className="ticks">{p.items.map((i) => <li key={i}>{i}</li>)}</ul>
            <p className="alta">{p.alta}</p>
            <a className={`btn ${p.rec ? "btn-primary" : "btn-secondary"}`} href={TRIAL_URL}>Prueba 15 días gratis</a>
          </article>
        ))}
      </div>
    </>
  );
}
