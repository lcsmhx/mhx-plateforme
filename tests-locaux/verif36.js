const { chromium } = require("playwright"); const fs=require("fs"); const http=require("http"); const path=require("path");
/* Horloge (v52) : l'envoi du bilan n'est testé que si le formulaire est proposé, c'est-à-dire du vendredi au dimanche
   (Checkin.semaineVisee). Tous les jours, données fictives, simulation et navigateur sont décalés au samedi 12 h de la semaine
   (vendredi, dimanche compris : jamais de passage de minuit pendant la suite) :
   les 13 vérifications tournent tous les jours (avant : 8 du lundi au jeudi, les 5 de l'envoi sautées sans le dire). */
const DECALAGE = (() => { const n = new Date(), j = n.getDay(), c = new Date(n); c.setDate(n.getDate() + (j === 0 ? -1 : 6 - j)); c.setHours(12, 0, 0, 0); return c.getTime() - n.getTime(); })();
const VraiDate = Date;
global.Date = class extends VraiDate { constructor(...a) { super(...(a.length ? a : [VraiDate.now() + DECALAGE])); } static now() { return VraiDate.now() + DECALAGE; } };
/* v71 : Playwright 1.63 (celui du banc GitHub) date chaque réglage de l'horloge avec Date.now() de Node et, à chaque nouveau
   document, le navigateur rattrape l'écart avec sa vraie heure. Avec le Date décalé de Node, un décalage en arrière (le dimanche,
   vers le samedi) était annulé : la page revenait au vrai jour. L'horloge de la page est donc installée avec le vrai Date de Node
   le temps de l'appel, à l'heure décalée : la page est au samedi tous les jours. */
const installerHorloge = async (c) => { const Decale = global.Date, t = Decale.now(); global.Date = VraiDate; try { await c.clock.install({ time: t }); } finally { global.Date = Decale; } };
const F = require("./fixtures"); const HTML = path.resolve(process.argv[2]);
const { servirFichier } = require("./fichiers");   // 52.1 : la page charge css/ et js/, servis depuis son dossier (fichiers.js)
const server = http.createServer((req,res)=>{if(servirFichier(req,res,HTML))return;res.writeHead(200,{"Content-Type":"text/html"});res.end(fs.readFileSync(HTML));});
(async()=>{
  await new Promise(r=>server.listen(9555,r)); const b = await chromium.launch(); const res=[]; const ecr=[];
  const ok=(n,c,d)=>res.push((c?"  ✓ ":"  ✗ ")+n+(c?"":"  — "+(d||"")));
  async function ctx(who){
    const c = await b.newContext({ viewport:{width:390,height:844} });
    await installerHorloge(c);   // horloge décalée qui continue de tourner (une seule page par contexte : un nouveau document repartirait de l'installation)
    await c.route("**/*", r => { const req=r.request(); const u=req.url(); if(new URL(u).hostname === "localhost") return r.continue(); if(!new URL(u).hostname.endsWith(".supabase.co")) return r.abort();
      const url=new URL(u); const p=url.pathname, q=url.searchParams, m=req.method();
      // v56 : la connexion notée par la base (noter_connexion, au démarrage) n'est pas une écriture de l'app : testée à part (verif61)
      if (p==="/rest/v1/rpc/noter_connexion") return r.fulfill({status:204,contentType:"application/json",body:""});
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
