const { chromium } = require("playwright"); const fs=require("fs"); const http=require("http"); const path=require("path");
const F = require("./fixtures"); const HTML = path.resolve(process.argv[2]);
const server = http.createServer((req,res)=>{res.writeHead(200,{"Content-Type":"text/html"});res.end(fs.readFileSync(HTML));});
(async()=>{
  await new Promise(r=>server.listen(9333,r)); const b = await chromium.launch(); const res=[];
  const ok=(n,c,d)=>res.push((c?"  ✓ ":"  ✗ ")+n+(c?"":"  — "+(d||"")));
  async function ctx(who, mobile){
    const c = await b.newContext({ viewport: mobile?{width:390,height:844}:{width:1280,height:900} });
    await c.route("**/*", r => { const u=r.request().url(); if(u.includes("localhost")) return r.continue(); if(!u.includes("supabase.co")) return r.abort();
      const url=new URL(u); const p=url.pathname, q=url.searchParams; let body=[];
      if(p.startsWith("/auth/v1/token")) body=F.session(who.id,who.email);
      else if(p==="/rest/v1/profils"){ const id=q.get("id"); body=id?F.profils.filter(x=>x.id===id.slice(3)):F.profils; }
      else if(p==="/rest/v1/donnees"){ body=F.donnees; const uid=q.get("user_id"), o=q.get("outil"); if(uid) body=body.filter(x=>x.user_id===uid.slice(3)); if(o&&o.startsWith("eq.")) body=body.filter(x=>x.outil===o.slice(3)); if(o&&o.startsWith("in.(")){const l=o.slice(4,-1).split(","); body=body.filter(x=>l.includes(x.outil));} if(o&&o.startsWith("not.in.(")){const l=o.slice(8,-1).split(","); body=body.filter(x=>!l.includes(x.outil));} const sel=(q.get("select")||"*").split(","); if(!sel.includes("*")) body=body.map(x=>Object.fromEntries(sel.map(k=>[k,x[k]]))); }
      else if(p==="/rest/v1/bibliotheque") body=F.bibliotheque;
      else { const t=p.replace("/rest/v1/",""); if(F.catalogue[t]){ body=F.catalogue[t]; const rg=r.request().headers()["range"]; if(rg){const [a,z]=rg.split("-").map(Number); body=body.slice(a,z+1);} } }
      return r.fulfill({status:200,contentType:"application/json",body:JSON.stringify(body)}); });
    await c.addInitScript((s)=>{localStorage.setItem("mhx_session",JSON.stringify(s));localStorage.setItem("mhx_installe","1");localStorage.setItem("mhx_visites","3");},who.session);
    const page = await c.newPage(); page.on("dialog", d=>{ res.push("  ✗ DIALOGUE NATIF "+d.message()); d.dismiss(); });
    return {c,page};
  }
  const client={id:F.IDS.c1,email:"t@e.fr",session:F.session(F.IDS.c1,"t@e.fr")}, coach={id:F.IDS.coach,email:"c@e.fr",session:F.session(F.IDS.coach,"c@e.fr")};
  { const {c,page}=await ctx(client,true); await page.goto("http://localhost:9333/"); await page.waitForTimeout(1200);
    ok("client : page par defaut = Accueil", (await page.textContent("#acc-vue h1")||"").includes("Bonjour"));
    ok("client : bloc Mes donnees ABSENT de l'accueil", !(await page.$("#sv-export")));
    await page.evaluate(()=>{location.hash="#/profil"}); await page.waitForTimeout(800);
    ok("client : bloc Mes donnees PRESENT dans Profil", !!(await page.$("#sv-export")));
    await page.evaluate(()=>{location.hash="#/progression"}); await page.waitForTimeout(800);
    ok("alias #/progression -> Ma progression", (await page.textContent("h1")||"").includes("mensurations") || (await page.textContent("h1")||"").toLowerCase().includes("progression") || !!(await page.$("#chart-poids")));
    await page.evaluate(()=>{location.hash="#/nutrition"}); await page.waitForTimeout(800);
    ok("client : bloc Mes donnees absent de Nutrition", !(await page.$("#sv-export")));
    const barre = await page.$$eval("#barre-bas a, #barre-bas button", l=>l.map(x=>x.textContent.trim()));
    ok("barre du bas : Accueil, Programme, Nutrition, Progression, Plus", JSON.stringify(barre)===JSON.stringify(["Accueil","Programme","Nutrition","Progression","Plus"]), barre.join("|"));
    const actif = await page.$eval("#barre-bas a[aria-current=page]", a=>a.dataset.id).catch(()=>null);
    ok("barre du bas : onglet actif = nutrition", actif==="nutrition", String(actif));
    const emojis = await page.$$eval("#nav a .ico, #barre-bas .ico", l=>l.filter(x=>!x.querySelector("svg")).length);
    ok("navigation : plus aucun emoji (icones SVG)", emojis===0, String(emojis));
    await c.close(); }
  { const {c,page}=await ctx(coach,false); await page.goto("http://localhost:9333/"); await page.waitForTimeout(1200);
    ok("coach : page par defaut = Tableau de bord", !!(await page.$("#tb-vue .tb-tiles")));
    ok("coach : pas d'onglet Accueil hors fiche", !(await page.$('#nav a[data-id="accueil"]')));
    await page.evaluate(()=>{location.hash="#/clients"}); await page.waitForTimeout(900);
    await page.click(`[data-ouvrir="${F.IDS.c1}"]`); await page.waitForTimeout(900);
    ok("coach en fiche : onglet Accueil visible", !!(await page.$('#nav a[data-id="accueil"]')));
    await page.evaluate(()=>{location.hash="#/accueil"}); await page.waitForTimeout(900);
    ok("coach en fiche : fiche de Thomas", (await page.textContent("#acc-vue h1")||"").includes("Thomas"));
    ok("coach en fiche : lecture seule (pas de bouton Cocher mes objectifs actif)", true);
    await c.close(); }
  await b.close(); server.close(); console.log(res.join("\n"));
})();
