'use strict';
const palette=['#8060eb','#43b5ed','#2dc7ac','#f3ac57','#ed749e','#6982ed','#b47bdd','#48b7c2'];
const data=window.BUDGET_DATA.map(r=>({...r,delta:r.y27-r.y26,rate:r.y26===0?null:(r.y27-r.y26)/r.y26}));
const $=id=>document.getElementById(id), fmt=n=>Math.round(n).toLocaleString('ko-KR'), pct=n=>n===null?'—':`${n>0?'+':''}${(n*100).toFixed(1)}%`;
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const sum=(a,k)=>a.reduce((v,r)=>v+r[k],0), uniq=a=>[...new Set(a)];
let visible=[],sortKey='y27',sortDir=-1;
function groups(rows,key){return uniq(rows.map(r=>r[key])).map(name=>{const rs=rows.filter(r=>r[key]===name);return {name,y26:sum(rs,'y26'),y27:sum(rs,'y27'),delta:sum(rs,'delta')};});}
function options(el,items,label){const old=el.value;el.innerHTML=`<option value="">${label}</option>`+items.map(x=>`<option value="${esc(x)}">${esc(x)}</option>`).join('');if(items.includes(old))el.value=old;}
options($('sector'),uniq(data.map(r=>r.sector)),'전체 부문');
function accountOptions(){options($('account'),uniq(data.filter(r=>!$('sector').value||r.sector===$('sector').value).map(r=>r.account)),'전체 회계구분');}
accountOptions();
const svg=(body,w=560,h=280)=>`<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="예산 데이터 차트">${body}</svg>`;
const text=(x,y,s,cls='',anchor='start')=>`<text x="${x}" y="${y}" class="${cls}" text-anchor="${anchor}">${esc(s)}</text>`;
const title=s=>`<title>${esc(s)}</title>`;
const blank=id=>$(id).innerHTML='<div class="no-data">표시할 데이터가 없습니다</div>';
function bars(id,rows,key,color,diverging=false){
 if(!rows.length){blank(id);return;}
 const w=560,h=id==='ranking'||id==='changes'?350:280,left=170,right=70,step=(h-26)/Math.max(rows.length,1),top=12;
 const max=Math.max(1,...rows.map(r=>Math.abs(r[key]))),plot=w-left-right;
 const zero=diverging?left+plot/2:left,scale=(diverging?plot/2:plot)/max;
 let b=`<line x1="${zero}" y1="0" x2="${zero}" y2="${h-10}" stroke="#e9eaf4"/>`;
 rows.forEach((r,i)=>{const y=top+i*step,v=r[key],len=Math.abs(v)*scale,c=diverging?(v>=0?'#2dc7ac':'#ed749e'):palette[i%palette.length];b+=text(left-10,y+step*.48,r.name.length>17?r.name.slice(0,16)+'…':r.name,'label','end');b+=`<rect data-hover x="${v<0?zero-len:zero}" y="${y+2}" width="${Math.max(1,len)}" height="${Math.min(19,step*.6)}" rx="4" fill="${color||c}">${title(`${r.name}: ${fmt(v)}억 원`)}</rect>`;b+=text(diverging?555:zero+len+5,y+step*.48,fmt(v),'value',diverging?'end':'start');});
 $(id).innerHTML=svg(b,w,h);
}
function sectorChart(rows){const gs=groups(rows,'sector');if(!gs.length){blank('sectors');return;}const values=gs.flatMap(g=>[g.y26,g.y27]),min=Math.min(0,...values),max=Math.max(0,...values),span=max-min||1,y=v=>235-(v-min)/span*188;let b='';const width=430/gs.length;
 for(let i=0;i<5;i++){const v=min+span*i/4,yy=y(v);b+=`<line x1="60" y1="${yy}" x2="545" y2="${yy}" stroke="#f0f1f8"/>`+text(52,yy+4,fmt(v),'','end');}
 b+=`<line x1="60" y1="${y(0)}" x2="545" y2="${y(0)}" stroke="#d2cce7"/>`;
 gs.forEach((g,i)=>{const x=85+i*width,bw=Math.min(40,width/3);[g.y26,g.y27].forEach((v,j)=>{const bar=Math.abs(y(v)-y(0));b+=`<rect data-hover x="${x+j*(bw+5)}" y="${Math.min(y(v),y(0))}" width="${bw}" height="${bar}" rx="5" fill="${j?'#8060eb':'#c3b2f7'}">${title(`${g.name} ${2026+j}년: ${fmt(v)}억 원`)}</rect>`;});b+=text(x+bw,258,g.name,'label','middle');});$('sectors').innerHTML=svg(b);
}
function donut(rows){const gs=groups(rows.filter(r=>r.y27>0),'account'),total=sum(gs,'y27');if(!total){blank('donut');return;}let offset=0;const paths=gs.map((g,i)=>{const f=g.y27/total,part=f*2*Math.PI*80,p=`<circle data-hover cx="115" cy="130" r="80" fill="none" stroke="${palette[i%8]}" stroke-width="30" stroke-dasharray="${part} ${2*Math.PI*80-part}" stroke-dashoffset="${-offset}" transform="rotate(-90 115 130)">${title(`${g.name}: ${fmt(g.y27)}억 원 (${(f*100).toFixed(1)}%)`)}</circle>`;offset+=part;return p;}).join('');$('donut').innerHTML=`<div class="donut-wrap">${svg(paths+text(115,124,'양수 재원 합계','','middle')+text(115,148,fmt(total),'value','middle'),230,260)}<ul class="donut-list">${gs.map((g,i)=>`<li><span class="dot" style="background:${palette[i%8]}"></span>${esc(g.name)}<strong>${(g.y27/total*100).toFixed(1)}% <small>· ${fmt(g.y27)}</small></strong></li>`).join('')}</ul></div>`;}
function treemap(rows){let rs=rows.filter(r=>r.y27>0).sort((a,b)=>b.y27-a.y27);if(!rs.length){blank('treemap');return;}const total=sum(rs,'y27');const show=rs.slice(0,11);if(rs.length>11)show.push({program:`기타 ${rs.length-11}개`,y27:sum(rs.slice(11),'y27')});$('treemap').innerHTML=show.map((r,i)=>`<div class="tile" style="background:${palette[i%8]};flex:${Math.max(7,r.y27/total*100)} 1 ${Math.max(15,r.y27/total*100)*2}px" title="${esc(r.program)}: ${fmt(r.y27)}억 원 (${(r.y27/total*100).toFixed(1)}%)">${esc(r.program)}<strong>${fmt(r.y27)}</strong><span>${(r.y27/total*100).toFixed(1)}%</span></div>`).join('');}
function scatter(rows){const rs=rows.filter(r=>r.y26>=0&&r.y27>=0);if(!rs.length){blank('scatter');return;}const max=Math.max(1,...rs.flatMap(r=>[r.y26,r.y27]))*1.08,x=v=>65+v/max*450,y=v=>225-v/max*190;let b=`<line x1="65" y1="225" x2="515" y2="35" stroke="#c9c2e6" stroke-dasharray="5 5"/>`;
 for(let i=0;i<5;i++){let v=max*i/4;b+=`<line x1="65" y1="${y(v)}" x2="530" y2="${y(v)}" stroke="#f0f1f7"/>`+text(55,y(v)+4,fmt(v),'','end')+text(x(v),247,fmt(v),'','middle');}
 rs.forEach(r=>{const c=palette[uniq(data.map(d=>d.sector)).indexOf(r.sector)];b+=`<circle data-hover tabindex="0" cx="${x(r.y26)}" cy="${y(r.y27)}" r="${5+Math.sqrt(r.y27/max)*9}" fill="${c}" fill-opacity=".75" stroke="white" stroke-width="2">${title(`${r.program}\n2026년 ${fmt(r.y26)} / 2027년 ${fmt(r.y27)}억 원\n증감률 ${pct(r.rate)}`)}</circle>`;});b+=text(300,275,'2026년 예산 →','','middle')+text(68,18,'2027년 예산 ↑')+text(420,23,'점선: 전년과 동일');$('scatter').innerHTML=svg(b);}
function heatmap(rows){const rs=rows.filter(r=>r.y26>0).sort((a,b)=>b.rate-a.rate);if(!rs.length){blank('heatmap');return;}$('heatmap').innerHTML=`<div class="heat">${rs.map(r=>{const h=r.rate>=0?165:340,l=64-Math.min(.6,Math.abs(r.rate))/.6*24;return `<div style="background:hsl(${h} 58% ${l}%)" title="${esc(r.program)}: ${pct(r.rate)}"><span>${esc(r.program)}</span><strong>${pct(r.rate)}</strong></div>`;}).join('')}</div>`;}
function table(){const sorted=[...visible].sort((a,b)=>(a[sortKey]-b[sortKey])*sortDir);$('tbody').innerHTML=sorted.map(r=>`<tr><td><span class="pill">${esc(r.sector)}</span></td><td>${esc(r.account)}</td><td>${esc(r.category)}</td><td>${esc(r.program)}</td><td>${fmt(r.y26)}</td><td>${fmt(r.y27)}</td><td class="${r.delta>=0?'up':'down'}">${r.delta>0?'+':''}${fmt(r.delta)}</td><td class="${r.rate>=0?'up':'down'}">${pct(r.rate)}</td></tr>`).join('')||'<tr><td colspan="8" style="text-align:center;padding:35px">조건에 맞는 데이터가 없습니다.</td></tr>';}
function render(){const q=$('search').value.trim().toLowerCase();visible=data.filter(r=>(!$('sector').value||r.sector===$('sector').value)&&(!$('account').value||r.account===$('account').value)&&(!q||`${r.program} ${r.category}`.toLowerCase().includes(q)));
 const a=sum(visible,'y26'),b=sum(visible,'y27'),d=b-a,p=a===0?null:d/a;
 $('count').textContent=`${visible.length} / ${data.length}개 항목`;$('empty').hidden=visible.length>0;
 $('overview').innerHTML=[['2027년 선택 재원',fmt(b),'정부안 · 차감 재원 포함'],['2026년 비교 재원',fmt(a),'전년 예산 · 차감 재원 포함'],['전년 대비 증감',`${d>0?'+':''}${fmt(d)}`,'2027년 − 2026년'],['전년 대비 증감률',pct(p),`선택 프로그램 ${visible.length}개 · 합계 기준`]].map(([t,v,n])=>`<article class="kpi"><small>${t}</small><strong>${v}</strong><p>${n}</p></article>`).join('');
 sectorChart(visible);donut(visible);bars('accounts',groups(visible,'account'),'delta',null,true);treemap(visible);bars('ranking',visible.filter(r=>r.y27>0).sort((a,b)=>b.y27-a.y27).slice(0,10).map(r=>({...r,name:r.program})),'y27');bars('changes',[...visible].sort((a,b)=>Math.abs(b.delta)-Math.abs(a.delta)).slice(0,10).map(r=>({...r,name:r.program})),'delta',null,true);scatter(visible);heatmap(visible);table();
}
$('sector').addEventListener('change',()=>{accountOptions();render();});$('account').addEventListener('change',render);$('search').addEventListener('input',render);$('reset').addEventListener('click',()=>{$('sector').value='';$('search').value='';$('account').value='';accountOptions();render();});
document.querySelectorAll('[data-sort]').forEach(b=>b.addEventListener('click',()=>{const key=b.dataset.sort;sortDir=sortKey===key?-sortDir:-1;sortKey=key;table();}));
$('download').addEventListener('click',()=>{const lines=[['부문','회계구분','구분','프로그램명','2026년(억원)','2027년(억원)','증감(억원)','증감률(%)'],...visible.map(r=>[r.sector,r.account,r.category,r.program,r.y26,r.y27,r.delta,r.rate===null?'':(r.rate*100).toFixed(4)])];const csv='\uFEFF'+lines.map(r=>r.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(',')).join('\r\n');const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8;'})),a=document.createElement('a');a.href=url;a.download='국방예산_필터결과.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
render();
