#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const messagesDir = path.join(__dirname, '..', 'messages');
const es = require(path.join(messagesDir, 'es.json'));
const ca = require(path.join(messagesDir, 'ca.json'));

Object.assign(ca.common, {
  notAuthenticated: 'No autenticat',
  refresh: 'Actualitzar',
  apply: 'Aplicar',
  clear: 'Netejar',
  upload: 'Pujar',
  uploading: 'Pujant...',
  file: 'Fitxer',
  type: 'Tipus',
  filename: 'Nom del fitxer',
  version: 'Versió',
  uploadedBy: 'Pujat per',
  confirmDelete: 'Estàs segur que vols eliminar això?',
  application: 'Sol·licitud',
  justification: 'Justificació',
  report: 'Informe',
  receipt: 'Rebut',
  other: 'Altre',
  view: 'Veure',
  all: 'Tots',
});

Object.assign(ca.admin.dashboard, {
  totalGrants: 'Subvencions Totals',
  pipelineValue: 'Valor del Pipeline',
  approvalRate: "Taxa d'Aprovació",
});

ca.admin.grantsPage = {
  title: 'Gestió de Subvencions',
  subtitle: "Gestiona i fes seguiment de totes les subvencions i fons de l'organització",
  newGrant: 'Nova Subvenció',
  searchPlaceholder: 'Cercar per nom, organisme o tipus...',
  filterByStatus: 'Filtrar per estat',
  filterByType: 'Filtrar per tipus',
  allStatuses: 'Tots els estats',
  allTypes: 'Tots els tipus',
  public: 'Pública',
  private: 'Privada',
  eu: 'UE',
  pipelineView: 'Vista de Pipeline',
  totalGrants: 'subvencions',
  noGrantsYet: 'Encara no hi ha subvencions',
  noGrantsDescription: 'Crea la teva primera subvenció per començar a gestionar el pipeline de finançament',
  createFirstGrant: 'Crear primera subvenció',
  noGrantsInStatus: 'No hi ha subvencions en estat {status}',
  errorLoadingGrants: 'Error en carregar les subvencions',
  refresh: 'Actualitzar',
  apply: 'Aplicar',
  clear: 'Netejar',
};

ca.admin.grantForm = {
  title: 'Nova Subvenció',
  editTitle: 'Editar Subvenció',
  name: 'Nom de la subvenció',
  namePlaceholder: 'Ex: Subvenció per a projectes socials 2024',
  fundingBody: 'Organisme finançador',
  fundingBodyPlaceholder: 'Ex: Ministeri de Drets Socials',
  type: 'Tipus de subvenció',
  amount: 'Import',
  amountPlaceholder: 'Ex: 50000',
  applicationDate: 'Data de sol·licitud',
  deadline: 'Data límit',
  resolutionDate: 'Data de resolució',
  justificationRequirements: 'Requisits de justificació',
  justificationRequirementsPlaceholder: 'Descriu els requisits de justificació...',
  submit: 'Desar Subvenció',
  cancel: 'Cancel·lar',
  success: 'Subvenció desada correctament',
  error: 'Error en desar la subvenció',
};

ca.admin.grantDetail = {
  title: 'Detalls de la Subvenció',
  backToList: 'Tornar a la llista',
  basicInfo: 'Informació Bàsica',
  grantInfoDescription: 'Informació bàsica de la subvenció',
  status: 'Estat',
  type: 'Tipus',
  amount: 'Import',
  fundingBody: 'Organisme',
  dates: 'Dates Importants',
  importantDatesDescription: 'Dates clau de la subvenció',
  applicationDate: 'Data de sol·licitud',
  deadline: 'Data límit',
  resolutionDate: 'Data de resolució',
  documents: 'Documents',
  documentsDescription: 'Documents associats a aquesta subvenció',
  noDocuments: 'No hi ha documents associats',
  uploadDocument: 'Pujar Document',
  justification: 'Justificació',
  justificationDescription: 'Estat de la justificació de la subvenció',
  justificationStatus: 'Estat de justificació',
  ready: 'Llista',
  notReady: 'Pendent',
  missingDocuments: 'Documents faltants',
  markAsReady: 'Marcar com a llista',
  calendar: 'Calendari',
  actions: 'Accions',
  statusTransitionDescription: 'Transicions d\'estat disponibles',
  edit: 'Editar',
  delete: 'Eliminar',
  dangerZone: 'Zona de perill',
  dangerZoneDescription: 'Accions irreversibles',
  deleteConfirm: 'Estàs segur que vols eliminar aquesta subvenció?',
  deleteSuccess: 'Subvenció eliminada correctament',
  deleteError: 'Error en eliminar la subvenció',
  errorLoadingGrant: 'Error en carregar la subvenció',
  errorUpdatingStatus: 'Error en actualitzar l\'estat',
  errorMarkingReady: 'Error en marcar com a llista',
  grantNotFound: 'Subvenció no trobada',
  uploadSuccess: 'Document pujat correctament',
};

ca.admin.grantCalendar = {
  title: 'Calendari de Subvencions',
  subtitle: 'Visualitza els terminis i dates importants de totes les subvencions',
  upcomingDeadlines: 'Propers Terminis',
  overdue: 'Endarrerits',
  today: 'Avui',
  thisWeek: 'Aquesta setmana',
  thisMonth: 'Aquest mes',
  noUpcomingDeadlines: 'No hi ha terminis propers',
  noOverdue: 'No hi ha subvencions endarrerides',
  filterDescription: 'Filtra les dates per rang de temps',
  upcomingDescription: 'Subvencions amb terminis propers',
  overdueDescription: 'Subvencions amb terminis vençuts',
  totalEvents: 'Total d\'esdeveniments',
  totalEventsDescription: 'Total d\'esdeveniments de calendari',
  next30Days: 'Propers 30 dies',
  next30DaysDescription: 'Subvencions amb terminis en els propers 30 dies',
  calendarView: 'Vista de Calendari',
  calendarViewDescription: 'Esdeveniments agrupats per data',
  noEventsInRange: 'No hi ha esdeveniments en el rang seleccionat',
  overdueSectionDescription: 'Subvencions que requereixen atenció immediata',
  andMore: 'i {count} més',
  errorLoadingEvents: 'Error en carregar els esdeveniments del calendari',
};

fs.writeFileSync(path.join(messagesDir, 'ca.json'), `${JSON.stringify(ca, null, 2)}\n`);

function flattenKeys(obj, prefix = '') {
  const keys = [];
  for (const [key, value] of Object.entries(obj)) {
    const p = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'object' && value !== null) keys.push(...flattenKeys(value, p));
    else keys.push(p);
  }
  return keys;
}

const missing = flattenKeys(es).filter((k) => !flattenKeys(ca).includes(k));
console.log(`ca.json synced; ${missing.length} keys still missing`);
if (missing.length) console.log(missing.slice(0, 20));
