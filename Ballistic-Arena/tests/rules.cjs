const vm=require('node:vm'),fs=require('node:fs');
const els=new Map();function el(s){if(!els.has(s))els.set(s,{textContent:'',innerHTML:'',style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},setAttribute(){},getContext(){return{};}});return els.get(s)}
const sandbox={document:{querySelector:el,querySelectorAll:()=>[],addEventListener(){}},window:{addEventListener(){}},performance:{now:()=>0},requestAnimationFrame(){},Math,console};vm.createContext(sandbox);vm.runInContext(fs.readFileSync('dist/game.js','utf8'),sandbox);
vm.runInContext(`
function check(ok,msg){if(!ok)throw Error(msg)}
mode='survival';prepare();start();check(players.every(p=>p.hp===10),'Survival starts at 10');
for(let i=0;i<10;i++)goal(0,1);check(players[0].hp===0&&state==='playing','Eliminated human must spectate');
for(let i=0;i<10;i++){goal(2,1);goal(3,1);}check(state==='ended'&&players[1].hp===10,'Last survivor wins');
mode='challenge';prepare();start();check(players.map(p=>p.hp).join(',')==='8,12,12,12','Challenge lives');
mode='tournament';prepare();start();goal(0,-1);goal(0,0);check(players.every(p=>p.score===0),'Unowned and own goals give no points');
players[1].score=8;players[2].score=6;players[3].score=4;for(let i=0;i<10;i++)goal(1,0);
check(state==='roundEnd'&&round===1,'Round 1 ends at 10');check(totals.join(',')==='20,8,6,4','Only winner doubles');
start();check(round===2&&players.every(p=>p.score===0)&&totals[1]===8,'Round 2 resets scores but retains totals');
players[0].score=8;players[2].score=2;players[3].score=5;for(let i=0;i<10;i++)goal(0,1);
check(totals.join(',')==='28,28,8,9','Round 2 accumulation');start();check(round===3,'Exactly round 3');
players[0].score=7;players[1].score=8;for(let i=0;i<10;i++)goal(1,2);
check(state==='ended'&&totals.join(',')==='35,36,28,9','Final winner uses totals, not last round');check($('#overlay-title').textContent==='EMBER wins it.','Cumulative winner displayed');
start();check(round===1&&totals.every(x=>x===0)&&history.length===0,'Replay resets tournament');
mode='tournament';prepare();start();totals=[10,10,0,0];round=3;players[0].score=0;players[1].score=0;finishRound(2);check($('#overlay-title').textContent==='VIOLET wins it.','Final totals correctly compared');
prepare();start();totals=[20,20,0,0];round=3;finishRound(2);check($('#overlay-title').textContent==='Shared victory.','Tie declared');
mode='survival';prepare();start();balls=[];spawn(0);check(Math.abs(Math.hypot(balls[0].vx,balls[0].vy)-190)<1e-6,'New ball slow');
let b=balls[0];b.x=450;b.y=760;b.vx=0;b.vy=190;update(1/120);const speed=Math.hypot(b.vx,b.vy);check(speed>190&&b.vy<0&&b.owner===0,'Return accelerates and sets scoring owner');
b.x=190;b.y=108;b.vx=0;b.vy=-speed;update(1/120);check(Math.abs(Math.hypot(b.vx,b.vy)-speed)<1e-6,'Wall preserves speed');
balls=[];spawn(0);spawn(1);Object.assign(balls[0],{x:450,y:450,vx:500,vy:0});Object.assign(balls[1],{x:465,y:450,vx:-190,vy:0});update(1/120);check(Math.abs(Math.hypot(balls[0].vx,balls[0].vy)-500)<1e-6&&Math.abs(Math.hypot(balls[1].vx,balls[1].vy)-190)<1e-6,'Ball collision preserves individual speeds');
for(const m of ['survival','challenge','tournament']){mode=m;prepare();start();for(let k=0;k<36000&&state==='playing';k++){update(1/120);for(const b of balls)check(Number.isFinite(b.x+b.y+b.vx+b.vy),'Finite physics');}check(state==='ended'||state==='roundEnd',m+' resolves');}
console.log('PASS: survival, challenge, 3-round scoring, double winner, carryover, no own-goal points, cumulative champion, ties, replay, speed growth and preservation, full simulations.');
`,sandbox);
