/* PixelProTech site behaviour — menu, reveal, hero visual, network canvas, toast, keyboard-aware action bar */
(function(){
"use strict";
var $=function(s,r){return(r||document).querySelector(s)},$$=function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))};
var root=document.documentElement;
var reduce=window.matchMedia&&matchMedia("(prefers-reduced-motion:reduce)").matches;

/* toast */
var tt;window.__toast=function(m){var t=$("#toast");if(!t)return;t.textContent=m;t.classList.add("on");clearTimeout(tt);tt=setTimeout(function(){t.classList.remove("on")},3200)};

/* menu drawer */
var mb=$(".menu-btn");
function menu(o){root.classList.toggle("menu-open",o);if(mb)mb.setAttribute("aria-expanded",o?"true":"false")}
if(mb){mb.addEventListener("click",function(){menu(!root.classList.contains("menu-open"))});
 $$("#drawer a").forEach(function(a){a.addEventListener("click",function(){menu(false)})});
 addEventListener("resize",function(){if(innerWidth>=1024)menu(false)});}
addEventListener("keydown",function(e){if(e.key==="Escape"){menu(false);var p=$(".pc-panel");if(p&&p.classList.contains("open")){var c=$(".pc-close");if(c)c.click()}}});

/* ask button -> chat widget */
var ask=$("#ab-ask");
if(ask)ask.addEventListener("click",function(){var l=$(".pc-launch");if(l)l.click();else window.__toast("Chat is loading — try again in a second.")});

/* keyboard open => hide action bar */
function kb(){var a=document.activeElement;return a&&/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)}
document.addEventListener("focusin",function(){root.classList.toggle("kb-open",kb())});
document.addEventListener("focusout",function(){setTimeout(function(){root.classList.toggle("kb-open",kb())},60)});

/* scroll reveal + sequential pipeline */
var io="IntersectionObserver" in window?new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add("in");io.unobserve(e.target)}})},{threshold:.08,rootMargin:"0px 0px -6% 0px"}):null;
$$(".step,.who-card,.svc-card,.cred-card,.price-card,.why-card,.proj-card,.cov-item,.hw-cat,.engine-block,.hw-form-wrap,.section-title,.proof-card").forEach(function(el){el.classList.add("rv");if(io)io.observe(el);else el.classList.add("in")});
$$(".pipeline-strip").forEach(function(p){
 var nodes=$$(".pipeline-node",p);if(!nodes.length||reduce||!("IntersectionObserver" in window))return;
 var done=false,po=new IntersectionObserver(function(es){if(es[0].isIntersecting&&!done){done=true;po.disconnect();
  var i=0;(function go(){nodes.forEach(function(n,k){n.classList.toggle("sig",k===i)});
   if(i<nodes.length-1){i++;setTimeout(go,420)}else setTimeout(function(){nodes[i].classList.remove("sig")},900)})()}},{threshold:.4});po.observe(p)});

/* hero 3D stack: flicker + pointer tilt */
var st=$(".stack");
if(st){var plates=$$(".plate",st);
 plates.forEach(function(pl){for(var i=0;i<40;i++){var d=document.createElement("div");d.className="pxl";pl.appendChild(d)}});
 var pix=$$(".pxl",st);
 function flick(){for(var k=0;k<9;k++){var p=pix[Math.floor(Math.random()*pix.length)];p.className="pxl"+(Math.random()<.5?"":Math.random()<.5?" p":" t")}}
 for(var j=0;j<24;j++)flick();
 if(!reduce)setInterval(function(){if(!document.hidden)flick()},520);
 if(!reduce&&matchMedia("(hover:hover) and (min-width:1024px)").matches){var tl=$(".stack-tilt",st);
  addEventListener("pointermove",function(e){tl.style.setProperty("--ry",((e.clientX/innerWidth-.5)*16).toFixed(1)+"deg");tl.style.setProperty("--rx",((.5-e.clientY/innerHeight)*12).toFixed(1)+"deg")},{passive:true})}}

/* typed console (illustration only) */
var con=$("#con");
if(con){var seq=[["$ ppt diagnose --device laptop","pp"],["› checking storage health ......... ok","ok"],["› checking memory ................. ok","ok"],["› checking thermals ............... warn: fan dust","wn"],["› checking network ................ ok","ok"],["✓ fault isolated · quote prepared · client approves","pp"]];
 var si=0,ci=0,line=null;
 if(reduce){con.innerHTML=seq.map(function(s){return'<span class="'+s[1]+'">'+s[0]+"</span>"}).join("\n")}
 else(function tick(){
  if(document.hidden){return setTimeout(tick,800)}
  if(si>=seq.length){return setTimeout(function(){con.textContent="";si=0;ci=0;line=null;tick()},3200)}
  if(!line){line=document.createElement("span");line.className=seq[si][1];con.appendChild(line)}
  line.textContent=seq[si][0].slice(0,++ci);
  if(ci>=seq[si][0].length){con.appendChild(document.createTextNode("\n"));si++;ci=0;line=null;setTimeout(tick,520)}else setTimeout(tick,22)})();}

/* network canvas — viewport-sized, DPR-capped */
var cv=$("#network-canvas");
if(cv&&!reduce){var cx=cv.getContext("2d"),W,H,dpr,nodes=[],mouse={x:-999,y:-999},raf;
 function size(){dpr=Math.min(devicePixelRatio||1,2);W=innerWidth;H=innerHeight;cv.width=W*dpr;cv.height=H*dpr;cx.setTransform(dpr,0,0,dpr,0,0);
  var n=Math.max(18,Math.min(60,Math.round(W*H/22000)));nodes=[];for(var i=0;i<n;i++)nodes.push({x:Math.random()*W,y:Math.random()*H,vx:(Math.random()-.5)*.3,vy:(Math.random()-.5)*.3,r:Math.random()*1.4+.6,c:Math.random()<.35?"0,212,170":"123,47,255"})}
 function step(){cx.clearRect(0,0,W,H);var L=W<700?110:150;
  for(var i=0;i<nodes.length;i++){var a=nodes[i];a.x+=a.vx;a.y+=a.vy;if(a.x<0||a.x>W)a.vx*=-1;if(a.y<0||a.y>H)a.vy*=-1;
   cx.fillStyle="rgba("+a.c+",.8)";cx.beginPath();cx.arc(a.x,a.y,a.r,0,6.283);cx.fill();
   for(var j=i+1;j<nodes.length;j++){var b=nodes[j],dx=a.x-b.x,dy=a.y-b.y,d=dx*dx+dy*dy;if(d<L*L){cx.strokeStyle="rgba("+a.c+","+(.22*(1-Math.sqrt(d)/L)).toFixed(3)+")";cx.beginPath();cx.moveTo(a.x,a.y);cx.lineTo(b.x,b.y);cx.stroke()}}
   var mx=a.x-mouse.x,my=a.y-mouse.y,md=mx*mx+my*my;if(md<14400){cx.strokeStyle="rgba(0,212,170,.3)";cx.beginPath();cx.moveTo(a.x,a.y);cx.lineTo(mouse.x,mouse.y);cx.stroke()}}
  raf=requestAnimationFrame(step)}
 size();step();
 var rt;addEventListener("resize",function(){clearTimeout(rt);rt=setTimeout(size,200)});
 addEventListener("pointermove",function(e){mouse.x=e.clientX;mouse.y=e.clientY},{passive:true});
 document.addEventListener("visibilitychange",function(){cancelAnimationFrame(raf);if(!document.hidden)step()});}

/* service worker */
if("serviceWorker" in navigator){addEventListener("load",function(){navigator.serviceWorker.register("service-worker.js").catch(function(e){console.warn("sw",e)})})}
})();
