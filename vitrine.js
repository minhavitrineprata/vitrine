(function(){
const VER=((document.currentScript&&document.currentScript.src)||"").split("v=")[1]||"";
function decode(s){try{s=s.replace(/-/g,"+").replace(/_/g,"/");return JSON.parse(decodeURIComponent(escape(atob(s.split("").reverse().join("")))))}catch(e){return null}}
const qs=new URLSearchParams(location.search);
let cfg=qs.get("v")?decode(qs.get("v")):null;
let demo=false;
const PED=qs.get("pedido")?decode(qs.get("pedido")):null;
if(!cfg&&PED&&(PED.l||PED.s))cfg=Object.assign({m:0,w:""},PED.l?{l:PED.l}:{},PED.s?{s:PED.s}:{});
if(!cfg&&qs.get("l"))cfg={l:qs.get("l"),m:(window.LOJAS[qs.get("l")]||{}).m||100,d:(window.LOJAS[qs.get("l")]||{}).d||0,w:""};
if(!cfg&&!location.search&&window.DEMO){cfg=Object.assign({},window.DEMO);demo=true}
const hex=v=>/^#[0-9a-fA-F]{3,8}$/.test(v||"")?v:null;
const loja=cfg&&(cfg.s&&typeof cfg.s==="object"?{nome:String(cfg.s.n||"Catálogo").slice(0,60),logo:/^https:\/\//.test(cfg.s.lg||"")?cfg.s.lg:"",cor:hex(cfg.s.c)||"#FFFFFF",texto:hex(cfg.s.t)||"#1E1A21",botao:hex(cfg.s.b)||"#1E1A21",botaoTexto:hex(cfg.s.bt)||"#FFFFFF",h:cfg.s.h,p:cfg.s.p,e:cfg.s.e}:window.LOJAS[cfg.l]);
if(cfg&&!loja&&!window.__lojasRetry){window.__lojasRetry=1;const sc=document.createElement("script");sc.src="lojas.js?t="+Date.now();sc.onload=()=>{const s2=document.createElement("script");s2.src="vitrine.js?t="+Date.now();document.body.appendChild(s2)};sc.onerror=()=>{window.__lojasRetry=2};document.body.appendChild(sc);return}
if(!cfg||!loja||!(cfg.m>=0)){document.getElementById("main").hidden=true;document.querySelector("header").hidden=true;document.getElementById("bad").hidden=false;return}

let MC=(cfg.mc&&typeof cfg.mc==="object")?Object.fromEntries(Object.entries(cfg.mc).filter(([k,v])=>typeof k==="string"&&isFinite(+v)).map(([k,v])=>[k,Math.min(1000,Math.max(0,+v))])):{};
let disc=Math.min(80,Math.max(0,+cfg.d||0)),margin=Math.min(1000,Math.max(0,+cfg.m)),WA=String(cfg.w||loja.wa||"").replace(/\D/g,"");
const enc=o=>btoa(unescape(encodeURIComponent(JSON.stringify(o)))).split("").reverse().join("").replace(/\+/g,"-").replace(/\//g,"_").replace(/=+/g,"");
let painel=false,asCli=false;
const R=document.documentElement.style;
R.setProperty("--hdr",loja.cor);R.setProperty("--hdr-ink",loja.texto);R.setProperty("--btn",loja.botao);R.setProperty("--btn-ink",loja.botaoTexto);
document.title=loja.nome;
if(loja.e){const hs=document.querySelector(".hero");if(hs){const eb=document.createElement("span");eb.className="eyebrow";eb.textContent=String(loja.e).slice(0,40);hs.prepend(eb)}}
if(loja.h||loja.p){const hs=document.querySelector(".hero");if(hs){if(loja.h)hs.querySelector("h2").textContent=String(loja.h).slice(0,90);if(loja.p)hs.querySelector("p").textContent=String(loja.p).slice(0,200)}}
const lg=document.getElementById("logo");if(loja.logo){lg.src=loja.logo;lg.alt=loja.nome}else{lg.hidden=true;const nm=document.getElementById("nome");nm.textContent=loja.nome;nm.hidden=false}
document.getElementById("foottxt").textContent=loja.nome+" · pedidos pelo WhatsApp";

const P=window.P;P.forEach((p,i)=>{p.id=i;p.sel=0;p.size=""});
const cats=["Todos",...new Set(P.map(p=>p.cat))];
let cat="Todos",q="",shown=48,cart={},LASTMSG="",LASTNUM="",aro="",LASTSIG="",PEDID="",LASTREG=null,SENT="";
const API=window.API||"",KEY=qs.get("k")||"";
function registrar(){if(!API||!cfg.l||!LASTREG||SENT===LASTREG.id)return;SENT=LASTREG.id;const b=JSON.stringify(LASTREG);try{if(navigator.sendBeacon&&navigator.sendBeacon(API,new Blob([b],{type:"text/plain"})))return}catch(e){}try{fetch(API,{method:"POST",body:b,mode:"no-cors",keepalive:true})}catch(e){}}
const AROS=[...new Set(P.filter(p=>p.cat==="Anéis").flatMap(p=>p.colors.flatMap(c=>c.ot?[]:c.sizes)))].filter(x=>/^\d+$/.test(x)).sort((a,b)=>a-b);
const IMG={},LOADING={};
const brl=v=>v.toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
const r2=v=>Math.round(v*100)/100;
const mg=cat=>(cat&&MC[cat]!=null)?MC[cat]:margin;
const full=(b,cat)=>{const m=mg(cat);return m===0?r2(b):Math.ceil(b*(1+m/100))-0.1};
const price=(b,cat)=>disc?(mg(cat)===0?r2(b*(1-disc/100)):Math.max(0.9,Math.ceil(full(b,cat)*(1-disc/100))-0.1)):full(b,cat);
const norm=s=>s.normalize("NFD").replace(/[̀-ͯ]/g,"").toLowerCase();
P.forEach(p=>p.s=norm(p.name+" "+p.colors.map(c=>c.c).join(" ")));
const fmtWA=w=>{w=w.replace(/^55(?=\d{10,11}$)/,"");return w.length>=10?`(${w.slice(0,2)}) ${w.slice(2,w.length-4)}-${w.slice(-4)}`:w};
const vl=s=>{s=String(s||"");return s==="?"?"Aro: não tenho certeza":(/^\d+$/.test(s)?"Aro "+s.replace(/^0/,""):s)};
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));

function loadChunk(n){if(LOADING[n])return;LOADING[n]=1;fetch("img/c"+n+".json?v="+VER).then(r=>r.json()).then(d=>{Object.assign(IMG,d);document.querySelectorAll("img[data-k]").forEach(fill)}).catch(()=>{LOADING[n]=0})}
function fill(im){const k=im.dataset.k;if(IMG[k]&&im.getAttribute("src")!==IMG[k]){im.onload=()=>im.classList.add("ok");im.src=IMG[k]}}
function list(){const nq=norm(q.trim());return P.filter(p=>{
  if(!(cat==="Todos"||p.cat===cat))return false;
  if(nq&&!nq.split(/\s+/).every(w=>p.s.includes(w)))return false;
  if(aro){if(p.cat!=="Anéis")return false;const j=p.colors.findIndex(c=>c.sizes.includes(aro));if(j<0)return false;if(!p.colors[p.sel].sizes.includes(aro)){p.sel=j}if(!p.size||p.size==="?")p.size=aro}
  return true})}
function card(p){
  const c=p.colors[p.sel];
  const col=p.colors.length>1?`<div class="colors">${p.colors.map((x,j)=>`<button class="cbtn" data-p="${p.id}" data-c="${j}" aria-pressed="${j===p.sel}">${esc(x.c||"Padrão")}</button>`).join("")}</div>`:(c.c?`<span class="one">Cor: ${esc(c.c)}</span>`:"");
  const sz=c.sizes.length?`<select class="sz" id="sz${p.id}" data-ps="${p.id}" aria-label="${c.ot?"Escolha a letra":"Tamanho do aro"}"><option value="">${c.ot?"Escolha a letra":"Tamanho do aro"}</option>${c.sizes.map(s=>`<option value="${s}" ${s===p.size?"selected":""}>${c.ot?s:s}</option>`).join("")}${c.ot?"":`<option value="?" ${p.size==="?"?"selected":""}>Não tenho certeza</option>`}</select>`:"";
  return `<article class="card" id="card${p.id}"><div class="ph"><img data-k="${c.k}" alt="${esc(p.name)}"></div><div class="info"><h3>${esc(p.name)}</h3>${col}${disc?`<span class="old">De ${brl(full(c.price,p.cat))}</span>`:""}<span class="price">${disc?"Por ":""}${brl(price(c.price,p.cat))}${disc?`<span class="off">-${disc}%</span>`:""}</span>${painel&&!asCli?`<span class="cost">Você paga ${brl(c.price)} · lucro <em class="${price(c.price,p.cat)-c.price<=0?"neg":""}">${brl(price(c.price,p.cat)-c.price)}</em></span>`:""}${sz}<button class="add" data-id="${p.id}">Adicionar</button></div></article>`;
}
function hook(root){root.querySelectorAll("img[data-k]").forEach(im=>{fill(im);const p=P[+im.closest(".card").id.slice(4)];loadChunk(p.colors[p.sel].ch)})}
function renderGrid(){const L=list(),g=document.getElementById("grid");g.innerHTML=L.slice(0,shown).map(card).join("");hook(g);document.getElementById("more").hidden=L.length<=shown;document.getElementById("found").textContent=L.length+" peças"}
function rerender(p){const el=document.getElementById("card"+p.id);if(!el)return;const t=document.createElement("div");t.innerHTML=card(p);el.replaceWith(t.firstChild);hook(document.getElementById("card"+p.id))}
function renderFilters(){document.getElementById("filters").innerHTML=cats.map(c=>`<button class="chip" aria-pressed="${c===cat}" data-cat="${c}">${c}</button>`).join("");
  const w=document.getElementById("arowrap");if(w)w.hidden=!AROS.length||(cat!=="Todos"&&cat!=="Anéis")}
function renderCart(){
  const ids=Object.keys(cart),el=document.getElementById("items"),ft=document.getElementById("foot");
  document.getElementById("cnt").textContent=Object.values(cart).reduce((a,b)=>a+b,0);
  if(!ids.length){el.innerHTML='<p class="empty">Sua sacola está vazia.</p>';ft.innerHTML="";return}
  let tot=0;const lines=[],its=[],reg=[];
  el.innerHTML=ids.map(key=>{const [pid,ci,sz]=key.split("|"),p=P[pid],c=p.colors[ci],n=cart[key],un=price(c.price,p.cat),t=un*n;tot+=t;
    const det=[c.c?"Cor "+c.c:"",sz?vl(sz):""].filter(Boolean).join(" · ");
    lines.push(`${n}x ${p.name}${det?" · "+det:""} (REF ${p.ref}) ${brl(t)}`);its.push([p.ref,c.c,sz||"",n,Math.round(un*100)]);reg.push([p.ref,p.name,c.c,sz==="?"?"?":(sz||""),n,un,c.price]);
    return `<div class="row"><img class="th" data-k="${c.k}" alt=""><span class="n">${esc(p.name)}<small>${esc(det)}${det?" · ":""}${brl(un)} cada</small></span><span class="t">${brl(t)}</span><div class="qty"><button data-dec="${key}" aria-label="Diminuir">−</button>${n}<button data-inc="${key}" aria-label="Aumentar">+</button></div></div>`}).join("");
  el.querySelectorAll("img[data-k]").forEach(im=>{fill(im);im.classList.add("ok")});
  const purl=location.href.split("?")[0].split("#")[0]+"?pedido="+enc(Object.assign(cfg.s?{s:cfg.s}:{l:cfg.l},{i:its}));
  const sig=JSON.stringify(reg);if(sig!==LASTSIG){LASTSIG=sig;PEDID=(Date.now().toString(36).slice(-5)+Math.random().toString(36).slice(2,5)).toUpperCase()}
  LASTREG={a:"pedido",l:cfg.l,id:PEDID,itens:reg,total:Math.round(tot*100)/100};
  const msg=`Olá, ${loja.nome}! Quero fazer este pedido (nº ${PEDID}):\n\n${lines.join("\n")}\n\nTotal: ${brl(tot)}\n\nVer pedido com fotos: ${purl}`;
  const num=WA.length<=11?"55"+WA:WA;
  const mob=/Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
  const href=mob?`https://wa.me/${num}?text=${encodeURIComponent(msg)}`:`https://web.whatsapp.com/send?phone=${num}&text=${encodeURIComponent(msg)}`;
  LASTMSG=msg;LASTNUM=num;
  ft.innerHTML=`<div class="total"><span>Total</span><span>${brl(tot)}</span></div>${WA.length>=10?`<a class="wa" id="finish" target="_blank" rel="noopener" href="${href}">Finalizar pelo WhatsApp</a>`:`<p class="tip" style="color:var(--sold)">WhatsApp da loja não configurado. Copie o pedido e envie para a vendedora.</p>`}<p class="tip" id="tip" hidden>Pedido copiado. Se a mensagem não aparecer no WhatsApp, é só colar na conversa.</p><button class="copyp" id="copyp">Copiar pedido</button>${WA?`<p class="waNum">WhatsApp: ${fmtWA(WA)}</p>`:""}`;
}
document.addEventListener("click",e=>{
  const fin=e.target.closest("#finish");
  if(fin){
    registrar();
    try{navigator.clipboard.writeText(LASTMSG).catch(()=>{})}catch(err){}
    const tip=document.getElementById("tip");if(tip)tip.hidden=false;
    if(/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)){
      e.preventDefault();
      const txt=encodeURIComponent(LASTMSG);
      let left=false;const onHide=()=>{left=true};document.addEventListener("visibilitychange",onHide,{once:true});
      location.href=`whatsapp://send?phone=${LASTNUM}&text=${txt}`;
      setTimeout(()=>{if(!left&&!document.hidden)location.href=`https://api.whatsapp.com/send?phone=${LASTNUM}&text=${txt}`},1800);
    }
    return;
  }
  const t=e.target.closest("button")||e.target;
  if(t.dataset.cat){cat=t.dataset.cat;if(aro&&cat!=="Anéis"&&cat!=="Todos"){P.forEach(p=>{if(p.size===aro)p.size=""});aro="";const as=document.getElementById("aro");if(as)as.value=""}shown=48;renderFilters();renderGrid()}
  else if(t.dataset.c!==undefined&&t.dataset.p!==undefined){const p=P[t.dataset.p];p.sel=+t.dataset.c;p.size="";rerender(p)}
  else if(t.classList.contains("add")&&t.dataset.id!=null){
    const p=P[t.dataset.id],c=p.colors[p.sel];
    if(c.sizes.length&&!p.size){const s=document.getElementById("sz"+p.id);s.focus();s.classList.add("need");t.textContent=c.ot?"Escolha a letra":"Escolha o tamanho";setTimeout(()=>{t.textContent="Adicionar";s.classList.remove("need")},1500);return}
    const key=p.id+"|"+p.sel+"|"+(c.sizes.length?p.size:"");cart[key]=(cart[key]||0)+1;renderCart();t.textContent="Adicionado ✓";setTimeout(()=>t.textContent="Adicionar",900)}
  else if(t.dataset.inc){cart[t.dataset.inc]++;renderCart()}
  else if(t.dataset.dec){if(--cart[t.dataset.dec]<=0)delete cart[t.dataset.dec];renderCart()}
  else if(t.id==="more"){shown+=48;renderGrid()}
  else if(t.id==="copyp"){registrar();const done=()=>{t.textContent="Pedido copiado ✓ Cole no WhatsApp";setTimeout(()=>t.textContent="Copiar pedido",2500)};try{navigator.clipboard.writeText(LASTMSG).then(done,()=>{prompt("Copie o pedido:",LASTMSG)})}catch(e){prompt("Copie o pedido:",LASTMSG)}}
  else if(t.id==="asCli"){asCli=true;applyPanel()}
  else if(t.id==="back"){asCli=false;applyPanel()}
  else if(t.id==="copy"){copyLink(t)}
  else if(t.id==="open"){document.getElementById("drawer").hidden=false}
  else if(t.id==="close"||e.target.id==="drawer"){document.getElementById("drawer").hidden=true}
});
document.addEventListener("change",e=>{if(e.target.dataset.ps!==undefined)P[e.target.dataset.ps].size=e.target.value});
(function(){const sel=document.getElementById("aro");if(!sel)return;sel.innerHTML='<option value="">Todos os tamanhos</option>'+AROS.map(a=>`<option value="${a}">Aro ${a}</option>`).join("");
  sel.addEventListener("change",()=>{const prev=aro;aro=sel.value;if(aro){cat="Anéis";P.forEach(p=>{if(p.cat==="Anéis"&&(p.size===prev||!p.size))p.size=""})}else{P.forEach(p=>{if(p.size===prev)p.size=""})}shown=48;renderFilters();renderGrid()})})();
let qt;document.getElementById("q").addEventListener("input",e=>{clearTimeout(qt);qt=setTimeout(()=>{q=e.target.value;shown=48;renderGrid()},200)});
function clientLink(){const base=location.href.split("?")[0].split("#")[0];return base+"?v="+enc(Object.assign({l:cfg.l,m:margin,w:WA?(WA.length<=11?"55"+WA:WA):""},disc?{d:disc}:{},Object.keys(MC).length?{mc:MC}:{}))}
function updLink(){document.getElementById("mylink").textContent=demo?"(o link aparece aqui quando o site estiver no ar)":clientLink()}
function copyLink(b){const t=document.getElementById("mylink").textContent;const sel=()=>{const r=document.createRange();r.selectNodeContents(document.getElementById("mylink"));const s=getSelection();s.removeAllRanges();s.addRange(r);b.textContent="Link selecionado: copie"};
  try{navigator.clipboard.writeText(t).then(()=>{b.textContent="Copiado ✓";setTimeout(()=>b.textContent="Copiar link",1500)},sel)}catch(e){sel()}}
function applyPanel(){document.getElementById("pbar").hidden=!painel||asCli;document.getElementById("back").hidden=!(painel&&asCli);renderGrid();renderCart()}
function initPanel(){
  painel=demo||location.hash==="#painel";
  if(!painel){applyPanel();return}
  const m=document.getElementById("m");m.value=margin;document.getElementById("mv").textContent="+"+margin+"%";
  document.getElementById("wa").value=WA?fmtWA(WA):"";
  const dd=document.getElementById("d");dd.value=disc;document.getElementById("dv").textContent=disc?"-"+disc+"%":"sem desconto";
  dd.addEventListener("input",()=>{disc=+dd.value;document.getElementById("dv").textContent=disc?"-"+disc+"%":"sem desconto";updLink();renderGrid();renderCart()});
  m.addEventListener("input",()=>{margin=+m.value;document.getElementById("mv").textContent="+"+margin+"%";renderMC();updLink();renderGrid();renderCart()});
  const mcb=document.getElementById("mcbox");
  function renderMC(){if(!mcb)return;mcb.innerHTML=cats.filter(c=>c!=="Todos").map(c=>{const on=MC[c]!=null,v=on?MC[c]:margin;
    return `<div class="mcrow"><label class="mcchk"><input type="checkbox" data-mcon="${esc(c)}" ${on?"checked":""}> ${esc(c)}</label><input type="range" min="50" max="500" step="10" value="${v}" data-mc="${esc(c)}" ${on?"":"disabled"} aria-label="Margem de ${esc(c)}"><span class="mcv">${on?"+"+v+"%":"igual à geral"}</span></div>`}).join("")}
  if(mcb){renderMC();
    mcb.addEventListener("input",e=>{const c=e.target.dataset.mc;if(c==null)return;MC[c]=+e.target.value;e.target.nextElementSibling.textContent="+"+MC[c]+"%";updLink();renderGrid();renderCart()});
    mcb.addEventListener("change",e=>{const c=e.target.dataset.mcon;if(c==null)return;if(e.target.checked)MC[c]=margin;else delete MC[c];renderMC();updLink();renderGrid();renderCart()})}
  document.getElementById("wa").addEventListener("input",e=>{WA=e.target.value.replace(/\D/g,"");updLink();renderCart()});
  updLink();applyPanel();
  const mp=document.getElementById("mypeds");if(mp)mp.hidden=!(API&&KEY&&cfg.l);
}
addEventListener("hashchange",()=>{if(location.hash==="#painel"&&!painel)initPanel()});
/* ---- Meus pedidos (painel da revendedora) ---- */
let PEDS=null,PEDERR="";
const KAU_WA=window.KAU_WA||"";
const fmtD=iso=>{const d=new Date(iso);return d.toLocaleDateString("pt-BR",{day:"2-digit",month:"2-digit"})+" "+d.toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"})};
function thumbFor(ref,cor){const p=P.find(x=>x.ref===ref);if(!p)return null;const c=p.colors.find(c=>c.c===cor)||p.colors[0];loadChunk(c.ch);return c.k}
function post(o){return fetch(API,{method:"POST",body:JSON.stringify(Object.assign({l:cfg.l,k:KEY},o))}).then(r=>r.json()).catch(()=>({ok:false}))}
function loadPeds(){
  PEDERR="";renderPeds(true);
  fetch(API+"?a=list&l="+encodeURIComponent(cfg.l)+"&k="+encodeURIComponent(KEY)).then(r=>r.json()).then(d=>{
    if(!d.ok){PEDERR=d.erro==="chave"?"Este painel não tem permissão para ver pedidos. Peça o link do painel novamente.":"Não foi possível carregar os pedidos.";PEDS=[]}
    else PEDS=d.pedidos;renderPeds()}).catch(()=>{PEDERR="Sem conexão. Tente de novo em instantes.";PEDS=PEDS||[];renderPeds()});
}
const LKK="kau_ult_"+(cfg.l||"");
function lastKau(){try{return localStorage.getItem(LKK)||""}catch(e){return ""}}
function openKau(txt){try{navigator.clipboard.writeText(txt).catch(()=>{})}catch(err){}const t=encodeURIComponent(txt);
  if(/Android|iPhone|iPad|iPod/i.test(navigator.userAgent))location.href=`https://wa.me/${KAU_WA}?text=${t}`;
  else{const a=document.createElement("a");a.href=`https://web.whatsapp.com/send?phone=${KAU_WA}&text=${t}`;a.target="_blank";a.rel="noopener";document.body.appendChild(a);a.click();a.remove()}}
function kauItems(){const out=[];(PEDS||[]).forEach(o=>{if(o.status==="Cancelado")return;o.itens.forEach(it=>{if(it.destino==="Encomendar")out.push(Object.assign({pid:o.id},it))})});return out}
function kauMsg(list){
  const g={};list.forEach(it=>{const k=it.ref+"|"+it.cor;(g[k]=g[k]||{ref:it.ref,nome:it.nome,cor:it.cor,aros:{},qtd:0,val:0}).qtd+=it.qtd;g[k].val+=it.qtd*it.atacado;if(it.aro){const a=it.aro==="?"?"a confirmar":String(it.aro).replace(/^0/,"");g[k].aros[a]=(g[k].aros[a]||0)+it.qtd}});
  let tot=0;const lines=Object.values(g).map(x=>{tot+=x.val;const aj=/alta joalheria/i.test(x.nome)?" ALTA JOALHERIA":"";
    const ar=Object.keys(x.aros).length?" "+Object.entries(x.aros).sort((a,b)=>(+a[0]||99)-(+b[0]||99)).map(([a,q])=>q+":"+a).join("/ "):"";
    return `${x.ref}${aj}${x.cor?" "+x.cor:""}${ar} (${x.qtd} pç) ${brl(x.val)}\n${x.nome}`});
  const ids=[...new Set(list.map(i=>i.pid))];
  return {tot,ids,txt:`Pedido de atacado: ${loja.nome}\n\n${lines.join("\n\n")}\n\nTotal atacado: ${brl(tot)}\nPedidos das clientes: ${ids.map(i=>"nº "+i).join(", ")}`};
}
/* ---- Pedido manual ---- */
let MAN=[],MSEL=null;
function manResults(){
  const box=document.getElementById("manres");if(!box)return;
  const q=norm((document.getElementById("manq").value||"").trim());
  if(q.length<2){box.innerHTML='<p class="kb-msg">Digite pelo menos 2 letras do nome, cor ou código da peça.</p>';return}
  const L=P.filter(p=>q.split(/\s+/).every(w=>(p.s+" "+norm(p.ref)).includes(w))).slice(0,12);
  if(!L.length){box.innerHTML='<p class="kb-msg">Nenhuma peça encontrada.</p>';return}
  box.innerHTML=L.map(p=>{const c=p.colors[0];loadChunk(c.ch);return `<button class="mres" data-mp="${p.id}"><img class="th" data-k="${c.k}" alt=""><span><b>${esc(p.name)}</b><small>REF ${esc(p.ref)} · ${brl(price(c.price,p.cat))}</small></span></button>`}).join("");
  box.querySelectorAll("img[data-k]").forEach(im=>{fill(im);im.classList.add("ok")});
}
function manSel(){
  const box=document.getElementById("mansel");if(!box)return;
  if(!MSEL){box.innerHTML="";return}
  const p=P[MSEL.pid],c=p.colors[MSEL.ci];
  box.innerHTML=`<div class="mpick"><b>${esc(p.name)}</b><small>REF ${esc(p.ref)}</small>
    ${p.colors.length>1?`<label>Cor <select id="mancor">${p.colors.map((x,j)=>`<option value="${j}" ${j===MSEL.ci?"selected":""}>${esc(x.c||"Padrão")}</option>`).join("")}</select></label>`:(c.c?`<small>Cor: ${esc(c.c)}</small>`:"")}
    ${c.sizes.length?`<label>${c.ot?"Letra":"Aro"} <select id="manaro"><option value="">Escolha</option>${c.sizes.map(s=>`<option ${s===MSEL.aro?"selected":""}>${s}</option>`).join("")}${c.ot?"":`<option value="?" ${MSEL.aro==="?"?"selected":""}>Não tenho certeza</option>`}</select></label>`:""}
    <label>Qtd <input id="manqtd" type="number" min="1" max="99" value="${MSEL.qtd}"></label>
    <span class="mpr">${brl(price(c.price,p.cat))} cada</span>
    <button class="add" id="manadd">Adicionar ao pedido</button></div>`;
}
function manDraft(){
  const box=document.getElementById("mandraft");if(!box)return;
  if(!MAN.length){box.innerHTML="";document.getElementById("mansave").hidden=true;return}
  let tot=0;box.innerHTML=MAN.map((it,i)=>{tot+=it[5]*it[4];return `<div class="mdr"><span>${it[4]}x ${esc(it[1])}<small>${esc([it[2]?"Cor "+it[2]:"",it[3]?vl(it[3]):""].filter(Boolean).join(" · "))}</small></span><span>${brl(it[5]*it[4])}</span><button class="x" data-mdel="${i}" aria-label="Remover">×</button></div>`}).join("")+`<div class="total"><span>Total</span><span>${brl(tot)}</span></div>`;
  document.getElementById("mansave").hidden=false;
}
document.addEventListener("input",e=>{if(e.target.id==="manq"){clearTimeout(window.__mq);window.__mq=setTimeout(manResults,200)}});
document.addEventListener("change",e=>{
  if(e.target.id==="mancor"&&MSEL){MSEL.ci=+e.target.value;MSEL.aro="";manSel()}
  else if(e.target.id==="manaro"&&MSEL){MSEL.aro=e.target.value}
  else if(e.target.id==="manqtd"&&MSEL){MSEL.qtd=Math.max(1,Math.min(99,+e.target.value||1))}
});
document.addEventListener("click",e=>{
  const t=e.target.closest("button");if(!t)return;
  if(t.id==="manopen"){const f=document.getElementById("manform");f.hidden=!f.hidden;if(!f.hidden){document.getElementById("manq").focus();manResults()}}
  else if(t.dataset.mp!=null){MSEL={pid:+t.dataset.mp,ci:0,aro:"",qtd:1};manSel()}
  else if(t.id==="manadd"&&MSEL){
    const p=P[MSEL.pid],c=p.colors[MSEL.ci];const q=document.getElementById("manqtd");if(q)MSEL.qtd=Math.max(1,Math.min(99,+q.value||1));
    if(c.sizes.length&&!MSEL.aro){const s=document.getElementById("manaro");if(s){s.focus();s.classList.add("need");setTimeout(()=>s.classList.remove("need"),1500)}return}
    MAN.push([p.ref,p.name,c.c,c.sizes.length?MSEL.aro:"",MSEL.qtd,price(c.price,p.cat),c.price]);MSEL=null;manSel();manDraft()}
  else if(t.dataset.mdel!=null){MAN.splice(+t.dataset.mdel,1);manDraft()}
  else if(t.id==="mansave"&&MAN.length){
    t.disabled=true;t.textContent="Salvando…";
    const id=("M"+Date.now().toString(36).slice(-5)+Math.random().toString(36).slice(2,4)).toUpperCase();
    const tot=Math.round(MAN.reduce((a,i)=>a+i[5]*i[4],0)*100)/100;
    post({a:"pedido",id,itens:MAN,total:tot}).then(r=>{t.disabled=false;t.textContent="Salvar pedido";
      if(r&&r.ok){MAN=[];manDraft();document.getElementById("manq").value="";manResults();document.getElementById("manform").hidden=true;loadPeds()}
      else{t.textContent="Não salvou. Tente de novo"}})}
});
function renderPeds(loading){
  const v=document.getElementById("pedview");if(!v||v.hidden)return;
  const box=document.getElementById("pedlist"),kb=document.getElementById("kaubar");
  if(loading&&!PEDS){box.innerHTML='<p class="empty">Carregando pedidos…</p>';kb.innerHTML="";return}
  const ks=kauItems(),km=kauMsg(ks),MIN=700,falta=Math.max(0,MIN-km.tot),pct=Math.min(100,km.tot/MIN*100);
  kb.innerHTML=ks.length?`<div class="kb-top"><strong>Pedido para a Kau</strong><span>${ks.reduce((a,i)=>a+i.qtd,0)} peças · ${brl(km.tot)}</span></div>
    <div class="kb-bar"><span style="width:${pct}%"></span></div>
    <p class="kb-msg">${falta?`Faltam <b>${brl(falta)}</b> para o pedido mínimo de R$700.`:"Pedido mínimo atingido."}</p>
    <details><summary>Ver itens</summary><pre class="kb-pre">${esc(km.txt)}</pre></details>
    <button class="add kb-send" id="kausend" ${KAU_WA?"":"disabled"}>Enviar pedido para a Kau pelo WhatsApp</button>`
    :`<p class="kb-msg">Marque <b>Encomendar</b> nas peças que você não tem. Elas se juntam aqui num pedido só para a Kau.</p>`;
  if(lastKau())kb.innerHTML+=`<p class="kb-msg">O WhatsApp abre com o pedido escrito: toque em <b>enviar</b> para ele chegar na Kau.</p><button class="pbtn" id="kauagain">Reenviar último pedido para a Kau</button>`;
  if(PEDERR){box.innerHTML=`<p class="empty">${esc(PEDERR)}</p>`;return}
  if(!PEDS.length){box.innerHTML='<p class="empty">Nenhum pedido ainda. Quando uma cliente finalizar pela sua vitrine, o pedido aparece aqui.</p>';return}
  const ST=["Novo","Confirmado","Pago","Entregue","Cancelado"];
  box.innerHTML=PEDS.map(o=>`<article class="pcard${o.status==="Cancelado"?" canc":""}"><header><div><strong>Pedido nº ${esc(o.id)}</strong><small>${fmtD(o.data)} · ${brl(o.total)}</small></div>
    <select class="pst" data-pid="${esc(o.id)}" aria-label="Status do pedido">${ST.map(s=>`<option ${s===o.status?"selected":""}>${s}</option>`).join("")}</select></header>
    ${o.itens.map(it=>{const k=thumbFor(it.ref,it.cor);const sent=it.destino==="Enviado à Kau";
      return `<div class="pit">${k?`<img class="th ok" data-k="${k}" alt="">`:'<div class="th"></div>'}<div class="pin"><span>${it.qtd}x ${esc(it.nome)}</span><small>${esc([it.cor?"Cor "+it.cor:"",it.aro?vl(it.aro):""].filter(Boolean).join(" · "))}</small>
      ${sent?`<em class="sentk">Enviado à Kau ✓</em>`:`<div class="seg2"><button data-ln="${it.linha}" data-dest="Tenho" aria-pressed="${it.destino==="Tenho"}">Tenho</button><button data-ln="${it.linha}" data-dest="Encomendar" aria-pressed="${it.destino==="Encomendar"}">Encomendar</button></div>`}</div></div>`}).join("")}</article>`).join("");
  box.querySelectorAll("img[data-k]").forEach(fill);
}
document.addEventListener("click",e=>{
  const t=e.target.closest("button");if(!t)return;
  if(t.id==="mypeds"){document.getElementById("pedview").hidden=false;loadPeds()}
  else if(t.id==="pedclose"){document.getElementById("pedview").hidden=true}
  else if(t.id==="pedreload"){loadPeds()}
  else if(t.dataset.ln&&t.dataset.dest){
    const ln=+t.dataset.ln;let it=null;(PEDS||[]).forEach(o=>o.itens.forEach(x=>{if(x.linha===ln)it=x}));if(!it)return;
    const novo=it.destino===t.dataset.dest?"Pendente":t.dataset.dest;it.destino=novo;renderPeds();post({a:"destino",mud:[[ln,novo]]})}
  else if(t.id==="kausend"){
    const ks=kauItems();if(!ks.length||!KAU_WA)return;const km=kauMsg(ks);
    if(km.tot<700&&!t.dataset.ok){t.dataset.ok=1;t.textContent=`Abaixo de R$700. Toque de novo para enviar mesmo assim`;return}
    const txt=encodeURIComponent(km.txt);
    post({a:"kau",linhas:ks.map(i=>i.linha),texto:km.txt,total:Math.round(km.tot*100)/100,ids:km.ids.join(", ")});
    ks.forEach(i=>{PEDS.forEach(o=>o.itens.forEach(x=>{if(x.linha===i.linha){x.destino="Enviado à Kau";x.enviado=new Date().toISOString()}}))});renderPeds();
    try{localStorage.setItem(LKK,km.txt)}catch(err){}renderPeds();
    openKau(km.txt);
  }
  else if(t.id==="kauagain"){const m=lastKau();if(m&&KAU_WA)openKau(m)}
});
document.addEventListener("change",e=>{if(e.target.classList.contains("pst")){const o=(PEDS||[]).find(x=>x.id===e.target.dataset.pid);if(o){o.status=e.target.value;renderPeds()}post({a:"status",id:e.target.dataset.pid,status:e.target.value})}});

function renderOrder(){
  document.getElementById("open").hidden=true;
  const its=Array.isArray(PED.i)?PED.i:[];let tot=0;
  const rows=its.map(([ref,cn,sz,n,cents])=>{
    const p=P.find(x=>x.ref===ref&&x.colors.some(c=>c.c===cn))||P.find(x=>x.ref===ref);
    const c=p?(p.colors.find(c=>c.c===cn)||p.colors[0]):null;
    const un=(+cents||0)/100,t=un*(+n||0);tot+=t;
    const det=[cn?"Cor "+cn:"",sz?vl(sz):""].filter(Boolean).join(" · ");
    if(c)loadChunk(c.ch);
    return `<div class="orow">${c?`<img class="oth" data-k="${c.k}" alt="">`:`<div class="oth none">Sem foto</div>`}<div class="oinfo"><strong>${esc(p?p.name:"Peça "+ref)}</strong><small>REF ${esc(ref)}${det?" · "+esc(det):""}</small><small>${n}x ${brl(un)}</small></div><span class="ot">${brl(t)}</span></div>`}).join("");
  document.getElementById("main").innerHTML=`<section class="hero"><h2>Pedido</h2><p>${its.length} ${its.length===1?"item":"itens"} · conferência com fotos</p></section><div class="olist">${rows||'<p class="empty">Pedido vazio.</p>'}</div><div class="total ototal"><span>Total</span><span>${brl(tot)}</span></div><button class="pdfb" id="pdfb">Salvar em PDF / Imprimir</button>`;
  document.getElementById("pdfb").addEventListener("click",()=>window.print());
  document.querySelectorAll("img[data-k]").forEach(im=>{fill(im);im.classList.add("ok")});
}
if(PED){document.getElementById("pbar").hidden=true;renderOrder();return}
renderFilters();initPanel();renderGrid();renderCart();
})();
