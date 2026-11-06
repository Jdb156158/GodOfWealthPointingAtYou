const $=id=>document.getElementById(id),key='caishen-v1';
const names=['金豆','元宝','金砖','金山','聚宝盆'],icons=['豆','元','砖','山','宝'];
const signs=[['积小财，成大势','把一件拖延的小事完成。今天的收获，藏在一次踏实的行动里。'],['好风凭借力','试着向信任的人请教一个问题。好想法常常来自一次真诚交流。'],['留有余地，自有余财','整理一处空间，给自己一点喘息的时间。今天不必急着做决定。'],['心有方向，步步生金','写下今天最重要的一件事，先为它留出半小时。专注就是你的好运。']];
let state;try{state=JSON.parse(localStorage.getItem(key))}catch{}
state??={wealth:0,level:1,board:[],day:'',daily:0,claimed:false,sign:null,total:0};
function date(){const d=new Date();return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`}
function day(){if(state.day!==date()){state.day=date();state.daily=0;state.claimed=false;state.sign=null}}
let busy=false;
function save(){if(!busy)localStorage.setItem(key,JSON.stringify(state))}
function matches(board){const found=new Set();for(let axis=0;axis<2;axis++)for(let line=0;line<5;line++){let run=[];for(let pos=0;pos<=5;pos++){const i=axis?pos*5+line:line*5+pos;if(pos<5&&(!run.length||board[i]===board[run[0]])){run.push(i);continue}if(run.length>=3)run.forEach(n=>found.add(n));run=pos<5?[i]:[]}}return [...found]}
function adjacent(a,b){return Math.abs(a%5-b%5)+Math.abs(Math.floor(a/5)-Math.floor(b/5))===1}
function possible(board){for(let a=0;a<25;a++)for(const b of [a+1,a+5]){if(b>=25||!adjacent(a,b))continue;[board[a],board[b]]=[board[b],board[a]];const ok=matches(board).length>0;[board[a],board[b]]=[board[b],board[a]];if(ok)return true}return false}
function randomTreasure(){return Math.floor(Math.random()*5)}
function fresh(){let board;do{board=[];for(let i=0;i<25;i++){const choices=[0,1,2,3,4].filter(n=>!(i%5>=2&&board[i-1]===n&&board[i-2]===n)&&!(i>=10&&board[i-5]===n&&board[i-10]===n));board.push(choices[Math.floor(Math.random()*choices.length)])}}while(!possible(board));return board}
if(state.rules!==3||state.board.length!==25||matches(state.board).length||!possible(state.board)){state.board=fresh();state.rules=3}
function render(){day();$('wealth').textContent=state.wealth.toLocaleString();$('merges').textContent=`合成 ${state.total} 次`;$('progress').textContent=`${Math.min(state.daily,10)} / 10`;$('claim').disabled=state.daily<10||state.claimed;$('claim').textContent=state.claimed?'已领取':'领取奖励';$('board').replaceChildren(...state.board.map((n,i)=>{const b=document.createElement('button');b.className='tile';b.dataset.level=n;b.textContent=icons[n];b.setAttribute('aria-label',`${i+1}号 ${names[n]}`);b.onclick=()=>merge(i);return b}));const s=state.sign===null?null:signs[state.sign];$('fortuneTitle').textContent=s?s[0]:'好事将至';$('fortuneText').textContent=s?s[1]:'摇一摇签筒，把今天的期待交给财神。';$('fortuneLabel').textContent=s?'今日签 · 顺遂':'静下心，接一份好运';$('draw').disabled=!!s;$('draw').textContent=s?'今日已抽，明日再会':'抽取今日签';renderTemple();save()}
const temples=[
 {name:'初见小福龛',detail:'一座小福龛，一炉香火，积攒第一份福气。',next:'添上翘角屋檐、红灯笼与石阶。'},
 {name:'金玉小庙',detail:'玉瓦覆顶，红灯迎客，小小福地初具模样。',next:'扩建双层宝殿，添置金狮与白石高台。'},
 {name:'聚财宝殿',detail:'重檐高台，金狮守门，聚起满堂好彩头。',next:'修建三层主殿、两侧楼阁和完整庭院。'},
 {name:'福满财神府',detail:'楼阁相连，庭院成景，你的财神府已建成。',next:''}
];
function renderTemple(){
 const stage=Math.min(state.level,4)-1,t=temples[stage],cost=state.level*200,max=stage===3;
 $('level').textContent=`等级 ${state.level}`;$('templeName').textContent=t.name;
 const shrine=document.querySelector('.shrine');shrine.dataset.stage=stage+1;shrine.setAttribute('role','img');shrine.setAttribute('aria-label',t.name+'：'+t.detail);shrine.style.backgroundPosition=`${stage%2*100}% ${Math.floor(stage/2)*100}%`;
 $('templeDetail').textContent=t.detail;
 $('templeStages').replaceChildren(...temples.map((t,i)=>{const el=document.createElement('span');el.textContent=['小福龛','金玉庙','聚财殿','财神府'][i];el.className=i===stage?'current':i<stage?'built':'';if(i===stage)el.setAttribute('aria-current','step');return el}));
 $('upgrade').textContent=max?'财神府已建成':`升级为${temples[stage+1].name} · ${cost} 财力`;
 $('upgrade').disabled=max||state.wealth<cost;
 $('templeHint').textContent=max?'四阶福地已点亮，愿你日日有所得。':`${t.next}${state.wealth<cost?'还需 '+(cost-state.wealth)+' 财力。':''}`;
}
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function merge(start,end){
 if(busy||end===undefined||start===end)return;
 if(!adjacent(start,end)){$('notice').textContent='只能交换上下左右相邻的财宝。';return}
 day();busy=true;$('shuffle').disabled=true;
 const swap=()=>{[state.board[start],state.board[end]]=[state.board[end],state.board[start]]};
 swap();render();await pause(180);
 let hits=matches(state.board);
 if(!hits.length){swap();busy=false;render();$('shuffle').disabled=false;$('notice').textContent='未凑齐三个，财宝已回到原位。';return}
 let combo=0,totalGain=0;
 while(hits.length){
  combo++;const gain=hits.reduce((sum,i)=>sum+(state.board[i]+1)*10,0)*combo;
  hits.forEach(i=>$('board').children[i].classList.add('clearing'));
  $('notice').textContent=`${combo>1?combo+' 连消！':'消除成功！'} ${hits.length} 件财宝 +${gain} 财力`;
  await pause(240);
  const removed=new Set(hits),falls=[];
  for(let col=0;col<5;col++){
   const survivors=[];for(let row=4;row>=0;row--){const i=row*5+col;if(!removed.has(i))survivors.push({value:state.board[i],row})}
   for(let row=4;row>=0;row--){const item=survivors[4-row];state.board[row*5+col]=item?item.value:randomTreasure();if(!item||item.row!==row)falls.push(row*5+col)}
  }
  state.wealth+=gain;totalGain+=gain;state.daily++;state.total++;render();
  falls.forEach(i=>$('board').children[i].classList.add('falling'));await pause(260);hits=matches(state.board);
 }
 let reshuffled=false;if(!possible(state.board)){state.board=fresh();reshuffled=true}
 busy=false;render();$('shuffle').disabled=false;$('notice').textContent=`${combo>1?combo+' 连消，':''}获得 ${totalGain} 财力！${reshuffled?'无可用交换，已自动重排。':''}`;
}
document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{render();document.querySelectorAll('.panel').forEach(p=>p.hidden=p.id!==b.dataset.tab);document.querySelectorAll('[data-tab]').forEach(t=>t.classList.toggle('active',t===b))});
$('shuffle').onclick=()=>{state.board=fresh();render();$('notice').textContent='新的一池财宝，好运继续。'};
$('claim').onclick=()=>{day();if(state.daily<10||state.claimed)return;state.claimed=true;state.wealth+=100;render();$('notice').textContent='今日任务完成！+100 财力'};
$('draw').onclick=()=>{day();if(state.sign!==null)return;state.sign=Math.floor(Math.random()*signs.length);render()};
$('upgrade').onclick=()=>{const cost=state.level*200;if(state.level>=4||state.wealth<cost)return;state.wealth-=cost;state.level++;render();const shrine=document.querySelector('.shrine');shrine.classList.remove('upgraded');void shrine.offsetWidth;shrine.classList.add('upgraded')};
function decorate(){$('merges').textContent=`消除 ${state.total} 次`;[...$('board').children].forEach((b,i)=>{b.dataset.index=i;b.onclick=null;const sprite=document.createElement('span');sprite.className='treasure-sprite';sprite.setAttribute('aria-hidden','true');const n=state.board[i];sprite.style.backgroundPosition=`${n%3*50}% ${Math.floor(n/3)*100}%`;b.replaceChildren(sprite)})}
new MutationObserver(decorate).observe($('board'),{childList:true});
let drag=null;
function clearDrag(){if(!drag)return;drag.ghost.remove();drag.source.classList.remove('dragging');document.querySelectorAll('.drop-target').forEach(b=>b.classList.remove('drop-target'));drag=null}
$('board').addEventListener('pointerdown',e=>{const source=e.target.closest('.tile');if(!source||drag||busy||e.button!==0)return;e.preventDefault();const ghost=source.cloneNode(true);ghost.className='tile drag-ghost';ghost.setAttribute('aria-hidden','true');document.body.append(ghost);drag={id:e.pointerId,start:Number(source.dataset.index),source,ghost,x:e.clientX,y:e.clientY};source.setPointerCapture(e.pointerId);source.classList.add('dragging');ghost.style.left=e.clientX+'px';ghost.style.top=e.clientY+'px'});
$('board').addEventListener('pointermove',e=>{if(!drag||drag.id!==e.pointerId)return;drag.ghost.style.left=e.clientX+'px';drag.ghost.style.top=e.clientY+'px';document.querySelectorAll('.drop-target').forEach(b=>b.classList.remove('drop-target'));const target=document.elementFromPoint(e.clientX,e.clientY)?.closest('#board .tile');if(target&&adjacent(drag.start,Number(target.dataset.index)))target.classList.add('drop-target')});
$('board').addEventListener('pointerup',e=>{if(!drag||drag.id!==e.pointerId)return;const start=drag.start,target=document.elementFromPoint(e.clientX,e.clientY)?.closest('#board .tile');clearDrag();if(target)merge(start,Number(target.dataset.index))});
for(const event of ['pointercancel','lostpointercapture'])$('board').addEventListener(event,clearDrag);window.addEventListener('blur',clearDrag);
$('game').querySelector('.tip').textContent='拖动交换相邻财宝，横竖凑齐三个即可消除';$('notice').textContent='找找差一格就能连成三个的财宝。';
$('game').querySelector('.task p').textContent='完成 10 次消除，领取 100 财力';$('game').querySelector('.route').textContent='相邻交换 · 三个消除 · 掉落补齐 · 连消加倍';
$('dialog').querySelector('h2').textContent='交换一格，财运连连';$('dialog').querySelector('p').textContent='拖动交换上下左右相邻的两件财宝。横向或纵向连续三个及以上同类财宝即可消除，获得财力；上方财宝下落、顶部补入新财宝，自动触发后续连消。没有形成消除的交换会退回。';
const shrine=document.querySelector('.shrine');shrine.replaceChildren();
const detail=document.createElement('p');detail.id='templeDetail';detail.className='tip center';$('templeName').after(detail);
const stages=document.createElement('div');stages.id='templeStages';stages.setAttribute('aria-label','财神庙修建进度');shrine.before(stages);
$('help').onclick=()=>$('dialog').showModal();$('close').onclick=()=>$('dialog').close();render();decorate();
