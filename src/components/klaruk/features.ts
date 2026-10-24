// Landing features copy (Adela, 24 oct 2026). Source: klaruk-landing/features-copy-2026-10-24.md
// No feature is tied to a plan.

export type FeatureGroup = { icon: string; title: string; benefit: string; items: string[] };

export const featuresTitle = "Todo lo que tu entidad hace cada semana, en un solo lugar.";
export const featuresSubtitle = "Tú sigues al frente de tu misión. Klaruk te quita la gestión de encima.";

export const features: FeatureGroup[] = [
  {
    icon: "◷",
    title: "Un voluntariado que se queda",
    benefit: "Turnos cubiertos y voluntarios que repiten, sin quemarse.",
    items: [
      "Actividades y turnos: organiza y cubre turnos sin cadenas de mensajes.",
      "Portal del voluntario: cada persona ve sus turnos y se apunta o se da de baja por su cuenta.",
      "Gamificación: reconoce la constancia y ayuda a que vuelvan.",
      "Bienestar: avisos cuando alguien hace demasiadas horas o deja de aparecer, control de ausencias, forma sencilla de pasar un conflicto a quien coordina y momentos para preguntar cómo está cada voluntario.",
    ],
  },
  {
    icon: "◉",
    title: "Las personas a las que acompañas",
    benefit: "Sabes a quién atiendes, en qué programa está y quién le acompaña.",
    items: [
      "Personas beneficiarias: su ficha y los programas en los que participan, tratada como información sensible.",
      "Mentoría: asigna una persona voluntaria como mentora a cada beneficiario.",
      // OPTIONAL — BANCO DE ALIMENTOS: may be dropped. To remove it, delete the next line only.
      "Banco de alimentos: registra lotes donados y recibe avisos de los que están a punto de caducar, para repartir primero lo más antiguo.",
    ],
  },
  {
    icon: "✉",
    title: "Comunicación y comunidad",
    benefit: "Habla con tu gente donde ya está, sin saltar entre diez aplicaciones.",
    items: [
      "Mensajería al momento: los mensajes llegan sin recargar, con chat interno para el equipo.",
      "WhatsApp y Telegram: envía y recibe mensajes desde Klaruk.",
      "Videollamadas y directos: reuniones, formaciones y eventos en el navegador, sin Zoom ni Teams.",
      "Redes sociales: publica y programa en LinkedIn, X, Instagram y Facebook, y mira cómo responde tu comunidad.",
    ],
  },
  {
    icon: "€",
    title: "Socios, campañas y subvenciones",
    benefit: "Más apoyo y justificaciones a tiempo, con todo reunido.",
    items: [
      "Socios y exportación: tu base de socios al día y exportable cuando la necesites.",
      "Campañas: crea una campaña, envíala por email y aviso en la app a socios, voluntariado y donantes, y mira quién la abre y la comparte.",
      "Subvenciones: prepara y justifica con todo a mano, en vez de reconstruirlo al final.",
    ],
  },
  {
    icon: "⚖",
    title: "Buen gobierno y transparencia",
    benefit: "Decisiones claras para tu junta o patronato, y visibles para quien confía en vosotros.",
    items: [
      "Votaciones sencillas para la junta, el patronato o la asamblea.",
      "Actas: redáctalas, apruébalas y publícalas.",
      "Página pública de decisiones, para rendir cuentas.",
      "Panel de federación: si sois una red de entidades, ved informes, impacto y miembros en conjunto, y cada entidad mantiene sus datos separados.",
    ],
  },
  {
    icon: "✦",
    title: "Impacto, datos e IA",
    benefit: "Enseña lo que consigues y deja que la IA te quite trabajo.",
    items: [
      "Paneles de impacto: muéstralo a tu junta o patronato, a quien financia y a tu comunidad.",
      "Salud de la comunidad: participación, cuánto voluntariado se queda y avisos cuando voluntarios o donantes se están alejando.",
      "Notion y Airtable: conecta y sincroniza tus datos, o impórtalos y expórtalos.",
      "Tu asistente de IA: puede hacer lo mismo que tú en la app, con los mismos permisos, sin coste extra. Todo lo que haces con clics también se lo puedes pedir con tus palabras.",
      "Castellano y catalán. Los datos son vuestros y podéis exportarlos cuando queráis.",
    ],
  },
];
