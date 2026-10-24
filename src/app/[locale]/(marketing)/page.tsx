import { Link } from "@/i18n/navigation";
import Faq from "@/components/klaruk/Faq";
import { CTA, TRIAL_URL } from "@/components/klaruk/links";
import { features, featuresTitle, featuresSubtitle } from "@/components/klaruk/features";

const faq = [
  { q: "¿Necesitamos saber de tecnología?", a: <p>No. Si sabéis usar WhatsApp, sabéis usar Klaruk. Y la IA os ayuda con lo que necesitéis.</p> },
  { q: "¿Pagamos por cada usuario?", a: <p>No. Los usuarios son ilimitados en todos los planes.</p> },
  { q: "¿Qué pasa con nuestros datos?", a: <p>Son vuestros y podéis exportarlos cuando queráis.</p> },
  { q: "¿Hay permanencia?", a: <p>No. El pago es mensual, sin permanencia, y podéis cambiar de plan cuando queráis.</p> },
  { q: "¿Qué pasa al acabar la prueba?", a: <p>Elegís plan si queréis seguir. No se pide tarjeta para empezar y nunca cobramos sin que lo elijáis.</p> },
  { q: "¿La IA puede hacer cosas que una persona no podría?", a: <p>No. Tiene exactamente los mismos permisos que el usuario que la usa.</p> },
  { q: "¿Funciona en catalán?", a: <p>Sí, la interfaz está en castellano y en catalán.</p> },
];

export default function Home() {
  return (
    <>
      <section className="hero wrap">
        <div className="hero-text">
          <h1>Tu ONG existe para las personas, no para el papeleo.</h1>
          <p className="lead">Klaruk es el sistema operativo de tu entidad: voluntariado, socios, actividades, subvenciones e impacto en un solo sitio. Hazlo con clics o pídeselo a la IA con tus palabras.</p>
          <div className="actions">
            <a className="btn btn-primary" href={TRIAL_URL}>{CTA}</a>
            <Link className="btn btn-secondary" href="/planes">Ver planes y precios</Link>
          </div>
          <ul className="pills" aria-label="Incluido">
            <li>Usuarios ilimitados</li><li>IA incluida</li><li>En castellano y catalán</li><li>Tus datos son tuyos</li>
          </ul>
        </div>
        <div className="shot-placeholder" role="img" aria-label="Captura del panel de Klaruk (pendiente)">
          <span>Captura del panel de Klaruk</span>
        </div>
      </section>

      <section className="band">
        <div className="wrap">
          <h2>¿Te suena?</h2>
          <div className="grid3">
            <div className="card">Turnos en un Excel, voluntarios en tres grupos de WhatsApp, socios en otra hoja y la justificación de la subvención a última hora.</div>
            <div className="card">Acabas la semana agotada, con la sensación de que la gestión se come el tiempo que querías dar a la causa.</div>
            <div className="card card-accent">Quien dedica su tiempo a los demás no debería perderlo en hojas de cálculo.</div>
          </div>
        </div>
      </section>

      <section className="wrap section narrow">
        <h2>Sabemos lo que es, porque lo hemos vivido.</h2>
        <p className="lead">Klaruk nace de años trabajando con ONG y voluntariado, viendo a equipos directivos sostener todo a base de buena voluntad y horas robadas.</p>
        <p>Hecho por ShiftCitizen, que forma y acompaña a entidades del tercer sector en digitalización e IA.</p>
      </section>

      <section className="wrap section" id="funcionalidades" aria-labelledby="features-title">
        <h2 id="features-title">{featuresTitle}</h2>
        <p className="lead features-sub">{featuresSubtitle}</p>
        <div className="features-grid">
          {features.map((f) => (
            <article className="card feature" key={f.title}>
              <span className="icon" aria-hidden="true">{f.icon}</span>
              <h3>{f.title}</h3>
              <p className="benefit">{f.benefit}</p>
              <ul className="ticks feature-list">
                {f.items.map((it) => <li key={it}>{it}</li>)}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="band">
        <div className="wrap narrow">
          <h2>Más horas para tu misión.</h2>
          <p className="lead"><strong>Un ejemplo:</strong> una entidad pequeña puede dedicar unas 10 horas al mes a gestión. Si Klaruk os devuelve buena parte de ese tiempo, la cuota se paga sola.</p>
        </div>
      </section>

      <section className="wrap section">
        <h2>Empezar es fácil</h2>
        <ol className="steps">
          <li>Empieza tu prueba gratis de 15 días.</li>
          <li>Trae tus socios y voluntarios. Si quieres, te ayudamos con la puesta en marcha (opcional).</li>
          <li>Organiza tu primera actividad y deja que Klaruk haga el resto.</li>
        </ol>
        <a className="btn btn-primary" href={TRIAL_URL}>{CTA}</a>
      </section>

      <section className="wrap section">
        <div className="grid2">
          <div className="card compare yes"><h3>Con Klaruk</h3><p>Turnos cubiertos, voluntarios que repiten, subvenciones justificadas a tiempo y una junta o un patronato con tiempo para pensar.</p></div>
          <div className="card compare no"><h3>Sin Klaruk</h3><p>Más Excel, más WhatsApp, más justificaciones de madrugada, y el riesgo de que la gente se queme.</p></div>
        </div>
      </section>

      <section className="wrap section narrow">
        <h2>Preguntas frecuentes</h2>
        <Faq items={faq} />
      </section>

      <section className="closing">
        <div className="wrap center">
          <h2>Tu causa merece tu tiempo.</h2>
          <div className="actions center">
            <a className="btn btn-primary" href={TRIAL_URL}>{CTA}</a>
            <Link className="btn btn-secondary" href="/planes">Ver planes</Link>
          </div>
          <p className="meta">Klaruk es un producto de ShiftCitizen.</p>
        </div>
      </section>
    </>
  );
}
