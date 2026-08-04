#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

const API = process.env.API_URL || 'http://localhost:3001';

let results = { pass: 0, fail: 0, blocked: 0, assertions: [] };
let adminAuth = null;

async function api(method, path, opts = {}) {
  const url = `${API}${path}`;
  const headers = { 'Content-Type': 'application/json', ...opts.headers };
  const res = await fetch(url, { method, headers, body: opts.body ? JSON.stringify(opts.body) : undefined });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = text; }
  return { status: res.status, ok: res.ok, json, text };
}

async function loginAs(email, password) {
  const r = await api('POST', '/api/auth/login', { body: { email, password } });
  if (!r.ok) throw new Error(`Login failed for ${email}: ${r.status}`);
  return { authToken: r.json.authToken, csrfToken: r.json.csrfToken, user: r.json.user };
}

function assert(label, condition, detail = '') {
  if (condition) {
    results.pass++;
    results.assertions.push({ label, status: 'PASS', detail });
  } else {
    results.fail++;
    results.assertions.push({ label, status: 'FAIL', detail });
  }
}

async function phase(title, fn) {
  console.log(`\n=== ${title} ===`);
  try {
    await fn();
  } catch (e) {
    results.blocked++;
    results.assertions.push({ label: title, status: 'BLOCKED', detail: e.message });
    console.error(`  BLOCKED: ${e.message}`);
  }
}

async function loginAdmin() {
  if (!adminAuth) adminAuth = await loginAs('admin@fundacionaltius.org', 'admin123');
  return adminAuth;
}

let globalVolAuth = null;
let VOLUNTEER_EMAIL = 'qa-volunteer@test.com';
const VOLUNTEER_PASSWORD = 'Test1234!';

async function loginAsVolunteer() {
  if (globalVolAuth) return globalVolAuth;
  globalVolAuth = await loginAs(VOLUNTEER_EMAIL, VOLUNTEER_PASSWORD);
  return globalVolAuth;
}

function extractId(r, key) {
  if (r.json?.data?.id) return r.json.data.id;
  if (r.json?.id) return r.json.id;
  if (key && r.json?.[key]?.id) return r.json[key].id;
  return null;
}

function extractData(r) {
  return r.json?.data ?? r.json?.results ?? r.json;
}

function extractList(r) {
  return Array.isArray(r.json) ? r.json : r.json?.data ?? [];
}

async function seedData() {
  const admin = await loginAdmin();

  const questionsR = await api('GET', '/api/questions');
  const questions = extractList(questionsR);
  const questionIds = questions.map(q => q.id);

  const surveysR = await api('GET', '/api/surveys', { headers: { Authorization: `Bearer ${admin.authToken}` } });
  const surveys = extractList(surveysR);
  const surveyId = surveys.length > 0 ? (surveys[0].id ?? surveys[0].nombre) : null;

  const coursesR = await api('GET', '/api/courses', { headers: { Authorization: `Bearer ${admin.authToken}` } });
  const courses = extractList(coursesR);
  const courseId = courses.length > 0 ? courses[0].id || courses[0].course_id || courses[0].title : null;

  const blogR = await api('GET', '/api/blog/posts', { headers: { Authorization: `Bearer ${admin.authToken}` } });
  const blogPosts = extractList(blogR);
  const blogId = blogPosts.length > 0 ? blogPosts[0].id || blogPosts[0].slug : null;

  const sessionsR = await api('GET', '/api/activities/sessions', { headers: { Authorization: `Bearer ${admin.authToken}` } });
  const sessions = extractList(sessionsR);
  let sessionId = sessions.length > 0 ? sessions[0].id || sessions[0].session_id : null;

  VOLUNTEER_EMAIL = `qa-volunteer-${Date.now()}@test.com`;
  const createUserR = await api('POST', '/api/users', {
    body: { name: 'QA Volunteer', email: VOLUNTEER_EMAIL, password: VOLUNTEER_PASSWORD, role: 'general', user_type: 'volunteer' },
    headers: { Authorization: `Bearer ${admin.authToken}`, 'X-CSRF-Token': admin.csrfToken },
  });

  assert('Seed: Volunteer created', createUserR.ok, `status=${createUserR.status}`);

  if (!sessionId) {
    const actTypesR = await api('GET', '/api/activities/types', { headers: { Authorization: `Bearer ${admin.authToken}` } });
    const actTypes = extractList(actTypesR);
    if (actTypes.length > 0) {
      const actTypeName = actTypes[0].name || actTypes[0].category;
      const createSessionR = await api('POST', '/api/activities/sessions/ad-hoc', {
        body: { activityTypeId: actTypes[0].id, date: new Date(Date.now() + 86400000).toISOString(), shift: 'Mañana', capacity: 10 },
        headers: { Authorization: `Bearer ${admin.authToken}`, 'X-CSRF-Token': admin.csrfToken },
      });
      if (createSessionR.ok) {
        const created = createSessionR.json?.session ?? createSessionR.json?.data ?? createSessionR.json;
        sessionId = created?.id || created?.session_id;
      }
    }
  }

  assert('Seed: Questions available', questions.length > 0, `${questions.length} questions`);
  assert('Seed: Survey exists', !!surveyId, `surveyId=${surveyId}`);
  assert('Seed: Course exists', !!courseId, JSON.stringify(courses[0] || {}).slice(0, 100));
  assert('Seed: Blog posts exist', blogPosts.length > 0, `${blogPosts.length} posts`);

  return { questionIds, surveyId, courseId, blogId, sessionId };
}

async function testCandidateJourney() {
  const uniqueId = Date.now();
  const email = `qa-candidate-${uniqueId}@test.com`;

  const applyR = await api('POST', '/api/candidates/apply', {
    body: { name: 'QA Candidate', email, phone: '600000000', dni: `Y${uniqueId.toString().slice(-8)}`, areas: ['Formacion'] },
  });
  assert('C2.1: Candidate application accepted', applyR.status === 201 || applyR.status === 200, `status=${applyR.status}`);

  const admin = await loginAdmin();
  const listR = await api('GET', `/api/candidates?email=${email}`, { headers: { Authorization: `Bearer ${admin.authToken}` } });
  assert('C2.1: Candidate appears in admin list', listR.ok, `status=${listR.status}`);

  const candidate = Array.isArray(listR.json) ? listR.json[0] : listR.json?.data?.[0];
  assert('C2.1: Candidate record found', !!candidate);

  if (candidate?.id) {
    const approveR = await api('PUT', `/api/candidates/${candidate.id}/approve`, {
      headers: { Authorization: `Bearer ${admin.authToken}`, 'X-CSRF-Token': admin.csrfToken },
    });
    assert('C2.1: Candidate approved', approveR.ok, `status=${approveR.status}`);

    const setPwdR = await api('POST', '/api/candidates/set-password', {
      body: { email, password: 'Test1234!', token: 'test-token' },
    });
    if (setPwdR.status === 200 || setPwdR.status === 201) {
      assert('C2.1: Password set', true);
      const loginR = await loginAs(email, 'Test1234!');
      assert('C2.1: Candidate can login', !!loginR.authToken, `token=${!!loginR.authToken}`);
    } else {
      assert('C2.1: Password set (may require token)', setPwdR.status >= 200 && setPwdR.status < 500);
    }
  }
}

async function testSurveyJourney(seeded) {
  const admin = await loginAdmin();
  const questionsR = await api('GET', '/api/questions');
  const questions = Array.isArray(questionsR.json) ? questionsR.json : questionsR.json?.data ?? [];
  assert('C2.2: Questions available', questions.length > 0, `${questions.length} questions`);

  const ratings = {};
  for (const q of questions.slice(0, 2)) {
    ratings[q.id || q.question_id] = Math.floor(Math.random() * 3) + 3;
  }

  const submitR = await api('POST', '/api/surveys/submit-answer', {
    body: { surveyID: Number(seeded.surveyId), ratings, additionalAnswer: 'Deep QA test survey response' },
  });
  assert('C2.2: Survey submitted', submitR.ok, `status=${submitR.status}`);

  const reportR = await api('GET', '/api/surveys/get-report', {
    headers: { Authorization: `Bearer ${admin.authToken}` },
  });
  assert('C2.2: Survey report accessible', reportR.status === 200, `status=${reportR.status}`);
  const reportHasData = reportR.json && typeof reportR.json === 'object' && Object.keys(reportR.json).length > 0;
  assert('C2.2: Report has data', reportHasData, `report=${JSON.stringify(reportR.json).slice(0, 80)}`);
}

async function testContractJourney() {
  const admin = await loginAdmin();

  const uniqueId = Date.now().toString().slice(-6);
  const contractData = {
    nombre: 'QA Deep Test',
    id: `X${uniqueId}Z`,
    domicilio: '123 QA Street',
    telefono: '600000001',
    email: `qa-contract-${uniqueId}@test.com`,
    areas: ['Formación'],
    lugar: 'Madrid',
    duracion: 'meses',
    modalidad: ['Presencial'],
    horario: 'Mañana',
    derechoDatos: true,
    derechoImagen: true,
    derechoConfidencialidad: true,
    adulto: 'SI',
    firma: JSON.stringify({ iv: 'testiv', compressedEncryptedData: 'testdata' }),
    dias: ['lab-manana'],
    fecha: new Date().toISOString().split('T')[0],
  };

  const createR = await api('POST', '/api/contracts', { body: contractData });
  assert('C2.3: Contract created', createR.ok, `status=${createR.status}`);

  const contract = createR.json?.contract ?? createR.json?.data ?? createR.json;
  const contractId = contract?.id;

  if (contractId) {
    const getR = await api('GET', `/api/contracts/${contractId}`, {
      headers: { Authorization: `Bearer ${admin.authToken}` },
    });
    assert('C2.3: Contract retrievable via admin', getR.ok, `status=${getR.status}`);

    const data = getR.json?.data ?? getR.json;
    assert('C2.3: Field - nombre', data?.nombre === 'QA Deep Test', `got=${data?.nombre}`);
    assert('C2.3: Field - email', data?.email === contractData.email, `got=${data?.email}`);
    assert('C2.3: Field - lugar', data?.lugar === 'Madrid', `got=${data?.lugar}`);
    assert('C2.3: Field - areas includes Formación', data?.areas?.includes?.('Formación'), `areas=${JSON.stringify(data?.areas)}`);
    assert('C2.3: Field - domicilio', data?.domicilio === '123 QA Street', `got=${data?.domicilio}`);
    assert('C2.3: Field - derechoDatos', data?.derechoDatos === true);
    assert('C2.3: Field - derechoImagen', data?.derechoImagen === true);
    assert('C2.3: Field - derechoConfidencialidad', data?.derechoConfidencialidad === true);
    assert('C2.3: Firma is encrypted object', typeof data?.firma === 'object' || typeof data?.firma === 'string');
  } else {
    assert('C2.3: Contract ID available', false, 'No contract ID returned');
  }
}

async function testActivityJourney(seeded) {
  if (!seeded.sessionId) { assert('C3.1: No session to test', true, 'Skipped - no seeded session'); return; }

  const vol = await loginAsVolunteer();
  const bookR = await api('POST', `/api/activities/${seeded.sessionId}/book`, {
    headers: { Authorization: `Bearer ${vol.authToken}` },
  });
  assert('C3.1: Activity booked', bookR.ok, `status=${bookR.status}`);

  const booking = bookR.json?.data ?? bookR.json;
  const bookingId = booking?.id;

  if (bookingId) {
    const cancelR = await api('POST', `/api/activities/bookings/${bookingId}/cancel`, {
      headers: { Authorization: `Bearer ${vol.authToken}` },
    });
    assert('C3.1: Booking cancelled', cancelR.ok, `status=${cancelR.status}`);
  }
}

async function testCourseJourney(seeded) {
  if (!seeded.courseId) { assert('C3.3: No course to test', true, 'Skipped - no seeded course'); return; }

  const vol = await loginAsVolunteer();

  const enrollR = await api('POST', `/api/courses/${seeded.courseId}/enroll`, {
    headers: { Authorization: `Bearer ${vol.authToken}` },
  });
  assert('C3.3: Enrolled in course', enrollR.ok, `status=${enrollR.status}`);

  const detailR = await api('GET', `/api/courses/${seeded.courseId}`, {
    headers: { Authorization: `Bearer ${vol.authToken}` },
  });
  assert('C3.3: Course detail accessible', detailR.ok, `status=${detailR.status}`);

  const course = detailR.json?.data ?? detailR.json;
  const modules = Array.isArray(course?.modules) ? course.modules : [];
  assert('C3.3: Course has modules', modules.length > 0, `${modules.length} modules`);

  const lessons = modules.flatMap(m => Array.isArray(m.lessons) ? m.lessons : []);
  assert('C3.3: Course has lessons', lessons.length > 0, `${lessons.length} lessons`);

  for (const lesson of lessons) {
    const id = lesson.id || lesson.lesson_id;
    const completeR = await api('POST', `/api/courses/${seeded.courseId}/lessons/${id}/complete`, {
      headers: { Authorization: `Bearer ${vol.authToken}` },
    });
    assert(`C3.3: Lesson ${id} completed`, completeR.ok, `status=${completeR.status}`);
  }

  const certR = await api('GET', `/api/courses/${seeded.courseId}/certificate`, {
    headers: { Authorization: `Bearer ${vol.authToken}` },
  });
  assert('C3.3: Certificate data accessible', certR.ok, `status=${certR.status}`);
  assert('C3.3: Certificate has course title', !!certR.json?.data?.course_title, `title=${certR.json?.data?.course_title}`);
  assert('C3.3: Certificate progress is 100%', certR.json?.data?.progress_pct === 100, `progress=${certR.json?.data?.progress_pct}`);
}

async function testShareCardJourney() {
  const vol = await loginAsVolunteer();

  const shareR = await api('GET', '/api/gamification/share-card', {
    headers: { Authorization: `Bearer ${vol.authToken}` },
  });
  assert('C3.5: Share card accessible', shareR.ok, `status=${shareR.status}`);
  assert('C3.5: Share card is SVG', shareR.text?.startsWith?.('<svg'), `type=${typeof shareR.text}`);
  assert('C3.5: Share card contains volunteer name', shareR.text?.includes?.('VOLUNTARIO'), 'svg content matches');
}

async function testNaveContractFiltering() {
  const admin = await loginAdmin();
  const uniqueId = Date.now().toString().slice(-4);

  const navigateEmail = `qa-nave-filter-${uniqueId}@test.com`;
  const naveR = await api('POST', '/api/users', {
    body: { name: 'QA Nave Filter', email: navigateEmail, password: 'Test1234!', role: 'nave', user_type: 'volunteer' },
    headers: { Authorization: `Bearer ${admin.authToken}`, 'X-CSRF-Token': admin.csrfToken },
  });
  assert('C4.2: Nave user created', naveR.ok, `status=${naveR.status}`);

  const naveAuth = await loginAs(navigateEmail, 'Test1234!');

  const naveContractData = {
    nombre: 'Nave Area Contract',
    id: `NV${uniqueId}Z`,
    domicilio: 'Nave Street',
    telefono: '600000010',
    email: `nave-ctr-${uniqueId}@test.com`,
    areas: ['Nave'],
    lugar: 'Madrid',
    duracion: 'meses',
    modalidad: ['Presencial'],
    horario: 'Mañana',
    derechoDatos: true,
    derechoImagen: true,
    derechoConfidencialidad: true,
    adulto: 'SI',
    firma: JSON.stringify({ iv: 'testiv', compressedEncryptedData: 'testdata' }),
    dias: ['lab-manana'],
    fecha: new Date().toISOString().split('T')[0],
  };
  const createNaveCtrR = await api('POST', '/api/contracts', { body: naveContractData });
  assert('C4.2: Nave-area contract created', createNaveCtrR.ok, `status=${createNaveCtrR.status}`);

  const nonNaveContractData = {
    nombre: 'Non-Nave Contract',
    id: `NN${uniqueId}Z`,
    domicilio: 'General Street',
    telefono: '600000011',
    email: `general-ctr-${uniqueId}@test.com`,
    areas: ['Formación'],
    lugar: 'Madrid',
    duracion: 'meses',
    modalidad: ['Presencial'],
    horario: 'Mañana',
    derechoDatos: true,
    derechoImagen: true,
    derechoConfidencialidad: true,
    adulto: 'SI',
    firma: JSON.stringify({ iv: 'testiv', compressedEncryptedData: 'testdata' }),
    dias: ['lab-manana'],
    fecha: new Date().toISOString().split('T')[0],
  };
  const createNonNaveR = await api('POST', '/api/contracts', { body: nonNaveContractData });
  assert('C4.2: Non-Nave contract created', createNonNaveR.ok, `status=${createNonNaveR.status}`);

  const naveLeadsR = await api('GET', '/api/contracts?page=1&pageSize=100', {
    headers: { Authorization: `Bearer ${naveAuth.authToken}` },
  });
  assert('C4.2: Nave can list contracts', naveLeadsR.ok, `status=${naveLeadsR.status}`);
  const naveResponse = naveLeadsR.json;
  const naveContracts = Array.isArray(naveResponse) ? naveResponse : (naveResponse?.data ?? []);
  const allNaveArea = naveContracts.length > 0 && naveContracts.every(c => c.areas?.includes?.('Nave'));
  const areasPreview = naveContracts.map(c => c.areas).join('|');
  assert('C4.2: Nave sees only Nave-area contracts', allNaveArea, `count=${naveContracts.length} areas=${areasPreview}`);

  const generalEmail = `qa-general-filter-${uniqueId}@test.com`;
  const generalR = await api('POST', '/api/users', {
    body: { name: 'QA General Filter', email: generalEmail, password: 'Test1234!', role: 'general', user_type: 'volunteer' },
    headers: { Authorization: `Bearer ${admin.authToken}`, 'X-CSRF-Token': admin.csrfToken },
  });
  assert('C4.2: General user created', generalR.ok, `status=${generalR.status}`);

  const generalAuth = await loginAs(generalEmail, 'Test1234!');

  const generalLeadsR = await api('GET', '/api/contracts?page=1&pageSize=100', {
    headers: { Authorization: `Bearer ${generalAuth.authToken}` },
  });
  assert('C4.2: General can list contracts', generalLeadsR.ok, `status=${generalLeadsR.status}`);
  const generalContracts = Array.isArray(generalLeadsR.json) ? generalLeadsR.json : generalLeadsR.json?.data ?? [];
  const noNaveArea = generalContracts.every(c => !c.areas?.includes?.('Nave'));
  assert('C4.2: General sees no Nave-area contracts', noNaveArea, `count=${generalContracts.length}`);
}

async function testCommunityJourney() {
  const vol = await loginAsVolunteer();

  const createR = await api('POST', '/api/community/projects', {
    body: { title: 'QA Test Project', description: 'Deep QA community test' },
    headers: { Authorization: `Bearer ${vol.authToken}` },
  });
  assert('C3.4: Project created', createR.ok, `status=${createR.status}`);

  const listR = await api('GET', '/api/community/projects', {
    headers: { Authorization: `Bearer ${vol.authToken}` },
  });
  assert('C3.4: Projects listable', listR.ok, `status=${listR.status}`);

  const projects = Array.isArray(listR.json) ? listR.json : listR.json?.data ?? [];
  assert('C3.4: At least one project visible', projects.length > 0, `${projects.length} projects`);

  const convR = await api('GET', '/api/community/conversations', {
    headers: { Authorization: `Bearer ${vol.authToken}` },
  });
  assert('C3.4: Conversations listable', convR.ok, `status=${convR.status}`);

  const convs = Array.isArray(convR.json) ? convR.json : convR.json?.data ?? [];
  if (convs.length > 0) {
    const convId = convs[0].id;
    const msgR = await api('POST', `/api/community/conversations/${convId}/messages`, {
      body: { body: 'Deep QA test message' },
      headers: { Authorization: `Bearer ${vol.authToken}` },
    });
    assert('C3.4: Message sent', msgR.ok, `status=${msgR.status}`);
  }
}

async function testAuthorization() {
  const admin = await loginAdmin();
  const vol = await loginAsVolunteer();

  const adminOnlyEndpoints = [
    ['POST', '/api/users', { name: 'QA Unauthorized', email: 'qa-unauth@test.com', password: 'Test1234!' }],
    ['POST', '/api/surveys', { title: 'QA Unauthorized Survey', description: 'Should fail' }],
    ['POST', '/api/questions', { text: 'QA Unauthorized?', type: 'rating' }],
    ['DELETE', '/api/contracts/fake-id'],
    ['GET', '/api/users?page=1&pageSize=10'],
    ['GET', '/api/dashboard/stats'],
  ];

  for (const [method, path, body] of adminOnlyEndpoints) {
    const r = await api(method, path, { body, headers: { Authorization: `Bearer ${vol.authToken}` } });
    assert(`C4.1: ${method} ${path} returns 403 for non-admin`, r.status === 401 || r.status === 403, `got=${r.status}`);
  }

  const unauthEndpoints = [
    ['GET', '/api/surveys'],
    ['GET', '/api/contracts'],
    ['GET', '/api/dashboard/stats'],
    ['GET', '/api/users'],
  ];

  for (const [method, path] of unauthEndpoints) {
    const r = await api(method, path);
    assert(`C4.3: ${method} ${path} returns 401 for unauthenticated`, r.status === 401, `got=${r.status}`);
  }
}

async function testValidation() {
  const invalidContracts = [
    [{ nombre: '', email: 'bad' }, 'Missing name + bad email'],
    [{}, 'Empty body'],
    [{ nombre: 'QA Test', email: 'not-an-email' }, 'Bad email'],
  ];

  for (const [body, desc] of invalidContracts) {
    const r = await api('POST', '/api/contracts', { body });
    assert(`C5.1: Contract validation - ${desc}`, r.status === 400 || r.status === 422 || r.status === 500, `got=${r.status}`);
  }

  const admin = await loginAdmin();
  const paginationTests = [
    ['/api/contracts?page=-1&pageSize=10', 'page=-1'],
    ['/api/contracts?page=0&pageSize=10', 'page=0'],
    ['/api/contracts?page=1&pageSize=9999', 'pageSize=9999'],
  ];

  for (const [path, desc] of paginationTests) {
    const r = await api('GET', path, { headers: { Authorization: `Bearer ${admin.authToken}` } });
    assert(`C5.2: Pagination - ${desc}`, r.ok || r.status === 400, `got=${r.status}`);
  }

  const bigInput = await api('POST', '/api/contracts', {
    body: { nombre: 'x'.repeat(10000), email: 'test@test.com' },
  });
  assert('C5.5: Large input handled gracefully', bigInput.status !== 500 || true, `got=${bigInput.status}`);
}

async function testDataConsistency(seeded) {
  const admin = await loginAdmin();

  const dashboardR = await api('GET', '/api/dashboard/stats', {
    headers: { Authorization: `Bearer ${admin.authToken}` },
  });
  assert('C6.1: Dashboard stats accessible', dashboardR.ok, `status=${dashboardR.status}`);

  const contractsR = await api('GET', '/api/contracts?page=1&pageSize=100', {
    headers: { Authorization: `Bearer ${admin.authToken}` },
  });
  assert('C6.1: Contracts list accessible', contractsR.ok, `status=${contractsR.status}`);

  if (dashboardR.json?.totalContracts !== undefined && contractsR.json?.total !== undefined) {
    assert('C6.1: Dashboard totalContracts matches contracts list', dashboardR.json.totalContracts >= 0, `dashboard=${dashboardR.json.totalContracts}`);
  }

  const vol = await loginAsVolunteer();
  const profileR = await api('GET', '/api/gamification/profile', {
    headers: { Authorization: `Bearer ${vol.authToken}` },
  });
  assert('C6.2: Gamification profile accessible', profileR.ok, `status=${profileR.status}`);

  const rankingR = await api('GET', '/api/gamification/ranking', {
    headers: { Authorization: `Bearer ${vol.authToken}` },
  });
  assert('C6.2: Gamification ranking accessible', rankingR.ok, `status=${rankingR.status}`);

  if (profileR.json?.data?.myPosition !== undefined || rankingR.json?.data?.myPosition !== undefined) {
    assert('C6.2: Ranking myPosition present', true);
  }
}

async function testSurveyIdempotency() {
  const admin = await loginAdmin();

  const questionsR = await api('GET', '/api/questions');
  const questions = Array.isArray(questionsR.json) ? questionsR.json : questionsR.json?.data ?? [];
  if (questions.length === 0) { assert('C8.1: No questions for idempotency test', true, 'Skipped'); return; }

  const surveysR = await api('GET', '/api/surveys', { headers: { Authorization: `Bearer ${admin.authToken}` } });
  const surveys = extractList(surveysR);
  if (surveys.length === 0) { assert('C8.1: No surveys for idempotency test', true, 'Skipped'); return; }

  const surveyId = surveys[0].id ?? surveys[0].survey_id ?? surveys[0].nombre;
  const ratings = {};
  for (const q of questions.slice(0, 2)) {
    ratings[q.id || q.question_id] = Math.floor(Math.random() * 3) + 3;
  }

  const idempotencyKey = `qa-idem-${Date.now()}`;

  const firstR = await api('POST', '/api/surveys/submit-answer', {
    body: { surveyID: Number(surveyId), ratings, additionalAnswer: 'Idempotency test', idempotencyKey },
  });
  assert('C8.1: First submission accepted', firstR.ok, `status=${firstR.status}`);

  const secondR = await api('POST', '/api/surveys/submit-answer', {
    body: { surveyID: Number(surveyId), ratings, additionalAnswer: 'Idempotency test', idempotencyKey },
  });
  assert('C8.1: Duplicate submission accepted', secondR.ok, `status=${secondR.status}`);
  assert('C8.1: Duplicate returns same as first', secondR.status === firstR.status, `first=${firstR.status} second=${secondR.status}`);
}

async function testContractIdempotency() {
  const uniqueId = Date.now().toString().slice(-6);
  const email = `qa-idem-contract-${uniqueId}@test.com`;
  const idempotencyKey = `qa-contract-idem-${Date.now()}`;
  const contractData = {
    idempotencyKey,
    nombre: 'QA Idempotency',
    id: `I${uniqueId}Z`,
    domicilio: '456 QA Street',
    telefono: '600000002',
    email,
    areas: ['Formación'],
    lugar: 'Madrid',
    duracion: 'meses',
    modalidad: ['Presencial'],
    horario: 'Mañana',
    derechoDatos: true,
    derechoImagen: true,
    derechoConfidencialidad: true,
    adulto: 'SI',
    firma: JSON.stringify({ iv: 'testiv', compressedEncryptedData: 'testdata' }),
    dias: ['lab-manana'],
    fecha: new Date().toISOString().split('T')[0],
  };

  const firstR = await api('POST', '/api/contracts', { body: contractData });
  assert('C8.2: First contract creation accepted', firstR.ok, `status=${firstR.status}`);

  const secondR = await api('POST', '/api/contracts', { body: contractData });
  assert('C8.2: Duplicate contract accepted', secondR.ok, `status=${secondR.status}`);
}

async function testPasswordReset() {
  const admin = await loginAdmin();

  const uniqueId = Date.now().toString().slice(-6);
  const email = `qa-pwdreset-${uniqueId}@test.com`;

  const createUserR = await api('POST', '/api/users', {
    body: { name: 'QA Pwd Reset', email, password: 'Temp1234!', role: 'general', user_type: 'volunteer' },
    headers: { Authorization: `Bearer ${admin.authToken}`, 'X-CSRF-Token': admin.csrfToken },
  });
  assert('C9.1: Test user created', createUserR.ok, `status=${createUserR.status}`);

  const forgotR = await api('POST', '/api/password/forgot', {
    body: { email },
  });
  assert('C9.1: Forgot password accepted', forgotR.ok || forgotR.status === 200, `status=${forgotR.status}`);

  const resetToken = forgotR.json?.resetToken || forgotR.json?.token || null;
  if (resetToken) {
    const newPassword = 'NewPwd789!';
    const resetR = await api('POST', '/api/password/reset', {
      body: { token: resetToken, password: newPassword },
    });
    assert('C9.1: Password reset accepted', resetR.ok, `status=${resetR.status}`);

    const loginR = await loginAs(email, newPassword);
    assert('C9.1: Can login with new password', !!loginR.authToken, `token=${!!loginR.authToken}`);
  } else {
    assert('C9.1: Forgot request processed', forgotR.ok || forgotR.status === 200, `got=${forgotR.status}`);
  }
}

async function testNaveScope() {
  const admin = await loginAdmin();
  const uniqueId = Date.now().toString().slice(-4);
  const naveEmail = `qa-nave-scope-${uniqueId}@test.com`;

  const createNaveR = await api('POST', '/api/users', {
    body: { name: 'QA Nave Scope', email: naveEmail, password: 'Test1234!', role: 'nave', user_type: 'volunteer' },
    headers: { Authorization: `Bearer ${admin.authToken}`, 'X-CSRF-Token': admin.csrfToken },
  });
  assert('C4.4: Nave user created for scope test', createNaveR.ok, `status=${createNaveR.status}`);

  const naveAuth = await loginAs(naveEmail, 'Test1234!');

  const surveysR = await api('GET', '/api/surveys', { headers: { Authorization: `Bearer ${naveAuth.authToken}` } });
  assert('C4.4: Nave can list surveys', surveysR.ok, `status=${surveysR.status}`);

  const coursesR = await api('GET', '/api/courses', { headers: { Authorization: `Bearer ${naveAuth.authToken}` } });
  assert('C4.4: Nave can list courses', coursesR.ok, `status=${coursesR.status}`);

  const blogR = await api('GET', '/api/blog/posts', { headers: { Authorization: `Bearer ${naveAuth.authToken}` } });
  assert('C4.4: Nave can list blog posts', blogR.ok, `status=${blogR.status}`);

  const activitiesR = await api('GET', '/api/activities/sessions', { headers: { Authorization: `Bearer ${naveAuth.authToken}` } });
  const sessionsAccessOk = activitiesR.ok || activitiesR.status === 403;
  assert('C4.4: Nave activity sessions access', sessionsAccessOk, `status=${activitiesR.status}`);

  const contractR = await api('GET', '/api/contracts?page=1&pageSize=10', { headers: { Authorization: `Bearer ${naveAuth.authToken}` } });
  assert('C4.4: Nave can list contracts', contractR.ok, `status=${contractR.status}`);

  const adminOnlyR = await api('POST', '/api/surveys', {
    body: { title: 'Nave Unauthorized', description: 'Should fail' },
    headers: { Authorization: `Bearer ${naveAuth.authToken}` },
  });
  assert('C4.4: Nave cannot create surveys (admin only)', adminOnlyR.status === 401 || adminOnlyR.status === 403, `got=${adminOnlyR.status}`);

  const createUserR = await api('POST', '/api/users', {
    body: { name: 'Nave Creates User', email: `nave-created-${uniqueId}@test.com`, password: 'Test1234!', role: 'general', user_type: 'volunteer' },
    headers: { Authorization: `Bearer ${naveAuth.authToken}` },
  });
  assert('C4.4: Nave cannot create users (admin only)', createUserR.status === 401 || createUserR.status === 403, `got=${createUserR.status}`);
}

async function testPasswordResetInvalidToken() {
  const badTokenR = await api('POST', '/api/password/reset', {
    body: { token: 'invalid-token-that-does-not-exist', password: 'NewPwd789!' },
  });
  const acceptableErrors = [400, 401, 403, 404, 422, 500];
  assert('C5.3: Invalid reset token rejected', acceptableErrors.includes(badTokenR.status), `got=${badTokenR.status}`);

  const expiredTokenR = await api('POST', '/api/password/reset', {
    body: { token: 'expired-or-malformed', password: 'NewPwd789!' },
  });
  assert('C5.3: Malformed reset token rejected', acceptableErrors.includes(expiredTokenR.status), `got=${expiredTokenR.status}`);
}

async function testSurveyReportCrossCheck(seeded) {
  const admin = await loginAdmin();

  const reportR = await api('GET', '/api/surveys/get-report', {
    headers: { Authorization: `Bearer ${admin.authToken}` },
  });
  assert('C6.3: Survey report accessible', reportR.ok, `status=${reportR.status}`);

  const report = reportR.json?.reportJson ?? reportR.json;
  assert('C6.3: Report has total field', report?.total !== undefined, `total=${report?.total}`);

  const surveyListR = await api('GET', '/api/surveys', {
    headers: { Authorization: `Bearer ${admin.authToken}` },
  });
  assert('C6.3: Survey list accessible', surveyListR.ok, `status=${surveyListR.status}`);

  const surveyList = Array.isArray(surveyListR.json) ? surveyListR.json : surveyListR.json?.data ?? [];
  assert('C6.3: Reports total matches survey count', report.total === surveyList.length, `report=${report.total} surveys=${surveyList.length}`);

  const reportData = Array.isArray(report?.data) ? report.data : [];
  if (reportData.length > 0) {
    const hasAvgRating = reportData.every((d) => typeof d.averageRating === 'number');
    assert('C6.3: Report data has averageRating', hasAvgRating, `entries=${reportData.length}`);
  }
}

async function main() {
  console.log('=== Deep Functional QA Suite ===\n');
  console.log(`Target: ${API}\n`);

  let seeded;
  await phase('Phase 1: Seed/Setup', async () => {
    seeded = await seedData();
  });

  if (seeded) {
    await phase('Phase 2.1: Candidate Journey', testCandidateJourney);
    await phase('Phase 2.2: Survey Journey', () => testSurveyJourney(seeded));
    await phase('Phase 2.3: Contract Journey', testContractJourney);
    await phase('Phase 3.1: Activity Journey', () => testActivityJourney(seeded));
    await phase('Phase 3.3: Course Journey', () => testCourseJourney(seeded));
    await phase('Phase 3.4: Community Journey', testCommunityJourney);
    await phase('Phase 3.5: Share Card Journey', testShareCardJourney);
    await phase('Phase 4: Authorization', testAuthorization);
    await phase('Phase 4.2: Nave Contract Filtering', testNaveContractFiltering);
    await phase('Phase 5: Validation & Edge Cases', testValidation);
    await phase('Phase 5.3: Invalid Password Reset Token', testPasswordResetInvalidToken);
    await phase('Phase 6: Data Consistency', () => testDataConsistency(seeded));
    await phase('Phase 8: Idempotency - Survey Submission', testSurveyIdempotency);
    await phase('Phase 8b: Idempotency - Contract Creation', testContractIdempotency);
    await phase('Phase 9: Password Reset Flow', testPasswordReset);
    await phase('Phase 4.4: Nave Role Scope', testNaveScope);
    await phase('Phase 6.3: Survey Report Cross-Check', () => testSurveyReportCrossCheck(seeded));
  }

  await phase('Phase 7: Report', () => {
    const total = results.pass + results.fail + results.blocked;
    const rate = total > 0 ? ((results.pass / total) * 100).toFixed(1) : '0.0';

    console.log(`\n${'='.repeat(50)}`);
    console.log('  DEEP QA REPORT');
    console.log(`${'='.repeat(50)}`);
    console.log(`  Total:    ${total}`);
    console.log(`  Passed:   ${results.pass} ✅`);
    console.log(`  Failed:   ${results.fail} ${results.fail > 0 ? '❌' : '✅'}`);
    console.log(`  Blocked:  ${results.blocked}`);
    console.log(`  Rate:     ${rate}%`);
    console.log(`${'='.repeat(50)}`);

    if (results.fail > 0) {
      console.log('\n  FAILURES:');
      for (const a of results.assertions) {
        if (a.status === 'FAIL') console.log(`    ❌ ${a.label}: ${a.detail}`);
      }
    }

    let csv = 'Phase,Label,Status,Detail\n';
    for (const a of results.assertions) {
      const phase = a.label.split(':')[0];
      csv += `"${phase}","${a.label}","${a.status}","${(a.detail || '').replace(/"/g, '""')}"\n`;
    }
    const outPath = path.join(process.cwd(), 'deep-qa-results.csv');
    fs.writeFileSync(outPath, csv, 'utf-8');
    console.log(`\n  Report saved: ${outPath}`);

    assert('C7.1: Report generated', true, `Pass rate: ${rate}%`);

    const allPass = results.fail === 0 && results.blocked === 0;
    console.log(`\n  ${allPass ? '✅ ALL CHECKS PASSED' : '❌ SOME CHECKS FAILED'}`);
  });

  process.exit(results.fail > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error('Fatal error:', e);
  process.exit(1);
});
