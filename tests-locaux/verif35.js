const { chromium } = require("playwright"); const fs=require("fs"); const http=require("http"); const path=require("path");
const F = require("./fixtures"); const HTML = path.resolve(process.argv[2]);
const server = http.createServer((req,res)=>{res.writeHead(200,{"Content-Type":"text/html"});res.end(fs.readFileSync(HTML));});
(async()=>{
  await new Promise(r=>server.listen(9444,r)); const b = await chromium.launch(); const res=[]; const ecr=[];
  const ok=(n,c,d)=>res.push((c?"  ✓ ":"  ✗ ")+n+(c?"":"  — "+(d||"")));
  const c = await b.newContext({ viewport:{width:390,height:844} }); const who={id:F.IDS.c1,email:"t@e.fr",session:F.session(F.IDS.c1,"t@e.fr")};
  await c.route("**/*", r => { const req=r.request(); const u=req.url(); if(new URL(u).hostname === "localhost") return r.continue(); if(!new URL(u).hostname.endsWith(".supabase.co")) return r.abort();
    const url=new URL(u); const p=url.pathname, q=url.searchParams, m=req.method();
    if (m!=="GET" && !p.startsWith("/auth/")){ ecr.push(m+" "+p+url.search+" "+(req.postData()||"").slice(0,80)); return r.fulfill({status:201,contentType:"application/json",body:""}); }
    let body=[];
    if(p.startsWith("/auth/v1/token")) body=F.session(who.id,who.email);
    else if(p==="/rest/v1/profils"){ const id=q.get("id"); body=id?F.profils.filter(x=>x.id===id.slice(3)):F.profils; }
    else if(p==="/rest/v1/donnees"){ body=F.donnees.filter(x=>x.user_id===who.id); const o=q.get("outil"); if(o&&o.startsWith("eq.")) body=body.filter(x=>x.outil===o.slice(3)); if(o&&o.startsWith("in.(")){const l=o.slice(4,-1).split(","); body=body.filter(x=>l.includes(x.outil));} const sel=(q.get("select")||"*").split(","); if(!sel.includes("*")) body=body.map(x=>Object.fromEntries(sel.map(k=>[k,x[k]]))); }
    else { const t=p.replace("/rest/v1/",""); if(F.catalogue[t]){ body=F.catalogue[t]; const rg=req.headers()["range"]; if(rg){const [a,z]=rg.split("-").map(Number); body=body.slice(a,z+1);} } }
    return r.fulfill({status:200,contentType:"application/json",body:JSON.stringify(body)}); });
  await c.addInitScript((s)=>{localStorage.setItem("mhx_session",JSON.stringify(s));localStorage.setItem("mhx_installe","1");localStorage.setItem("mhx_visites","3");},who.session);
  const page = await c.newPage(); page.on("pageerror",e=>res.push("  ✗ ERREUR JS "+e)); page.on("dialog",d=>{res.push("  ✗ DIALOGUE NATIF"); d.dismiss();});
  /* nutrition : bouton Respecte */
  await page.goto("http://localhost:9444/#/nutrition"); await page.waitForTimeout(1200);
  const avant = await page.$$eval(".respect.on", l=>l.length);
  const btn = await page.$(".respect:not(.on)"); await btn.click(); await page.waitForTimeout(1000);
  const apres = await page.$$eval(".respect.on", l=>l.length);
  ok("nutrition : clic Respecté = un repas de plus coché", apres===avant+1, avant+"->"+apres);
  ok("nutrition : ecriture repas_suivi partie", ecr.some(e=>e.includes('"outil":"repas_suivi"')), ecr.join(" | "));
  ok("nutrition : compteur du jour mis a jour", (await page.textContent(".seance-c-tete > .pastille")||"").includes(String(apres)));
  /* suivi : cocher un objectif */
  ecr.length=0; await page.evaluate(()=>{location.hash="#/suivi"}); await page.waitForTimeout(1200);
  ok("suivi : evolution 5 semaines affichee", (await page.$$eval(".reg-evo-col", l=>l.length))===5);
  ok("suivi : bilan du mois integre", !!(await page.$("#suivi-bilan .tiles")));
  const cases = await page.$$(".obj-case"); await cases[1].click(); await page.waitForTimeout(1000);
  ok("suivi : cocher un objectif = ecriture objectifs_faits", ecr.some(e=>e.includes('"outil":"objectifs_faits"')), ecr.join(" | "));
  ok("suivi : badge Atteint mis a jour", (await page.$$eval(".pastille.ok", l=>l.map(x=>x.textContent.trim()).filter(t=>t==="Atteint").length))>=2);
  /* programme : noter une seance -> badge */
  ecr.length=0; await page.evaluate(()=>{location.hash="#/programme"}); await page.waitForTimeout(1200);
  ok("programme : carte cycle/semaine", (await page.textContent(".prog-tete .eyebrow")||"").toLowerCase().includes("cycle"));
  const nbAvant = (await page.textContent("#prog-nb")||"").trim();
  const zone = await page.$("#seance-3"); ok("programme : seance D a faire", (await zone.textContent()).includes("à faire"));
  await (await zone.$("[data-jr-ouvrir]")).click(); await page.waitForTimeout(300);
  await (await zone.$("[data-r='0']")).fill("10"); await (await zone.$("[data-jr-fin]")).click(); await page.waitForTimeout(1200);
  ok("programme : ecriture journal partie", ecr.some(e=>e.includes('"outil":"journal"')), ecr.join(" | "));
  ok("programme : badge « notée » apparu et compteur +1", (await page.textContent("#seance-3")||"").includes("notée") && (await page.textContent("#prog-nb")||"").trim()!==nbAvant, nbAvant+" -> "+(await page.textContent("#prog-nb")));
  /* progression : saisie repliee, bouton Ajouter */
  await page.evaluate(()=>{location.hash="#/mensurations"}); await page.waitForTimeout(1000);
  ok("progression : saisie repliee quand il y a des mesures", await page.$eval("#mens-saisie", e=>e.hidden));
  await page.click("#mens-ajouter"); await page.waitForTimeout(300);
  ok("progression : Ajouter ma mesure ouvre la saisie", await page.$eval("#mens-saisie", e=>!e.hidden));
  ok("progression : tuile poids de depart", (await page.textContent("#k-depart")||"").includes("84"));
  await b.close(); server.close(); console.log(res.join("\n"));
})();
