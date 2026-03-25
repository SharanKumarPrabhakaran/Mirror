// ─── Sample conversations ──────────────────────────────────
const SAMPLES = {
  avoider: {
    name: 'Me',
    conversation: `Jordan: Hey, did you get a chance to look at the proposal I sent?
Me: Yeah I saw it.
Jordan: And? What did you think?
Me: It was fine.
Jordan: Just fine? I worked really hard on that.
Me: I mean, it's good. I just think some parts could be better but it's whatever.
Jordan: Which parts? I'd love your feedback.
Me: I don't know, just... some of it felt a bit basic. But forget it, it's fine.
Jordan: No tell me, I want to know.
Me: It's not a big deal. You always take feedback personally anyway.
Jordan: That's not fair. I'm asking because I genuinely want to improve.
Me: Okay fine. The market analysis was weak and the pricing section made no sense.
Jordan: Wow, okay. You could have just said that from the beginning.
Me: I didn't want to hurt your feelings. I was trying to be nice.
Jordan: That's not being nice, that's being dishonest.
Me: I can't win with you. If I'm honest you get upset, if I hold back you get upset.
Jordan: I'm not upset about the feedback, I'm upset about how you handled it.
Me: Whatever. Next time I just won't say anything.`
  },
  deflector: {
    name: 'Me',
    conversation: `Sam: Hey, I felt a bit dismissed in today's meeting when you talked over me.
Me: I wasn't talking over you, I was just excited about the idea.
Sam: It happened a couple times though.
Me: I think you might be misreading it. I do that with everyone when I'm passionate.
Sam: It still felt dismissive.
Me: I'm sorry you felt that way, but I didn't mean anything by it.
Sam: Can you just try to be more aware of it?
Me: I mean, you could also signal more clearly when you want to speak. I can't read minds.
Sam: I was literally in the middle of a sentence.
Me: Look, I've always been like this. Everyone on the team knows I get excited. Nobody else has complained.
Sam: Maybe they're just not saying anything.
Me: Or maybe this is just how I am and it's being taken the wrong way.
Sam: I'm just asking you to listen better.
Me: I hear you, but I also think you need to be a bit more assertive in those situations.`
  },
  pleaser: {
    name: 'Me',
    conversation: `Riley: Do you actually want to go to this party tonight or are you just saying yes to be nice?
Me: No no, I really want to go! It'll be fun.
Riley: Because last time you seemed miserable.
Me: I wasn't miserable, I was just tired. I'm sorry if I ruined the vibe.
Riley: You didn't ruin it, I just want to know what you actually want.
Me: I want whatever you want. Seriously, if you want to go, let's go.
Riley: That's not an answer.
Me: I'm genuinely okay with whatever. I don't want to be the reason we don't go.
Riley: Why do you always do this?
Me: Do what? I'm just being flexible.
Riley: It feels like you never have an opinion.
Me: I have opinions, I just don't want to make everything about me. I'm sorry.
Riley: Stop apologizing. Just tell me what YOU want.
Me: Honestly? I'm a bit tired but if you're excited about it I'll be excited too. I don't want to let you down.`
  }
};

// ─── Tab switching ─────────────────────────────────────────
function switchTab(tab) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  document.querySelector(`.tab[onclick*="${tab}"]`).classList.add('active');
  document.getElementById(`tab-${tab}`).classList.add('active');
}

// ─── Load sample ───────────────────────────────────────────
function loadSample(key) {
  const s = SAMPLES[key];
  document.getElementById('your-name').value = s.name;
  document.getElementById('conversation').value = s.conversation;
  const len = s.conversation.length;
  charCount.textContent = `${len.toLocaleString()} chars`;
  charCount.style.color = 'var(--violet2)';
  document.getElementById('conversation').focus();
}

// ─── Upload helpers ────────────────────────────────────────
function triggerChatUpload()  { document.getElementById('file-chat-input').click(); }
function triggerVoiceUpload() { document.getElementById('file-voice-input').click(); }

function setUploadStatus(state, message) {
  const el = document.getElementById('upload-status');
  el.className = 'upload-status';
  if (state === 'hidden') { el.classList.add('hidden'); el.textContent = ''; return; }
  el.classList.remove('hidden');
  el.classList.add(state);
  el.textContent = message;
}

function setUploadBtnsDisabled(disabled) {
  document.getElementById('btn-upload-chat').disabled  = disabled;
  document.getElementById('btn-upload-voice').disabled = disabled;
}

async function handleChatFile(input) {
  const file = input.files[0];
  if (!file) return;
  input.value = '';
  setUploadStatus('loading', '◈  Parsing chat export…');
  setUploadBtnsDisabled(true);
  const formData = new FormData();
  formData.append('file', file);
  try {
    const res = await fetch('/upload/chat', { method: 'POST', body: formData });
    if (!res.ok) { const e = await res.json(); throw new Error(e.detail || 'Parse failed'); }
    const data = await res.json();
    populateConversation(data.text, data.source);
    setUploadStatus('success', `✓  Loaded ${file.name} — review below, then click Analyze`);
  } catch (err) {
    setUploadStatus('error', '✗  ' + err.message);
  } finally {
    setUploadBtnsDisabled(false);
  }
}

async function handleVoiceFile(input) {
  const file = input.files[0];
  if (!file) return;
  input.value = '';
  setUploadStatus('loading', '◈  Transcribing with Whisper…');
  setUploadBtnsDisabled(true);
  const formData = new FormData();
  formData.append('file', file);
  try {
    const res = await fetch('/upload/voice', { method: 'POST', body: formData });
    if (!res.ok) { const e = await res.json(); throw new Error(e.detail || 'Transcription failed'); }
    const data = await res.json();
    populateConversation(data.text, data.source);
    setUploadStatus('success', '✓  Transcribed — add speaker names if needed, then Analyze');
  } catch (err) {
    setUploadStatus('error', '✗  ' + err.message);
  } finally {
    setUploadBtnsDisabled(false);
  }
}

function populateConversation(text, source) {
  const textarea = document.getElementById('conversation');
  textarea.value = text;
  const len = text.length;
  charCount.textContent = `${len.toLocaleString()} chars`;
  charCount.style.color = len > 100 ? 'var(--violet2)' : 'var(--dimmed)';

  const noteEl = document.getElementById('transcript-note');
  if (source === 'voice_transcript') {
    noteEl.classList.remove('hidden');
    const span = document.createElement('span');
    span.textContent = '◎  Voice transcript loaded — no speaker labels. Add "Me:" prefixes to your lines for deeper blind spot detection.';
    const btn = document.createElement('button');
    btn.className = 'transcript-note-dismiss';
    btn.textContent = '✕';
    btn.setAttribute('onclick', 'dismissTranscriptNote()');
    noteEl.innerHTML = '';
    noteEl.appendChild(span);
    noteEl.appendChild(btn);
  } else {
    noteEl.classList.add('hidden');
  }
  textarea.focus();
  textarea.scrollTop = 0;
}

function dismissTranscriptNote() {
  document.getElementById('transcript-note').classList.add('hidden');
}

// ─── Drag and drop ─────────────────────────────────────────
function handleDragOver(event) {
  event.preventDefault();
  document.getElementById('upload-zone').classList.add('drag-over');
}
function handleDragLeave(event) {
  document.getElementById('upload-zone').classList.remove('drag-over');
}
function handleDrop(event) {
  event.preventDefault();
  document.getElementById('upload-zone').classList.remove('drag-over');
  const file = event.dataTransfer.files[0];
  if (!file) return;
  const name = file.name.toLowerCase();
  const dt = new DataTransfer();
  dt.items.add(file);
  if (name.endsWith('.txt')) {
    const input = document.getElementById('file-chat-input');
    input.files = dt.files;
    handleChatFile(input);
  } else if (/\.(mp3|m4a|wav|webm|ogg)$/.test(name)) {
    const input = document.getElementById('file-voice-input');
    input.files = dt.files;
    handleVoiceFile(input);
  } else {
    setUploadStatus('error', '✗  Unsupported file. Drop a .txt chat export or an audio file.');
    setTimeout(() => setUploadStatus('hidden', ''), 4000);
  }
}

// ─── Character counter ──────────────────────────────────────
const convTextarea = document.getElementById('conversation');
const charCount    = document.getElementById('char-count');
convTextarea.addEventListener('input', () => {
  const len = convTextarea.value.length;
  charCount.textContent = `${len.toLocaleString()} chars`;
  charCount.style.color = len > 100 ? 'var(--violet2)' : 'var(--dimmed)';
});

// ─── Screen management ──────────────────────────────────────
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ─── Loading animation ─────────────────────────────────────
let stepInterval;
function startLoadingAnimation() {
  const steps = ['step-1', 'step-2', 'step-3'];
  let current = 0;
  steps.forEach(s => document.getElementById(s).classList.remove('active'));
  document.getElementById(steps[0]).classList.add('active');
  stepInterval = setInterval(() => {
    document.getElementById(steps[current]).classList.remove('active');
    current = (current + 1) % steps.length;
    document.getElementById(steps[current]).classList.add('active');
  }, 1400);
}
function stopLoadingAnimation() { clearInterval(stepInterval); }

// ─── Analyze ────────────────────────────────────────────────
async function analyze() {
  const name         = document.getElementById('your-name').value.trim();
  const conversation = document.getElementById('conversation').value.trim();
  if (!name)                   return showToast('Enter your name as it appears in the conversation.');
  if (conversation.length < 50) return showToast('Paste a longer conversation for accurate analysis.');

  setAnalyzeBtnState(true);
  showScreen('screen-loading');
  startLoadingAnimation();

  try {
    const res = await fetch('/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversation, your_name: name })
    });
    if (!res.ok) { const e = await res.json(); throw new Error(e.detail || 'Analysis failed'); }
    const data = await res.json();
    stopLoadingAnimation();
    renderResults(data);
    showScreen('screen-results');
  } catch (err) {
    stopLoadingAnimation();
    showScreen('screen-input');
    showToast('Error: ' + err.message);
  } finally {
    setAnalyzeBtnState(false);
  }
}

function setAnalyzeBtnState(loading) {
  document.getElementById('cta-arrow').classList.toggle('hidden', loading);
  document.getElementById('btn-loader').classList.toggle('hidden', !loading);
  document.getElementById('btn-text').textContent = loading ? 'Analyzing…' : 'Look in the Mirror';
}

// ─── Quick Rewrite ──────────────────────────────────────────
async function doRewrite() {
  const message = document.getElementById('rw-message').value.trim();
  const context = document.getElementById('rw-context').value.trim();
  if (!message) return showToast('Enter a message to rewrite.');

  document.getElementById('rw-cta-arrow').classList.add('hidden');
  document.getElementById('rw-btn-loader').classList.remove('hidden');
  document.getElementById('rw-btn-text').textContent = 'Rewriting…';
  const resultsEl = document.getElementById('rewrite-results');
  resultsEl.classList.add('hidden');

  try {
    const res = await fetch('/rewrite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, context })
    });
    if (!res.ok) { const e = await res.json(); throw new Error(e.detail || 'Rewrite failed'); }
    const data = await res.json();
    renderRewrites(data.rewrites);
    resultsEl.classList.remove('hidden');
  } catch (err) {
    showToast('Error: ' + err.message);
  } finally {
    document.getElementById('rw-cta-arrow').classList.remove('hidden');
    document.getElementById('rw-btn-loader').classList.add('hidden');
    document.getElementById('rw-btn-text').textContent = 'Rewrite It';
  }
}

function renderRewrites(rewrites) {
  const el = document.getElementById('rewrite-results');
  el.innerHTML = '';
  (rewrites || []).forEach((rw, i) => {
    const card = document.createElement('div');
    card.className = 'rw-card';
    card.style.animationDelay = `${i * 0.08}s`;

    const top = document.createElement('div');
    top.className = 'rw-card-top';
    const icon = document.createElement('span');
    icon.className = 'rw-icon';
    icon.textContent = rw.icon || '→';
    const style = document.createElement('span');
    style.className = 'rw-style';
    style.textContent = rw.style;
    top.appendChild(icon); top.appendChild(style);

    const msg = document.createElement('div');
    msg.className = 'rw-message';
    msg.textContent = rw.message;

    const why = document.createElement('div');
    why.className = 'rw-why';
    why.textContent = rw.why;

    card.appendChild(top); card.appendChild(msg); card.appendChild(why);
    el.appendChild(card);
  });
}

// ─── Render Results ──────────────────────────────────────────

// Stored analysis context for coach
let analysisContext = '';

function renderResults(data) {
  // Build context string for coach
  analysisContext = buildAnalysisContext(data);

  // Reset coach messages
  const msgs = document.getElementById('coach-messages');
  msgs.innerHTML = '';
  const introMsg = document.createElement('div');
  introMsg.className = 'coach-msg assistant';
  const introContent = document.createElement('div');
  introContent.className = 'coach-msg-content';
  introContent.textContent = `I've analyzed your conversation. You're ${data.archetype?.name || 'a complex communicator'}. Ask me anything about your blind spots — I know your specific patterns.`;
  introMsg.appendChild(introContent);
  msgs.appendChild(introMsg);
  coachHistory = [];

  // Score
  animateNumber('overall-score', data.overall_score);
  document.getElementById('tagline-text').textContent = data.tagline || '';

  // Ring
  const circumference = 339.3;
  const offset = circumference - (data.overall_score / 100) * circumference;
  const ring = document.getElementById('score-ring');
  setTimeout(() => {
    ring.style.strokeDashoffset = offset;
    if (data.overall_score >= 70)      ring.style.stroke = 'var(--success)';
    else if (data.overall_score >= 45) ring.style.stroke = 'var(--warning)';
    else                               ring.style.stroke = 'var(--danger)';
  }, 200);

  // Archetype
  const arch = data.archetype || {};
  document.getElementById('archetype-icon').textContent  = arch.icon    || '◈';
  document.getElementById('archetype-name').textContent  = arch.name    || '—';
  document.getElementById('archetype-tagline').textContent = arch.tagline || '';

  // Dimension bars
  renderDimBars(data.scores);

  // Radar
  renderRadar(data.scores);

  // Blind spots
  renderBlindSpots(data.blind_spots || []);

  // Strengths
  const strengthsList = document.getElementById('strengths-list');
  strengthsList.innerHTML = '';
  (data.strengths || []).forEach(s => {
    const t = document.createElement('div');
    t.className = 'strength-tag';
    t.textContent = s;
    strengthsList.appendChild(t);
  });

  // One thing
  document.getElementById('one-thing-text').textContent = data.one_thing_to_change || '';
}

function buildAnalysisContext(data) {
  const scores = data.scores || {};
  const blindSpots = (data.blind_spots || []).map(b =>
    `${b.pattern} (${b.severity}): "${b.evidence}" — ${b.what_others_see}`
  ).join('\n');

  return `Overall Score: ${data.overall_score}/100
Archetype: ${data.archetype?.name} — "${data.archetype?.tagline}"
Tagline: "${data.tagline}"

Dimension Scores:
- Empathy: ${scores.empathy}
- Assertiveness: ${scores.assertiveness}
- Emotional Regulation: ${scores.emotional_regulation}
- Accountability: ${scores.accountability}
- Active Listening: ${scores.active_listening}
- Authenticity: ${scores.authenticity}

Blind Spots Detected:
${blindSpots}

Strengths: ${(data.strengths || []).join(', ')}

One thing to change: ${data.one_thing_to_change}`;
}

// ─── Dimension Bars ──────────────────────────────────────────
const DIM_CONFIG = [
  { key: 'empathy',            label: 'Empathy' },
  { key: 'assertiveness',      label: 'Assertiveness' },
  { key: 'emotional_regulation', label: 'Emotional Reg.' },
  { key: 'accountability',     label: 'Accountability' },
  { key: 'active_listening',   label: 'Active Listening' },
  { key: 'authenticity',       label: 'Authenticity' },
];

function scoreColor(v) {
  if (v >= 70) return 'var(--success)';
  if (v >= 45) return 'var(--warning)';
  return 'var(--danger)';
}

function renderDimBars(scores) {
  const container = document.getElementById('dims-bars');
  container.innerHTML = '';
  DIM_CONFIG.forEach(({ key, label }, i) => {
    const val = scores[key] || 0;
    const wrap = document.createElement('div');
    wrap.className = 'dim-bar';

    const top = document.createElement('div');
    top.className = 'dim-bar-top';
    const nameEl = document.createElement('span');
    nameEl.className = 'dim-name';
    nameEl.textContent = label;
    const scoreEl = document.createElement('span');
    scoreEl.className = 'dim-score';
    scoreEl.textContent = val;
    top.appendChild(nameEl); top.appendChild(scoreEl);

    const track = document.createElement('div');
    track.className = 'dim-track';
    const fill = document.createElement('div');
    fill.className = 'dim-fill';
    fill.style.background = scoreColor(val);
    track.appendChild(fill);

    wrap.appendChild(top); wrap.appendChild(track);
    container.appendChild(wrap);

    setTimeout(() => { fill.style.width = `${val}%`; }, 100 + i * 80);
  });
}

// ─── Blind Spots ─────────────────────────────────────────────
function renderBlindSpots(blindSpots) {
  const list = document.getElementById('blind-spots-list');
  list.innerHTML = '';
  blindSpots.forEach((bs, i) => {
    const sev  = (bs.severity || 'Medium').toLowerCase();
    const card = document.createElement('div');
    card.className = `blind-spot-card ${sev} fade-up`;
    card.style.animationDelay = `${i * 0.12}s`;

    // Top
    const top = document.createElement('div');
    top.className = 'blind-spot-top';
    const name = document.createElement('div');
    name.className = 'blind-spot-name'; name.textContent = bs.pattern;
    const badge = document.createElement('div');
    badge.className = `severity-badge severity-${sev}`; badge.textContent = bs.severity;
    top.appendChild(name); top.appendChild(badge); card.appendChild(top);

    // Pair
    const body = document.createElement('div');
    body.className = 'blind-spot-body';
    [['What you think you\'re saying', bs.what_you_think],
     ['What others actually hear',    bs.what_others_see]].forEach(([lbl, txt]) => {
      const pair = document.createElement('div');
      pair.className = 'bs-pair';
      const l = document.createElement('div'); l.className = 'bs-pair-label'; l.textContent = lbl;
      const t = document.createElement('div'); t.className = 'bs-pair-text';  t.textContent = txt;
      pair.appendChild(l); pair.appendChild(t); body.appendChild(pair);
    });
    card.appendChild(body);

    // Evidence
    const ev = document.createElement('div');
    ev.className = 'blind-spot-evidence';
    const el1 = document.createElement('div'); el1.className = 'bs-ev-label'; el1.textContent = 'From your messages';
    const et  = document.createElement('div'); et.className = 'bs-ev-text';  et.textContent = `"${bs.evidence}"`;
    ev.appendChild(el1); ev.appendChild(et); card.appendChild(ev);

    // Rewrite
    const rw = document.createElement('div');
    rw.className = 'blind-spot-rewrite';
    const rl = document.createElement('div'); rl.className = 'bs-rw-label'; rl.textContent = 'Try this instead';
    const rt = document.createElement('div'); rt.className = 'bs-rw-text';  rt.textContent = bs.rewrite;
    rw.appendChild(rl); rw.appendChild(rt); card.appendChild(rw);

    list.appendChild(card);
  });
}

// ─── Radar Chart ─────────────────────────────────────────────
let radarChart = null;
function renderRadar(scores) {
  if (radarChart) radarChart.destroy();
  const ctx = document.getElementById('radar-chart').getContext('2d');
  radarChart = new Chart(ctx, {
    type: 'radar',
    data: {
      labels: ['Empathy','Assertiveness','Emotional\nReg.','Accountability','Active\nListening','Authenticity'],
      datasets: [{
        data: [scores.empathy, scores.assertiveness, scores.emotional_regulation,
               scores.accountability, scores.active_listening, scores.authenticity],
        backgroundColor: 'rgba(155,127,255,0.1)',
        borderColor: 'rgba(155,127,255,0.65)',
        borderWidth: 1.5,
        pointBackgroundColor: 'rgba(196,181,253,1)',
        pointBorderColor: 'transparent',
        pointRadius: 3, pointHoverRadius: 5,
      }]
    },
    options: {
      responsive: true,
      scales: {
        r: {
          min: 0, max: 100,
          ticks: { display: false },
          grid: { color: 'rgba(255,255,255,0.05)' },
          angleLines: { color: 'rgba(255,255,255,0.05)' },
          pointLabels: { color: '#5e5e78', font: { size: 10, family: 'Figtree, sans-serif' } }
        }
      },
      plugins: { legend: { display: false } },
      animation: { duration: 1200, easing: 'easeOutQuart' }
    }
  });
}

// ─── AI Coach Chat ────────────────────────────────────────────
let coachHistory = [];

async function sendCoachMessage() {
  const input = document.getElementById('coach-input');
  const text  = input.value.trim();
  if (!text || !analysisContext) return;

  input.value = '';
  coachHistory.push({ role: 'user', content: text });

  appendCoachMsg('user', text);
  const typingEl = appendCoachMsg('assistant', '●●●', 'coach-typing');

  document.getElementById('coach-send-text').classList.add('hidden');
  document.getElementById('coach-send-loader').classList.remove('hidden');

  try {
    const res = await fetch('/coach', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: coachHistory, analysis_context: analysisContext })
    });
    if (!res.ok) throw new Error('Coach failed');
    const data = await res.json();
    coachHistory.push({ role: 'assistant', content: data.reply });
    typingEl.remove();
    appendCoachMsg('assistant', data.reply);
  } catch (err) {
    typingEl.remove();
    appendCoachMsg('assistant', 'Something went wrong. Try asking again.');
  } finally {
    document.getElementById('coach-send-text').classList.remove('hidden');
    document.getElementById('coach-send-loader').classList.add('hidden');
  }
}

function appendCoachMsg(role, text, extraClass) {
  const msgs = document.getElementById('coach-messages');
  const wrap = document.createElement('div');
  wrap.className = `coach-msg ${role}${extraClass ? ' ' + extraClass : ''}`;
  const content = document.createElement('div');
  content.className = 'coach-msg-content';
  if (extraClass !== 'coach-typing') content.textContent = text;
  wrap.appendChild(content);
  msgs.appendChild(wrap);
  msgs.scrollTop = msgs.scrollHeight;
  return wrap;
}

// ─── Utilities ────────────────────────────────────────────────
function animateNumber(id, target) {
  const elem = document.getElementById(id);
  const duration = 1400;
  const start = performance.now();
  function step(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    elem.textContent = Math.round(eased * target);
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

function showToast(msg) {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = msg;
  Object.assign(toast.style, {
    position: 'fixed', bottom: '28px', left: '50%', transform: 'translateX(-50%)',
    background: 'rgba(16,16,24,0.96)', border: '1px solid rgba(255,64,96,0.3)',
    color: '#ff8096', padding: '11px 22px', borderRadius: '100px',
    fontSize: '0.84rem', fontFamily: 'Figtree, sans-serif',
    backdropFilter: 'blur(20px)', zIndex: '9999',
    boxShadow: '0 6px 28px rgba(0,0,0,0.4)', whiteSpace: 'nowrap'
  });
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}

function reset() {
  document.getElementById('your-name').value = '';
  document.getElementById('conversation').value = '';
  charCount.textContent = '0 chars';
  charCount.style.color = 'var(--dimmed)';
  analysisContext = '';
  coachHistory = [];
  setUploadStatus('hidden', '');
  document.getElementById('transcript-note').classList.add('hidden');
  showScreen('screen-input');
}
