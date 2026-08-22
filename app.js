const APP_VERSION = "2.1.0";
const STORE = "coach10k_force_v2";

const defaults = {
  settings: {
    target10kSec: 50*60,
    maxSessionMin: 60,
    enduranceScore: 5840,
    climbScore: 40,
    climbEndurance: 17,
    climbPower: 32,
    vo2max: 47,
    readiness: 4,
    legs: 2,
    availableMin: 60,
    allowDouble: true
  },
  sessions: [
    {
      code:"A", type:"strength", title:"Muscu A — séance validée", duration:55, hardLegs:false,
      goal:"Force / entretien — séance de référence",
      note:"Séance A conservée comme référence. Les exercices sont modifiables une fois pour coller exactement à ta séance d’hier.",
      exercises:[
        {name:"Développé couché",sets:4,reps:"5-6",rest:120},
        {name:"Tirage vertical",sets:4,reps:"6-8",rest:105},
        {name:"Rowing poulie ou barre",sets:3,reps:"8",rest:90},
        {name:"Développé épaules",sets:3,reps:"6-8",rest:90},
        {name:"Curl biceps",sets:2,reps:"10",rest:60},
        {name:"Extension triceps",sets:2,reps:"10",rest:60}
      ]
    },
    {
      code:"B", type:"strength", title:"Muscu B — complémentaire", duration:55, hardLegs:false,
      goal:"Force / équilibre musculaire",
      note:"Complète A sans charger fortement les jambes.",
      exercises:[
        {name:"Développé incliné",sets:3,reps:"6-8",rest:105},
        {name:"Rowing unilatéral poulie",sets:3,reps:"8/jambe",rest:90},
        {name:"Tirage vertical prise neutre",sets:3,reps:"8",rest:90},
        {name:"Élévations latérales",sets:3,reps:"12",rest:60},
        {name:"Face pull",sets:3,reps:"12",rest:60},
        {name:"Gainage",sets:3,reps:"40 s",rest:45}
      ]
    },
    {
      code:"C", type:"strength", title:"Jambes — côte & descente", duration:58, hardLegs:true,
      goal:"Force, propulsion en côte, freinage en descente",
      note:"RPE 6–7. Descente contrôlée sur le travail excentrique. Pas d’échec.",
      exercises:[
        {name:"Squat",sets:4,reps:"5",rest:120},
        {name:"Step-up",sets:3,reps:"6/jambe",rest:90},
        {name:"Soulevé de terre roumain",sets:3,reps:"6-8",rest:105},
        {name:"Split squat",sets:3,reps:"6/jambe · descente 3-4 s",rest:90},
        {name:"Step-down",sets:3,reps:"8/jambe · descente 3-4 s",rest:75},
        {name:"Mollets unilatéraux",sets:3,reps:"10-12",rest:60}
      ]
    },
    {code:"R1",type:"run",title:"Endurance fondamentale",duration:50,hardLegs:false,goal:"Base aérobie / récupération",note:"45–60 min très faciles. Conversation possible. RPE 3–4.",run:{warmup:0,main:"45–60 min facile",recovery:"",cooldown:""}},
    {code:"R2",type:"run",title:"Fractionné court",duration:48,hardLegs:true,goal:"Vitesse / économie de course",note:"Rapide mais contrôlé, jamais sprint maximal.",run:{warmup:14,main:"8 × 1 min rapide",recovery:"1 min lente entre répétitions",cooldown:"10–12 min facile"}},
    {code:"R3",type:"run",title:"Seuil / tempo",duration:52,hardLegs:true,goal:"Tenir un effort soutenu",note:"Difficile mais contrôlé. RPE ≈ 7.",run:{warmup:12,main:"3 × 8 min soutenues",recovery:"2 min faciles",cooldown:"10 min facile"}},
    {code:"R4",type:"run",title:"Spécifique 10 km",duration:52,hardLegs:true,goal:"Rendre 5:00/km durable",note:"Objectif 10 km < 50 min. Ne pas courir plus vite juste pour gagner la séance.",run:{warmup:12,main:"4 × 1 km à 5:00–5:10/km",recovery:"2 min faciles",cooldown:"8–10 min facile"}},
    {code:"R5",type:"run",title:"Côtes",duration:48,hardLegs:true,goal:"Puissance + endurance en montée",note:"Effort énergique contrôlé, pas sprint. Redescente tranquille.",run:{warmup:14,main:"6 × 60–75 s en côte",recovery:"redescente lente ≈ 2 min",cooldown:"10–12 min facile"}}
  ],
  history: [],
  planned: {},
  updatedAt: new Date().toISOString()
};

function clone(x){return JSON.parse(JSON.stringify(x))}
function normalizeState(parsed){
  const base=clone(defaults);
  if(!parsed || typeof parsed!=="object") return base;

  base.settings=Object.assign({},base.settings,parsed.settings||{});

  // Keep the user's edited session library when valid; otherwise restore defaults.
  if(Array.isArray(parsed.sessions) && parsed.sessions.length){
    base.sessions=parsed.sessions.map(function(s){
      const fallback=defaults.sessions.find(function(d){return d.code===s.code})||{};
      return Object.assign({},fallback,s||{});
    });
  }

  base.history=Array.isArray(parsed.history)?parsed.history:[];
  base.planned=(parsed.planned && typeof parsed.planned==="object")?parsed.planned:{};
  base.updatedAt=parsed.updatedAt||base.updatedAt;
  return base;
}
function load(){
  try{
    const raw=localStorage.getItem(STORE);
    return raw ? normalizeState(JSON.parse(raw)) : clone(defaults);
  }catch(e){
    return clone(defaults);
  }
}
let state=load();
function save(){state.updatedAt=new Date().toISOString();localStorage.setItem(STORE,JSON.stringify(state))}
function esc(s=""){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
function fmtDate(iso){return new Date(iso).toLocaleDateString("fr-FR",{weekday:"short",day:"2-digit",month:"short"})}
function secToPace(sec){if(!isFinite(sec)||sec<=0)return "—"; const m=Math.floor(sec/60),s=Math.round(sec%60);return `${m}:${String(s).padStart(2,"0")}/km`}
function paceToSec(txt){if(!txt)return null; const m=String(txt).match(/(\d+)\s*[:']\s*(\d+)/); return m ? (+m[1]*60 + +m[2]) : null}
function sessionBy(code){return state.sessions.find(s=>s.code===code)}
function daysAgo(iso){return (Date.now()-new Date(iso).getTime())/86400000}
function recent(code,days=14){return state.history.filter(h=>h.code===code && daysAgo(h.date)<=days)}
function lastOf(code){return state.history.filter(h=>h.code===code).sort((a,b)=>new Date(b.date)-new Date(a.date))[0]}
function lastHardDays(){
  const hard = state.history.filter(h=>sessionBy(h.code)?.hardLegs).sort((a,b)=>new Date(b.date)-new Date(a.date))[0];
  return hard ? daysAgo(hard.date) : 99;
}
function completedLast(days=7){return state.history.filter(h=>daysAgo(h.date)<=days).length}
function hardLast(days=7){return state.history.filter(h=>daysAgo(h.date)<=days && sessionBy(h.code)?.hardLegs).length}

function weaknessModel(){
  const s=state.settings;
  let r4=lastOf("R4"), r4Pace = r4?.run?.paceSec || null;
  let tenKNeed = r4Pace ? Math.max(0, Math.min(100, (r4Pace-300)*2 + 35)) : 55;
  let enduranceNeed = Math.max(20, Math.min(95, 70 - Math.min(30, recent("R1",10).length*12)));
  return [
    {key:"climbEndurance",label:"Endurance en montée",need:Math.max(0,100-s.climbEndurance),detail:`Garmin ${s.climbEndurance}`},
    {key:"climbPower",label:"Puissance en montée",need:Math.max(0,100-s.climbPower),detail:`Garmin ${s.climbPower}`},
    {key:"10k",label:"Spécifique 10 km",need:tenKNeed,detail:r4Pace?`Dernier R4 ${secToPace(r4Pace)}`:"Pas encore assez de données R4"},
    {key:"aerobic",label:"Endurance fondamentale",need:enduranceNeed,detail:`${recent("R1",10).length} R1 sur 10 jours`}
  ].sort((a,b)=>b.need-a.need);
}

function scoreSession(code){
  const s=state.settings, weak=weaknessModel(), top=weak[0]?.key;
  let score=50, reasons=[];
  const hDays=lastHardDays(), legs=s.legs, readiness=s.readiness;
  if(code==="R5"){score += (100-s.climbEndurance)*.38 + (100-s.climbPower)*.25; reasons.push("cible directement tes points faibles en montée")}
  if(code==="C"){score += (100-s.climbPower)*.28 + (100-s.climbEndurance)*.10; reasons.push("renforce propulsion et contrôle des descentes")}
  if(code==="R4"){score += top==="10k"?35:18; reasons.push("spécifique à l’objectif 5:00/km")}
  if(code==="R3"){score += top==="10k"?28:14; reasons.push("développe la tenue d’allure")}
  if(code==="R2"){score += 12; reasons.push("travaille vitesse et économie")}
  if(code==="R1"){score += 18 + (hDays<1.5?32:0) + (legs>=4?30:0); reasons.push("favorise récupération et base aérobie")}
  if(code==="A"||code==="B"){score += 12 + (hDays<1.2?18:0); reasons.push("entretient la force sans imposer une grosse séance de jambes")}

  const sess=sessionBy(code);
  if(sess?.hardLegs && hDays<1.25){score-=55;reasons.push("pénalisée car une séance jambes intense est récente")}
  if(sess?.hardLegs && legs>=4){score-=45;reasons.push("pénalisée car tes jambes sont fatiguées")}
  if(sess?.hardLegs && readiness<=2){score-=35;reasons.push("pénalisée par une récupération basse")}
  if(hardLast(7)>=3 && sess?.hardLegs){score-=25;reasons.push("déjà beaucoup de séances exigeantes cette semaine")}
  const last=lastOf(code); if(last && daysAgo(last.date)<2.5){score-=25;reasons.push("séance identique réalisée récemment")}
  if(sessionBy(code)?.duration>s.availableMin){score-=80;reasons.push("dépasse le temps disponible")}
  return {code,score,reasons}
}
function recommendation(){
  return state.sessions.map(x=>scoreSession(x.code)).sort((a,b)=>b.score-a.score);
}
function compat(a,b){
  const A=sessionBy(a),B=sessionBy(b); if(!A||!B)return {lvl:"mid",txt:"À évaluer"};
  if(a===b)return {lvl:"no",txt:"Même séance"};
  if(A.hardLegs&&B.hardLegs)return {lvl:"no",txt:"Deux fortes charges jambes"};
  if((A.code==="C"&&B.type==="run")||(B.code==="C"&&A.type==="run")){
    if(A.code==="R1"||B.code==="R1")return {lvl:"mid",txt:"Possible seulement si très facile et bonne récupération"};
    return {lvl:"no",txt:"À éviter le même jour"};
  }
  if((A.type==="strength"&&!A.hardLegs&&B.code==="R1")||(B.type==="strength"&&!B.hardLegs&&A.code==="R1"))
    return {lvl:"ok",txt:"Très bon doublé"};
  if(A.hardLegs||B.hardLegs)return {lvl:"mid",txt:"Possible avec plusieurs heures d’écart, selon récupération"};
  return {lvl:"ok",txt:"Compatible"};
}

let activeTab="today";
const view=document.getElementById("view");
const quickDialog=document.getElementById("quickDialog");
const sessionDialog=document.getElementById("sessionDialog");
document.querySelectorAll(".nav-btn").forEach(b=>b.onclick=()=>{activeTab=b.dataset.tab;render()});

function render(){
  document.querySelectorAll(".nav-btn").forEach(b=>b.classList.toggle("active",b.dataset.tab===activeTab));
  ({today:renderToday,sessions:renderSessions,history:renderHistory,stats:renderStats,settings:renderSettings}[activeTab]||renderToday)();
}
function renderToday(){
  const recs=recommendation(), best=recs[0], second=recs[1], s=sessionBy(best.code);
  const weak=weaknessModel(), today=new Date().toLocaleDateString("fr-FR",{weekday:"long",day:"numeric",month:"long"});
  const planned=state.planned[new Date().toISOString().slice(0,10)]||[];
  view.innerHTML=`
    <div class="section-title"><div><div class="small">${esc(today)}</div><h2>Séance recommandée</h2></div><span class="badge good">${completedLast(7)} séance(s) / 7 j</span></div>
    <section class="card hero">
      <div class="row between"><span class="badge ${s.type==="run"?"blue":"accent"}">${esc(s.code)} · ${s.type==="run"?"RUNNING":"MUSCU"}</span><span class="small">≈ ${s.duration} min</span></div>
      <div class="big" style="margin-top:10px">${esc(s.title)}</div>
      <p class="muted">${esc(best.reasons[0]||s.goal)}.</p>
      <div class="notice"><strong>Pourquoi aujourd’hui :</strong> ${esc(buildReason(best.code))}</div>
      <div class="action-grid">
        <button class="primary" onclick="openSession('${s.code}')">Démarrer ${s.code}</button>
        <button class="secondary" onclick="chooseSession(false)">Changer</button>
        <button class="secondary" onclick="chooseSession(true)">+ 2e séance</button>
      </div>
    </section>

    ${planned.length?`<section class="card"><h3>Programme du jour</h3>${planned.map((p,i)=>`<div class="kpi"><div><strong>${esc(p)}</strong><div class="small">${esc(sessionBy(p)?.title||"")}</div></div><button class="ghost" onclick="removePlanned(${i})">Retirer</button></div>`).join("")}</section>`:""}

    <div class="section-title"><h2>Points faibles actuels</h2><span class="small">pilotent les recommandations</span></div>
    <section class="card">${weak.slice(0,4).map((w,i)=>`
      <div class="rank"><span class="ranknum">${i+1}</span><div><strong>${esc(w.label)}</strong><div class="small">${esc(w.detail)}</div><div class="scorebar"><span style="width:${Math.round(w.need)}%"></span></div></div><span class="badge">${Math.round(w.need)}%</span></div>`).join("")}
    </section>

    <div class="section-title"><h2>Garmin / objectif</h2><button class="ghost" onclick="activeTab='settings';render()">Modifier</button></div>
    <div class="metric-grid">
      <div class="metric"><div class="v">5:00</div><div class="l">Allure cible 10 km</div></div>
      <div class="metric"><div class="v">${state.settings.climbScore}</div><div class="l">Score montée</div></div>
      <div class="metric"><div class="v">${state.settings.climbEndurance}</div><div class="l">Endurance montée</div></div>
      <div class="metric"><div class="v">${state.settings.climbPower}</div><div class="l">Puissance montée</div></div>
    </div>

    <div class="section-title"><h2>Alternative</h2></div>
    ${sessionCard(sessionBy(second.code),true)}
  `;
}
function buildReason(code){
  const weak=weaknessModel(), first=weak[0];
  if(code==="R5") return `ton indicateur le plus faible est ${first.label.toLowerCase()} et R5 apporte le transfert le plus direct sur le terrain`;
  if(code==="C") return `la puissance en montée reste un axe prioritaire ; C développe force unilatérale et freinage excentrique`;
  if(code==="R4") return `le sous-50 exige de rendre 5:00/km progressivement confortable sur des blocs de plus en plus longs`;
  if(code==="R3") return `le seuil améliore ta capacité à conserver une allure soutenue, utile quand la vitesse courte n’est plus le facteur limitant`;
  if(code==="R1") return `la priorité est d’assimiler les efforts récents tout en entretenant le volume aérobie`;
  if(code==="A"||code==="B") return `tu peux entretenir la force sans ajouter une nouvelle forte contrainte sur les jambes`;
  return `elle équilibre au mieux tes objectifs et ta récupération enregistrée`;
}
function sessionCard(s,open=false){
  return `<div class="card session-card" onclick="${open?`openSession('${s.code}')`:''}">
    <div class="code ${s.type==="run"?"run":""}">${esc(s.code)}</div>
    <div><strong>${esc(s.title)}</strong><p>${esc(s.goal)} · ≈ ${s.duration} min</p></div><div class="chev">›</div>
  </div>`
}
function renderSessions(){
  const strength=state.sessions.filter(s=>s.type==="strength"), runs=state.sessions.filter(s=>s.type==="run");
  view.innerHTML=`<div class="section-title"><h2>Musculation</h2><span class="small">A · B · C</span></div>${strength.map(s=>sessionCard(s,true)).join("")}
    <div class="section-title"><h2>Running</h2><span class="small">R1 → R5</span></div>${runs.map(s=>sessionCard(s,true)).join("")}
    <div class="card"><div class="notice">Une seule grosse sollicitation des jambes par jour. Les doublés les plus simples à tolérer sont R1 + A ou R1 + B.</div></div>`;
}
function renderHistory(){
  const hs=[...state.history].sort((a,b)=>new Date(b.date)-new Date(a.date));
  view.innerHTML=`<div class="section-title"><h2>Historique</h2><span class="badge">${hs.length} séance(s)</span></div>
  <section class="card">${hs.length?hs.map((h,i)=>`
    <div class="history-item"><div class="row between"><div><strong>${esc(h.code)} · ${esc(sessionBy(h.code)?.title||h.title||"")}</strong><div class="history-meta">${fmtDate(h.date)} · RPE ${h.rpe||"—"} ${h.duration?`· ${h.duration} min`:""}</div></div><button class="ghost" onclick="deleteHistory('${h.id}')">×</button></div>
    ${h.run?`<div class="small" style="margin-top:6px">${h.run.distance?`${h.run.distance} km · `:""}${h.run.paceSec?secToPace(h.run.paceSec):""}${h.run.elev?` · D+ ${h.run.elev} m`:""}</div>`:""}
    ${h.notes?`<div class="small" style="margin-top:5px">${esc(h.notes)}</div>`:""}
    </div>`).join(""):`<p class="muted">Aucune séance enregistrée pour l’instant.</p>`}</section>`;
}
function renderStats(){
  const weak=weaknessModel(), r4=lastOf("R4"), runs=state.history.filter(h=>h.run), strengths=state.history.filter(h=>h.type==="strength");
  const avgRpe=state.history.length?(state.history.reduce((a,h)=>a+(+h.rpe||0),0)/state.history.length).toFixed(1):"—";
  view.innerHTML=`<div class="section-title"><h2>Analyse coach</h2><span class="badge accent">v${APP_VERSION}</span></div>
    <section class="card hero"><h3>Priorité actuelle</h3><div class="big">${esc(weak[0].label)}</div><p class="muted">${esc(analysisText())}</p></section>
    <div class="metric-grid">
      <div class="metric"><div class="v">${state.history.length}</div><div class="l">Séances enregistrées</div></div>
      <div class="metric"><div class="v">${runs.length}</div><div class="l">Running</div></div>
      <div class="metric"><div class="v">${strengths.length}</div><div class="l">Musculation</div></div>
      <div class="metric"><div class="v">${avgRpe}</div><div class="l">RPE moyen</div></div>
    </div>
    <section class="card"><h3>Objectif 10 km</h3>
      <div class="kpi"><span>Allure cible</span><strong>5:00/km</strong></div>
      <div class="kpi"><span>Dernier R4</span><strong>${r4?.run?.paceSec?secToPace(r4.run.paceSec):"À mesurer"}</strong></div>
      <div class="kpi"><span>Temps cible</span><strong>&lt; 50:00</strong></div>
    </section>
    <section class="card"><h3>Hiérarchie des besoins</h3>${weak.map((w,i)=>`<div class="rank"><span class="ranknum">${i+1}</span><div><strong>${esc(w.label)}</strong><div class="small">${esc(w.detail)}</div></div><span>${Math.round(w.need)}%</span></div>`).join("")}</section>
    <section class="card"><h3>Corrélations à surveiller</h3>
      <p class="small">• C progresse mais la puissance Garmin ne bouge pas → augmenter le transfert R5.</p>
      <p class="small">• R2 progresse mais R4 reste difficile → priorité R3/R4 plutôt que plus de vitesse courte.</p>
      <p class="small">• 1 km à 5:00 facile mais blocs longs difficiles → développer la durée au seuil et au spécifique 10 km.</p>
      <p class="small">• Descente toujours limitante → regarder la progression split squat / step-down et la fatigue quadriceps.</p>
    </section>`;
}
function analysisText(){
  const w=weaknessModel()[0];
  if(w.key==="climbEndurance") return "Le cardio général est déjà solide ; l’app donne davantage de poids aux côtes et à l’endurance spécifique en montée, sans empiler les séances dures.";
  if(w.key==="climbPower") return "La priorité va au renforcement jambes C et aux côtes R5, en laissant assez de récupération pour que la force se transfère à la course.";
  if(w.key==="10k") return "La priorité passe au seuil et au spécifique 10 km : l’objectif est d’allonger progressivement le temps passé proche de 5:00/km.";
  return "La base aérobie reste à consolider avec davantage de R1 faciles, pour mieux absorber les séances spécifiques.";
}
function renderSettings(){
  const s=state.settings;
  view.innerHTML=`<div class="section-title"><h2>Réglages & données</h2></div>
    <section class="card"><h3>État du jour</h3>
      <div class="form-grid">
        <div><label>Récupération 1–5</label><input id="setReadiness" type="number" min="1" max="5" value="${s.readiness}"></div>
        <div><label>Fatigue jambes 1–5</label><input id="setLegs" type="number" min="1" max="5" value="${s.legs}"></div>
      </div>
      <label>Temps disponible aujourd’hui (min)</label><select id="setAvailable"><option ${s.availableMin==30?"selected":""}>30</option><option ${s.availableMin==45?"selected":""}>45</option><option ${s.availableMin==60?"selected":""}>60</option></select>
      <button class="primary full" style="margin-top:12px" onclick="saveDaily()">Recalculer ma séance</button>
    </section>
    <section class="card"><h3>Garmin</h3>
      <div class="form-grid">
        <div><label>Score endurance</label><input id="gEnd" type="number" value="${s.enduranceScore}"></div>
        <div><label>VO₂ max</label><input id="gVo2" type="number" value="${s.vo2max}"></div>
        <div><label>Score montée</label><input id="gClimb" type="number" value="${s.climbScore}"></div>
        <div><label>Endurance montée</label><input id="gClimbEnd" type="number" value="${s.climbEndurance}"></div>
        <div><label>Puissance montée</label><input id="gClimbPow" type="number" value="${s.climbPower}"></div>
      </div>
      <button class="secondary full" style="margin-top:12px" onclick="saveGarmin()">Enregistrer Garmin</button>
    </section>
    <section class="card"><h3>Séance A</h3><p class="small">A est conservée comme séance de référence. Tu peux ajuster les noms/exercices une fois et l’app gardera ta version.</p><button class="secondary full" onclick="editA()">Modifier la séance A</button></section>
    <section class="card"><h3>Sauvegarde</h3><div class="action-grid"><button class="secondary" onclick="exportData()">Exporter JSON</button><label class="secondary" style="text-align:center;margin:0">Importer JSON<input id="importFile" type="file" accept="application/json" onchange="importData(this.files[0])" style="display:none"></label><button class="ghost" onclick="clearCaches()">Forcer mise à jour</button></div><div class="small" style="margin-top:10px">Version ${APP_VERSION} · données stockées sur cet appareil.</div></section>
    <section class="card"><h3>Règles de sécurité</h3><div class="notice">Pas de 1RM ni de répétitions forcées. Évite de bloquer volontairement la respiration sous charge. Les limites d’intensité données par ton équipe médicale priment sur l’app. Arrête la séance en cas de symptôme inhabituel.</div></section>`;
}

function saveDaily(){
  state.settings.readiness=Math.max(1,Math.min(5,+document.getElementById("setReadiness").value||3));
  state.settings.legs=Math.max(1,Math.min(5,+document.getElementById("setLegs").value||2));
  state.settings.availableMin=+document.getElementById("setAvailable").value||60; save(); activeTab="today";render()
}
function saveGarmin(){
  state.settings.enduranceScore=+document.getElementById("gEnd").value||0;
  state.settings.vo2max=+document.getElementById("gVo2").value||0;
  state.settings.climbScore=+document.getElementById("gClimb").value||0;
  state.settings.climbEndurance=+document.getElementById("gClimbEnd").value||0;
  state.settings.climbPower=+document.getElementById("gClimbPow").value||0;save();activeTab="stats";render()
}

function chooseSession(second){
  const recs=recommendation(), primary=recs[0].code;
  const q=document.getElementById("quickDialog"), c=document.getElementById("quickDialogContent");
  c.innerHTML=`<div class="dialog-inner"><div class="dialog-head"><div><div class="small">${second?"DEUXIÈME SÉANCE":"CHOISIR UNE SÉANCE"}</div><h2 style="margin:0">${second?"Ajouter un doublé":"Toutes les séances"}</h2></div><button class="close" onclick="quickDialog.close()">×</button></div>
    ${state.sessions.map(s=>{const co=second?compat(primary,s.code):null;return `<div class="card session-card" onclick="${second?`addPlanned('${s.code}')`:`planAndOpen('${s.code}')`}"><div class="code ${s.type==="run"?"run":""}">${s.code}</div><div><strong>${esc(s.title)}</strong><p>${esc(s.goal)}</p>${co?`<span class="compat ${co.lvl}">${esc(co.txt)}</span>`:""}</div><div class="chev">›</div></div>`}).join("")}</div>`;
  q.showModal();
}
function todayKey(){return new Date().toISOString().slice(0,10)}
function addPlanned(code){const k=todayKey();state.planned[k]=state.planned[k]||[];if(!state.planned[k].includes(code))state.planned[k].push(code);save();quickDialog.close();render()}
function removePlanned(i){const k=todayKey();state.planned[k]?.splice(i,1);save();render()}
function planAndOpen(code){quickDialog.close();openSession(code)}

let workoutDraft=null, restTimer=null, restRemaining=0;
function openSession(code){
  const s=sessionBy(code); if(!s)return;
  const d=document.getElementById("sessionDialog"), c=document.getElementById("sessionDialogContent");
  workoutDraft={code,date:new Date().toISOString(),type:s.type,rpe:6,duration:s.duration,notes:"",strength:{},run:{}};
  if(s.type==="strength"){
    c.innerHTML=`<div class="dialog-inner"><div class="dialog-head"><div><div class="small">${s.code} · MUSCULATION</div><h2 style="margin:0">${esc(s.title)}</h2></div><button class="close" onclick="closeSession()">×</button></div>
      <div id="timerBox"></div><div class="notice">${esc(s.note)}</div>
      ${s.exercises.map((e,ei)=>exerciseHTML(s,e,ei)).join("")}
      <label>RPE global</label><input id="workRpe" type="number" min="1" max="10" step=".5" value="6.5">
      <label>Notes</label><textarea id="workNotes" placeholder="Sensations, douleurs, facilité, technique…"></textarea>
      <button class="primary full" style="margin-top:14px" onclick="finishStrength()">Terminer et analyser</button></div>`;
  }else{
    c.innerHTML=`<div class="dialog-inner"><div class="dialog-head"><div><div class="small">${s.code} · RUNNING</div><h2 style="margin:0">${esc(s.title)}</h2></div><button class="close" onclick="closeSession()">×</button></div>
      <div class="card soft"><h3>Plan</h3>${s.run.warmup?`<p><strong>Échauffement :</strong> ${s.run.warmup} min</p>`:""}<p><strong>Bloc :</strong> ${esc(s.run.main)}</p>${s.run.recovery?`<p><strong>Récupération :</strong> ${esc(s.run.recovery)}</p>`:""}${s.run.cooldown?`<p><strong>Retour au calme :</strong> ${esc(s.run.cooldown)}</p>`:""}<div class="small">${esc(s.note)}</div></div>
      <div class="form-grid"><div><label>Durée (min)</label><input id="runDuration" type="number" value="${s.duration}"></div><div><label>Distance (km)</label><input id="runDistance" type="number" step=".01" placeholder="ex. 8.2"></div><div><label>Allure moy. (mm:ss/km)</label><input id="runPace" placeholder="ex. 5:18"></div><div><label>FC moy. (optionnel)</label><input id="runHr" type="number"></div><div><label>D+ (m)</label><input id="runElev" type="number"></div><div><label>RPE 1–10</label><input id="runRpe" type="number" min="1" max="10" step=".5" value="${s.code==="R1"?3.5:7}"></div></div>
      <label>Notes / sensations</label><textarea id="runNotes" placeholder="Tenue d’allure, souffle, jambes, côte, descente…"></textarea>
      <button class="primary full" style="margin-top:14px" onclick="finishRun()">Enregistrer et analyser</button></div>`;
  }
  d.showModal();
}
function previousEx(code,name){
  const last=state.history.filter(h=>h.code===code&&h.strength?.[name]).sort((a,b)=>new Date(b.date)-new Date(a.date))[0];
  if(!last)return "Aucun historique";
  const sets=last.strength[name]; const vals=sets.filter(x=>x.done).map(x=>`${x.kg||0}kg×${x.reps||0}`);
  return vals.length?`Dernière fois : ${vals.join(" · ")}`:"Aucun historique";
}
function exerciseHTML(s,e,ei){
  const rows=Array.from({length:e.sets},(_,si)=>`<div class="set-grid"><strong>${si+1}</strong><input id="kg_${ei}_${si}" type="number" step=".5" placeholder="kg"><input id="reps_${ei}_${si}" placeholder="${esc(e.reps)}"><input id="rpe_${ei}_${si}" type="number" min="1" max="10" step=".5" placeholder="RPE"><button class="checkset" id="done_${ei}_${si}" onclick="toggleSet(${ei},${si},${e.rest})">✓</button></div>`).join("");
  return `<div class="exercise"><div class="ex-head"><div><div class="ex-title">${esc(e.name)}</div><div class="previous">${esc(previousEx(s.code,e.name))}</div></div><span class="badge">${e.sets}×${esc(e.reps)}</span></div><div class="small" style="margin-top:7px">Série · kg · reps · RPE · ✓</div>${rows}</div>`;
}
function toggleSet(ei,si,rest){
  const btn=document.getElementById(`done_${ei}_${si}`);btn.classList.toggle("done");
  if(btn.classList.contains("done")) startRest(rest);
}
function startRest(sec){
  clearInterval(restTimer);restRemaining=sec;paintTimer();
  restTimer=setInterval(()=>{restRemaining--;paintTimer();if(restRemaining<=0){clearInterval(restTimer);if(navigator.vibrate)navigator.vibrate([120,80,120])}},1000);
}
function paintTimer(){
  const box=document.getElementById("timerBox");if(!box)return;
  if(restRemaining<=0){box.innerHTML="";return}
  const m=Math.floor(restRemaining/60),s=restRemaining%60;
  box.innerHTML=`<div class="timerbar"><div><div class="small">RÉCUPÉRATION</div><div class="timerbig">${m}:${String(s).padStart(2,"0")}</div></div><button class="ghost" onclick="restRemaining=0;paintTimer()">Passer</button></div>`;
}
function finishStrength(){
  const s=sessionBy(workoutDraft.code), strength={};
  s.exercises.forEach((e,ei)=>{
    strength[e.name]=Array.from({length:e.sets},(_,si)=>({
      kg:+document.getElementById(`kg_${ei}_${si}`).value||0,
      reps:document.getElementById(`reps_${ei}_${si}`).value||"",
      rpe:+document.getElementById(`rpe_${ei}_${si}`).value||0,
      done:document.getElementById(`done_${ei}_${si}`).classList.contains("done")
    }))
  });
  const h={id:crypto.randomUUID?crypto.randomUUID():String(Date.now()),code:s.code,type:"strength",date:new Date().toISOString(),duration:s.duration,rpe:+document.getElementById("workRpe").value||0,notes:document.getElementById("workNotes").value,strength};
  state.history.push(h);save();closeSession();activeTab="today";render();showPostAnalysis(h)
}
function finishRun(){
  const s=sessionBy(workoutDraft.code), dist=+document.getElementById("runDistance").value||0, dur=+document.getElementById("runDuration").value||s.duration;
  let pace=paceToSec(document.getElementById("runPace").value); if(!pace&&dist)pace=dur*60/dist;
  const h={id:crypto.randomUUID?crypto.randomUUID():String(Date.now()),code:s.code,type:"run",date:new Date().toISOString(),duration:dur,rpe:+document.getElementById("runRpe").value||0,notes:document.getElementById("runNotes").value,run:{distance:dist,paceSec:pace,hr:+document.getElementById("runHr").value||0,elev:+document.getElementById("runElev").value||0}};
  state.history.push(h);save();closeSession();activeTab="today";render();showPostAnalysis(h)
}
function showPostAnalysis(h){
  const q=document.getElementById("quickDialog"), c=document.getElementById("quickDialogContent"), next=recommendation()[0];
  let msg=`Séance ${h.code} enregistrée.`;
  if(h.code==="R4"&&h.run?.paceSec){
    msg += h.run.paceSec<=305 ? " Tu es dans la zone cible : la prochaine progression devra surtout allonger les blocs." : " L’allure spécifique reste à consolider ; l’app donnera plus de poids à R3/R4.";
  } else if(h.code==="R5") msg += " Les prochains scores Garmin de montée permettront de vérifier si le travail se transfère.";
  else if(h.code==="C") msg += " On comparera tes charges/reps et le ressenti en descente avec les prochaines séances.";
  c.innerHTML=`<div class="dialog-inner"><div class="dialog-head"><h2 style="margin:0">Analyse enregistrée</h2><button class="close" onclick="quickDialog.close()">×</button></div><p>${esc(msg)}</p><div class="notice"><strong>Prochaine séance actuellement favorisée :</strong> ${esc(next.code)} · ${esc(sessionBy(next.code).title)}</div><button class="primary full" style="margin-top:12px" onclick="quickDialog.close()">OK</button></div>`;q.showModal()
}
function closeSession(){clearInterval(restTimer);document.getElementById("sessionDialog").close()}
function deleteHistory(id){if(confirm("Supprimer cette séance ?")){state.history=state.history.filter(h=>h.id!==id);save();render()}}

function editA(){
  const A=sessionBy("A"),q=document.getElementById("quickDialog"),c=document.getElementById("quickDialogContent");
  c.innerHTML=`<div class="dialog-inner"><div class="dialog-head"><h2 style="margin:0">Modifier A</h2><button class="close" onclick="quickDialog.close()">×</button></div>
  <p class="small">Un exercice par ligne : Nom | séries | reps | repos en secondes</p>
  <textarea id="aEditor" style="min-height:260px">${esc(A.exercises.map(e=>`${e.name} | ${e.sets} | ${e.reps} | ${e.rest}`).join("\n"))}</textarea>
  <button class="primary full" style="margin-top:12px" onclick="saveA()">Enregistrer A</button></div>`;q.showModal()
}
function saveA(){
  const lines=document.getElementById("aEditor").value.split("\n").map(x=>x.trim()).filter(Boolean);
  const ex=lines.map(l=>{const [name,sets,reps,rest]=l.split("|").map(x=>x.trim());return {name,sets:+sets||3,reps:reps||"8",rest:+rest||90}}).filter(x=>x.name);
  if(ex.length){sessionBy("A").exercises=ex;save()}quickDialog.close();render()
}
function exportData(){
  const blob=new Blob([JSON.stringify(state,null,2)],{type:"application/json"}),a=document.createElement("a");
  a.href=URL.createObjectURL(blob);a.download=`coach-10k-force-backup-${todayKey()}.json`;a.click();URL.revokeObjectURL(a.href)
}
function importData(file){
  if(!file)return;const r=new FileReader();r.onload=()=>{try{const x=JSON.parse(r.result);if(!x.sessions||!x.settings)throw 0;state=x;save();alert("Import réussi.");render()}catch(e){alert("Fichier non reconnu.")}};r.readAsText(file)
}
async function clearCaches(){if("caches"in window){for(const k of await caches.keys())await caches.delete(k)} if(navigator.serviceWorker?.controller)navigator.serviceWorker.controller.postMessage({type:"SKIP_WAITING"}); alert("Cache vidé. Recharge la page.");location.reload(true)}

let deferredPrompt=null;
window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferredPrompt=e;document.getElementById("installBtn").classList.remove("hidden")});
document.getElementById("installBtn").onclick=async()=>{if(deferredPrompt){deferredPrompt.prompt();await deferredPrompt.userChoice;deferredPrompt=null;document.getElementById("installBtn").classList.add("hidden")}};
if("serviceWorker" in navigator){
  window.addEventListener("load",function(){
    navigator.serviceWorker.register("./sw.js?v=2.1.0").catch(function(){});
  });
}

function boot(){
  try{
    render();
  }catch(err){
    console.error(err);
    var v=document.getElementById("view");
    if(v){
      v.innerHTML='<section class="card hero"><h2>Réparation nécessaire</h2><p>L\'application a rencontré une donnée locale incompatible.</p><button class="primary full" id="repairBtn">Réparer sans supprimer l\'historique</button><button class="ghost full" style="margin-top:8px" id="resetBtn">Réinitialiser l\'application</button><p class="small" style="margin-top:10px">Erreur : '+esc(err && err.message ? err.message : String(err))+'</p></section>';
      var repair=document.getElementById("repairBtn");
      if(repair) repair.onclick=function(){ state=normalizeState(state); save(); location.reload(); };
      var reset=document.getElementById("resetBtn");
      if(reset) reset.onclick=function(){ if(confirm("Réinitialiser les données locales de cette version ?")){localStorage.removeItem(STORE);location.reload();} };
    }
  }
}
window.addEventListener("error",function(e){
  console.error("APP ERROR",e.error||e.message);
});
boot();
