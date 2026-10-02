let allPlayers = [];
let playerA = null;
let playerB = null;

async function init() {
  const data = await fetch('../championship-dna/data/players.json').then(r => r.json());
  allPlayers = data;

  const params = new URLSearchParams(window.location.search);
  const pa = params.get('a');
  const pb = params.get('b');
  if (pa && pb) {
    playerA = allPlayers.find(p => p.id === pa) || null;
    playerB = allPlayers.find(p => p.id === pb) || null;
    if (playerA) renderPlayerCard('a', playerA);
    if (playerB) renderPlayerCard('b', playerB);
    if (playerA && playerB) runAnalysis();
  }

  setupSearch('a');
  setupSearch('b');
}

function fantasyValue(p) {
  return (
    (p.pts || 0) * 1.0 +
    (p.reb || 0) * 1.2 +
    (p.ast || 0) * 1.5 +
    (p.steals || 0) * 3.0 +
    (p.blocks || 0) * 3.0 +
    (p.three_pm || 0) * 0.5
  );
}

function valueLabel(v) {
  if (v >= 45) return 'Elite';
  if (v >= 35) return 'Star';
  if (v >= 25) return 'Starter';
  if (v >= 15) return 'Rotation';
  return 'Role Player';
}

function statBar(label, val, maxVal) {
  const pct = maxVal > 0 ? Math.min(100, (val / maxVal) * 100) : 0;
  const filled = Math.round(pct / 5);
  const bar = '█'.repeat(filled) + '░'.repeat(20 - filled);
  return `<div class="stat-row">
    <span class="stat-label">${label}</span>
    <span class="stat-bar">${bar}</span>
    <span class="stat-val">${val.toFixed(1)}</span>
  </div>`;
}

function renderPlayerCard(side, player) {
  const card = document.getElementById(`player-card-${side}`);
  const fv = fantasyValue(player);
  card.classList.remove('empty');
  card.innerHTML = `
    <div class="card-name">${player.name}</div>
    <div class="card-meta">${player.archetype_label} · ${player.position} · Era ${player.era}</div>
    <div class="card-salary">${player.salary_label}</div>
    <div class="card-fv">DelQuant Value: <strong>${fv.toFixed(1)}</strong> <span class="fv-label">${valueLabel(fv)}</span></div>
    <button class="clear-btn" onclick="clearPlayer('${side}')">Change Player</button>
  `;
  checkReady();
}

function clearPlayer(side) {
  if (side === 'a') { playerA = null; }
  else { playerB = null; }
  const card = document.getElementById(`player-card-${side}`);
  card.classList.add('empty');
  card.innerHTML = '<span class="empty-label">No player selected</span>';
  document.getElementById(`search-${side}`).value = '';
  document.getElementById('result-panel').classList.add('hidden');
  checkReady();
}

function checkReady() {
  const btn = document.getElementById('analyze-btn');
  if (playerA && playerB) {
    btn.classList.remove('hidden');
  } else {
    btn.classList.add('hidden');
  }
}

function setupSearch(side) {
  const input = document.getElementById(`search-${side}`);
  const results = document.getElementById(`results-${side}`);

  input.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase();
    if (q.length < 2) { results.innerHTML = ''; return; }
    const other = side === 'a' ? playerB : playerA;
    const matches = allPlayers
      .filter(p => p.name.toLowerCase().includes(q) && (!other || p.id !== other.id))
      .slice(0, 8);
    if (!matches.length) { results.innerHTML = ''; return; }
    results.innerHTML = matches.map(p =>
      `<div class="search-result" onclick="selectPlayer('${side}', '${p.id}')">
        <span class="result-name">${p.name}</span>
        <span class="result-meta">${p.archetype_label} · ${p.pts}pts · ${p.salary_label}</span>
      </div>`
    ).join('');
  });

  document.addEventListener('click', e => {
    if (!e.target.closest(`#search-wrapper-${side}`)) results.innerHTML = '';
  });
}

function selectPlayer(side, id) {
  const player = allPlayers.find(p => p.id === id);
  if (!player) return;
  if (side === 'a') playerA = player;
  else playerB = player;
  renderPlayerCard(side, player);
  document.getElementById(`search-${side}`).value = '';
  document.getElementById(`results-${side}`).innerHTML = '';
  document.getElementById('result-panel').classList.add('hidden');
}

function runAnalysis() {
  if (!playerA || !playerB) return;

  const panel = document.getElementById('result-panel');
  const loading = document.getElementById('loading');
  const content = document.getElementById('result-content');

  panel.classList.remove('hidden');
  loading.classList.remove('hidden');
  content.classList.add('hidden');

  const steps = ['Loading projection data...', 'Computing fantasy value...', 'Comparing archetypes...', 'Delivering verdict...'];
  let step = 0;
  const stepEl = document.getElementById('loading-step');
  const interval = setInterval(() => {
    if (step < steps.length) stepEl.textContent = steps[step++];
  }, 350);

  setTimeout(() => {
    clearInterval(interval);
    const result = analyze(playerA, playerB);
    loading.classList.add('hidden');
    content.classList.remove('hidden');
    renderResult(result);
    panel.scrollIntoView({ behavior: 'smooth' });
  }, 1600);
}

function analyze(a, b) {
  const fvA = fantasyValue(a);
  const fvB = fantasyValue(b);
  const diff = fvB - fvA;
  const absDiff = Math.abs(diff);
  const pctDiff = fvA > 0 ? (absDiff / fvA) * 100 : 0;

  let winner, loser, winnerVal, loserVal, margin;

  if (absDiff < 1.5) {
    winner = null;
    margin = 'even';
  } else if (diff > 0) {
    winner = b;
    loser = a;
    winnerVal = fvB;
    loserVal = fvA;
    margin = pctDiff > 20 ? 'clear' : 'slight';
  } else {
    winner = a;
    loser = b;
    winnerVal = fvA;
    loserVal = fvB;
    margin = pctDiff > 20 ? 'clear' : 'slight';
  }

  const archetypeBonus = a.archetype === b.archetype ? 0 : 1;

  let verdictText, breakdownText;

  if (margin === 'even') {
    verdictText = `This trade is essentially even. Both players project to similar value.`;
    breakdownText = `${a.name} (${fvA.toFixed(1)}) and ${b.name} (${fvB.toFixed(1)}) are within the model's margin of error. Either player makes sense depending on your roster needs. DelQuant sees no clear winner here.`;
  } else {
    const you = winner === b ? 'You WIN this trade.' : 'You LOSE this trade.';
    verdictText = `${you} ${margin === 'clear' ? 'Clearly.' : 'Slightly.'}`;

    const advPlayer = winner === b ? b : a;
    const disadvPlayer = winner === b ? a : b;
    const advVal = winner === b ? fvB : fvA;
    const disadvVal = winner === b ? fvA : fvB;

    breakdownText = `${advPlayer.name} projects ${(advVal - disadvVal).toFixed(1)} more DelQuant value points per game than ${disadvPlayer.name} — a ${pctDiff.toFixed(0)}% edge. `;

    if (a.salary > b.salary && winner === b) {
      breakdownText += `You're also saving ${formatSalary(a.salary - b.salary)} in fictional salary. `;
    } else if (b.salary > a.salary && winner === a) {
      breakdownText += `Though you're taking on ${formatSalary(b.salary - a.salary)} more in fictional salary. `;
    }

    if (archetypeBonus && a.position !== b.position) {
      breakdownText += `Different positions (${a.position} vs ${b.position}) adds roster flexibility value.`;
    }
  }

  return { a, b, fvA, fvB, verdictText, breakdownText, winner, margin };
}

function formatSalary(n) {
  return '$' + (n / 1_000_000).toFixed(0) + 'M';
}

const STAT_MAX = { pts: 35, reb: 15, ast: 12, steals: 3, blocks: 3, three_pm: 4 };

function renderResult(result) {
  const { a, b, fvA, fvB, verdictText, breakdownText, winner } = result;

  const verdictEl = document.getElementById('verdict-text');
  verdictEl.textContent = verdictText;
  verdictEl.className = 'verdict-text ' + (
    winner === b ? 'win' : winner === a ? 'lose' : 'even'
  );

  document.getElementById('result-name-a').textContent = a.name;
  document.getElementById('result-name-b').textContent = b.name;

  document.getElementById('stat-bars-a').innerHTML =
    statBar('PTS', a.pts, STAT_MAX.pts) +
    statBar('REB', a.reb, STAT_MAX.reb) +
    statBar('AST', a.ast, STAT_MAX.ast) +
    statBar('STL', a.steals || 0, STAT_MAX.steals) +
    statBar('BLK', a.blocks || 0, STAT_MAX.blocks) +
    statBar('3PM', a.three_pm || 0, STAT_MAX.three_pm);

  document.getElementById('stat-bars-b').innerHTML =
    statBar('PTS', b.pts, STAT_MAX.pts) +
    statBar('REB', b.reb, STAT_MAX.reb) +
    statBar('AST', b.ast, STAT_MAX.ast) +
    statBar('STL', b.steals || 0, STAT_MAX.steals) +
    statBar('BLK', b.blocks || 0, STAT_MAX.blocks) +
    statBar('3PM', b.three_pm || 0, STAT_MAX.three_pm);

  const compA = document.getElementById('comp-value-a');
  compA.textContent = `Value: ${fvA.toFixed(1)} · ${valueLabel(fvA)}`;
  compA.className = 'comp-value ' + (winner === a ? 'winner' : winner === b ? 'loser' : '');

  const compB = document.getElementById('comp-value-b');
  compB.textContent = `Value: ${fvB.toFixed(1)} · ${valueLabel(fvB)}`;
  compB.className = 'comp-value ' + (winner === b ? 'winner' : winner === a ? 'loser' : '');

  document.getElementById('breakdown-text').textContent = breakdownText;

  document.getElementById('share-btn').onclick = () => copyShareText(result);
  document.getElementById('new-trade-btn').onclick = () => {
    clearPlayer('a');
    clearPlayer('b');
    document.getElementById('result-panel').classList.add('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
}

function copyShareText(result) {
  const { a, b, fvA, fvB, verdictText } = result;
  const text = `DelQuant Trade Analyzer:

Give: ${a.name} (${a.salary_label} · Value ${fvA.toFixed(1)})
Get:  ${b.name} (${b.salary_label} · Value ${fvB.toFixed(1)})

${verdictText}

Powered by DelQuant — 25 years of NBA intelligence
delquant.com`;

  navigator.clipboard.writeText(text).then(() => {
    const btn = document.getElementById('share-btn');
    btn.textContent = 'Copied!';
    setTimeout(() => btn.textContent = 'Copy Result Card', 2000);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  init();
  document.getElementById('analyze-btn').addEventListener('click', runAnalysis);
});
