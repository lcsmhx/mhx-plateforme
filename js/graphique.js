/* --- Composant graphique : courbes + survol. Sert au suivi des mensurations,
       et reste disponible pour tout futur outil. --- */
const Graphique = {
  echelle(min, max){
    if (min === max){ min -= 1; max += 1; }
    const marge = (max-min)*0.12; min -= marge; max += marge;
    let pas = Math.pow(10, Math.floor(Math.log10((max-min)/4)));
    const m = (max-min)/4/pas;
    pas *= m>5 ? 10 : m>2 ? 5 : m>1 ? 2 : 1;
    return { bas: Math.floor(min/pas)*pas, haut: Math.ceil(max/pas)*pas, pas };
  },
  dessiner(idSvg, idTip, series, unite){
    const svg = $(idSvg), tip = $(idTip);
    if (!svg) return;
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    const boite = svg.parentNode.getBoundingClientRect();
    const W = Math.max(320, boite.width - 16), H = 260;
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    const NS = "http://www.w3.org/2000/svg";
    const el = (n,a) => { const e = document.createElementNS(NS,n); for (const k in a) e.setAttribute(k,a[k]); return e; };

    const vivantes = series.filter(s => s.points.length > 0);
    if (!vivantes.length){
      const t = el("text",{x:W/2,y:H/2,"text-anchor":"middle",fill:"var(--ink-3)","font-size":14,"font-family":'"IBM Plex Sans",sans-serif'});
      t.textContent = "Enregistre au moins deux semaines pour voir la courbe.";
      svg.appendChild(t); if (tip) tip.style.opacity = 0; return;
    }
    const L=46, R=16, T=14, B=30, pw=W-L-R, ph=H-T-B;
    const xs=[], ys=[];
    vivantes.forEach(s => s.points.forEach(p => { xs.push(p.x); ys.push(p.y); }));
    const x0 = Math.min(...xs); let x1 = Math.max(...xs); if (x0===x1) x1 = x0+1;
    const yr = this.echelle(Math.min(...ys), Math.max(...ys));
    const X = v => L + (v-x0)/(x1-x0)*pw;
    const Y = v => T + ph - (v-yr.bas)/(yr.haut-yr.bas)*ph;

    for (let v=yr.bas; v<=yr.haut+1e-9; v+=yr.pas){
      svg.appendChild(el("line",{x1:L,x2:L+pw,y1:Y(v),y2:Y(v),stroke:"var(--grid)","stroke-width":1}));
      const lb = el("text",{x:L-9,y:Y(v)+4,"text-anchor":"end",fill:"var(--ink-3)","font-size":11,"font-family":'"IBM Plex Mono",monospace'});
      lb.textContent = Math.round(v*10)/10; svg.appendChild(lb);
    }
    svg.appendChild(el("line",{x1:L,x2:L+pw,y1:T+ph,y2:T+ph,stroke:"var(--axis)","stroke-width":1}));
    const pasX = Math.max(1, Math.ceil((x1-x0)/6));
    for (let xv=x0; xv<=x1; xv+=pasX){
      const t = el("text",{x:X(xv),y:T+ph+19,"text-anchor":"middle",fill:"var(--ink-3)","font-size":11,"font-family":'"IBM Plex Mono",monospace'});
      t.textContent = "S"+xv; svg.appendChild(t);
    }
    const croix = el("line",{x1:0,x2:0,y1:T,y2:T+ph,stroke:"var(--line-strong)","stroke-width":1,opacity:0});
    svg.appendChild(croix);

    vivantes.forEach(s => {
      const d = s.points.map((p,i) => (i?"L":"M")+X(p.x)+" "+Y(p.y)).join(" ");
      if (vivantes.length === 1){
        const aire = d + ` L${X(s.points[s.points.length-1].x)} ${T+ph} L${X(s.points[0].x)} ${T+ph} Z`;
        svg.appendChild(el("path",{d:aire,fill:s.couleur,opacity:.10}));
      }
      svg.appendChild(el("path",{d,fill:"none",stroke:s.couleur,"stroke-width":2,"stroke-linejoin":"round","stroke-linecap":"round"}));
      const dernier = s.points[s.points.length-1];
      svg.appendChild(el("circle",{cx:X(dernier.x),cy:Y(dernier.y),r:4.5,fill:s.couleur,stroke:"var(--sunken)","stroke-width":2}));
    });

    const reperes = vivantes.map(s => el("circle",{cx:-99,cy:-99,r:4,fill:s.couleur,stroke:"var(--sunken)","stroke-width":2,opacity:0}));
    reperes.forEach(m => svg.appendChild(m));
    const zone = el("rect",{x:L,y:T,width:pw,height:ph,fill:"transparent"});
    svg.appendChild(zone);

    const bouger = ev => {
      const rc = svg.getBoundingClientRect();
      const cx = (ev.touches ? ev.touches[0].clientX : ev.clientX) - rc.left;
      let semaine = Math.round(x0 + (cx/rc.width*W - L)/pw*(x1-x0));
      semaine = Math.max(x0, Math.min(x1, semaine));
      croix.setAttribute("x1", X(semaine)); croix.setAttribute("x2", X(semaine)); croix.setAttribute("opacity", 1);
      let lignes = "", trouve = false;
      vivantes.forEach((s,i) => {
        const pt = s.points.find(p => p.x === semaine);
        if (pt){
          trouve = true;
          reperes[i].setAttribute("cx",X(pt.x)); reperes[i].setAttribute("cy",Y(pt.y)); reperes[i].setAttribute("opacity",1);
          lignes += `<div class="row"><span class="sw" style="background:${s.couleur}"></span>${esc(s.nom)} <b>${n1(pt.y)}</b> ${unite}</div>`;
        } else reperes[i].setAttribute("opacity",0);
      });
      if (!trouve){ tip.style.opacity = 0; return; }
      tip.innerHTML = `<b>Semaine ${semaine}</b>${lignes}`;
      tip.style.opacity = 1;
      let px = X(semaine)/W*rc.width + 8;
      if (px + tip.offsetWidth > rc.width - 4) px = X(semaine)/W*rc.width - tip.offsetWidth - 8;
      tip.style.left = Math.max(4, px) + "px";
      tip.style.top = "14px";
    };
    const quitter = () => { tip.style.opacity = 0; croix.setAttribute("opacity",0); reperes.forEach(m => m.setAttribute("opacity",0)); };
    zone.addEventListener("mousemove", bouger);
    zone.addEventListener("mouseleave", quitter);
    zone.addEventListener("touchstart", bouger, {passive:true});
    zone.addEventListener("touchmove",  bouger, {passive:true});
    zone.addEventListener("touchend",   quitter);
  }
};

