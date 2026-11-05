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
const loja=cfg&&(cfg.s&&typeof cfg.s==="object"?{nome:String(cfg.s.n||"Catálogo").slice(0,60),logo:/^https:\/\//.test(cfg.s.lg||"")?cfg.s.lg:"",cor:hex(cfg.s.c)||"#FFFFFF",texto:hex(cfg.s.t)||"#1E1A21",botao:hex(cfg.s.b)||"#1E1A21",botaoTexto:hex(cfg.s.bt)||"#FFFFFF",h:cfg.s.h,p:cfg.s.p}:window.LOJAS[cfg.l]);
if(cfg&&!loja&&!window.__lojasRetry){window.__lojasRetry=1;const sc=document.createElement("script");sc.src="lojas.js?t="+Date.now();sc.onload=()=>{const s2=document.createElement("script");s2.src="vitrine.js?t="+Date.now();document.body.appendChild(s2)};sc.onerror=()=>{window.__lojasRetry=2};document.body.appendChild(sc);return}
if(!cfg||!loja||!(cfg.m>=0)){document.getElementById("main").hidden=true;document.querySelector("header").hidden=true;document.getElementById("bad").hidden=false;return}

let disc=Math.min(80,Math.max(0,+cfg.d||0)),margin=Math.min(1000,Math.max(0,+cfg.m)),WA=String(cfg.w||loja.wa||"").replace(/\D/g,"");
const enc=o=>btoa(unescape(encodeURIComponent(JSON.stringify(o)))).split("").reverse().join("").replace(/\+/g,"-").replace(/\//g,"_").replace(/=+/g,"");
let painel=false,asCli=false;
const R=document.documentElement.style;
R.setProperty("--hdr",loja.cor);R.setProperty("--hdr-ink",loja.texto);R.setProperty("--btn",loja.botao);R.setProperty("--btn-ink",loja.botaoTexto);
document.title=loja.nome;
if(loja.h||loja.p){const hs=document.querySelector(".hero");if(hs){if(loja.h)hs.querySelector("h2").textContent=String(loja.h).slice(0,90);if(loja.p)hs.querySelector("p").textContent=String(loja.p).slice(0,200)}}
const lg=document.getElementById("logo");if(loja.logo){lg.src=loja.logo;lg.alt=loja.nome}else{lg.hidden=true;const nm=document.getElementById("nome");nm.textContent=loja.nome;nm.hidden=false}
document.getElementById("foottxt").textContent=loja.nome+" · pedidos pelo WhatsApp";

const P=window.P;P.forEach((p,i)=>{p.id=i;p.sel=0;p.size=""});
const cats=["Todos",...new Set(P.map(p=>p.cat))];
let cat="Todos",q="",shown=48,cart={},LASTMSG="",LASTNUM="";
const IMG={},LOADING={};
const brl=v=>v.toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
const r2=v=>Math.round(v*100)/100;
const full=b=>margin===0?r2(b):Math.ceil(b*(1+margin/100))-0.1;
const price=b=>disc?(margin===0?r2(b*(1-disc/100)):Math.max(0.9,Math.ceil(full(b)*(1-disc/100))-0.1)):full(b);
const norm=s=>s.normalize("NFD").replace(/[̀-ͯ]/g,"").toLowerCase();
P.forEach(p=>p.s=norm(p.name+" "+p.colors.map(c=>c.c).join(" ")));
const fmtWA=w=>{w=w.replace(/^55(?=\d{10,11}$)/,"");return w.length>=10?`(${w.slice(0,2)}) ${w.slice(2,w.length-4)}-${w.slice(-4)}`:w};
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));

function loadChunk(n){if(LOADING[n])return;LOADING[n]=1;fetch("img/c"+n+".json?v="+VER).then(r=>r.json()).then(d=>{Object.assign(IMG,d);document.querySelectorAll("img[data-k]").forEach(fill)}).catch(()=>{LOADING[n]=0})}
function fill(im){const k=im.dataset.k;if(IMG[k]&&im.getAttribute("src")!==IMG[k]){im.onload=()=>im.classList.add("ok");im.src=IMG[k]}}
function list(){const nq=norm(q.trim());return P.filter(p=>(cat==="Todos"||p.cat===cat)&&(!nq||nq.split(/\s+/).every(w=>p.s.includes(w))))}
function card(p){
  const c=p.colors[p.sel];
  const col=p.colors.length>1?`<div class="colors">${p.colors.map((x,j)=>`<button class="cbtn" data-p="${p.id}" data-c="${j}" aria-pressed="${j===p.sel}">${esc(x.c||"Padrão")}</button>`).join("")}</div>`:(c.c?`<span class="one">Cor: ${esc(c.c)}</span>`:"");
  const sz=c.sizes.length?`<select class="sz" id="sz${p.id}" data-ps="${p.id}" aria-label="Tamanho do aro"><option value="">Tamanho do aro</option>${c.sizes.map(s=>`<option ${s===p.size?"selected":""}>${s}</option>`).join("")}<option value="?" ${p.size==="?"?"selected":""}>Não tenho certeza</option></select>`:"";
  return `<article class="card" id="card${p.id}"><div class="ph"><img data-k="${c.k}" alt="${esc(p.name)}"></div><div class="info"><h3>${esc(p.name)}</h3>${col}${disc?`<span class="old">De ${brl(full(c.price))}</span>`:""}<span class="price">${disc?"Por ":""}${brl(price(c.price))}${disc?`<span class="off">-${disc}%</span>`:""}</span>${painel&&!asCli?`<span class="cost">Você paga ${brl(c.price)} · lucro <em class="${price(c.price)-c.price<=0?"neg":""}">${brl(price(c.price)-c.price)}</em></span>`:""}${sz}<button class="add" data-id="${p.id}">Adicionar</button></div></article>`;
}
function hook(root){root.querySelectorAll("img[data-k]").forEach(im=>{fill(im);const p=P[+im.closest(".card").id.slice(4)];loadChunk(p.colors[p.sel].ch)})}
function renderGrid(){const L=list(),g=document.getElementById("grid");g.innerHTML=L.slice(0,shown).map(card).join("");hook(g);document.getElementById("more").hidden=L.length<=shown;document.getElementById("found").textContent=L.length+" peças"}
function rerender(p){const el=document.getElementById("card"+p.id);if(!el)return;const t=document.createElement("div");t.innerHTML=card(p);el.replaceWith(t.firstChild);hook(document.getElementById("card"+p.id))}
function renderFilters(){document.getElementById("filters").innerHTML=cats.map(c=>`<button class="chip" aria-pressed="${c===cat}" data-cat="${c}">${c}</button>`).join("")}
function renderCart(){
  const ids=Object.keys(cart),el=document.getElementById("items"),ft=document.getElementById("foot");
  document.getElementById("cnt").textContent=Object.values(cart).reduce((a,b)=>a+b,0);
  if(!ids.length){el.innerHTML='<p class="empty">Sua sacola está vazia.</p>';ft.innerHTML="";return}
  let tot=0;const lines=[],its=[];
  el.innerHTML=ids.map(key=>{const [pid,ci,sz]=key.split("|"),p=P[pid],c=p.colors[ci],n=cart[key],un=price(c.price),t=un*n;tot+=t;
    const det=[c.c?"Cor "+c.c:"",sz?(sz==="?"?"Aro: não tenho certeza":"Aro "+sz):""].filter(Boolean).join(" · ");
    lines.push(`${n}x ${p.name}${det?" · "+det:""} (REF ${p.ref}) ${brl(t)}`);its.push([p.ref,c.c,sz||"",n,Math.round(un*100)]);
    return `<div class="row"><img class="th" data-k="${c.k}" alt=""><span class="n">${esc(p.name)}<small>${esc(det)}${det?" · ":""}${brl(un)} cada</small></span><span class="t">${brl(t)}</span><div class="qty"><button data-dec="${key}" aria-label="Diminuir">−</button>${n}<button data-inc="${key}" aria-label="Aumentar">+</button></div></div>`}).join("");
  el.querySelectorAll("img[data-k]").forEach(im=>{fill(im);im.classList.add("ok")});
  const purl=location.href.split("?")[0].split("#")[0]+"?pedido="+enc(Object.assign(cfg.s?{s:cfg.s}:{l:cfg.l},{i:its}));
  const msg=`Olá, ${loja.nome}! Quero fazer este pedido:\n\n${lines.join("\n")}\n\nTotal: ${brl(tot)}\n\nVer pedido com fotos: ${purl}`;
  const num=WA.length<=11?"55"+WA:WA;
  const mob=/Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
  const href=mob?`https://wa.me/${num}?text=${encodeURIComponent(msg)}`:`https://web.whatsapp.com/send?phone=${num}&text=${encodeURIComponent(msg)}`;
  LASTMSG=msg;LASTNUM=num;
  ft.innerHTML=`<div class="total"><span>Total</span><span>${brl(tot)}</span></div>${WA.length>=10?`<a class="wa" id="finish" target="_blank" rel="noopener" href="${href}">Finalizar pelo WhatsApp</a>`:`<p class="tip" style="color:var(--sold)">WhatsApp da loja não configurado. Copie o pedido e envie para a vendedora.</p>`}<p class="tip" id="tip" hidden>Pedido copiado. Se a mensagem não aparecer no WhatsApp, é só colar na conversa.</p><button class="copyp" id="copyp">Copiar pedido</button>${WA?`<p class="waNum">WhatsApp: ${fmtWA(WA)}</p>`:""}`;
}
document.addEventListener("click",e=>{
  const fin=e.target.closest("#finish");
  if(fin){
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
  if(t.dataset.cat){cat=t.dataset.cat;shown=48;renderFilters();renderGrid()}
  else if(t.dataset.c!==undefined&&t.dataset.p!==undefined){const p=P[t.dataset.p];p.sel=+t.dataset.c;p.size="";rerender(p)}
  else if(t.classList.contains("add")){
    const p=P[t.dataset.id],c=p.colors[p.sel];
    if(c.sizes.length&&!p.size){const s=document.getElementById("sz"+p.id);s.focus();s.classList.add("need");t.textContent="Escolha o tamanho";setTimeout(()=>{t.textContent="Adicionar";s.classList.remove("need")},1500);return}
    const key=p.id+"|"+p.sel+"|"+(c.sizes.length?p.size:"");cart[key]=(cart[key]||0)+1;renderCart();t.textContent="Adicionado ✓";setTimeout(()=>t.textContent="Adicionar",900)}
  else if(t.dataset.inc){cart[t.dataset.inc]++;renderCart()}
  else if(t.dataset.dec){if(--cart[t.dataset.dec]<=0)delete cart[t.dataset.dec];renderCart()}
  else if(t.id==="more"){shown+=48;renderGrid()}
  else if(t.id==="copyp"){const done=()=>{t.textContent="Pedido copiado ✓ Cole no WhatsApp";setTimeout(()=>t.textContent="Copiar pedido",2500)};try{navigator.clipboard.writeText(LASTMSG).then(done,()=>{prompt("Copie o pedido:",LASTMSG)})}catch(e){prompt("Copie o pedido:",LASTMSG)}}
  else if(t.id==="asCli"){asCli=true;applyPanel()}
  else if(t.id==="back"){asCli=false;applyPanel()}
  else if(t.id==="copy"){copyLink(t)}
  else if(t.id==="open"){document.getElementById("drawer").hidden=false}
  else if(t.id==="close"||e.target.id==="drawer"){document.getElementById("drawer").hidden=true}
});
document.addEventListener("change",e=>{if(e.target.dataset.ps!==undefined)P[e.target.dataset.ps].size=e.target.value});
let qt;document.getElementById("q").addEventListener("input",e=>{clearTimeout(qt);qt=setTimeout(()=>{q=e.target.value;shown=48;renderGrid()},200)});
function clientLink(){const base=location.href.split("?")[0].split("#")[0];return base+"?v="+enc(Object.assign({l:cfg.l,m:margin,w:WA?(WA.length<=11?"55"+WA:WA):""},disc?{d:disc}:{}))}
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
  m.addEventListener("input",()=>{margin=+m.value;document.getElementById("mv").textContent="+"+margin+"%";updLink();renderGrid();renderCart()});
  document.getElementById("wa").addEventListener("input",e=>{WA=e.target.value.replace(/\D/g,"");updLink();renderCart()});
  updLink();applyPanel();
}
addEventListener("hashchange",()=>{if(location.hash==="#painel"&&!painel)initPanel()});
function renderOrder(){
  document.getElementById("open").hidden=true;
  const its=Array.isArray(PED.i)?PED.i:[];let tot=0;
  const rows=its.map(([ref,cn,sz,n,cents])=>{
    const p=P.find(x=>x.ref===ref&&x.colors.some(c=>c.c===cn))||P.find(x=>x.ref===ref);
    const c=p?(p.colors.find(c=>c.c===cn)||p.colors[0]):null;
    const un=(+cents||0)/100,t=un*(+n||0);tot+=t;
    const det=[cn?"Cor "+cn:"",sz?(sz==="?"?"Aro: não tenho certeza":"Aro "+sz):""].filter(Boolean).join(" · ");
    if(c)loadChunk(c.ch);
    return `<div class="orow">${c?`<img class="oth" data-k="${c.k}" alt="">`:`<div class="oth none">Sem foto</div>`}<div class="oinfo"><strong>${esc(p?p.name:"Peça "+ref)}</strong><small>REF ${esc(ref)}${det?" · "+esc(det):""}</small><small>${n}x ${brl(un)}</small></div><span class="ot">${brl(t)}</span></div>`}).join("");
  document.getElementById("main").innerHTML=`<section class="hero"><h2>Pedido</h2><p>${its.length} ${its.length===1?"item":"itens"} · conferência com fotos</p></section><div class="olist">${rows||'<p class="empty">Pedido vazio.</p>'}</div><div class="total ototal"><span>Total</span><span>${brl(tot)}</span></div><button class="pdfb" id="pdfb">Salvar em PDF / Imprimir</button>`;
  document.getElementById("pdfb").addEventListener("click",()=>window.print());
  document.querySelectorAll("img[data-k]").forEach(im=>{fill(im);im.classList.add("ok")});
}
if(PED){document.getElementById("pbar").hidden=true;renderOrder();return}
renderFilters();initPanel();renderGrid();renderCart();
})();
