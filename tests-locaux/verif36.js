const { chromium } = require("playwright"); const fs=require("fs"); const http=require("http"); const path=require("path");
const F = require("./fixtures"); const HTML = path.resolve(process.argv[2]);
const server = http.createServer((req,res)=>{res.writeHead(200,{"Content-Type":"text/html"});res.end(fs.readFileSync(HTML));});
(async()=>{
  await new Promise(r=>server.listen(9555,r)); const b = await chromium.launch(); const res=[]; const ecr=[];
  const ok=(n,c,d)=>res.push((c?"  ✓ ":"  ✗ ")+n+(c?"":"  — "+(d||"")));
  async function ctx(who){
    const c = await b.newContext({ viewport:{width:390,height:844} });
    await c.route("**/*", r => { const req=r.request(); const u=req.url(); if(new URL(u).hostname === "localhost") return r.continue(); if(!new URL(u).hostname.endsWith(".supabase.co")) return r.abort();
      const url=new URL(u); const p=url.pathname, q=url.searchParams, m=req.method();
      if (m!=="GET" && !p.startsWith("/auth/")){ ecr.push(m+" "+p+" "+(req.postData()||"").slice(0,4000)); return r.fulfill({status:201,contentType:"application/json",body:""}); }
      let body=[];
      if(p.startsWith("/auth/v1/token")) body=F.session(who.id,who.email);
      else if(p==="/rest/v1/profils"){ const id=q.get("id"); body=id?F.profils.filter(x=>x.id===id.slice(3)):F.profils; }
      else if(p==="/rest/v1/donnees"){ body=F.donnees; const uid=q.get("user_id"), o=q.get("outil"); if(uid) body=body.filter(x=>x.user_id===uid.slice(3)); if(o&&o.startsWith("eq.")) body=body.filter(x=>x.outil===o.slice(3)); if(o&&o.startsWith("in.(")){const l=o.slice(4,-1).split(","); body=body.filter(x=>l.includes(x.outil));} if(o&&o.startsWith("not.in.(")){const l=o.slice(8,-1).split(","); body=body.filter(x=>!l.includes(x.outil));} const sel=(q.get("select")||"*").split(","); if(!sel.includes("*")) body=body.map(x=>Object.fromEntries(sel.map(k=>[k,x[k]]))); }
      else { const t=p.replace("/rest/v1/",""); if(F.catalogue[t]){ body=F.catalogue[t]; const rg=req.headers()["range"]; if(rg){const [a,z]=rg.split("-").map(Number); body=body.slice(a,z+1);} } }
      return r.fulfill({status:200,contentType:"application/json",body:JSON.stringify(body)}); });
    await c.addInitScript((s)=>{localStorage.setItem("mhx_session",JSON.stringify(s));localStorage.setItem("mhx_installe","1");localStorage.setItem("mhx_visites","3");},who.session);
    const page = await c.newPage(); page.on("pageerror",e=>res.push("  ✗ ERREUR JS "+e)); page.on("dialog",d=>{res.push("  ✗ DIALOGUE NATIF"); d.dismiss();});
    return {c,page};
  }
  const client={id:F.IDS.c1,email:"t@e.fr",session:F.session(F.IDS.c1,"t@e.fr")}, coach={id:F.IDS.coach,email:"c@e.fr",session:F.session(F.IDS.coach,"c@e.fr")};
  { const {c,page}=await ctx(client);
    await page.goto("http://localhost:9555/"); await page.waitForTimeout(1200);
    const acc = await page.textContent("#acc-vue");
    ok("accueil : bilan hebdo « disponible » quand la semaine visee n'est pas faite", acc.includes("disponible") || acc.includes("envoyé"), "");
    ok("accueil : objectif 3 « Non atteint » (statut coach)", acc.includes("Non atteint"));
    await page.evaluate(()=>{location.hash="#/suivi"}); await page.waitForTimeout(1200);
    ok("suivi : formulaire de bilan affiche ou bilan envoye", !!(await page.$("[data-checkin]")) || (await page.textContent("#suivi-checkin")).includes("envoyé"));
    const form = await page.$("[data-checkin]");
    if (form){
      await page.click("[data-checkin] .echelle5 button >> nth=3"); await page.waitForTimeout(100);
      await page.click("[data-checkin] button[type=submit]"); await page.waitForTimeout(400);
      ok("suivi : envoi refuse tant que les 4 echelles ne sont pas remplies", ecr.length===0 && (await page.textContent("[data-checkin-msg]")).includes("manque"));
      const groupes = await page.$$("[data-checkin] .echelle5");
      for (const g of groupes){ const bt = await g.$$("button"); await bt[3].click(); }
      await page.fill('[data-checkin] textarea[data-q="semaine"]', "Semaine test");
      await page.click("[data-checkin] button[type=submit]"); await page.waitForTimeout(1200);
      ok("suivi : envoi = ecriture de la cle checkins", ecr.some(e=>e.includes('"outil":"checkins"')), ecr.join(" | "));
      ok("suivi : statut passe a « envoyé »", (await page.textContent("#suivi-checkin")).includes("envoyé"));
      ok("suivi : historique de la semaine passee visible", (await page.textContent("#suivi-checkin")).includes("Mes bilans précédents"));
      ok("suivi : aucune autre cle ecrite", ecr.every(e=>e.includes('"outil":"checkins"')), ecr.join(" | "));
    }
    ok("suivi : objectif 3 case desactivee (statut coach non atteint)", await page.$eval('.obj-case[data-obj="2"]', e=>e.disabled));
    await c.close(); }
  { const {c,page}=await ctx(coach);
    await page.goto("http://localhost:9555/#/clients"); await page.waitForTimeout(1200);
    await page.click(`[data-bilan="${F.IDS.c1}"]`); await page.waitForTimeout(1200);
    const t = await page.textContent("#bilan-vue");
    ok("coach : « Ses bilans hebdomadaires » avec la reponse du client", t.includes("Ses bilans hebdomadaires") && t.includes("4 séances tenues"));
    ok("coach : points a aborder mentionnent les statuts", t.includes("non atteint"));
    await page.evaluate(()=>{location.hash="#/programme"}); await page.waitForTimeout(1200);
    ok("coach : selecteurs de statut d'objectif presents", (await page.$$("#prog-obj select")).length===3);
    await page.selectOption("#obj-st-0", "atteint"); await page.waitForTimeout(1000);
    ok("coach : changer un statut = ecriture programme avec statuts", ecr.some(e=>e.includes('"outil":"programme"') && e.includes("statuts")), ecr.filter(e=>e.includes("programme")).join(" | "));
    await c.close(); }
  await b.close(); server.close(); console.log(res.join("\n"));
})();
