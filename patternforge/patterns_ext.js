// patterns_ext.js
// Procedurally generates 100+ patterns and appends them to the main PatternForge array

(function() {
  const extra = [];
  
  // 1. POLY STARS (10 patterns)
  for(let i = 4; i <= 13; i++) {
    extra.push({
      id: `star_${i}`, name: `Star Burst (${i}-point)`, tags: ['geometric', 'star', 'burst', 'modern', 'polygon'],
      render: (w, h, sw, c1, c2) => {
        const cx=w/2, cy=h/2, or=w*0.4, ir=w*0.15; let pts='';
        for(let j=0; j<i*2; j++) {
          const r = j%2===0 ? or : ir; const a = (Math.PI/i)*j - Math.PI/2;
          pts += `${cx+r*Math.cos(a)},${cy+r*Math.sin(a)} `;
        }
        return `<polygon points="${pts.trim()}" fill="none" stroke="${c1}" stroke-width="${sw}" stroke-linejoin="round"/>
                <circle cx="${cx}" cy="${cy}" r="${ir*0.5}" fill="${c2}"/>`;
      }
    });
  }

  // 2. GEOMETRIC GRIDS (10 patterns)
  for(let i = 2; i <= 6; i++) {
    extra.push({
      id: `grid_square_${i}`, name: `Checkered Grid ${i}x${i}`, tags: ['geometric', 'grid', 'squares', 'checkered', 'modern'],
      render: (w, h, sw, c1, c2) => {
        let svg = ''; const step = w/i;
        for(let x=0; x<i; x++) for(let y=0; y<i; y++) {
          if((x+y)%2 === 0) svg += `<rect x="${x*step}" y="${y*step}" width="${step}" height="${step}" fill="${c1}"/>`;
          else svg += `<rect x="${x*step}" y="${y*step}" width="${step}" height="${step}" fill="${c2}"/>`;
        }
        return svg;
      }
    });
    extra.push({
      id: `grid_circle_${i}`, name: `Dot Grid ${i}x${i}`, tags: ['geometric', 'grid', 'dots', 'circles', 'retro'],
      render: (w, h, sw, c1, c2) => {
        let svg = ''; const step = w/i, r = step*0.35;
        for(let x=0; x<i; x++) for(let y=0; y<i; y++) {
          svg += `<circle cx="${x*step+step/2}" cy="${y*step+step/2}" r="${r}" fill="${(x+y)%2===0?c1:c2}"/>`;
        }
        return svg;
      }
    });
  }

  // 3. CONCENTRIC SHAPES (10 patterns)
  for(let i = 2; i <= 6; i++) {
    extra.push({
      id: `concentric_circ_${i}`, name: `Concentric Rings v${i}`, tags: ['geometric', 'circles', 'rings', 'target', 'retro'],
      render: (w, h, sw, c1, c2) => {
        let svg = ''; const maxR = w*0.45;
        for(let j=i; j>0; j--) {
          svg += `<circle cx="${w/2}" cy="${h/2}" r="${(maxR/i)*j}" fill="${j%2===0?c1:c2}"/>`;
        }
        return svg;
      }
    });
    extra.push({
      id: `concentric_sq_${i}`, name: `Concentric Squares v${i}`, tags: ['geometric', 'squares', 'boxes', 'retro', 'maze'],
      render: (w, h, sw, c1, c2) => {
        let svg = ''; const maxS = w*0.9;
        for(let j=i; j>0; j--) {
          const s = (maxS/i)*j;
          svg += `<rect x="${(w-s)/2}" y="${(h-s)/2}" width="${s}" height="${s}" fill="${j%2===0?c1:c2}"/>`;
        }
        return svg;
      }
    });
  }

  // 4. WAVES & ZIGZAGS (10 patterns)
  for(let i = 2; i <= 6; i++) {
    extra.push({
      id: `zigzag_${i}`, name: `Multi Zigzag v${i}`, tags: ['geometric', 'zigzag', 'lines', 'chevron', 'chevron'],
      render: (w, h, sw, c1, c2) => {
        let svg = ''; const stepY = h/i;
        for(let j=0; j<=i; j++) {
          const y = j*stepY;
          svg += `<polyline points="0,${y} ${w/4},${y-stepY/2} ${w*0.75},${y+stepY/2} ${w},${y}" fill="none" stroke="${j%2===0?c1:c2}" stroke-width="${sw}"/>`;
        }
        return svg;
      }
    });
    extra.push({
      id: `sine_wave_${i}`, name: `Ocean Waves v${i}`, tags: ['geometric', 'waves', 'ocean', 'sine', 'curves'],
      render: (w, h, sw, c1, c2) => {
        let svg = ''; const stepY = h/i, amp = stepY*0.4;
        for(let j=0; j<=i; j++) {
          const y = j*stepY;
          svg += `<path d="M0,${y} Q${w*0.25},${y-amp} ${w*0.5},${y} T${w},${y}" fill="none" stroke="${j%2===0?c1:c2}" stroke-width="${sw}"/>`;
        }
        return svg;
      }
    });
  }

  // 5. TARTAN / PLAID (10 patterns)
  for(let i = 1; i <= 10; i++) {
    extra.push({
      id: `plaid_${i}`, name: `Tartan Plaid v${i}`, tags: ['fabric', 'plaid', 'tartan', 'stripes', 'intersect'],
      render: (w, h, sw, c1, c2) => {
        const w1 = sw*i, w2 = sw*(i/2);
        return `<rect x="${w*0.2}" y="0" width="${w1}" height="${h}" fill="${c1}" opacity="0.6"/>
                <rect x="${w*0.7}" y="0" width="${w2}" height="${h}" fill="${c2}" opacity="0.6"/>
                <rect x="0" y="${h*0.2}" width="${w}" height="${w1}" fill="${c1}" opacity="0.6"/>
                <rect x="0" y="${h*0.7}" width="${w}" height="${w2}" fill="${c2}" opacity="0.6"/>`;
      }
    });
  }

  // 6. AFRICAN / TRIBAL (15 patterns)
  const tribalShapes = [
    { name: 'Mudcloth Arrows', type: 'arrows' }, { name: 'Zulu Chevrons', type: 'chevrons' },
    { name: 'Ndebele Blocks', type: 'blocks' }, { name: 'Kente Lines', type: 'lines' },
    { name: 'Maasai Beads', type: 'beads' }
  ];
  tribalShapes.forEach((ts, idx) => {
    for(let i=1; i<=3; i++) {
      extra.push({
        id: `tribal_${ts.type}_${i}`, name: `${ts.name} v${i}`, tags: ['african', 'tribal', 'ethnic', ts.type, 'geometric', 'mudcloth', 'kente', 'zulu'],
        render: (w, h, sw, c1, c2) => {
          let svg = '';
          if(ts.type === 'arrows') {
            svg = `<polyline points="${w/2},0 ${w/2},${h}" stroke="${c1}" stroke-width="${sw}"/>
                   <polyline points="${w/4},${h/4} ${w/2},0 ${w*0.75},${h/4}" fill="none" stroke="${c2}" stroke-width="${sw}"/>
                   <polyline points="${w/4},${h*0.75} ${w/2},${h/2} ${w*0.75},${h*0.75}" fill="none" stroke="${c2}" stroke-width="${sw}"/>`;
          } else if(ts.type === 'chevrons') {
             const y = h/3*i;
             svg = `<polygon points="0,${y} ${w/2},${y-20} ${w},${y} ${w},${y+10} ${w/2},${y-10} 0,${y+10}" fill="${i%2===0?c1:c2}"/>`;
          } else if(ts.type === 'blocks') {
             svg = `<rect x="${w*0.1}" y="${h*0.1}" width="${w*0.8}" height="${h*0.3}" fill="${c1}"/>
                    <rect x="${w*0.2}" y="${h*0.2}" width="${w*0.6}" height="${h*0.1}" fill="${c2}"/>`;
          } else if(ts.type === 'lines') {
             svg = `<line x1="${w/i}" y1="0" x2="${w/i}" y2="${h}" stroke="${c1}" stroke-width="${sw*i}" stroke-dasharray="${sw*4},${sw*2}"/>`;
          } else {
             svg = `<circle cx="${w/2}" cy="${h/2}" r="${w*0.3}" stroke="${c1}" stroke-width="${sw*i}" stroke-dasharray="${sw*2},${sw}"/>`;
          }
          return svg;
        }
      });
    }
  });

  // 7. ART DECO (10 patterns)
  for(let i = 1; i <= 10; i++) {
    extra.push({
      id: `art_deco_arch_${i}`, name: `Art Deco Arch v${i}`, tags: ['art deco', 'arches', 'vintage', 'retro', 'elegant'],
      render: (w, h, sw, c1, c2) => {
        let svg = '';
        for(let j=0; j<i; j++) {
           const r = (w/2) - (j*(w/2/i));
           svg += `<path d="M${w/2-r},${h} A${r},${r} 0 0,1 ${w/2+r},${h}" fill="none" stroke="${j%2===0?c1:c2}" stroke-width="${sw}"/>`;
        }
        return svg;
      }
    });
  }

  // 8. FLORAL MANDALAS (10 patterns)
  for(let i = 4; i <= 13; i++) {
    extra.push({
      id: `mandala_flower_${i}`, name: `Mandala Blossom (${i}-petal)`, tags: ['floral', 'mandala', 'blossom', 'flower', 'nature'],
      render: (w, h, sw, c1, c2) => {
        const cx=w/2, cy=h/2, r=w*0.4; let pts='';
        for(let j=0; j<=360; j+=5) {
          const a = j*Math.PI/180;
          const rad = r + (r*0.2)*Math.sin(a*i); // flower petal math
          pts += `${cx+rad*Math.cos(a)},${cy+rad*Math.sin(a)} `;
        }
        return `<polygon points="${pts.trim()}" fill="none" stroke="${c1}" stroke-width="${sw}"/>
                <circle cx="${cx}" cy="${cy}" r="${r*0.2}" fill="${c2}"/>`;
      }
    });
  }

  // 9. RETRO MEMPHIS (10 patterns)
  for(let i = 1; i <= 10; i++) {
    extra.push({
      id: `memphis_retro_${i}`, name: `80s Memphis v${i}`, tags: ['retro', 'memphis', '80s', '90s', 'abstract', 'shapes'],
      render: (w, h, sw, c1, c2) => {
        const cx = (w * (i*7%100))/100;
        const cy = (h * (i*13%100))/100;
        return `<circle cx="${cx}" cy="${cy}" r="${w*0.15}" fill="${c1}"/>
                <rect x="${w-cx}" y="${h-cy}" width="${w*0.2}" height="${h*0.2}" fill="${c2}" transform="rotate(${i*15},${w-cx},${h-cy})"/>
                <line x1="0" y1="${cy}" x2="${w}" y2="${h-cy}" stroke="${c1}" stroke-width="${sw}" stroke-dasharray="${sw*2},${sw*4}"/>`;
      }
    });
  }

  // 10. JAPANESE MOTIFS (5 patterns)
  const jap = ['Asanoha', 'Sayagata', 'Shippo', 'Yagasuri', 'Kikko'];
  jap.forEach((name, i) => {
    extra.push({
      id: `japanese_${name.toLowerCase()}`, name: `Japanese ${name}`, tags: ['japanese', 'asian', 'traditional', 'geometric'],
      render: (w, h, sw, c1, c2) => {
        // Simplified generic representations of these complex patterns to fit procedurally
        if(i===0) return `<polygon points="${w/2},0 ${w},${h/2} ${w/2},${h} 0,${h/2}" fill="none" stroke="${c1}" stroke-width="${sw}"/><line x1="0" y1="${h/2}" x2="${w}" y2="${h/2}" stroke="${c2}" stroke-width="${sw}"/><line x1="${w/2}" y1="0" x2="${w/2}" y2="${h}" stroke="${c2}" stroke-width="${sw}"/>`;
        if(i===1) return `<polyline points="0,${h/4} ${w*0.75},${h/4} ${w*0.75},${h*0.75} ${w},${h*0.75}" fill="none" stroke="${c1}" stroke-width="${sw}"/><polyline points="${w/4},0 ${w/4},${h/2} ${w},${h/2}" fill="none" stroke="${c2}" stroke-width="${sw}"/>`;
        if(i===2) return `<circle cx="0" cy="${h/2}" r="${w/2}" fill="none" stroke="${c1}" stroke-width="${sw}"/><circle cx="${w}" cy="${h/2}" r="${w/2}" fill="none" stroke="${c1}" stroke-width="${sw}"/><circle cx="${w/2}" cy="0" r="${h/2}" fill="none" stroke="${c2}" stroke-width="${sw}"/><circle cx="${w/2}" cy="${h}" r="${h/2}" fill="none" stroke="${c2}" stroke-width="${sw}"/>`;
        if(i===3) return `<polyline points="${w/2},0 ${w},${h/4} ${w/2},${h/2} ${w},${h*0.75} ${w/2},${h}" fill="none" stroke="${c1}" stroke-width="${sw}"/><polyline points="0,0 ${w/2},${h/4} 0,${h/2} ${w/2},${h*0.75} 0,${h}" fill="none" stroke="${c2}" stroke-width="${sw}"/>`;
        return `<polygon points="${w/2},${h*0.1} ${w*0.9},${h*0.3} ${w*0.9},${h*0.7} ${w/2},${h*0.9} ${w*0.1},${h*0.7} ${w*0.1},${h*0.3}" fill="none" stroke="${c1}" stroke-width="${sw}"/><circle cx="${w/2}" cy="${h/2}" r="${w*0.15}" fill="${c2}"/>`;
      }
    });
  });

  // 11. AZTEC / MESOAMERICAN (15 patterns)
  for(let i = 1; i <= 15; i++) {
    extra.push({
      id: `aztec_geo_${i}`, name: `Aztec Geometric v${i}`, tags: ['aztec', 'mesoamerican', 'tribal', 'geometric', 'steps', 'diamonds', 'ethnic'],
      render: (w, h, sw, c1, c2) => {
        const u = w/10;
        let svg = '';
        if(i%3 === 0) {
          svg = `<path d="M${u*5},0 L${u*7},${u*2} L${u*5},${u*4} L${u*3},${u*2}Z" fill="${c1}"/>
                 <path d="M0,${u*5} L${u*2},${u*7} L0,${u*9} L${-u*2},${u*7}Z" fill="${c2}"/>
                 <path d="M${w},${u*5} L${w+u*2},${u*7} L${w},${u*9} L${w-u*2},${u*7}Z" fill="${c2}"/>
                 <polyline points="${u*2},0 0,${u*2} ${u*2},${u*4}" fill="none" stroke="${c1}" stroke-width="${sw}"/>
                 <polyline points="${w-u*2},0 ${w},${u*2} ${w-u*2},${u*4}" fill="none" stroke="${c1}" stroke-width="${sw}"/>`;
        } else if(i%3 === 1) {
          svg = `<rect x="${u*2}" y="${u*2}" width="${u*6}" height="${u*6}" fill="none" stroke="${c1}" stroke-width="${sw}"/>
                 <rect x="${u*4}" y="${u*4}" width="${u*2}" height="${u*2}" fill="${c2}"/>
                 <line x1="${u*5}" y1="0" x2="${u*5}" y2="${u*2}" stroke="${c2}" stroke-width="${sw}"/>
                 <line x1="${u*5}" y1="${u*8}" x2="${u*5}" y2="${h}" stroke="${c2}" stroke-width="${sw}"/>
                 <line x1="0" y1="${u*5}" x2="${u*2}" y2="${u*5}" stroke="${c2}" stroke-width="${sw}"/>
                 <line x1="${u*8}" y1="${u*5}" x2="${w}" y2="${u*5}" stroke="${c2}" stroke-width="${sw}"/>`;
        } else {
          svg = `<path d="M0,${u*3} L${u*3},${u*3} L${u*3},0" fill="none" stroke="${c1}" stroke-width="${sw}"/>
                 <path d="M${w},${u*3} L${w-u*3},${u*3} L${w-u*3},0" fill="none" stroke="${c1}" stroke-width="${sw}"/>
                 <path d="M0,${h-u*3} L${u*3},${h-u*3} L${u*3},${h}" fill="none" stroke="${c1}" stroke-width="${sw}"/>
                 <path d="M${w},${h-u*3} L${w-u*3},${h-u*3} L${w-u*3},${h}" fill="none" stroke="${c1}" stroke-width="${sw}"/>
                 <circle cx="${w/2}" cy="${h/2}" r="${u*2}" fill="${c2}"/>`;
        }
        return svg;
      }
    });
  }

  // Append to main patterns array
  window.patterns = window.patterns || [];
  window.patterns.push(...extra);
})();
