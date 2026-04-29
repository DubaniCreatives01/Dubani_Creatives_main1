/* ============================================================
   Handscribe – app.js  |  Dubani Creatives Edition
   Realistic Pen Ink Rendering Engine
   ============================================================ */

'use strict';

const state = {
  text:            'The quick brown fox jumps over the lazy dog.',
  font:            "'Kalam', cursive",
  fontSize:        28,
  lineHeight:      1.8,
  letterSpacing:   0,
  wordSpacing:     0,
  inkColor:        '#1a1a1a',
  inkOpacity:      1.0,
  align:           'left',
  padding:         40,
  jitter:          0,
  shadow:          false,
  background:      'lined',
  exportScale:     4,
  canvasWidth:     794,
  inkVariation:    0.08,
  pressureEffect:  true,
  baselineDrift:   true,
};

const canvas        = document.getElementById('hwCanvas');
const ctx           = canvas.getContext('2d');
const previewScroll = document.getElementById('previewScroll');
const fontPreview   = document.getElementById('fontPreview');

(function spawnParticles() {
  const container = document.getElementById('particles');
  const colors    = ['#ff5e00','#ff8533','#ff3300','#ffaa00','#cc4b00'];
  for (let i = 0; i < 35; i++) {
    const p   = document.createElement('div');
    p.className = 'particle';
    const sz  = Math.random() * 4 + 1.5;
    p.style.cssText = `width:${sz}px;height:${sz}px;left:${Math.random()*100}%;background:${colors[Math.floor(Math.random()*colors.length)]};animation-duration:${Math.random()*22+14}s;animation-delay:${Math.random()*18}s;filter:blur(${Math.random()<0.3?0.8:0}px);opacity:0;`;
    container.appendChild(p);
  }
})();

function debounce(fn, ms) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(()=>fn(...args), ms); };
}

function hexToRgba(hex, alpha) {
  let h = hex.replace('#','');
  if (h.length===3) h = h.split('').map(c=>c+c).join('');
  const r=parseInt(h.slice(0,2),16), g=parseInt(h.slice(2,4),16), b=parseInt(h.slice(4,6),16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function hexToRGB(hex) {
  let h = hex.replace('#','');
  if (h.length===3) h = h.split('').map(c=>c+c).join('');
  return [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16)];
}

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'), 2600);
}

function getFilename(ext) {
  return `handscribe_${new Date().toISOString().slice(0,10)}.${ext}`;
}

function wrapText(tCtx, text, maxWidth) {
  const result = [];
  text.split('\n').forEach(raw => {
    if (!raw.trim()) { result.push(''); return; }
    const words = raw.split(' ');
    let line = '';
    words.forEach(word => {
      const test = line ? line+' '+word : word;
      if (tCtx.measureText(test).width > maxWidth && line) {
        result.push(line); line = word;
      } else { line = test; }
    });
    if (line) result.push(line);
  });
  return result;
}

function getAlignX(tCtx, line, W) {
  const lw = tCtx.measureText(line).width;
  if (state.align==='center') return (W-lw)/2;
  if (state.align==='right')  return W-state.padding-lw;
  return state.padding;
}

let _seed = 0;
function seedRand(seed) { _seed = seed % 2147483647; if (_seed<=0) _seed += 2147483646; }
function seededRand() { _seed = (_seed * 16807) % 2147483647; return (_seed - 1) / 2147483646; }
function sRandRange(a, b) { return a + seededRand()*(b-a); }

function drawBg(tCtx, W, H, lineH) {
  if (state.background==='transparent') { tCtx.clearRect(0,0,W,H); return; }
  tCtx.fillStyle = state.background==='lined' ? '#fdf9f0' : '#ffffff';
  tCtx.fillRect(0,0,W,H);

  if (state.background==='lined') {
    tCtx.fillStyle='rgba(220,195,140,0.07)';
    tCtx.fillRect(0,0,W,H);
    tCtx.save();
    tCtx.strokeStyle='rgba(220,120,120,0.55)'; tCtx.lineWidth=1.5;
    tCtx.beginPath(); tCtx.moveTo(68,0); tCtx.lineTo(68,H); tCtx.stroke();
    tCtx.restore();
    tCtx.save();
    tCtx.strokeStyle='rgba(160,195,235,0.6)'; tCtx.lineWidth=1;
    for (let y=state.padding+lineH; y<H-state.padding*0.4; y+=lineH) {
      tCtx.beginPath(); tCtx.moveTo(0,Math.round(y)); tCtx.lineTo(W,Math.round(y)); tCtx.stroke();
    }
    tCtx.restore();
    tCtx.save();
    tCtx.strokeStyle='rgba(185,165,115,0.28)'; tCtx.lineWidth=2;
    tCtx.beginPath();
    tCtx.moveTo(0,1.5); tCtx.lineTo(W,1.5);
    tCtx.moveTo(0,H-1.5); tCtx.lineTo(W,H-1.5);
    tCtx.stroke();
    tCtx.restore();
    [0.15,0.5,0.85].forEach(f=>{
      tCtx.save();
      tCtx.beginPath(); tCtx.arc(22,H*f,9,0,Math.PI*2);
      tCtx.fillStyle='rgba(200,180,140,0.2)'; tCtx.fill();
      tCtx.strokeStyle='rgba(180,155,110,0.25)'; tCtx.lineWidth=1; tCtx.stroke();
      tCtx.restore();
    });
  }
}

function drawChar(tCtx, ch, x, y, charIdx, baseOpacity, [r,g,b]) {
  const jitter = state.jitter;
  let opacity = baseOpacity;
  if (state.inkVariation > 0) {
    const variation = (seededRand()-0.5) * 2 * state.inkVariation;
    opacity = Math.max(0.35, Math.min(1.0, baseOpacity + variation));
  }
  let sizeScale = 1;
  if (state.pressureEffect) { sizeScale = 1 + (seededRand()-0.5) * 0.04; }
  const ang = jitter > 0 ? (seededRand()-0.5)*(jitter*0.03) : 0;
  const dy  = jitter > 0 ? (seededRand()-0.5)*(jitter*2.0)  : 0;
  tCtx.save();
  tCtx.translate(x, y+dy);
  if (ang !== 0) tCtx.rotate(ang);
  if (sizeScale !== 1) tCtx.scale(sizeScale, sizeScale);
  tCtx.fillStyle = `rgba(${r},${g},${b},${opacity})`;
  if (state.shadow) {
    tCtx.shadowColor   = `rgba(${r},${g},${b},${opacity*0.2})`;
    tCtx.shadowBlur    = 1.8;
    tCtx.shadowOffsetX = 0.6;
    tCtx.shadowOffsetY = 0.8;
  }
  tCtx.fillText(ch, 0, 0);
  tCtx.restore();
  return tCtx.measureText(ch).width * sizeScale;
}

function renderToCanvas(targetCanvas, targetCtx, logicalW, scale) {
  targetCtx.save();
  targetCtx.font = `${state.fontSize}px ${state.font}`;
  const maxW  = logicalW - state.padding*2;
  const lines = wrapText(targetCtx, state.text || ' ', maxW);
  const lineH = state.fontSize * state.lineHeight;
  const logH  = Math.max(500, state.padding*2 + lines.length*lineH + 50);
  targetCanvas.width  = Math.round(logicalW * scale);
  targetCanvas.height = Math.round(logH * scale);
  targetCanvas.style.width  = logicalW + 'px';
  targetCanvas.style.height = logH     + 'px';
  targetCtx.scale(scale, scale);
  drawBg(targetCtx, logicalW, logH, lineH);
  targetCtx.font         = `${state.fontSize}px ${state.font}`;
  targetCtx.textBaseline = 'alphabetic';
  targetCtx.letterSpacing = state.letterSpacing + 'px';
  targetCtx.wordSpacing   = state.wordSpacing   + 'px';
  const [r,g,b]  = hexToRGB(state.inkColor);
  const baseAlpha = state.inkOpacity;
  seedRand(state.text.length * 31 + state.font.length * 17);
  lines.forEach((line, li) => {
    if (!line) return;
    const baseY = state.padding + (li+1)*lineH - (lineH - state.fontSize)*0.38;
    const lineDrift = state.baselineDrift && state.jitter>0 ? (seededRand()-0.5)*state.jitter*0.6 : 0;
    const y = baseY + lineDrift;
    if (state.jitter === 0 && state.inkVariation === 0 && !state.pressureEffect) {
      targetCtx.fillStyle = hexToRgba(state.inkColor, baseAlpha);
      if (state.shadow) {
        targetCtx.shadowColor   = hexToRgba(state.inkColor, 0.22);
        targetCtx.shadowBlur    = 2;
        targetCtx.shadowOffsetX = 0.8;
        targetCtx.shadowOffsetY = 1;
      } else {
        targetCtx.shadowColor = 'transparent'; targetCtx.shadowBlur = 0;
        targetCtx.shadowOffsetX = 0; targetCtx.shadowOffsetY = 0;
      }
      targetCtx.fillText(line, getAlignX(targetCtx, line, logicalW), y);
    } else {
      if (!state.shadow) { targetCtx.shadowColor = 'transparent'; targetCtx.shadowBlur = 0; }
      let x = getAlignX(targetCtx, line, logicalW);
      for (let ci=0; ci<line.length; ci++) {
        const ch  = line[ci];
        const cw  = drawChar(targetCtx, ch, x, y, ci, baseAlpha, [r,g,b]);
        x += cw + state.letterSpacing;
        if (ch===' ') x += state.wordSpacing;
      }
    }
  });
  targetCtx.restore();
}

function drawCanvas() {
  const dpr = Math.min(window.devicePixelRatio||1, 2);
  renderToCanvas(canvas, ctx, state.canvasWidth, dpr);
}

const debouncedDraw = debounce(drawCanvas, 90);

function renderOffscreen(mimeType, quality) {
  const off    = document.createElement('canvas');
  const offCtx = off.getContext('2d');
  renderToCanvas(off, offCtx, state.canvasWidth, state.exportScale);
  return { dataURL: off.toDataURL(mimeType, quality), offCanvas: off };
}

document.getElementById('dlPNG').addEventListener('click', () => {
  showToast('⏳ Exporting PNG at ' + state.exportScale + '× quality…');
  setTimeout(() => {
    const { dataURL } = renderOffscreen('image/png', 1.0);
    const a = document.createElement('a');
    a.href = dataURL; a.download = getFilename('png'); a.click();
    showToast('✅ PNG downloaded!');
  }, 60);
});

document.getElementById('dlJPEG').addEventListener('click', () => {
  showToast('⏳ Exporting JPEG at ' + state.exportScale + '× quality…');
  setTimeout(() => {
    const prevBg = state.background;
    if (state.background==='transparent') state.background='white';
    const { dataURL } = renderOffscreen('image/jpeg', 0.97);
    const a = document.createElement('a');
    a.href = dataURL; a.download = getFilename('jpg'); a.click();
    showToast('✅ JPEG downloaded!');
    state.background = prevBg; drawCanvas();
  }, 60);
});

document.getElementById('dlPDF').addEventListener('click', () => {
  showToast('⏳ Generating PDF…');
  setTimeout(() => {
    const { jsPDF } = window.jspdf;
    const prevBg = state.background;
    if (state.background==='transparent') state.background='white';
    const { dataURL, offCanvas } = renderOffscreen('image/jpeg', 0.97);
    const pxW = state.canvasWidth;
    const pxH = Math.round(offCanvas.height / state.exportScale);
    const mmW = pxW*0.264583, mmH = pxH*0.264583;
    const doc = new jsPDF({ orientation: mmW>mmH?'landscape':'portrait', unit:'mm', format:[mmW,mmH] });
    doc.addImage(dataURL,'JPEG',0,0,mmW,mmH,'','FAST');
    doc.save(getFilename('pdf'));
    showToast('✅ PDF downloaded!');
    state.background = prevBg; drawCanvas();
  }, 80);
});

document.getElementById('inputText').addEventListener('input', e => { state.text = e.target.value; debouncedDraw(); });
document.getElementById('fontSelect').addEventListener('change', e => { state.font = e.target.value; fontPreview.style.fontFamily = state.font; debouncedDraw(); });
document.getElementById('resSelect').addEventListener('change', e => { state.exportScale = parseInt(e.target.value); });

function bindSlider(id, key, unit, decimals) {
  const el  = document.getElementById(id);
  const lbl = document.getElementById(id+'Val');
  el.addEventListener('input', () => {
    const v = parseFloat(el.value);
    state[key] = v;
    if (lbl) lbl.textContent = decimals ? v.toFixed(decimals)+unit : Math.round(v)+unit;
    debouncedDraw();
  });
}

bindSlider('fontSize',      'fontSize',      'px');
bindSlider('lineHeight',    'lineHeight',    '',  1);
bindSlider('letterSpacing', 'letterSpacing', 'px',1);
bindSlider('wordSpacing',   'wordSpacing',   'px');
bindSlider('pagePadding',   'padding',       'px');

const inkOpEl  = document.getElementById('inkOpacity');
const inkOpLbl = document.getElementById('inkOpacityVal');
inkOpEl.addEventListener('input', () => { state.inkOpacity = parseInt(inkOpEl.value)/100; inkOpLbl.textContent = inkOpEl.value+'%'; debouncedDraw(); });

const jitterEl  = document.getElementById('jitter');
const jitterLbl = document.getElementById('jitterVal');
jitterEl.addEventListener('input', () => { state.jitter = parseFloat(jitterEl.value); jitterLbl.textContent = state.jitter===0 ? 'Off' : state.jitter.toFixed(1); debouncedDraw(); });

document.querySelectorAll('.ink-swatch').forEach(sw => {
  sw.addEventListener('click', () => {
    document.querySelectorAll('.ink-swatch').forEach(s=>s.classList.remove('selected'));
    sw.classList.add('selected');
    state.inkColor = sw.dataset.color;
    document.getElementById('customColor').value = sw.dataset.color;
    drawCanvas();
  });
});

document.getElementById('customColor').addEventListener('input', e => { state.inkColor = e.target.value; document.querySelectorAll('.ink-swatch').forEach(s=>s.classList.remove('selected')); drawCanvas(); });

document.querySelectorAll('.align-btn').forEach(btn => {
  btn.addEventListener('click', () => { document.querySelectorAll('.align-btn').forEach(b=>b.classList.remove('selected')); btn.classList.add('selected'); state.align = btn.dataset.align; drawCanvas(); });
});

document.getElementById('shadowToggle').addEventListener('change', e => { state.shadow = e.target.checked; drawCanvas(); });

const inkVarEl  = document.getElementById('inkVariation');
const inkVarLbl = document.getElementById('inkVariationVal');
inkVarEl.addEventListener('input', () => { const v = parseFloat(inkVarEl.value); state.inkVariation = v; inkVarLbl.textContent = v === 0 ? 'Off' : Math.round(v * 100) + '%'; debouncedDraw(); });

document.getElementById('pressureToggle').addEventListener('change', e => { state.pressureEffect = e.target.checked; drawCanvas(); });
document.getElementById('baselineToggle').addEventListener('change', e => { state.baselineDrift = e.target.checked; drawCanvas(); });

document.querySelectorAll('.bg-btn').forEach(btn => {
  btn.addEventListener('click', () => { document.querySelectorAll('.bg-btn').forEach(b=>b.classList.remove('selected')); btn.classList.add('selected'); state.background = btn.dataset.bg; previewScroll.classList.toggle('checker', state.background==='transparent'); drawCanvas(); });
});

if (document.fonts && document.fonts.ready) {
  document.fonts.ready.then(()=>setTimeout(drawCanvas,200));
} else {
  window.addEventListener('load',()=>setTimeout(drawCanvas,400));
}
window.addEventListener('resize', debounce(drawCanvas,200));
