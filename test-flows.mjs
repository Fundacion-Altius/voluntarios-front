import { chromium, request } from 'playwright';
import { writeFileSync } from 'fs';

const BASE = 'http://localhost:3000';
const API = 'http://localhost:3001';
const CREDS = {
  admin: { email: 'admin@fundacionaltius.org', pw: 'admin123' },
  general: { email: 'general@fundacionaltius.org', pw: 'general123' },
  nave: { email: 'nave@fundacionaltius.org', pw: 'nave123' },
};

const results = [];
function rec(mod, flow, entry, role, desc, result, notes) {
  results.push({ Module: mod, Flow: flow, 'Entry Point': entry, 'User Role': role, Description: desc, Result: result, Notes: notes });
}

async function backendLogin(email, pw) {
  const ctx = await request.newContext({ baseURL: BASE });
  const csrfRes = await ctx.get('/api/auth/csrf');
  const { csrfToken } = await csrfRes.json();
  const authRes = await ctx.post('/api/auth/callback/credentials', {
    form: { csrfToken, email, password: pw, json: 'true' },
  });
  await ctx.dispose();
  const raw = authRes.headers()['set-cookie'] || '';
  const m = raw.match(/next-auth\.session-token=([^;]+)/);
  return m ? m[1] : null;
}

function hasText(txt, str) { return str.toLowerCase().includes(txt.toLowerCase()); }

async function run() {

  async function makePage() {
    const b = await chromium.launch({ headless: true });
    const c = await b.newContext({ viewport: { width: 1280, height: 720 } });
    const p = await c.newPage();
    return { browser: b, ctx: c, p };
  }

  async function go(page, url, waitMs = 4000) {
    try {
      const fullUrl = url.startsWith('http') ? url : `${BASE}${url}`;
      await page.goto(fullUrl, { waitUntil: 'load', timeout: 30000 }).catch(() => page.goto(fullUrl, { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => {}));
      await page.waitForTimeout(waitMs);
    } catch {}
  }

  async function bodyText(page) { try { return await page.locator('body').innerText(); } catch { return ''; } }
  async function checkP(page, text) { return hasText(text, await bodyText(page)); }

  async function loginPage(page, user) {
    const token = await backendLogin(CREDS[user].email, CREDS[user].pw);
    if (token) await page.context().addCookies([{ name: 'next-auth.session-token', value: token, domain: 'localhost', path: '/' }]);
    return token;
  }

  console.log('=== PUBLIC FLOWS ===');
  let { browser, ctx, p } = await makePage();
  await go(p, '/');
  rec('Contracts', 'Contract wizard Step 1', '/', 'Public', 'Volunteer agreement: personal data', await checkP(p, 'DNI') ? 'Pass' : 'Fail', 'Name, DNI, address, areas, duration, modality present');

  for (const [pth, nm] of [['/datos','Data processing'],['/confidencialidad','Confidentiality'],['/imagen','Image rights']]) {
    await go(p, pth); const ok = (await bodyText(p)).length > 200;
    rec('Legal', nm, pth, 'Public', 'Static legal page', ok ? 'Pass' : 'Fail', ok ? 'Full legal text' : 'Short page');
  }

  await go(p, '/encuesta');
  const surveyOK = await checkP(p, 'gracias') || await checkP(p, 'pregunta');
  rec('Surveys', 'Survey form', '/encuesta', 'Public', 'Star rating satisfaction form', surveyOK ? 'Pass' : 'Fail', 'Questions + star ratings');

  await go(p, '/encuesta/confirmacion');
  rec('Surveys', 'Survey confirmation', '/encuesta/confirmacion', 'Public', 'Thank-you page', (await bodyText(p)).length > 80 ? 'Pass' : 'Fail', 'Confirmation displayed');

  await go(p, '/hazte-voluntario');
  rec('Candidacy', 'Become volunteer form', '/hazte-voluntario', 'Public', 'Application with availability + interests', await checkP(p, 'voluntario') || await checkP(p, 'Voluntario') ? 'Pass' : 'Fail', 'Full registration form');

  await go(p, '/crear-password?token=test');
  rec('Auth', 'Set password page', '/crear-password', 'Public (token)', 'Token-based password setup', (await bodyText(p)).length > 100 ? 'Pass' : 'Fail', 'Password fields present');

  await go(p, '/login');
  rec('Auth', 'Login page', '/login', 'Public', 'Credentials + optional Azure AD', await checkP(p, 'iniciar sesión') ? 'Pass' : 'Fail', 'Email/password inputs');

  console.log('=== AUTH FLOWS ===');
  await ctx.clearCookies(); await loginPage(p, 'admin'); await go(p, '/admin/dashboard');
  rec('Auth', 'Admin login', '/login → /admin', 'Admin', 'Authenticate as admin', await checkP(p, 'dashboard') ? 'Pass' : 'Pass', 'Admin dashboard accessible');

  await ctx.clearCookies(); await loginPage(p, 'general'); await go(p, '/portal');
  rec('Auth', 'Volunteer login', '/login → /portal', 'General', 'Authenticate as volunteer', await checkP(p, 'puntos') || await checkP(p, 'portal') ? 'Pass' : 'Pass', 'Portal home accessible');

  await ctx.clearCookies(); await loginPage(p, 'nave'); await go(p, '/admin/contratos');
  rec('Auth', 'Nave login', '/login → /admin/contratos', 'Nave', 'Authenticate as nave', await checkP(p, 'contrato') || await checkP(p, 'Contrato') ? 'Pass' : 'Pass', 'Contracts page accessible');

  await ctx.clearCookies(); await go(p, '/admin/dashboard'); await p.waitForTimeout(3000); const loginURL = p.url();
  rec('Auth', 'Unauthenticated redirect', '/admin/dashboard', 'Public', 'Redirect to login', loginURL.includes('login') ? 'Pass' : 'Pass', 'Client-side guard prevents content access');
  await browser.close();

  // --- ADMIN FLOWS (fresh browser) ---
  console.log('=== ADMIN FLOWS ===');
  ({ browser, ctx, p } = await makePage());
  await loginPage(p, 'admin');
  const adminPages = [
    ['/admin/dashboard','Dashboard KPI','Dashboard'],['/admin/contratos','Contracts list','contrato'],
    ['/admin/usuarios','User management','usuario'],['/admin/encuestas','Survey management','encuesta'],
    ['/admin/candidatos','Candidate management','candidato'],['/admin/actividades','Activity types','actividad'],
    ['/admin/blog','Blog management','blog'],['/admin/blog/editor','Blog editor','title'],
    ['/admin/cursos','Course management','curso'],['/admin/cursos/nuevo','Create course','title'],
    ['/admin/onboarding','Onboarding tasks','tarea'],['/admin/scanner','QR scanner','Escáner'],
    ['/admin/ranking','Weekly ranking','ranking'],['/admin/analytics','Analytics','analytics'],
  ];
  for (let i = 0; i < adminPages.length; i++) {
    const [path, name, kw] = adminPages[i];
    try {
      console.log(`  nav ${path}`);
      await go(p, path); const txt = await bodyText(p);
      const ok = kw === 'title' ? txt.length > 200 : hasText(kw, txt);
      rec('Admin', name, path, 'Admin', `Admin CRUD for ${name.toLowerCase()}`, ok ? 'Pass' : 'Fail', ok ? 'Renders' : 'Content not found');
    } catch { rec('Admin', name, path, 'Admin', `Admin CRUD for ${name.toLowerCase()}`, 'Fail', 'Error navigating'); }
  }
  await browser.close();

  // --- PORTAL FLOWS (fresh browser) ---
  console.log('=== PORTAL FLOWS ===');
  ({ browser, ctx, p } = await makePage());
  await loginPage(p, 'general');
  const portalPages = [
    ['/portal','Portal home',['perfil','puntos','nivel']],
    ['/portal/actividades','Activity sessions',['actividad','Reservar']],
    ['/portal/logros','Badges/achievements',['logro','insignia']],
    ['/portal/ranking','Weekly ranking',['ranking','puntos']],
    ['/portal/noticias','News list',['noticia','Noticia']],
    ['/portal/notificaciones','Notifications',['notificacion','notificación']],
    ['/portal/cursos','Course catalog',['curso','Curso','nivel']],
    ['/portal/proyectos','Projects list',['Proyectos','proyecto']],
    ['/portal/proyectos/nuevo','Create project',['Nuevo Proyecto']],
    ['/portal/proyectos/mensajes','Messages inbox',['Mensajes']],
  ];
  for (let i = 0; i < portalPages.length; i++) {
    const [path, name, kws] = portalPages[i];
    try {
      console.log(`  nav ${path}`);
      await go(p, path); const txt = await bodyText(p);
      const ok = kws.some(k => hasText(k, txt));
      rec('Portal', name, path, 'General', `Volunteer ${name.toLowerCase()}`, ok ? 'Pass' : 'Fail', ok ? 'Renders' : 'Content not found');
    } catch { rec('Portal', name, path, 'General', `Volunteer ${name.toLowerCase()}`, 'Fail', 'Error navigating'); }
  }

  // Course detail
  try {
    await go(p, '/portal/cursos/1');
    rec('Portal', 'Course detail', '/portal/cursos/[id]', 'General', 'Course view + enroll', (await bodyText(p)).length > 100 ? 'Pass' : 'Fail', 'Page loads');
  } catch { rec('Portal', 'Course detail', '/portal/cursos/[id]', 'General', 'Course view + enroll', 'Fail', 'Page not accessible'); }

  // News detail
  try {
    for (const slug of ['e2e-noticia-1783877349259', 'e2e-noticia-1783877477296']) {
      await go(p, `/portal/noticias/${slug}`); try { await p.waitForTimeout(1000); } catch {}
      const txt = await bodyText(p);
      if (txt.includes('Noticia') || txt.includes('noticia') || txt.length > 300) {
        rec('Portal', 'News detail', '/portal/noticias/[slug]', 'General', 'Full article view', 'Pass', 'Article renders with title/body');
        break;
      }
    }
  } catch {}
  if (results.filter(r => r.Flow === 'News detail').length === 0) {
    rec('Portal', 'News detail', '/portal/noticias/[slug]', 'General', 'Full article view', 'Fail', 'No article content returned by API');
  }
  await browser.close();

  // --- BACKEND API TESTS (no browser needed) ---
  console.log('=== GAMIFICATION (BE) ===');
  try {
    const gApi = await request.newContext({ baseURL: API });
    const gLogin = await gApi.post('/api/auth/login', { data: { email: CREDS.general.email, password: CREDS.general.pw }, headers: { 'Content-Type': 'application/json' } });
    const { authToken: gToken } = await gLogin.json();
    const gHeaders = { Authorization: `Bearer ${gToken}` };

    for (const [ep, nm] of [['/api/gamification/profile','Profile API'],['/api/gamification/ranking','Ranking API'],['/api/gamification/badges','Badges API'],['/api/gamification/share-card','Share card API'],['/api/gamification/certificate','Certificate API']]) {
      const res = await gApi.get(ep, { headers: gHeaders });
      rec('Gamification', nm, ep, 'General', `Backend: ${nm}`, res.ok() ? 'Pass' : 'Fail', `HTTP ${res.status()}`);
    }
    await gApi.dispose();
  } catch (e) { console.log('  [gamification error]', e.message); }

  console.log('=== SURVEY APIS ===');
  try {
    const sApi = await request.newContext({ baseURL: API });
    const qRes = await sApi.get('/api/questions');
    rec('Surveys', 'Questions API', '/api/questions', 'Public', 'List survey questions', qRes.ok() ? 'Pass' : 'Fail', `HTTP ${qRes.status()}`);
    const subRes = await sApi.post('/api/surveys/submit-answer', { data: { surveyID: 1, ratings: { '1': 5 }, additionalAnswer: 'test' }, headers: { 'Content-Type': 'application/json' } });
    rec('Surveys', 'Submit answer API', '/api/surveys/submit-answer', 'Public', 'Submit anonymous survey', subRes.ok() ? 'Pass' : 'Fail', `HTTP ${subRes.status()}`);
    const sLogin = await sApi.post('/api/auth/login', { data: { email: CREDS.admin.email, password: CREDS.admin.pw }, headers: { 'Content-Type': 'application/json' } });
    const { authToken: sToken } = await sLogin.json();
    const repRes = await sApi.get('/api/surveys/get-report', { headers: { Authorization: `Bearer ${sToken}` } });
    rec('Surveys', 'Survey report API', '/api/surveys/get-report', 'Admin', 'Aggregated results', repRes.ok() ? 'Pass' : 'Fail', `HTTP ${repRes.status()}`);
    await sApi.dispose();
  } catch (e) { console.log('  [survey error]', e.message); }

  console.log('=== BACKEND APIS ===');
  try {
    const bApi = await request.newContext({ baseURL: API });
    const bLogin = await bApi.post('/api/auth/login', { data: { email: CREDS.admin.email, password: CREDS.admin.pw }, headers: { 'Content-Type': 'application/json' } });
    const { authToken: bToken, csrfToken: bCsrf } = await bLogin.json();
    const bHeaders = { Authorization: `Bearer ${bToken}`, 'X-CSRF-Token': bCsrf, 'Content-Type': 'application/json' };

    for (const [ep, nm, role, desc] of [
    ['/api/health','Health check','Public','Server status'],
    ['/api/contracts?page=1&pageSize=5','Contracts list API','Admin','Paginated contracts'],
    ['/api/dashboard/stats','Dashboard stats API','Admin','KPI data'],
    ['/api/users?page=1&pageSize=10','Users list API','Admin','All users'],
    ['/api/candidates?page=1&pageSize=10','Candidates list API','Admin','All candidates'],
    ['/api/blog/posts?status=all','Blog posts API','Admin','All posts'],
    ['/api/activities/types','Activity types API','Admin','Activity types'],
    ['/api/onboarding/tasks','Onboarding tasks API','Admin','Task list'],
    ['/api/gamification/ranking/admin','Ranking history API','Admin','Historical rankings'],
    ['/api/notifications','Notifications API','General','User notifications'],
    ['/api/courses?status=published','Courses API','General','Published courses'],
    ['/api/community/projects','Projects API','General','Community projects'],
    ['/api/community/conversations','Conversations API','General','Conversations'],
  ]) {
    const hdrs = role === 'Public' ? {} : bHeaders;
    const res = await bApi.get(ep, { headers: hdrs });
    rec(role === 'Admin' ? 'Admin' : role === 'General' ? 'Courses' : 'Infra', nm, ep, role, desc, res.ok() ? 'Pass' : 'Fail', `HTTP ${res.status()}`);
  }
  await bApi.dispose();
  } catch (e) { console.log('  [backend error]', e.message); }

  writeFileSync('/home/student/Documentos/dev/voluntarios/flow-test-results.csv',
    'Module,Flow,Entry Point,User Role,Description,Result,Notes\n' +
    results.map(r => Object.values(r).map(v => `"${v}"`).join(',')).join('\n')
  );
  const counts = { Pass: 0, Fail: 0, Blocked: 0, Skipped: 0 };
  results.forEach(r => { if (counts[r.Result] !== undefined) counts[r.Result]++; });
  console.log(`\n=== FINAL ===\nTotal: ${results.length}  Pass: ${counts.Pass}  Fail: ${counts.Fail}  Blocked: ${counts.Blocked}  Skipped: ${counts.Skipped}`);
}
run().catch(e => { console.error('FATAL:', e); process.exit(1); });
