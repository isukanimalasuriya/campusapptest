/**
 * Integration checks: log in as each @skilltest.local user and run ≥2 API tests per account.
 *
 * Prerequisites: MongoDB + API on PORT (default 5000), seeded users (npm run seed:skill-exchange).
 *
 * Usage: node scripts/skill-exchange-four-users.test.mjs
 * Env: API_BASE=http://localhost:5000/api
 */

const API_BASE = (process.env.API_BASE || "http://localhost:5000/api").replace(/\/$/, "");

const PASSWORD = "TestPass123!";

const ACCOUNTS = [
  { key: "alice", email: "alice@skilltest.local", label: "Alice Host" },
  { key: "bob", email: "bob@skilltest.local", label: "Bob Learner" },
  { key: "carol", email: "carol@skilltest.local", label: "Carol Volunteer" },
  { key: "dana", email: "dana@skilltest.local", label: "Dana Joiner" },
];

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

async function api(method, path, { token, body } = {}) {
  const url = path.startsWith("http") ? path : `${API_BASE}${path.startsWith("/") ? "" : "/"}${path}`;
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  let data = null;
  const text = await res.text();
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  return { status: res.status, data };
}

async function login(email) {
  const { status, data } = await api("POST", "/auth/login", {
    body: { email, password: PASSWORD },
  });
  assert(status === 200, `Login ${email}: expected 200, got ${status}: ${JSON.stringify(data)}`);
  const token = data?.token;
  assert(token, `Login ${email}: missing token`);
  return token;
}

function extractSkills(payload) {
  const d = payload?.data;
  if (Array.isArray(d)) return d;
  if (Array.isArray(payload)) return payload;
  return [];
}

async function main() {
  console.log("Skill Exchange — four-user API checks");
  console.log("API_BASE:", API_BASE);
  let passed = 0;
  let failed = 0;

  const run = async (who, name, fn) => {
    try {
      await fn();
      console.log(`  ✓ [${who}] ${name}`);
      passed++;
    } catch (e) {
      console.error(`  ✗ [${who}] ${name}:`, e.message);
      failed++;
    }
  };

  const tokens = {};
  for (const a of ACCOUNTS) {
    tokens[a.key] = await login(a.email);
  }

  // ── Alice (host): notifications + approve Dana's pending join ─────────
  await run("alice", "GET /skills/notifications", async () => {
    const { status, data } = await api("GET", "/skills/notifications", { token: tokens.alice });
    assert(status === 200, `status ${status}`);
    assert(data && Array.isArray(data.data), "expected { data: [] }");
  });

  let skillWithDanaPending = null;
  let danaJoinId = null;
  await run("alice", "GET /skills + approve Dana pending join", async () => {
    const { status, data } = await api("GET", "/skills?limit=120&page=1", { token: tokens.alice });
    assert(status === 200, `status ${status}`);
    const skills = extractSkills(data);
    for (const s of skills) {
      const jr = s.joinRequests?.find(
        (j) => j.status === "Pending" && /dana/i.test(j.userName || "")
      );
      if (jr) {
        skillWithDanaPending = s;
        danaJoinId = jr._id;
        break;
      }
    }
    assert(skillWithDanaPending && danaJoinId, "No pending join from Dana (re-run seed: npm run seed:skill-exchange)");
    const patch = await api("PATCH", `/skills/${skillWithDanaPending._id}/join-request/${danaJoinId}`, {
      token: tokens.alice,
      body: { status: "Approved" },
    });
    assert(patch.status === 200, `approve join: ${patch.status} ${JSON.stringify(patch.data)}`);
  });

  // Extra skill for Dana to join (fresh join request)
  let extraSkillId = null;
  await run("alice", "POST /skills/offer (extra public session for Dana)", async () => {
    const when = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString();
    const { status, data } = await api("POST", "/skills/offer", {
      token: tokens.alice,
      body: {
        skillName: "Dashboard E2E — Extra Session",
        subject: "Computer Science",
        moduleCode: "IT2020",
        description: "Created by automated four-user test.",
        skillLevel: "Beginner",
        mode: "Online",
        isPublic: true,
        availability: when,
      },
    });
    assert(status === 201, `offer: ${status} ${JSON.stringify(data)}`);
    extraSkillId = data._id;
    assert(extraSkillId, "missing new skill id");
  });

  // ── Bob: my learning requests + post new learning request ─────────────
  let bobNewLrId = null;
  await run("bob", "GET /skills/my-learning-requests", async () => {
    const { status, data } = await api("GET", "/skills/my-learning-requests", { token: tokens.bob });
    assert(status === 200, `status ${status}`);
    assert(Array.isArray(data), "expected array");
    assert(data.length >= 1, "seed should give Bob at least one learning request");
  });

  await run("bob", "POST /skills/learning-request", async () => {
    const when = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString();
    const { status, data } = await api("POST", "/skills/learning-request", {
      token: tokens.bob,
      body: {
        subject: "Computer Science",
        moduleCode: "IT3050",
        titleWhatIWantToLearn: "Four-user test — GraphQL basics",
        description: "Automated test post.",
        preferredTime: when,
        skillLevel: "Beginner",
        mode: "Online",
      },
    });
    assert(status === 201, `status ${status}`);
    bobNewLrId = data._id;
    assert(bobNewLrId, "missing learning request id");
  });

  // ── Carol: browse open requests + volunteer on Bob's new request ─────
  await run("carol", "GET /skills/learning-requests", async () => {
    const { status, data } = await api("GET", "/skills/learning-requests?limit=80&page=1", {
      token: tokens.carol,
    });
    assert(status === 200, `status ${status}`);
    const list = extractSkills(data);
    assert(list.length >= 1, "expected at least one open learning request");
  });

  await run("carol", "POST volunteer on Bob's new learning request", async () => {
    assert(bobNewLrId, "Bob LR id missing");
    const { status, data } = await api("POST", `/skills/learning-request/${bobNewLrId}/volunteer`, {
      token: tokens.carol,
      body: { message: "Happy to help — from four-user test script." },
    });
    assert(status === 200, `status ${status} ${JSON.stringify(data)}`);
  });

  // ── Dana: list skills + join Alice's extra session ─────────────────────
  await run("dana", "GET /skills", async () => {
    const { status, data } = await api("GET", "/skills?limit=120&page=1", { token: tokens.dana });
    assert(status === 200, `status ${status}`);
    const skills = extractSkills(data);
    assert(skills.length >= 1, "expected skills list");
  });

  await run("dana", "POST join-request on Alice extra public skill", async () => {
    assert(extraSkillId, "extra skill id missing");
    const { status, data } = await api("POST", `/skills/${extraSkillId}/join-request`, {
      token: tokens.dana,
      body: {},
    });
    assert(status === 200, `status ${status} ${JSON.stringify(data)}`);
  });

  // ── Dana: second read test ─────────────────────────────────────────────
  await run("dana", "GET /skills/requests (activity feed)", async () => {
    const { status, data } = await api("GET", "/skills/requests?limit=50&page=1", { token: tokens.dana });
    assert(status === 200, `status ${status}`);
    const list = extractSkills(data);
    assert(Array.isArray(list), "expected list");
  });

  // ── Carol: second test — notifications ────────────────────────────────
  await run("carol", "GET /skills/notifications", async () => {
    const { status, data } = await api("GET", "/skills/notifications", { token: tokens.carol });
    assert(status === 200, `status ${status}`);
  });

  // ── Bob: second write-ish — GET requests (already had POST LR); add GET explore ──
  await run("bob", "GET /skills/learning-requests (sees board incl. own hidden)", async () => {
    const { status } = await api("GET", "/skills/learning-requests?limit=80&page=1", { token: tokens.bob });
    assert(status === 200, `status ${status}`);
  });

  console.log("\n─────────────────────────────────");
  console.log(`Passed: ${passed}, Failed: ${failed}`);
  if (failed > 0) process.exit(1);
  console.log("All four-user Skill Exchange checks passed.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
