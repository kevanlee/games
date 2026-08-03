const items = [
  {id:"milk",name:"Milk",w:72,h:96,weight:8.6,temp:"cold",fragile:1,category:"cold"},
  {id:"eggs",name:"Eggs",w:112,h:54,weight:1.5,temp:"cold",fragile:5,category:"cold"},
  {id:"bread",name:"Bread",w:92,h:62,weight:1.0,temp:"room",fragile:4,soft:true,category:"bakery"},
  {id:"bananas",name:"Bananas",w:94,h:54,weight:2.2,temp:"room",fragile:3,soft:true,category:"produce"},
  {id:"cans",name:"2 Cans",w:66,h:74,weight:3.2,temp:"room",fragile:1,category:"pantry"},
  {id:"peas",name:"Frozen Peas",w:84,h:58,weight:1.0,temp:"frozen",fragile:1,category:"frozen"},
  {id:"icecream",name:"Ice Cream",w:68,h:76,weight:1.8,temp:"frozen",fragile:2,category:"frozen"},
  {id:"cereal",name:"Cereal",w:78,h:108,weight:1.2,temp:"room",fragile:2,category:"pantry"},
  {id:"chips",name:"Potato Chips",w:88,h:78,weight:0.7,temp:"room",fragile:5,soft:true,category:"pantry"},
  {id:"yogurt",name:"Yogurt",w:62,h:58,weight:1.3,temp:"cold",fragile:2,category:"cold"},
  {id:"chicken",name:"Raw Chicken",w:98,h:55,weight:3.4,temp:"cold",fragile:2,category:"cold"},
  {id:"apples",name:"Apples",w:92,h:66,weight:3.0,temp:"room",fragile:2,category:"produce"},
  {id:"pasta",name:"Pasta",w:64,h:100,weight:1.0,temp:"room",fragile:1,category:"pantry"},
  {id:"rice",name:"Rice",w:80,h:72,weight:2.0,temp:"room",fragile:1,category:"pantry"},
  {id:"detergent",name:"Detergent",w:76,h:102,weight:6.5,temp:"room",fragile:1,category:"household"},
  {id:"towels",name:"Paper Towels",w:110,h:86,weight:1.1,temp:"room",fragile:1,soft:true,category:"household"},
  {id:"cheese",name:"Cheese",w:72,h:48,weight:0.8,temp:"cold",fragile:1,category:"cold"},
  {id:"lettuce",name:"Lettuce",w:88,h:76,weight:1.0,temp:"cold",fragile:4,soft:true,category:"produce"},
  {id:"sauce",name:"Glass Sauce",w:54,h:94,weight:2.1,temp:"room",fragile:5,category:"pantry"},
  {id:"soda",name:"6-Pack Soda",w:116,h:76,weight:5.4,temp:"room",fragile:1,category:"pantry"},
  {id:"butter",name:"Butter",w:68,h:38,weight:0.5,temp:"cold",fragile:1,category:"cold"},
  {id:"tomatoes",name:"Tomatoes",w:86,h:54,weight:1.4,temp:"room",fragile:5,soft:true,category:"produce"},
  {id:"cookies",name:"Cookies",w:78,h:72,weight:0.9,temp:"room",fragile:4,category:"bakery"},
  {id:"coffee",name:"Coffee",w:62,h:88,weight:1.0,temp:"room",fragile:1,category:"pantry"},
  {id:"flowers",name:"Flowers",w:52,h:118,weight:0.6,temp:"room",fragile:5,category:"produce"}
];

let queue = [];
let placements = [];
let selectedId = null;
let rotations = {};
let startedAt = null;
let timerHandle = null;
let elapsed = 0;
let history = [];

const $ = (s) => document.querySelector(s);
const currentItem = $("#currentItem");
const itemQueue = $("#itemQueue");
const selectionStatus = $("#selectionStatus");

function resetGame() {
  queue = items.map(i => i.id);
  placements = [];
  selectedId = queue[0];
  rotations = {};
  history = [];
  startedAt = null;
  elapsed = 0;
  clearInterval(timerHandle);
  timerHandle = null;
  $("#resultsDialog").close();
  renderAll();
}

function itemById(id) { return items.find(item => item.id === id); }

function itemElement(item, className="") {
  const rotation = rotations[item.id] || 0;
  const el = document.createElement("div");
  el.className = `grocery-item category-${item.category} ${className}${selectedId===item.id?" selected":""}`;
  el.dataset.id = item.id;
  el.draggable = !className.includes("queue-item");
  el.tabIndex = className.includes("queue-item") ? -1 : 0;
  const rotated = rotation % 180 !== 0;
  el.style.width = (rotated ? item.h : item.w) + "px";
  el.style.height = (rotated ? item.w : item.h) + "px";
  el.innerHTML = `<span class="item-name">${item.name}</span><span class="item-code">${item.weight.toFixed(1)} LB</span>`;
  if (!className.includes("queue-item")) {
    el.addEventListener("click", (e) => { e.stopPropagation(); selectItem(item.id); });
    el.addEventListener("dragstart", (e) => {
      startTimer();
      selectedId = item.id;
      e.dataTransfer.setData("text/plain", item.id);
      e.dataTransfer.effectAllowed = "move";
    });
  }
  return el;
}

function renderBelt() {
  currentItem.innerHTML = "";
  itemQueue.innerHTML = "";
  const current = itemById(queue[0]);
  if (current) currentItem.append(itemElement(current));
  else currentItem.innerHTML = '<strong>ALL ITEMS BAGGED</strong>';
  queue.slice(1,8).forEach(id => itemQueue.append(itemElement(itemById(id),"queue-item")));
  $("#remainingCount").textContent = queue.length;
  renderDetails(selectedId ? itemById(selectedId) : current);
}

function renderDetails(item) {
  $("#itemDetails").innerHTML = item ? `
    <span><b>${item.name}</b></span>
    <span>Weight: <b>${item.weight.toFixed(1)} lb</b></span>
    <span>Temperature: <b>${item.temp}</b></span>
    <span>Fragility: <b>${item.fragile}/5</b></span>
    <span>Category: <b>${item.category}</b></span>
    <span>Shape: <b>${item.w} × ${item.h}</b></span>` : "<span>Order packed. Review bags and finish.</span>";
}

function renderBags() {
  [1,2].forEach(n => {
    const bag = $("#bag"+n);
    bag.querySelectorAll(".placed-item").forEach(el => el.remove());
    placements.filter(p=>p.bag===n).forEach(p => {
      const item=itemById(p.id);
      const el=itemElement(item,"placed-item");
      el.style.left=p.x+"px";
      el.style.top=p.y+"px";
      el.style.zIndex=p.order+2;
      el.classList.toggle("problem",p.problem);
      bag.append(el);
    });
    const list=placements.filter(p=>p.bag===n);
    const weight=list.reduce((sum,p)=>sum+itemById(p.id).weight,0);
    $("#bag"+n+"Weight").textContent=weight.toFixed(1)+" lb";
    $("#bag"+n+"Meta").textContent=`${list.length} items · 18 lb target`;
    bag.closest(".bag-shell").classList.toggle("overweight",weight>18);
  });
}

function renderAll() {
  renderBelt();
  renderBags();
  updateScore();
  $("#baggedCount").textContent=placements.length;
  $("#undoButton").disabled=!history.length;
  $("#finishButton").disabled=queue.length>0;
  selectionStatus.textContent=selectedId ? `Selected: ${itemById(selectedId).name} · click a bag to place` : "Select an item to begin";
}

function selectItem(id) {
  selectedId=id;
  startTimer();
  renderAll();
}

function startTimer() {
  if (startedAt) return;
  startedAt=Date.now()-elapsed*1000;
  timerHandle=setInterval(()=>{
    elapsed=Math.floor((Date.now()-startedAt)/1000);
    $("#timer").textContent=formatTime(elapsed);
    updateScore();
  },1000);
}

function formatTime(s) { return Math.floor(s/60)+":"+String(s%60).padStart(2,"0"); }

function rotateSelected() {
  if(!selectedId) return;
  rotations[selectedId]=((rotations[selectedId]||0)+90)%180;
  const p=placements.find(x=>x.id===selectedId);
  if(p) {
    const bag=$("#bag"+p.bag);
    const item=itemById(p.id);
    const rotated=rotations[p.id]%180!==0;
    p.x=Math.min(p.x,bag.clientWidth-(rotated?item.h:item.w));
    p.y=Math.min(p.y,bag.clientHeight-(rotated?item.w:item.h));
  }
  renderAll();
}

function snapshot() {
  history.push({
    queue:[...queue],
    placements:placements.map(p=>({...p})),
    rotations:{...rotations},
    selectedId
  });
}

function placeItem(id,bagNumber,x,y) {
  const item=itemById(id);
  if(!item) return;
  startTimer();
  snapshot();
  const existing=placements.find(p=>p.id===id);
  if(existing) placements=placements.filter(p=>p.id!==id);
  const bag=$("#bag"+bagNumber);
  const rotated=(rotations[id]||0)%180!==0;
  const w=rotated?item.h:item.w;
  const h=rotated?item.w:item.h;
  x=Math.max(0,Math.min(x-w/2,bag.clientWidth-w));
  y=Math.max(0,Math.min(y-h/2,bag.clientHeight-h));
  placements.push({id,bag:bagNumber,x:Math.round(x),y:Math.round(y),order:placements.length});
  queue=queue.filter(q=>q!==id);
  selectedId=queue[0]||null;
  renderAll();
}

function overlaps(a,b) {
  const ia=itemById(a.id), ib=itemById(b.id);
  const ar=(rotations[a.id]||0)%180!==0, br=(rotations[b.id]||0)%180!==0;
  const aw=ar?ia.h:ia.w, ah=ar?ia.w:ia.h, bw=br?ib.h:ib.w, bh=br?ib.w:ib.h;
  return a.x < b.x+bw && a.x+aw > b.x && a.y < b.y+bh && a.y+ah > b.y;
}

function calculateScore() {
  let care=placements.length*2;
  let grouping=0;
  let weight=20;
  const warnings=[];
  placements.forEach(p=>p.problem=false);
  for(let i=0;i<placements.length;i++) {
    for(let j=i+1;j<placements.length;j++) {
      const a=placements[i],b=placements[j];
      if(a.bag!==b.bag) continue;
      const ia=itemById(a.id),ib=itemById(b.id);
      const dx=Math.abs(a.x-b.x),dy=Math.abs(a.y-b.y);
      if(ia.category===ib.category && dx<150 && dy<150) grouping+=1;
      if(overlaps(a,b)) {
        const top=a.order>b.order?a:b;
        const bottom=top===a?b:a;
        const topItem=itemById(top.id),bottomItem=itemById(bottom.id);
        if((bottomItem.fragile>=4||bottomItem.soft) && topItem.weight>=2) {
          care-=8;
          bottom.problem=true;
          warnings.push(`${bottomItem.name} may be crushed by ${topItem.name}.`);
        } else {
          care-=1;
        }
      }
    }
  }
  [1,2].forEach(n=>{
    const list=placements.filter(p=>p.bag===n);
    const total=list.reduce((s,p)=>s+itemById(p.id).weight,0);
    if(total>18) {
      const over=total-18;
      weight-=Math.ceil(over*3);
      warnings.push(`Bag ${n} is ${over.toFixed(1)} lb over the target.`);
    }
    const hasHousehold=list.some(p=>itemById(p.id).category==="household");
    const hasFood=list.some(p=>itemById(p.id).category!=="household");
    if(hasHousehold&&hasFood) {
      care-=4;
      warnings.push(`Bag ${n} mixes household products with food.`);
    }
    const frozen=list.filter(p=>itemById(p.id).temp==="frozen").length;
    if(frozen===1) {
      grouping-=2;
      warnings.push(`A frozen item is isolated in Bag ${n}.`);
    }
  });
  const speed=Math.max(0,50-Math.floor(elapsed/5));
  return {
    packing:placements.length*10,
    care:Math.max(0,care),
    grouping:Math.max(0,Math.min(30,grouping)),
    weight:Math.max(0,weight),
    speed,
    warnings
  };
}

function updateScore() {
  const s=calculateScore();
  placements.forEach(p=>p.problem=false);
  calculateScore();
  const total=s.packing+s.care+s.grouping+s.weight+s.speed;
  $("#packingScore").textContent=s.packing;
  $("#careScore").textContent=s.care;
  $("#groupScore").textContent=s.grouping;
  $("#weightScore").textContent=s.weight;
  $("#speedScore").textContent=s.speed;
  $("#totalScore").textContent=total;
  $("#score").textContent=total;
  $("#warningList").innerHTML=s.warnings.length?s.warnings.map(w=>`<li>${w}</li>`).join(""):'<li class="quiet">No issues detected.</li>';
  document.querySelectorAll(".placed-item").forEach(el=>{
    const p=placements.find(x=>x.id===el.dataset.id);
    el.classList.toggle("problem",Boolean(p?.problem));
  });
  return {...s,total};
}

document.querySelectorAll(".bag").forEach(bag=>{
  bag.addEventListener("dragover",e=>{e.preventDefault();bag.classList.add("drag-over");});
  bag.addEventListener("dragleave",()=>bag.classList.remove("drag-over"));
  bag.addEventListener("drop",e=>{
    e.preventDefault();bag.classList.remove("drag-over");
    const rect=bag.getBoundingClientRect();
    placeItem(e.dataTransfer.getData("text/plain"),Number(bag.dataset.bag),e.clientX-rect.left,e.clientY-rect.top);
  });
  bag.addEventListener("click",e=>{
    if(e.target.closest(".placed-item")) return;
    if(!selectedId) return;
    const rect=bag.getBoundingClientRect();
    placeItem(selectedId,Number(bag.dataset.bag),e.clientX-rect.left,e.clientY-rect.top);
  });
});

$("#rotateButton").addEventListener("click",rotateSelected);
$("#undoButton").addEventListener("click",()=>{
  const last=history.pop();
  if(!last)return;
  queue=last.queue;placements=last.placements;rotations=last.rotations;selectedId=last.selectedId;
  renderAll();
});
$("#resetButton").addEventListener("click",()=>{if(confirm("Reset this order?"))resetGame();});
$("#finishButton").addEventListener("click",()=>{
  clearInterval(timerHandle);
  const s=updateScore();
  const issues=s.warnings.length;
  $("#resultsBody").innerHTML=`<div class="results-grid">
    <div><span>Final score</span><strong>${s.total}</strong></div>
    <div><span>Time</span><strong>${formatTime(elapsed)}</strong></div>
    <div><span>Items packed</span><strong>25/25</strong></div>
    <div><span>Bag issues</span><strong>${issues}</strong></div>
  </div><p class="results-note">${issues?"The order is packed, but the bag check found "+issues+" issue"+(issues===1?"":"s")+". Try different positioning, weight balance, or category grouping.":"Clean pack. The order is protected, balanced, and ready to go."}</p>`;
  $("#resultsDialog").showModal();
});
$("#playAgainButton").addEventListener("click",resetGame);
document.addEventListener("keydown",e=>{
  if(e.key.toLowerCase()==="r")rotateSelected();
  if(e.key==="Escape"){selectedId=null;renderAll();}
});

resetGame();