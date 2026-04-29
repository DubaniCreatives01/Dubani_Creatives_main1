/* ============================================================
   PatternForge – app.js  |  Dubani Creatives Edition
   SVG Pattern Generator Engine
   ============================================================ */
'use strict';

// ── STATE ──
const state = {
  pattern: 'dots', scale: 40, rotation: 0, strokeWidth: 2,
  spacing: 0, opacity: 100, fgColor: '#ff5e00', bgColor: '#0d0d0d',
  exportScale: 2
};

const previewTile = document.getElementById('previewTile');

// ── PARTICLES ──
(function(){
  const c=document.getElementById('particles');
  const cols=['#ff5e00','#ff8533','#ff3300','#ffaa00','#cc4b00'];
  for(let i=0;i<35;i++){const p=document.createElement('div');p.className='particle';const s=Math.random()*4+1.5;p.style.cssText=`width:${s}px;height:${s}px;left:${Math.random()*100}%;background:${cols[Math.floor(Math.random()*cols.length)]};animation-duration:${Math.random()*22+14}s;animation-delay:${Math.random()*18}s;filter:blur(${Math.random()<.3?.8:0}px);opacity:0;`;c.appendChild(p);}
})();

// ── UTILS ──
function showToast(m){const t=document.getElementById('toast');t.textContent=m;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2600);}
function esc(s){return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function debounce(fn,ms){let t;return(...a)=>{clearTimeout(t);t=setTimeout(()=>fn(...a),ms);};}

// ── PATTERN GENERATORS ──
// Each returns an SVG string for a single tile at (w×h)
const patterns = {
  dots(w,h,sw,fg){
    const r=w*0.18;
    return `<circle cx="${w/2}" cy="${h/2}" r="${r}" fill="${fg}"/>`;
  },
  grid(w,h,sw,fg){
    return `<line x1="0" y1="0" x2="${w}" y2="0" stroke="${fg}" stroke-width="${sw}"/><line x1="0" y1="0" x2="0" y2="${h}" stroke="${fg}" stroke-width="${sw}"/>`;
  },
  chevrons(w,h,sw,fg){
    const m=w/2,b=h*0.7;
    return `<polyline points="0,${b} ${m},${h*0.3} ${w},${b}" fill="none" stroke="${fg}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"/>`;
  },
  triangles(w,h,sw,fg){
    return `<polygon points="${w/2},${h*0.15} ${w*0.85},${h*0.85} ${w*0.15},${h*0.85}" fill="none" stroke="${fg}" stroke-width="${sw}" stroke-linejoin="round"/>`;
  },
  diamonds(w,h,sw,fg){
    const cx=w/2,cy=h/2,rx=w*0.38,ry=h*0.38;
    return `<polygon points="${cx},${cy-ry} ${cx+rx},${cy} ${cx},${cy+ry} ${cx-rx},${cy}" fill="none" stroke="${fg}" stroke-width="${sw}" stroke-linejoin="round"/>`;
  },
  hexagons(w,h,sw,fg){
    const cx=w/2,cy=h/2,r=w*0.4;
    let pts='';for(let i=0;i<6;i++){const a=Math.PI/3*i-Math.PI/6;pts+=`${cx+r*Math.cos(a)},${cy+r*Math.sin(a)} `;}
    return `<polygon points="${pts.trim()}" fill="none" stroke="${fg}" stroke-width="${sw}" stroke-linejoin="round"/>`;
  },
  zigzag(w,h,sw,fg){
    const s=w/4;
    return `<polyline points="0,${h/2} ${s},${h*0.2} ${s*2},${h*0.8} ${s*3},${h*0.2} ${w},${h/2}" fill="none" stroke="${fg}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"/>`;
  },
  crosses(w,h,sw,fg){
    const cx=w/2,cy=h/2,a=w*0.3;
    return `<line x1="${cx-a}" y1="${cy}" x2="${cx+a}" y2="${cy}" stroke="${fg}" stroke-width="${sw}" stroke-linecap="round"/><line x1="${cx}" y1="${cy-a}" x2="${cx}" y2="${cy+a}" stroke="${fg}" stroke-width="${sw}" stroke-linecap="round"/>`;
  },
  stars(w,h,sw,fg){
    const cx=w/2,cy=h/2,or=w*0.38,ir=w*0.16;let pts='';
    for(let i=0;i<10;i++){const a=Math.PI/5*i-Math.PI/2,r=i%2===0?or:ir;pts+=`${cx+r*Math.cos(a)},${cy+r*Math.sin(a)} `;}
    return `<polygon points="${pts.trim()}" fill="none" stroke="${fg}" stroke-width="${sw}" stroke-linejoin="round"/>`;
  },
  plus(w,h,sw,fg){
    const cx=w/2,cy=h/2,a=w*0.15,b=w*0.35;
    return `<rect x="${cx-a}" y="${cy-b}" width="${a*2}" height="${b*2}" rx="2" fill="${fg}"/><rect x="${cx-b}" y="${cy-a}" width="${b*2}" height="${a*2}" rx="2" fill="${fg}"/>`;
  },
  waves(w,h,sw,fg){
    const cy=h/2,amp=h*0.25;
    return `<path d="M0,${cy} Q${w*0.25},${cy-amp} ${w*0.5},${cy} Q${w*0.75},${cy+amp} ${w},${cy}" fill="none" stroke="${fg}" stroke-width="${sw}" stroke-linecap="round"/>`;
  },
  scales(w,h,sw,fg){
    return `<path d="M0,${h} A${w/2},${h/2} 0 0,1 ${w/2},${h/2} A${w/2},${h/2} 0 0,1 ${w},${h}" fill="none" stroke="${fg}" stroke-width="${sw}"/><path d="M${-w/2},${h} A${w/2},${h/2} 0 0,1 0,${h/2}" fill="none" stroke="${fg}" stroke-width="${sw}"/><path d="M${w},${h/2} A${w/2},${h/2} 0 0,1 ${w*1.5},${h}" fill="none" stroke="${fg}" stroke-width="${sw}"/>`;
  },
  leaves(w,h,sw,fg){
    const cx=w/2,cy=h/2;
    return `<path d="M${cx},${cy-h*0.35} Q${cx+w*0.3},${cy} ${cx},${cy+h*0.35} Q${cx-w*0.3},${cy} ${cx},${cy-h*0.35}Z" fill="none" stroke="${fg}" stroke-width="${sw}"/><line x1="${cx}" y1="${cy-h*0.2}" x2="${cx}" y2="${cy+h*0.2}" stroke="${fg}" stroke-width="${sw*0.6}" stroke-linecap="round"/>`;
  },
  circles(w,h,sw,fg){
    const cx=w/2,cy=h/2;
    return `<circle cx="${cx}" cy="${cy}" r="${w*0.35}" fill="none" stroke="${fg}" stroke-width="${sw}"/><circle cx="${cx}" cy="${cy}" r="${w*0.2}" fill="none" stroke="${fg}" stroke-width="${sw*0.7}"/>`;
  },
  arcs(w,h,sw,fg){
    return `<path d="M0,${h} A${w},${h} 0 0,1 ${w},0" fill="none" stroke="${fg}" stroke-width="${sw}" stroke-linecap="round"/><path d="M0,${h*0.5} A${w*0.5},${h*0.5} 0 0,1 ${w*0.5},0" fill="none" stroke="${fg}" stroke-width="${sw*0.7}" stroke-linecap="round"/>`;
  },
  memphis(w,h,sw,fg){
    const cx=w/2,cy=h/2;
    return `<circle cx="${w*0.25}" cy="${w*0.25}" r="${w*0.1}" fill="${fg}"/><line x1="${w*0.5}" y1="${h*0.2}" x2="${w*0.8}" y2="${h*0.5}" stroke="${fg}" stroke-width="${sw}" stroke-linecap="round"/><polygon points="${w*0.15},${h*0.7} ${w*0.35},${h*0.55} ${w*0.35},${h*0.85}" fill="none" stroke="${fg}" stroke-width="${sw}" stroke-linejoin="round"/><rect x="${w*0.6}" y="${h*0.65}" width="${w*0.22}" height="${w*0.22}" fill="none" stroke="${fg}" stroke-width="${sw}" rx="2"/>`;
  },
  confetti(w,h,sw,fg){
    let out='';
    const seed=[{x:.15,y:.2,a:30},{x:.5,y:.1,a:-20},{x:.8,y:.25,a:60},{x:.25,y:.6,a:-45},{x:.6,y:.55,a:15},{x:.85,y:.7,a:-30},{x:.4,y:.85,a:45},{x:.1,y:.85,a:10}];
    seed.forEach(s=>{
      const x=w*s.x,y=h*s.y;
      out+=`<rect x="${x-3}" y="${y-6}" width="6" height="12" rx="2" fill="${fg}" transform="rotate(${s.a},${x},${y})"/>`;
    });
    return out;
  },
  lines(w,h,sw,fg){
    return `<line x1="0" y1="${h}" x2="${w}" y2="0" stroke="${fg}" stroke-width="${sw}"/>`;
  },
  crosshatch(w,h,sw,fg){
    return `<line x1="0" y1="${h}" x2="${w}" y2="0" stroke="${fg}" stroke-width="${sw}"/><line x1="0" y1="0" x2="${w}" y2="${h}" stroke="${fg}" stroke-width="${sw}"/>`;
  },
  arrows(w,h,sw,fg){
    const cx=w/2,cy=h/2,a=w*0.25;
    return `<polyline points="${cx-a},${cy+a*0.5} ${cx},${cy-a*0.5} ${cx+a},${cy+a*0.5}" fill="none" stroke="${fg}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"/><line x1="${cx}" y1="${cy-a*0.5}" x2="${cx}" y2="${cy+a}" stroke="${fg}" stroke-width="${sw}" stroke-linecap="round"/>`;
  },
  bricks(w,h,sw,fg){
    const half=h/2;
    return `<rect x="0" y="0" width="${w}" height="${half}" fill="none" stroke="${fg}" stroke-width="${sw}"/><line x1="${w/2}" y1="${half}" x2="${w/2}" y2="${h}" stroke="${fg}" stroke-width="${sw}"/><line x1="0" y1="${half}" x2="${w}" y2="${half}" stroke="${fg}" stroke-width="${sw}"/>`;
  }
};

// ── GENERATE SVG ──
function buildSVG(){
  const base=state.scale+state.spacing;
  const w=base,h=base;
  const gen=patterns[state.pattern];
  if(!gen) return '';
  const inner=gen(w,h,state.strokeWidth,state.fgColor);
  const op=state.opacity/100;
  const rot=state.rotation;
  const transform=rot!==0?` transform="rotate(${rot},${w/2},${h/2})"`:'';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><rect width="${w}" height="${h}" fill="${state.bgColor}"/><g opacity="${op}"${transform}>${inner}</g></svg>`;
}

function svgToDataURI(svg){
  return 'data:image/svg+xml,'+encodeURIComponent(svg);
}

// ── RENDER ──
function render(){
  const svg=buildSVG();
  const uri=svgToDataURI(svg);
  previewTile.style.backgroundColor=state.bgColor;
  previewTile.style.backgroundImage=`url("${uri}")`;
  previewTile.style.backgroundRepeat='repeat';
  previewTile.style.backgroundSize=`${state.scale+state.spacing}px`;
}
const debouncedRender=debounce(render,40);

// ── CONTROLS ──
function bindSlider(id,key,suffix,decimals){
  const el=document.getElementById(id),lbl=document.getElementById(id+'Val');
  el.addEventListener('input',()=>{
    const v=parseFloat(el.value);state[key]=v;
    if(lbl) lbl.textContent=decimals?v.toFixed(decimals)+suffix:Math.round(v)+suffix;
    debouncedRender();
  });
}
bindSlider('scale','scale','');
bindSlider('rotation','rotation','°');
bindSlider('strokeWidth','strokeWidth','',1);
bindSlider('spacing','spacing','');
bindSlider('opacity','opacity','%');

document.getElementById('patternSelect').addEventListener('change',e=>{state.pattern=e.target.value;render();});
document.getElementById('resSelect').addEventListener('change',e=>{state.exportScale=parseInt(e.target.value);});

// FG swatches
document.querySelectorAll('.ink-swatch.fg').forEach(sw=>{
  sw.addEventListener('click',()=>{
    document.querySelectorAll('.ink-swatch.fg').forEach(s=>s.classList.remove('selected'));
    sw.classList.add('selected');state.fgColor=sw.dataset.color;
    document.getElementById('fgCustom').value=sw.dataset.color;render();
  });
});
document.getElementById('fgCustom').addEventListener('input',e=>{
  state.fgColor=e.target.value;document.querySelectorAll('.ink-swatch.fg').forEach(s=>s.classList.remove('selected'));render();
});

// BG swatches
document.querySelectorAll('.ink-swatch.bg').forEach(sw=>{
  sw.addEventListener('click',()=>{
    document.querySelectorAll('.ink-swatch.bg').forEach(s=>s.classList.remove('selected'));
    sw.classList.add('selected');state.bgColor=sw.dataset.color;
    document.getElementById('bgCustom').value=sw.dataset.color;render();
  });
});
document.getElementById('bgCustom').addEventListener('input',e=>{
  state.bgColor=e.target.value;document.querySelectorAll('.ink-swatch.bg').forEach(s=>s.classList.remove('selected'));render();
});

// Inspire Me
document.getElementById('inspireBtn').addEventListener('click',()=>{
  const keys=Object.keys(patterns);
  state.pattern=keys[Math.floor(Math.random()*keys.length)];
  document.getElementById('patternSelect').value=state.pattern;
  state.scale=Math.round(20+Math.random()*80);
  document.getElementById('scale').value=state.scale;document.getElementById('scaleVal').textContent=state.scale;
  state.rotation=Math.round(Math.random()*360);
  document.getElementById('rotation').value=state.rotation;document.getElementById('rotationVal').textContent=state.rotation+'°';
  state.strokeWidth=+(0.5+Math.random()*5).toFixed(1);
  document.getElementById('strokeWidth').value=state.strokeWidth;document.getElementById('strokeWidthVal').textContent=state.strokeWidth;
  state.spacing=Math.round(Math.random()*20);
  document.getElementById('spacing').value=state.spacing;document.getElementById('spacingVal').textContent=state.spacing;
  const fgs=['#ff5e00','#ffffff','#1565C0','#1b5e20','#6a0dad','#b71c1c','#f9a825','#e91e63','#00bcd4'];
  const bgs=['#0d0d0d','#141414','#1a1a2e','#ffffff','#fdf9f0','#0d1b2a','#2d1b69','#263238'];
  state.fgColor=fgs[Math.floor(Math.random()*fgs.length)];
  state.bgColor=bgs[Math.floor(Math.random()*bgs.length)];
  document.getElementById('fgCustom').value=state.fgColor;
  document.getElementById('bgCustom').value=state.bgColor;
  document.querySelectorAll('.ink-swatch.fg').forEach(s=>{s.classList.toggle('selected',s.dataset.color===state.fgColor);});
  document.querySelectorAll('.ink-swatch.bg').forEach(s=>{s.classList.toggle('selected',s.dataset.color===state.bgColor);});
  render();
  showToast('✨ New pattern generated!');
});

// ── EXPORTS ──
function downloadBlob(blob,name){
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;a.click();URL.revokeObjectURL(a.href);
}
function getFilename(ext){return `patternforge_${new Date().toISOString().slice(0,10)}.${ext}`;}

// Download SVG
document.getElementById('dlSVG').addEventListener('click',()=>{
  const svg=buildSVG();
  downloadBlob(new Blob([svg],{type:'image/svg+xml'}),getFilename('svg'));
  showToast('✅ SVG downloaded!');
});

// Download PNG
document.getElementById('dlPNG').addEventListener('click',()=>{
  showToast('⏳ Rendering PNG…');
  setTimeout(()=>{
    const tileSize=state.scale+state.spacing;
    const tiles=8;
    const canvasSize=tileSize*tiles*state.exportScale;
    const offCanvas=document.createElement('canvas');
    offCanvas.width=canvasSize;offCanvas.height=canvasSize;
    const oc=offCanvas.getContext('2d');
    const svg=buildSVG();
    const img=new Image();
    img.onload=function(){
      for(let x=0;x<tiles;x++)for(let y=0;y<tiles;y++){
        oc.drawImage(img,x*tileSize*state.exportScale,y*tileSize*state.exportScale,tileSize*state.exportScale,tileSize*state.exportScale);
      }
      offCanvas.toBlob(blob=>{downloadBlob(blob,getFilename('png'));showToast('✅ PNG downloaded!');},'image/png');
    };
    img.src=svgToDataURI(svg);
  },60);
});

// Copy CSS
document.getElementById('copyCSS').addEventListener('click',()=>{
  const svg=buildSVG();
  const uri=svgToDataURI(svg);
  const size=state.scale+state.spacing;
  const css=`background-color: ${state.bgColor};\nbackground-image: url("${uri}");\nbackground-repeat: repeat;\nbackground-size: ${size}px ${size}px;`;
  navigator.clipboard.writeText(css).then(()=>showToast('📋 CSS copied to clipboard!')).catch(()=>showToast('❌ Copy failed'));
});

// Copy SVG code
document.getElementById('copySVG').addEventListener('click',()=>{
  const svg=buildSVG();
  navigator.clipboard.writeText(svg).then(()=>showToast('📋 SVG code copied!')).catch(()=>showToast('❌ Copy failed'));
});

// ── INIT ──
render();
