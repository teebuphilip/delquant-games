const STAR_ARCHETYPES = new Set([
  'PG_01','PG_02','PG_03','SG_02','SG_10',
  'SF_08','SF_09','PF_09','PF_10','C_10','C_11',
]);

const CAP = 100_000_000;
const CAP_DISPLAY = '$100M';

let allPlayers = [];
let roster = [];
let centroids = {};
let comps = [];

async function init() {
  const [p, c, h] = await Promise.all([
    fetch('data/players.json').then(r => r.json()),
    fetch('data/champion-centroids.json').then(r => r.json()),
    fetch('data/historical-comps.json').then(r => r.json()),
  ]);
  allPlayers = p;
  centroids = c;
  comps = h;

  const params = new URLSearchParams(window.location.search);
  const shared = params.get('roster');
  if (shared) {
    const ids = shared.split(',').slice(0, 8);
    roster = allPlayers.filter(p => ids.includes(p.id)).slice(0, 8);
    if (roster.length >= 5) {
      renderRoster();
      updateCapMeter();
      runAnalysis();
      return;
    }
  }
  renderRoster();
  updateCapMeter();
}

function rosterSalary() {
  return roster.reduce((sum, p) => sum + (p.salary || 0), 0);
}

function isOverCap() {
  return rosterSalary() > CAP;
}

function formatSalary(n) {
  if (n >= 1_000_000) return '$' + (n / 1_000_000).toFixed(0) + 'M';
  return '$' + n.toLocaleString();
}

function updateCapMeter() {
  const used = rosterSalary();
  const pct = Math.min(100, (used / CAP) * 100);
  const over = used > CAP;

  const meterFill = document.getElementById('cap-meter-fill');
  const capUsed = document.getElementById('cap-used');
  const capRemaining = document.getElementById('cap-remaining');
  const capStatus = document.getElementById('cap-status');

  meterFill.style.width = pct + '%';
  meterFill.style.background = over
    ? 'linear-gradient(90deg, #f87171, #ef4444)'
    : pct > 85
    ? 'linear-gradient(90deg, #fb923c, #f59e0b)'
    : 'linear-gradient(90deg, #f59e0b, #4ade80)';

  capUsed.textContent = formatSalary(used);
  capRemaining.textContent = over
    ? '−' + formatSalary(used - CAP) + ' OVER'
    : formatSalary(CAP - used) + ' remaining';
  capRemaining.style.color = over ? '#f87171' : '#9ca3af';

  if (over) {
    capStatus.textContent = '⚠ Over the cap — remove a player to analyze';
    capStatus.style.color = '#f87171';
    document.getElementById('analyze-btn').disabled = true;
    document.getElementById('analyze-btn').classList.add('disabled');
  } else {
    capStatus.textContent = roster.length >= 5 ? '✓ Under the cap — ready to analyze' : 'Add at least 5 players';
    capStatus.style.color = roster.length >= 5 ? '#4ade80' : '#9ca3af';
    document.getElementById('analyze-btn').disabled = false;
    document.getElementById('analyze-btn').classList.remove('disabled');
  }

  if (roster.length >= 5 && !over) {
    document.getElementById('analyze-btn').classList.remove('hidden');
  } else if (roster.length < 5) {
    document.getElementById('analyze-btn').classList.add('hidden');
  }
}

function getEra() {
  if (!roster.length) return 'era3';
  const counts = {era1: 0, era2: 0, era3: 0};
  roster.forEach(p => counts['era' + p.era]++);
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
}

function buildShapeVector(players) {
  const n = players.length;
  if (!n) return null;
  const archs = players.map(p => p.archetype);
  const starCount = archs.filter(a => STAR_ARCHETYPES.has(a)).length;
  const posCount = {PG: 0, SG: 0, SF: 0, PF: 0, C_: 0};
  archs.forEach(a => {
    const key = a.slice(0, 2);
    if (key in posCount) posCount[key]++;
  });
  return {
    star_share: starCount / n,
    pg_share: posCount.PG / n,
    sg_share: posCount.SG / n,
    sf_share: posCount.SF / n,
    pf_share: posCount.PF / n,
    c_share: posCount.C_ / n,
  };
}

function vectorDistance(a, b) {
  const keys = ['star_share','pg_share','sg_share','sf_share','pf_share','c_share'];
  let sum = 0;
  keys.forEach(k => {
    const diff = (a[k] || 0) - (b[k] || 0);
    sum += diff * diff;
  });
  return Math.sqrt(sum);
}

function scoreRoster(players) {
  const vec = buildShapeVector(players);
  const era = getEra();
  const centroid = centroids[era];

  const maxDist = Math.sqrt(6);
  const rawDist = vectorDistance(vec, centroid);
  const overall = Math.round((1 - rawDist / maxDist) * 100);

  const starCount = players.filter(p => STAR_ARCHETYPES.has(p.archetype)).length;
  const offScore = Math.round(Math.min(100, (starCount / 3) * 60 + (centroid.star_share > 0 ? (1 - Math.abs(vec.star_share - centroid.star_share)) * 40 : 40)));

  const hasCenter = players.some(p => p.archetype.startsWith('C_'));
  const hasBig = players.some(p => p.archetype.startsWith('PF'));
  const hasWing = players.some(p => p.archetype.startsWith('SF') || p.archetype.startsWith('SG'));
  const defScore = Math.round(
    (hasCenter ? 30 : 10) +
    (hasBig ? 20 : 5) +
    (hasWing ? 25 : 10) +
    (players.length >= 7 ? 15 : players.length >= 5 ? 10 : 5) +
    Math.random() * 10
  );

  const posSet = new Set(players.map(p => p.archetype.slice(0, 2)));
  const balanceScore = Math.round(Math.min(100, (posSet.size / 5) * 60 + (players.length / 8) * 40));

  const compScores = comps.map(c => ({
    comp: c,
    dist: vectorDistance(vec, c),
  })).sort((a, b) => a.dist - b.dist);
  const bestComp = compScores[0].comp;

  return {
    overall: Math.max(20, Math.min(99, overall)),
    offScore: Math.max(20, Math.min(99, offScore)),
    defScore: Math.max(20, Math.min(99, defScore)),
    balanceScore: Math.max(20, Math.min(99, balanceScore)),
    era,
    comp: bestComp,
    totalSalary: rosterSalary(),
  };
}

function search(query) {
  if (query.length < 2) return [];
  const q = query.toLowerCase();
  return allPlayers
    .filter(p => p.name.toLowerCase().includes(q) && !roster.find(r => r.id === p.id))
    .slice(0, 8);
}

function addPlayer(player) {
  if (roster.length >= 8) return;
  if (roster.find(r => r.id === player.id)) return;
  roster.push(player);
  renderRoster();
  updateCapMeter();
  document.getElementById('search-input').value = '';
  document.getElementById('search-results').innerHTML = '';
  document.getElementById('result-panel').classList.add('hidden');
}

function removePlayer(id) {
  roster = roster.filter(p => p.id !== id);
  renderRoster();
  updateCapMeter();
  document.getElementById('result-panel').classList.add('hidden');
}

function renderRoster() {
  const el = document.getElementById('roster-slots');
  const slots = 8;
  let html = '';
  for (let i = 0; i < slots; i++) {
    if (i < roster.length) {
      const p = roster[i];
      html += `<div class="player-slot filled">
        <div class="player-info">
          <span class="player-name">${p.name}</span>
          <span class="player-meta">${p.archetype_label} · ${p.pts}pts · <span class="salary-tag">${p.salary_label}</span></span>
        </div>
        <button class="remove-btn" onclick="removePlayer('${p.id}')">✕</button>
      </div>`;
    } else {
      html += `<div class="player-slot empty">
        <span class="slot-label">${i < 5 ? 'Required' : 'Optional'} Slot ${i + 1}</span>
      </div>`;
    }
  }
  el.innerHTML = html;
  document.getElementById('roster-count').textContent = `${roster.length}/8 players`;
}

function runAnalysis() {
  if (roster.length < 5 || isOverCap()) return;

  const resultPanel = document.getElementById('result-panel');
  const loadingEl = document.getElementById('loading');
  const resultEl = document.getElementById('result-content');

  resultPanel.classList.remove('hidden');
  loadingEl.classList.remove('hidden');
  resultEl.classList.add('hidden');

  const steps = [
    'Assigning archetypes...',
    'Mapping roster shape...',
    'Comparing to championship reference set...',
    'Calibrating era...',
    'Computing DNA score...',
  ];
  let step = 0;
  const stepEl = document.getElementById('loading-step');
  const interval = setInterval(() => {
    if (step < steps.length) {
      stepEl.textContent = steps[step++];
    }
  }, 400);

  setTimeout(() => {
    clearInterval(interval);
    const result = scoreRoster(roster);
    loadingEl.classList.add('hidden');
    resultEl.classList.remove('hidden');
    renderResult(result);
    resultPanel.scrollIntoView({behavior: 'smooth'});
  }, 2200);
}

function bar(score) {
  const filled = Math.round(score / 5);
  return '█'.repeat(filled) + '░'.repeat(20 - filled);
}

function scoreColor(score) {
  if (score >= 80) return '#4ade80';
  if (score >= 65) return '#facc15';
  if (score >= 50) return '#fb923c';
  return '#f87171';
}

function renderResult(result) {
  const {overall, offScore, defScore, balanceScore, era, comp, totalSalary} = result;
  const eraLabels = {era1: '1996–2004', era2: '2005–2015', era3: '2016–2026'};

  document.getElementById('score-number').textContent = overall + '%';
  document.getElementById('score-number').style.color = scoreColor(overall);
  document.getElementById('score-bar').textContent = bar(overall);
  document.getElementById('score-bar').style.color = scoreColor(overall);

  document.getElementById('off-score').textContent = offScore + '%';
  document.getElementById('off-bar').textContent = bar(offScore);
  document.getElementById('off-bar').style.color = scoreColor(offScore);

  document.getElementById('def-score').textContent = defScore + '%';
  document.getElementById('def-bar').textContent = bar(defScore);
  document.getElementById('def-bar').style.color = scoreColor(defScore);

  document.getElementById('bal-score').textContent = balanceScore + '%';
  document.getElementById('bal-bar').textContent = bar(balanceScore);
  document.getElementById('bal-bar').style.color = scoreColor(balanceScore);

  document.getElementById('result-salary').textContent = `Total payroll: ${formatSalary(totalSalary)} of ${CAP_DISPLAY} cap`;

  document.getElementById('comp-name').textContent = comp.label;
  document.getElementById('comp-desc').textContent = comp.description;
  document.getElementById('comp-players').textContent = comp.players.slice(0, 5).join(' · ');
  document.getElementById('era-label').textContent = `Era: ${eraLabels[era]}`;

  const archetypeSummary = {};
  roster.forEach(p => {
    archetypeSummary[p.archetype_label] = (archetypeSummary[p.archetype_label] || 0) + 1;
  });
  document.getElementById('archetype-mix').innerHTML = Object.entries(archetypeSummary)
    .map(([label, count]) => `<span class="arch-tag">${label}${count > 1 ? ' ×' + count : ''}</span>`)
    .join('');

  document.getElementById('share-btn').onclick = () => copyShareText(result);
  document.getElementById('share-url-btn').onclick = () => copyShareUrl();
}

function copyShareText(result) {
  const {overall, offScore, defScore, comp, totalSalary} = result;
  const text = `My NBA Championship DNA Score: ${overall}%

Roster (${formatSalary(totalSalary)} cap):
${roster.map(p => `• ${p.name} — ${p.salary_label}`).join('\n')}

Offense: ${offScore}% | Defense: ${defScore}%
Closest comp: ${comp.label}
"${comp.description}"

Powered by DelQuant — 25 years of NBA intelligence
delquant.com`;

  navigator.clipboard.writeText(text).then(() => {
    const btn = document.getElementById('share-btn');
    btn.textContent = 'Copied!';
    setTimeout(() => btn.textContent = 'Copy Result Card', 2000);
  });
}

function copyShareUrl() {
  const ids = roster.map(p => p.id).join(',');
  const url = `${window.location.origin}${window.location.pathname}?roster=${ids}`;
  navigator.clipboard.writeText(url).then(() => {
    const btn = document.getElementById('share-url-btn');
    btn.textContent = 'Link Copied!';
    setTimeout(() => btn.textContent = 'Share This Roster', 2000);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  init();

  const input = document.getElementById('search-input');
  const results = document.getElementById('search-results');

  input.addEventListener('input', () => {
    const q = input.value.trim();
    const matches = search(q);
    if (!matches.length) { results.innerHTML = ''; return; }
    results.innerHTML = matches.map(p =>
      `<div class="search-result" onclick="addPlayer(${JSON.stringify(p).replace(/"/g, '&quot;')})">
        <span class="result-name">${p.name}</span>
        <span class="result-meta">${p.archetype_label} · ${p.pts}pts · <span class="salary-tag-sm">${p.salary_label}</span></span>
      </div>`
    ).join('');
  });

  document.addEventListener('click', e => {
    if (!e.target.closest('#search-wrapper')) {
      results.innerHTML = '';
    }
  });

  document.getElementById('analyze-btn').addEventListener('click', runAnalysis);
});
