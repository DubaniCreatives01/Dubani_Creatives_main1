/* ============================================================
   PatternForge v3 – app.js  |  Pattern Monster SPA Layout
   ============================================================ */
'use strict';

// ── STATE ──
const state = {
  pattern: null, scale: 60, rotation: 0, strokeWidth: 2,
  opacity: 100, c1: '#ff5e00', c2: '#ffffff', bg: '#0d0d0d',
  exportScale: 2
};

const galleryView = document.getElementById('galleryView');
const editorView = document.getElementById('editorView');
const previewTile = document.getElementById('previewTile');
const massiveGrid = document.getElementById('massiveGrid');
const matchCount = document.getElementById('matchCount');
const activePatternName = document.getElementById('activePatternName');

// ── VIEW SWITCHING ──
window.showGallery = function() {
  editorView.style.display = 'none';
  galleryView.style.display = 'block';
  setTimeout(() => {
    editorView.classList.remove('active');
    galleryView.classList.add('active');
  }, 10);
};

window.showEditor = function(id) {
  galleryView.style.display = 'none';
  editorView.style.display = 'block';
  setTimeout(() => {
    galleryView.classList.remove('active');
    editorView.classList.add('active');
    selectPattern(id);
  }, 10);
};

document.getElementById('backToGallery').addEventListener('click', showGallery);

// ── PARTICLES ──
(function(){
  const c=document.getElementById('particles');
  const cols=['#ff5e00','#ff8533','#ff3300','#ffaa00','#cc4b00'];
  for(let i=0;i<30;i++){const p=document.createElement('div');p.className='particle';const s=Math.random()*4+1.5;p.style.cssText=`width:${s}px;height:${s}px;left:${Math.random()*100}%;background:${cols[Math.floor(Math.random()*cols.length)]};animation-duration:${Math.random()*22+14}s;animation-delay:${Math.random()*18}s;filter:blur(${Math.random()<.3?.8:0}px);opacity:0;`;c.appendChild(p);}
})();

// ── UTILS ──
function showToast(m){const t=document.getElementById('toast');t.textContent=m;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2600);}
function esc(s){return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function debounce(fn,ms){let t;return(...a)=>{clearTimeout(t);t=setTimeout(()=>fn(...a),ms);};}

// ── PALETTES ──
const palettes = [
  { name: 'Dubani', c1: '#ff5e00', c2: '#ffffff', bg: '#0d0d0d' },
  { name: 'Savanna', c1: '#d35400', c2: '#f39c12', bg: '#2c3e50' },
  { name: 'Midnight', c1: '#00bcd4', c2: '#e91e63', bg: '#1a1a2e' },
  { name: 'Forest', c1: '#8bc34a', c2: '#cddc39', bg: '#1b5e20' },
  { name: 'Royal', c1: '#ffc107', c2: '#ff9800', bg: '#4a148c' },
  { name: 'Monochrome', c1: '#ffffff', c2: '#9e9e9e', bg: '#212121' },
  { name: 'Earth', c1: '#8d6e63', c2: '#d7ccc8', bg: '#3e2723' },
  { name: 'Ocean', c1: '#4dd0e1', c2: '#00bcd4', bg: '#006064' }
];

function renderPalettes() {
  const row = document.getElementById('paletteRow');
  row.innerHTML = palettes.map((p, i) => `
    <div class="palette-chip" title="${p.name}" data-idx="${i}" style="background:${p.bg}">
      <div class="palette-swatch" style="background:${p.c1}"></div>
      <div class="palette-swatch" style="background:${p.c2}"></div>
    </div>
  `).join('');
  
  row.querySelectorAll('.palette-chip').forEach(el => {
    el.addEventListener('click', () => {
      const p = palettes[el.dataset.idx];
      state.c1 = p.c1; state.c2 = p.c2; state.bg = p.bg;
      updateColorPickers();
      renderPreview();
    });
  });
}

// ── CORE PATTERNS (V1) ──
// Note: patterns_ext.js is loaded first and will append 100+ patterns to this array
// If patterns_ext is loaded after, it appends to window.patterns
window.patterns = window.patterns || [];
const basePatterns = [
  {
    id: 'african_mudcloth', name: 'African Mudcloth', tags: ['african', 'mudcloth', 'tribal', 'geometric', 'crosses', 'lines', 'ethnic'],
    render: (w, h, sw, c1, c2) => {
      const cx=w/2, cy=h/2, q=w/4;
      return `<path d="M0,${cy} L${w},${cy} M${cx},0 L${cx},${h}" stroke="${c1}" stroke-width="${sw}" stroke-dasharray="${sw*2},${sw*2}"/>
              <path d="M${q},${q} L${w-q},${h-q} M${w-q},${q} L${q},${h-q}" stroke="${c2}" stroke-width="${sw}"/>
              <circle cx="${cx}" cy="${q/2}" r="${sw}" fill="${c1}"/><circle cx="${cx}" cy="${h-q/2}" r="${sw}" fill="${c1}"/>
              <circle cx="${q/2}" cy="${cy}" r="${sw}" fill="${c1}"/><circle cx="${w-q/2}" cy="${cy}" r="${sw}" fill="${c1}"/>`;
    }
  },
  {
    id: 'african_kente', name: 'Kente Blocks', tags: ['african', 'kente', 'woven', 'geometric', 'blocks', 'ethnic', 'stripes'],
    render: (w, h, sw, c1, c2) => {
      return `<rect x="0" y="0" width="${w/2}" height="${h/2}" fill="${c1}"/>
              <rect x="${w/2}" y="${h/2}" width="${w/2}" height="${h/2}" fill="${c1}"/>
              <rect x="${w/2}" y="0" width="${w/2}" height="${h/2}" fill="${c2}"/>
              <rect x="0" y="${h/2}" width="${w/2}" height="${h/2}" fill="${c2}"/>
              <line x1="0" y1="${h/4}" x2="${w}" y2="${h/4}" stroke="${state.bg}" stroke-width="${sw}"/>
              <line x1="0" y1="${h*0.75}" x2="${w}" y2="${h*0.75}" stroke="${state.bg}" stroke-width="${sw}"/>`;
    }
  },
  {
    id: 'floral_damask', name: 'Simple Damask', tags: ['floral', 'damask', 'elegant', 'vintage', 'leaves', 'ornate'],
    render: (w, h, sw, c1, c2) => {
      const cx=w/2, cy=h/2;
      return `<path d="M${cx},0 Q${cx+w*0.4},${cy} ${cx},${h} Q${cx-w*0.4},${cy} ${cx},0Z" fill="none" stroke="${c1}" stroke-width="${sw}"/>
              <path d="M${cx},${h*0.2} Q${cx+w*0.2},${cy} ${cx},${h*0.8} Q${cx-w*0.2},${cy} ${cx},${h*0.2}Z" fill="${c2}"/>
              <circle cx="${cx}" cy="${cy}" r="${w*0.1}" fill="${state.bg}"/>`;
    }
  },
  {
    id: 'floral_daisy', name: 'Daisy Field', tags: ['floral', 'daisy', 'flowers', 'nature', 'cute', 'spring'],
    render: (w, h, sw, c1, c2) => {
      const cx=w/2, cy=h/2, r=w*0.2;
      let petals='';
      for(let i=0;i<8;i++){
        const a=Math.PI/4*i;
        petals+=`<circle cx="${cx+r*Math.cos(a)}" cy="${cy+r*Math.sin(a)}" r="${r*0.6}" fill="${c1}"/>`;
      }
      return `${petals}<circle cx="${cx}" cy="${cy}" r="${r*0.8}" fill="${c2}"/>`;
    }
  },
  {
    id: 'geometric_hex', name: 'Hexagon Grid', tags: ['geometric', 'hexagons', 'honeycomb', 'modern', 'shapes'],
    render: (w, h, sw, c1, c2) => {
      const cx=w/2, cy=h/2, r=w*0.5;
      let pts='';for(let i=0;i<6;i++){const a=Math.PI/3*i-Math.PI/6;pts+=`${cx+r*Math.cos(a)},${cy+r*Math.sin(a)} `;}
      return `<polygon points="${pts.trim()}" fill="none" stroke="${c1}" stroke-width="${sw}"/>
              <circle cx="${cx}" cy="${cy}" r="${r*0.3}" fill="${c2}"/>`;
    }
  },
  {
    id: 'art_deco_scales', name: 'Art Deco Scales', tags: ['art deco', 'scales', 'retro', 'vintage', 'elegant', 'fans'],
    render: (w, h, sw, c1, c2) => {
      return `<path d="M0,${h} A${w/2},${h/2} 0 0,1 ${w},${h}" fill="none" stroke="${c1}" stroke-width="${sw}"/>
              <path d="M${w/4},${h} A${w/4},${h/4} 0 0,1 ${w*0.75},${h}" fill="none" stroke="${c2}" stroke-width="${sw}"/>
              <path d="M${-w/2},${h/2} A${w/2},${h/2} 0 0,1 ${w/2},${h/2}" fill="none" stroke="${c1}" stroke-width="${sw}"/>
              <path d="M${w/2},${h/2} A${w/2},${h/2} 0 0,1 ${w*1.5},${h/2}" fill="none" stroke="${c1}" stroke-width="${sw}"/>`;
    }
  },
  {
    id: 'moroccan_star', name: 'Moroccan Star', tags: ['moroccan', 'tile', 'geometric', 'star', 'arabesque', 'islamic'],
    render: (w, h, sw, c1, c2) => {
      const cx=w/2, cy=h/2, r=w*0.4;
      let pts1='', pts2='';
      for(let i=0;i<4;i++){
        pts1+=`${cx+r*Math.cos(Math.PI/2*i)},${cy+r*Math.sin(Math.PI/2*i)} `;
        pts2+=`${cx+r*Math.cos(Math.PI/2*i+Math.PI/4)},${cy+r*Math.sin(Math.PI/2*i+Math.PI/4)} `;
      }
      return `<polygon points="${pts1.trim()}" fill="none" stroke="${c1}" stroke-width="${sw}"/>
              <polygon points="${pts2.trim()}" fill="none" stroke="${c2}" stroke-width="${sw}"/>`;
    }
  },
  {
    id: 'japanese_waves', name: 'Seigaiha Waves', tags: ['japanese', 'waves', 'ocean', 'traditional', 'asian', 'curves'],
    render: (w, h, sw, c1, c2) => {
      return `<circle cx="${w/2}" cy="${h}" r="${w*0.4}" fill="none" stroke="${c1}" stroke-width="${sw}"/>
              <circle cx="${w/2}" cy="${h}" r="${w*0.3}" fill="none" stroke="${c2}" stroke-width="${sw}"/>
              <circle cx="${w/2}" cy="${h}" r="${w*0.2}" fill="none" stroke="${c1}" stroke-width="${sw}"/>
              <circle cx="0" cy="${h/2}" r="${w*0.4}" fill="none" stroke="${c2}" stroke-width="${sw}"/>
              <circle cx="${w}" cy="${h/2}" r="${w*0.4}" fill="none" stroke="${c2}" stroke-width="${sw}"/>`;
    }
  },
  {
    id: 'dots', name: 'Polka Dots', tags: ['basic', 'dots', 'circles', 'retro', 'simple'],
    render: (w, h, sw, c1, c2) => {
      return `<circle cx="${w/4}" cy="${h/4}" r="${w*0.15}" fill="${c1}"/>
              <circle cx="${w*0.75}" cy="${h*0.75}" r="${w*0.15}" fill="${c2}"/>`;
    }
  },
  {
    id: 'stripes', name: 'Diagonal Stripes', tags: ['basic', 'stripes', 'lines', 'diagonal', 'simple'],
    render: (w, h, sw, c1, c2) => {
      return `<line x1="0" y1="${h}" x2="${w}" y2="0" stroke="${c1}" stroke-width="${sw}"/>
              <line x1="0" y1="${h/2}" x2="${w/2}" y2="0" stroke="${c2}" stroke-width="${sw}"/>
              <line x1="${w/2}" y1="${h}" x2="${w}" y2="${h/2}" stroke="${c2}" stroke-width="${sw}"/>`;
    }
  }
];
window.patterns.push(...basePatterns);

// ── RENDER ENGINE ──
function buildSVG(patternId, customScale) {
  const p = window.patterns.find(x => x.id === patternId);
  if(!p) return '';
  const w = customScale || state.scale, h = customScale || state.scale;
  const inner = p.render(w, h, state.strokeWidth, state.c1, state.c2);
  const op = state.opacity/100;
  const rot = state.rotation;
  const transform = rot !== 0 ? ` transform="rotate(${rot},${w/2},${h/2})"` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><rect width="${w}" height="${h}" fill="${state.bg}"/><g opacity="${op}"${transform}>${inner}</g></svg>`;
}

function svgToDataURI(svg){ return 'data:image/svg+xml,'+encodeURIComponent(svg); }

function renderPreview() {
  if (!state.pattern) return;
  const svg = buildSVG(state.pattern);
  const uri = svgToDataURI(svg);
  previewTile.style.backgroundColor = state.bg;
  previewTile.style.backgroundImage = `url("${uri}")`;
  previewTile.style.backgroundRepeat = 'repeat';
  previewTile.style.backgroundSize = `${state.scale}px`;
}
const debouncedRender = debounce(renderPreview, 40);

// ── UI LOGIC ──
function selectPattern(id) {
  state.pattern = id;
  const p = window.patterns.find(x => x.id === id);
  activePatternName.textContent = p ? p.name : 'Select a pattern';
  renderPreview();
}

// Special lightweight build for gallery thumbnails
function buildCardPreview(p) {
  const w = 120, h = 120;
  // Render using the Dubani palette to make the gallery pop initially
  const inner = p.render(w, h, 4, '#ff5e00', '#ffffff'); 
  return `<svg viewBox="0 0 ${w} ${h}"><rect width="${w}" height="${h}" fill="#111"/>${inner}</svg>`;
}

window.renderMassiveGallery = function(query = '') {
  // Give patterns array time to populate if patterns_ext.js is loading asynchronously
  if(window.patterns.length < 20) {
     setTimeout(() => renderMassiveGallery(query), 100);
     return;
  }
  
  const q = query.toLowerCase().trim();
  const matches = window.patterns.filter(p => {
    if(!q) return true;
    return p.name.toLowerCase().includes(q) || p.tags.some(t => t.includes(q));
  });
  
  matchCount.textContent = matches.length;
  
  if (matches.length === 0) {
    massiveGrid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--text-muted);">No patterns found. Try "african", "floral", or "stars".</div>';
    return;
  }
  
  massiveGrid.innerHTML = matches.map(p => {
    // We use inline background-image to create the pattern card effect
    const svg = buildCardPreview(p);
    const uri = svgToDataURI(svg);
    return `<div class="pattern-card" onclick="showEditor('${p.id}')" style="background-image: url('${uri}'); background-size: 80px;">
              <div class="pill-label">${p.name}</div>
            </div>`;
  }).join('');
};

// Search
document.getElementById('mainSearch').addEventListener('input', e => {
  renderMassiveGallery(e.target.value);
});

// Controls
function bindSlider(id, key, suffix, decimals) {
  const el = document.getElementById(id), lbl = document.getElementById(id+'Val');
  el.addEventListener('input', () => {
    const v = parseFloat(el.value); state[key] = v;
    if(lbl) lbl.textContent = decimals ? v.toFixed(decimals)+suffix : Math.round(v)+suffix;
    debouncedRender();
  });
}
bindSlider('scale', 'scale', '');
bindSlider('rotation', 'rotation', '°');
bindSlider('strokeWidth', 'strokeWidth', '', 1);
bindSlider('opacity', 'opacity', '%');

// Colors
function updateColorPickers() {
  document.getElementById('color1').value = state.c1;
  document.getElementById('color1Hex').textContent = state.c1;
  document.getElementById('color2').value = state.c2;
  document.getElementById('color2Hex').textContent = state.c2;
  document.getElementById('colorBg').value = state.bg;
  document.getElementById('colorBgHex').textContent = state.bg;
}
function bindColor(id, key) {
  const el = document.getElementById(id), hex = document.getElementById(id+'Hex');
  el.addEventListener('input', e => {
    state[key] = e.target.value;
    hex.textContent = e.target.value;
    debouncedRender();
  });
}
bindColor('color1', 'c1');
bindColor('color2', 'c2');
bindColor('colorBg', 'bg');

// Surprise Me
document.getElementById('inspireBtn').addEventListener('click', () => {
  const p = window.patterns[Math.floor(Math.random() * window.patterns.length)];
  const pal = palettes[Math.floor(Math.random() * palettes.length)];
  state.c1 = pal.c1; state.c2 = pal.c2; state.bg = pal.bg;
  updateColorPickers();
  
  state.scale = Math.round(30 + Math.random()*80);
  document.getElementById('scale').value = state.scale; document.getElementById('scaleVal').textContent = state.scale;
  
  state.rotation = Math.round(Math.random()*4)*90; 
  document.getElementById('rotation').value = state.rotation; document.getElementById('rotationVal').textContent = state.rotation+'°';
  
  selectPattern(p.id);
  showToast('✨ Random inspiration applied!');
});

// Exports
document.getElementById('resSelect').addEventListener('change', e => state.exportScale = parseInt(e.target.value));

function getFilename(ext) { return `patternforge_${state.pattern||'custom'}_${new Date().toISOString().slice(0,10)}.${ext}`; }
function downloadBlob(blob, name) {
  const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=name; a.click(); URL.revokeObjectURL(a.href);
}

document.getElementById('dlSVG').addEventListener('click', () => {
  if(!state.pattern) return;
  downloadBlob(new Blob([buildSVG(state.pattern)],{type:'image/svg+xml'}), getFilename('svg'));
  showToast('✅ SVG downloaded!');
});

document.getElementById('dlPNG').addEventListener('click', () => {
  if(!state.pattern) return;
  showToast('⏳ Rendering PNG…');
  setTimeout(() => {
    const ts = state.scale, tiles = 8, cs = ts * tiles * state.exportScale;
    const oc = document.createElement('canvas'); oc.width = cs; oc.height = cs;
    const ctx = oc.getContext('2d');
    const img = new Image();
    img.onload = () => {
      for(let x=0; x<tiles; x++) for(let y=0; y<tiles; y++) {
        ctx.drawImage(img, x*ts*state.exportScale, y*ts*state.exportScale, ts*state.exportScale, ts*state.exportScale);
      }
      oc.toBlob(blob => { downloadBlob(blob, getFilename('png')); showToast('✅ PNG downloaded!'); }, 'image/png');
    };
    img.src = svgToDataURI(buildSVG(state.pattern));
  }, 50);
});

document.getElementById('copyCSS').addEventListener('click', () => {
  if(!state.pattern) return;
  const css = `background-color: ${state.bg};\nbackground-image: url("${svgToDataURI(buildSVG(state.pattern))}");\nbackground-repeat: repeat;\nbackground-size: ${state.scale}px ${state.scale}px;`;
  navigator.clipboard.writeText(css).then(()=>showToast('📋 CSS copied!')).catch(()=>showToast('❌ Copy failed'));
});

document.getElementById('copySVG').addEventListener('click', () => {
  if(!state.pattern) return;
  navigator.clipboard.writeText(buildSVG(state.pattern)).then(()=>showToast('📋 SVG copied!')).catch(()=>showToast('❌ Copy failed'));
});

// INIT
renderPalettes();
// Initial render happens when DOM/scripts load
setTimeout(() => window.renderMassiveGallery(), 50);
