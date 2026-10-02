const QUESTIONS = [
  {
    id: 'q1',
    text: 'Your team is down 2 with 8 seconds left. What do you do?',
    answers: [
      { text: 'I want the ball. I\'m taking the last shot.', scores: { scorer: 3, playmaker: 1 } },
      { text: 'I set up my teammate for the best look.', scores: { playmaker: 3, wing: 1 } },
      { text: 'Get to the line. I shoot 88% from the stripe.', scores: { shooter: 3, scorer: 1 } },
      { text: 'I crash the boards. Someone will miss — I\'ll be there.', scores: { big: 3, anchor: 1 } },
    ],
  },
  {
    id: 'q2',
    text: 'What\'s your natural position on offense?',
    answers: [
      { text: 'Off the dribble, creating my own shot.', scores: { scorer: 2, playmaker: 2 } },
      { text: 'Spotting up in the corner, waiting for my moment.', scores: { shooter: 3, wing: 1 } },
      { text: 'In the post or elbow, reading the defense.', scores: { big: 2, anchor: 2 } },
      { text: 'Transition. I\'m fastest with the ball in open space.', scores: { wing: 3, playmaker: 1 } },
    ],
  },
  {
    id: 'q3',
    text: 'How do you get your teammates going?',
    answers: [
      { text: 'I score first. When I\'m hot, everyone feeds off it.', scores: { scorer: 3, wing: 1 } },
      { text: 'I find them in rhythm. The assist is the play.', scores: { playmaker: 3, big: 1 } },
      { text: 'I set screens, get the easy bucket, let the offense flow.', scores: { big: 3, anchor: 1 } },
      { text: 'I guard the best player. Defense changes the whole game.', scores: { anchor: 3, wing: 1 } },
    ],
  },
  {
    id: 'q4',
    text: 'A scout is watching. What stat are you chasing tonight?',
    answers: [
      { text: '35+ points. I want him writing.', scores: { scorer: 3, playmaker: 1 } },
      { text: '12+ assists. I want everyone else to look great.', scores: { playmaker: 3, big: 1 } },
      { text: '5 blocked shots. I want to change the game defensively.', scores: { anchor: 3, big: 1 } },
      { text: '7+ threes. I want the range to show.', scores: { shooter: 3, scorer: 1 } },
    ],
  },
  {
    id: 'q5',
    text: 'What does your game look like in the fourth quarter?',
    answers: [
      { text: 'I get better. The moment doesn\'t scare me.', scores: { scorer: 2, playmaker: 2 } },
      { text: 'I make the right read, whatever the situation needs.', scores: { playmaker: 2, wing: 2 } },
      { text: 'I\'m on the best scorer on the other team. Locked in.', scores: { anchor: 3, wing: 1 } },
      { text: 'Give me the ball in the paint. I\'m too big to stop.', scores: { big: 3, anchor: 1 } },
    ],
  },
  {
    id: 'q6',
    text: 'What\'s your basketball philosophy?',
    answers: [
      { text: 'Offense wins games. Score more than them.', scores: { scorer: 3, shooter: 1 } },
      { text: 'Basketball is five guys sharing one ball.', scores: { playmaker: 3, big: 1 } },
      { text: 'Defense is the only thing you can control.', scores: { anchor: 3, wing: 1 } },
      { text: 'I play both ends. You can\'t just be one thing.', scores: { wing: 3, playmaker: 1 } },
    ],
  },
];

const ARCHETYPES = {
  scorer: {
    label: 'Elite Scorer',
    archetype_label: 'Elite Scorer / Creator',
    description: 'You were built to put the ball in the basket. Isolation, pull-up, off the catch — it doesn\'t matter. You find ways to score that other players can\'t explain.',
    traits: ['Shot creator', 'Clutch performer', 'Bucket getter'],
    comp_name: 'Damian Lillard',
    comp_note: 'Era 3 · PG · 24.9 PPG · Elite Scorer / Creator',
    comp_stat: '24.9 PPG',
    dq_label: 'DelQuant archetype: Elite Scorer / Creator',
  },
  playmaker: {
    label: 'Star Playmaker',
    archetype_label: 'Star Playmaker',
    description: 'Your vision runs the offense. You see passes two moves ahead and your teammates know: play off you and good things happen.',
    traits: ['Court vision', 'Decision maker', 'Pace controller'],
    comp_name: 'Shai Gilgeous-Alexander',
    comp_note: 'Era 3 · PG · 26.0 PPG · Star Playmaker',
    comp_stat: '26.0 PPG',
    dq_label: 'DelQuant archetype: Star Playmaker',
  },
  shooter: {
    label: 'Elite Shooter',
    archetype_label: 'Elite Shooter',
    description: 'You are the reason defenses have to make a decision. Your range extends the floor for everyone. When you catch it in rhythm — it\'s gone.',
    traits: ['Range specialist', 'Off-screen master', 'Spot-up threat'],
    comp_name: 'Ray Allen',
    comp_note: 'Era 1/2 · SG · 20.1 PPG · Elite Shooter',
    comp_stat: '45.4% 3P',
    dq_label: 'DelQuant archetype: Elite Shooter',
  },
  wing: {
    label: 'Star Wing',
    archetype_label: 'Star Wing / Scorer',
    description: 'Versatile, athletic, two-way. You guard the best player on most nights and score 20 on the other end. You\'re the building block every contender needs.',
    traits: ['Two-way impact', 'Wing defense', 'Transition threat'],
    comp_name: 'Luka Dončić',
    comp_note: 'Era 3 · SF/PG · 25.9 PPG · Star Wing / Scorer',
    comp_stat: '25.9 PPG',
    dq_label: 'DelQuant archetype: Star Wing / Scorer',
  },
  big: {
    label: 'Generational Big',
    archetype_label: 'Generational Center',
    description: 'You are the gravitational force that holds the team together. Scoring in the paint, rebounding, passing — you do everything a modern big man should.',
    traits: ['Interior force', 'Playmaking center', 'Anchor + creator'],
    comp_name: 'Nikola Jokić',
    comp_note: 'Era 3 · C · 23.0 PPG · Generational Center',
    comp_stat: '23.0 PPG / 11.8 REB / 7.3 AST',
    dq_label: 'DelQuant archetype: Generational Center',
  },
  anchor: {
    label: 'Defensive Anchor',
    archetype_label: 'Defensive Anchor',
    description: 'You protect the paint, alter shots, and make everyone else better defensively. When you\'re on the floor, the whole defense has a spine.',
    traits: ['Rim protection', 'Help-side presence', 'Defensive IQ'],
    comp_name: 'Rudy Gobert',
    comp_note: 'Era 3 · C · 13.3 PPG · Defensive Anchor',
    comp_stat: '3× Defensive Player of Year',
    dq_label: 'DelQuant archetype: Defensive Anchor',
  },
};

let answers = {};
let currentQ = 0;

function startQuiz() {
  document.getElementById('intro').classList.add('hidden');
  document.getElementById('quiz-area').classList.remove('hidden');
  renderQuestion(0);
}

function renderQuestion(idx) {
  currentQ = idx;
  const q = QUESTIONS[idx];
  const total = QUESTIONS.length;

  const pct = Math.round((idx / total) * 100);
  document.getElementById('progress-fill').style.width = pct + '%';
  document.getElementById('progress-label').textContent = `Question ${idx + 1} of ${total}`;

  const container = document.getElementById('question-container');
  container.innerHTML = `
    <p class="question-text">${q.text}</p>
    <div class="answers-grid">
      ${q.answers.map((a, i) =>
        `<button class="answer-btn" onclick="selectAnswer('${q.id}', ${i})">${a.text}</button>`
      ).join('')}
    </div>
  `;
}

function selectAnswer(qid, idx) {
  const q = QUESTIONS.find(q => q.id === qid);
  answers[qid] = q.answers[idx].scores;

  const btns = document.querySelectorAll('.answer-btn');
  btns[idx].classList.add('selected');
  btns.forEach((b, i) => { if (i !== idx) b.disabled = true; });

  setTimeout(() => {
    const nextIdx = QUESTIONS.findIndex(q => q.id === qid) + 1;
    if (nextIdx < QUESTIONS.length) {
      renderQuestion(nextIdx);
    } else {
      showResult();
    }
  }, 400);
}

function computeResult() {
  const totals = { scorer: 0, playmaker: 0, shooter: 0, wing: 0, big: 0, anchor: 0 };
  for (const scores of Object.values(answers)) {
    for (const [key, val] of Object.entries(scores)) {
      totals[key] = (totals[key] || 0) + val;
    }
  }
  let best = 'scorer';
  let max = 0;
  for (const [key, val] of Object.entries(totals)) {
    if (val > max) { max = val; best = key; }
  }
  return best;
}

function showResult() {
  document.getElementById('progress-fill').style.width = '100%';
  document.getElementById('progress-label').textContent = 'Done';

  const key = computeResult();
  const arch = ARCHETYPES[key];

  document.getElementById('quiz-area').classList.add('hidden');
  const panel = document.getElementById('result-panel');
  panel.classList.remove('hidden');

  document.getElementById('result-label').textContent = arch.label;
  document.getElementById('result-archetype').textContent = arch.archetype_label;
  document.getElementById('result-description').textContent = arch.description;

  document.getElementById('result-traits').innerHTML =
    arch.traits.map(t => `<span class="trait-tag">${t}</span>`).join('');

  document.getElementById('comp-name').textContent = arch.comp_name;
  document.getElementById('comp-note').textContent = arch.comp_note;
  document.getElementById('comp-stat').textContent = arch.comp_stat;
  document.getElementById('dq-label').textContent = arch.dq_label;

  document.getElementById('share-btn').onclick = () => copyShareText(arch);
  document.getElementById('retry-btn').onclick = () => retakeQuiz();

  panel.scrollIntoView({ behavior: 'smooth' });
}

function retakeQuiz() {
  answers = {};
  currentQ = 0;
  document.getElementById('result-panel').classList.add('hidden');
  document.getElementById('quiz-area').classList.remove('hidden');
  renderQuestion(0);
}

function copyShareText(arch) {
  const text = `DelQuant NBA Player Quiz

I play like: ${arch.label}
My comp: ${arch.comp_name} (${arch.comp_stat})

${arch.archetype_label} — powered by 25 years of NBA data.

Find your player type → https://delquant.com/games/which-player-are-you`;

  navigator.clipboard.writeText(text).then(() => {
    const btn = document.getElementById('share-btn');
    btn.textContent = 'Copied!';
    setTimeout(() => btn.textContent = 'Copy My Result', 2000);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('start-btn').addEventListener('click', startQuiz);
});
