// ===== KaamWala AI Web App — Main JS =====
const API_BASE = 'https://api-zbyomuiceq-uc.a.run.app';

// ===== Navigation =====
document.addEventListener('DOMContentLoaded', () => {
  const navbar = document.querySelector('.navbar');
  const mobileToggle = document.querySelector('.mobile-toggle');
  const navLinks = document.querySelector('.nav-links');

  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 50);
  });

  if (mobileToggle) {
    mobileToggle.addEventListener('click', () => {
      navLinks.classList.toggle('open');
      mobileToggle.textContent = navLinks.classList.contains('open') ? '✕' : '☰';
    });
  }

  // Close mobile menu on link click
  document.querySelectorAll('.nav-links a').forEach(a => {
    a.addEventListener('click', () => { navLinks.classList.remove('open'); mobileToggle.textContent = '☰'; });
  });

  // Scroll animations
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); } });
  }, { threshold: 0.1 });
  document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));

  // Active nav link
  const sections = document.querySelectorAll('section[id]');
  window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(s => {
      if (window.scrollY >= s.offsetTop - 200) current = s.id;
    });
    document.querySelectorAll('.nav-links a').forEach(a => {
      a.classList.toggle('active', a.getAttribute('href') === '#' + current);
    });
  });

  // Check health on load
  checkHealth();
});

// ===== Preset Buttons =====
function setPreset(text) {
  document.getElementById('demoInput').value = text;
}

// ===== Health Check =====
async function checkHealth() {
  const dot = document.getElementById('statusDot');
  const label = document.getElementById('statusLabel');
  try {
    const res = await fetch(API_BASE + '/health', { signal: AbortSignal.timeout(8000) });
    if (res.ok) {
      dot.style.background = '#10B981'; label.textContent = 'Backend Online';
    } else {
      dot.style.background = '#F59E0B'; label.textContent = 'Degraded';
    }
  } catch {
    dot.style.background = '#EF4444'; label.textContent = 'Offline';
  }
}

// ===== Run Workflow =====
async function runWorkflow() {
  const input = document.getElementById('demoInput').value.trim();
  if (!input) { alert('Please enter a service request.'); return; }

  const btn = document.getElementById('runBtn');
  const results = document.getElementById('results');
  const stepper = document.getElementById('workflowStepper');

  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Processing with AI...';
  results.classList.add('show');

  // Reset stepper
  const steps = stepper.querySelectorAll('.step-item');
  steps.forEach(s => { s.className = 'step-item pending'; });

  // Clear previous results
  document.getElementById('parseResults').innerHTML = '<p style="color:var(--text-muted)">Waiting...</p>';
  document.getElementById('providerResults').innerHTML = '';
  document.getElementById('pricingResults').innerHTML = '';
  document.getElementById('bookingResults').innerHTML = '';
  document.getElementById('traceResults').innerHTML = '';

  // Scroll to results
  results.scrollIntoView({ behavior: 'smooth', block: 'start' });

  try {
    // Animate steps one by one
    await animateStep(steps, 0); // Understand
    const workflow = await fetch(API_BASE + '/runWorkflow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rawText: input })
    });

    if (!workflow.ok) throw new Error('Workflow API returned ' + workflow.status);
    const data = await workflow.json();

    // Mark all steps complete
    for (let i = 0; i < steps.length; i++) {
      await sleep(200);
      steps[i].className = 'step-item completed';
    }

    // Render results
    renderResults(data);
  } catch (err) {
    console.error('Workflow error:', err);
    document.getElementById('parseResults').innerHTML = `
      <div style="color:#EF4444; padding:1rem;">
        <strong>⚠ Error:</strong> ${err.message}<br>
        <small style="color:var(--text-muted)">The backend may be cold-starting. Please try again in 30 seconds.</small>
      </div>`;
    steps.forEach(s => s.className = 'step-item pending');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '🚀 Run AI Workflow';
  }
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function animateStep(steps, idx) {
  if (idx < steps.length) {
    steps[idx].className = 'step-item active';
  }
}

// ===== Render Results =====
function renderResults(data) {
  // Parse / Understanding
  const parsed = data.parsed || data.understanding || {};
  document.getElementById('parseResults').innerHTML = buildResultRows({
    'Service Type': parsed.serviceType || parsed.service || '—',
    'Location': parsed.location || '—',
    'Urgency': parsed.urgency || parsed.timePreference || '—',
    'Language': parsed.language || parsed.detectedLanguage || '—',
    'Confidence': renderConfidence(parsed.confidence || parsed.overallConfidence || 0)
  });

  // Providers
  const providers = data.providers || data.discovery?.providers || data.rankedProviders || [];
  const provContainer = document.getElementById('providerResults');
  if (providers.length > 0) {
    provContainer.innerHTML = providers.slice(0, 5).map((p, i) => {
      const name = p.name || p.displayName || 'Provider';
      const rating = p.rating || p.googleRating || '—';
      const dist = p.distance || p.distanceText || '—';
      const score = p.totalScore || p.score || p.rankScore || 0;
      const initial = name.charAt(0).toUpperCase();
      const isRec = i === 0;
      return `
        <div class="provider-card ${isRec ? 'recommended' : ''}" style="position:relative; margin-bottom:0.75rem;">
          ${isRec ? '<span class="badge-rec">★ Recommended</span>' : ''}
          <div class="provider-avatar">${initial}</div>
          <div class="provider-info">
            <h4>${name}</h4>
            <div class="provider-meta">
              <span>⭐ ${typeof rating === 'number' ? rating.toFixed(1) : rating}</span>
              <span>📍 ${dist}</span>
              ${score ? `<span class="score-badge">${Math.round(score * 100) || score}/100</span>` : ''}
            </div>
          </div>
        </div>`;
    }).join('');
  } else {
    provContainer.innerHTML = '<p style="color:var(--text-muted)">No providers returned</p>';
  }

  // Pricing
  const pricing = data.pricing || data.priceEstimate || {};
  if (pricing.low || pricing.recommended || pricing.estimatedRange) {
    document.getElementById('pricingResults').innerHTML = buildResultRows({
      'Low Estimate': 'PKR ' + (pricing.low || pricing.estimatedRange?.low || '—'),
      'High Estimate': 'PKR ' + (pricing.high || pricing.estimatedRange?.high || '—'),
      'Recommended': 'PKR ' + (pricing.recommended || '—'),
      'Confidence': renderConfidence(pricing.confidence || 0)
    });
  } else {
    document.getElementById('pricingResults').innerHTML = '<p style="color:var(--text-muted)">No pricing data</p>';
  }

  // Booking
  const booking = data.booking || {};
  if (booking.bookingId || booking.id) {
    document.getElementById('bookingResults').innerHTML = buildResultRows({
      'Booking ID': booking.bookingId || booking.id || '—',
      'Status': `<span style="color:var(--emerald-light); font-weight:600">${booking.status || 'Created'}</span>`,
      'Provider': booking.providerName || booking.provider?.name || '—',
      'Time Slot': booking.timeSlot || booking.scheduledTime || '—'
    });
  } else {
    document.getElementById('bookingResults').innerHTML = '<p style="color:var(--text-muted)">No booking created</p>';
  }

  // Traces
  const traces = data.traces || data.agentTraces || data.trace || [];
  const traceContainer = document.getElementById('traceResults');
  if (traces.length > 0) {
    traceContainer.innerHTML = traces.slice(0, 10).map(t => `
      <div style="display:flex; gap:0.75rem; padding:0.5rem 0; border-bottom:1px solid rgba(255,255,255,0.05);">
        <span style="color:var(--emerald); font-family:'JetBrains Mono',monospace; font-size:0.75rem; min-width:100px;">[${t.agentName || t.phase || 'agent'}]</span>
        <span style="font-size:0.85rem; color:var(--text-secondary);">${t.action || t.reasoning || t.message || '—'}</span>
      </div>`).join('');
  } else {
    traceContainer.innerHTML = '<p style="color:var(--text-muted)">No trace data</p>';
  }
}

function buildResultRows(data) {
  return Object.entries(data).map(([k, v]) => `
    <div class="result-row">
      <span class="key">${k}</span>
      <span class="value">${v}</span>
    </div>`).join('');
}

function renderConfidence(val) {
  const pct = typeof val === 'number' ? Math.round(val * 100) : 0;
  const color = pct >= 80 ? '#10B981' : pct >= 50 ? '#F59E0B' : '#EF4444';
  return `${pct}% <div class="confidence-bar" style="width:120px;display:inline-block;vertical-align:middle;margin-left:8px;">
    <div class="fill" style="width:${pct}%;background:${color}"></div></div>`;
}
