const { chromium } = require("playwright"); const fs=require("fs"); const http=require("http"); const path=require("path");
const F = require("./fixtures"); const HTML = path.resolve(process.argv[2]);
const server = http.createServer((req,res)=>{res.writeHead(200,{"Content-Type":"text/html"});res.end(fs.readFileSync(HTML));});
(async()=>{
  await new Promise(r=>server.listen(9666,r)); const b = await chromium.launch(); const res=[]; const ecr=[];
  const ok=(n,c,d)=>res.push((c?"  ✓ ":"  ✗ ")+n+(c?"":"  — "+(d||"")));
  const who={id:F.IDS.coach,email:"c@e.fr",session:F.session(F.IDS.coach,"c@e.fr")};
  const c = await b.newContext({ viewport:{width:1280,height:900} });
  await c.route("**/*", r => { const req=r.request(); const u=req.url(); if(u.includes("localhost")) return r.continue(); if(!u.includes("supabase.co")) return r.abort();
    const url=new URL(u); const p=url.pathname, q=url.searchParams, m=req.method();
    if (m!=="GET" && !p.startsWith("/auth/")){ ecr.push(m+" "+p); return r.fulfill({status:201,contentType:"application/json",body:""}); }
    let body=[];
    if(p.startsWith("/auth/v1/token")) body=F.session(who.id,who.email);
    else if(p==="/rest/v1/profils"){ const id=q.get("id"); body=id?F.profils.filter(x=>x.id===id.slice(3)):F.profils; }
    else if(p==="/rest/v1/donnees"){ body=F.donnees; const uid=q.get("user_id"), o=q.get("outil"); if(uid) body=body.filter(x=>x.user_id===uid.slice(3)); if(o&&o.startsWith("eq.")) body=body.filter(x=>x.outil===o.slice(3)); if(o&&o.startsWith("in.(")){const l=o.slice(4,-1).split(","); body=body.filter(x=>l.includes(x.outil));} if(o&&o.startsWith("not.in.(")){const l=o.slice(8,-1).split(","); body=body.filter(x=>!l.includes(x.outil));} const sel=(q.get("select")||"*").split(","); if(!sel.includes("*")) body=body.map(x=>Object.fromEntries(sel.map(k=>[k,x[k]]))); }
    else { const t=p.replace("/rest/v1/",""); if(F.catalogue[t]){ body=F.catalogue[t]; const rg=req.headers()["range"]; if(rg){const [a,z]=rg.split("-").map(Number); body=body.slice(a,z+1);} } }
    return r.fulfill({status:200,contentType:"application/json",body:JSON.stringify(body)}); });
  await c.addInitScript((s)=>{localStorage.setItem("mhx_session",JSON.stringify(s));localStorage.setItem("mhx_installe","1");localStorage.setItem("mhx_visites","3");},who.session);
  const page = await c.newPage(); page.on("pageerror",e=>res.push("  ✗ ERREUR JS "+e)); page.on("dialog",d=>{res.push("  ✗ DIALOGUE NATIF"); d.dismiss();});
  await page.goto("http://localhost:9666/"); await page.waitForTimeout(1500);
  const t = await page.textContent("#tb-vue");
  ok("tableau : KPI clients actifs = 3", /Clients actifs\s*3/.test(t.replace(/\s+/g," ")), t.slice(0,200));
  ok("tableau : KPI prospects = 0", /Prospects\s*0/.test(t.replace(/\s+/g," ")));
  ok("tableau : Julien inactif signale", t.includes("Julien") && /Inactif depuis \d+ j/.test(t));
  ok("tableau : Sarah programme/diete a envoyer", t.includes("Programme à envoyer") && t.includes("Diète à envoyer"));
  ok("tableau : Thomas objectif non atteint", t.includes("Objectif non atteint"));
  ok("tableau : Thomas bilan hebdo recu (a lire)", t.includes("Bilan hebdo reçu"));
  ok("tableau : aucune ecriture", ecr.length===0, ecr.join(" | "));
  /* clic sur une alerte -> fiche sur le bon onglet */
  await page.click('.attention-alertes [data-cible="programme"]'); await page.waitForTimeout(1200);
  ok("alerte -> ouvre la fiche sur Son programme", location=null || (await page.evaluate(()=>location.hash))==="#/programme" && !!(await page.$(".bandeau")));
  await page.evaluate(()=>{location.hash="#/accueil"}); await page.waitForTimeout(1500);
  const f = await page.textContent("#acc-vue");
  const h1 = await page.textContent("#acc-vue h1"); ok("fiche : en-tete au nom du client ouvert", /Sarah|Julien|Thomas/.test(h1), h1);
  ok("fiche : blocs profil / objectifs / programme / nutrition / poids / bilan / reste", ["Profil","Objectifs du mois","Programme","Nutrition","Poids et mensurations","Bilan hebdomadaire","Le reste"].every(x=>f.includes(x)));
  ok("fiche : questionnaire complet et programme a faire (Sarah)", f.includes("questionnaire complet") && f.includes("à faire"));
  /* fiche de Thomas : alertes + bilan recu */
  await page.evaluate(()=>{location.hash="#/tableau"}); await page.waitForTimeout(1200);
  await page.click(`[data-fiche="${F.IDS.c1}"][data-cible="accueil"]`); await page.waitForTimeout(1500);
  const f2 = await page.textContent("#acc-vue");
  ok("fiche Thomas : bilan hebdo recu avec reponses", f2.includes("4 séances tenues"));
  ok("fiche Thomas : cycle affiche", /Cycle 01/.test(f2));
  /* mes clients en mobile : cartes */
  await c.close();
  const c2 = await b.newContext({ viewport:{width:390,height:844} });
  await c2.route("**/*", r => r.request().url().includes("localhost") ? r.continue() : r.request().url().includes("supabase.co") ? (()=>{ const url=new URL(r.request().url()); const p=url.pathname,q=url.searchParams; let body=[]; if(p.startsWith("/auth/v1/token")) body=F.session(who.id,who.email); else if(p==="/rest/v1/profils"){const id=q.get("id"); body=id?F.profils.filter(x=>x.id===id.slice(3)):F.profils;} else if(p==="/rest/v1/donnees"){ body=F.donnees; const o=q.get("outil"); if(o&&o.startsWith("not.in.(")){const l=o.slice(8,-1).split(","); body=body.filter(x=>!l.includes(x.outil));} const sel=(q.get("select")||"*").split(","); if(!sel.includes("*")) body=body.map(x=>Object.fromEntries(sel.map(k=>[k,x[k]]))); } return r.fulfill({status:200,contentType:"application/json",body:JSON.stringify(body)}); })() : r.abort());
  await c2.addInitScript((s)=>{localStorage.setItem("mhx_session",JSON.stringify(s));localStorage.setItem("mhx_installe","1");localStorage.setItem("mhx_visites","3");},who.session);
  const p2 = await c2.newPage(); await p2.goto("http://localhost:9666/#/clients"); await p2.waitForTimeout(1500);
  const disp = await p2.$eval("#tb-clients tr", e=>getComputedStyle(e).display);
  ok("mes clients mobile : lignes en cartes (display block)", disp==="block", disp);
  const largeur = await p2.evaluate(()=>document.documentElement.scrollWidth<=390);
  ok("mes clients mobile : pas de defilement horizontal", largeur);
  await p2.screenshot({ path: "captures/v37/coach-clients-mobile-cartes.png", fullPage: true });
  await b.close(); server.close(); console.log(res.join("\n"));
})();
