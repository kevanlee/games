const orders = [
  {coffee:"regular",milk:false,sugar:false,label:"Regular · black"},
  {coffee:"regular",milk:true,sugar:false,label:"Regular · milk"},
  {coffee:"decaf",milk:false,sugar:true,label:"Decaf · sugar"},
  {coffee:"regular",milk:true,sugar:true,label:"Regular · milk + sugar"},
  {coffee:"decaf",milk:false,sugar:false,label:"Decaf · black"}
];

const starts = {
  regular:{x:48,y:115}, decaf:{x:132,y:115}, moka:{x:240,y:330},
  mug:{x:725,y:335}, milk:{x:845,y:315}, sugar:{x:925,y:335}, spoon:{x:1015,y:365}
};

const stationCenters = {
  shelf:{x:119,y:149}, sink:{x:367,y:142}, stove:{x:602,y:149},
  counter:{x:885,y:149}, serve:{x:1099,y:395}, mug:null, moka:null
};

let orderIndex=0;
let selected=null;
let dragging=null;
let offset={x:0,y:0};
let state={};
let orderStarted=0;
let totalScore=0;
let mistakes=0;
let heatTimer=null;
let clockTimer=null;
let heatStart=0;

const $=s=>document.querySelector(s);
const surface=$("#workstation");

function resetState() {
  clearInterval(heatTimer);
  clearInterval(clockTimer);
  state={
    grounds:null,bagReturned:false,water:false,onStove:false,heating:false,
    ready:false,burnt:false,brewed:false,poured:false,milk:false,sugar:false,
    stirred:false,served:false
  };
  mistakes=0;
  selected=null;
  Object.entries(starts).forEach(([id,p])=>{
    const el=$("#"+id);
    el.style.left=p.x+"px";
    el.style.top=p.y+"px";
    el.classList.remove("selected","near");
  });
  orderStarted=Date.now();
  clockTimer=setInterval(updateClock,250);
  $("#nextButton").disabled=true;
  $("#heatMeter").hidden=true;
  $("#heatFill").style.width="0";
  $("#heatLabel").textContent="OFF";
  $("#mokaState").textContent="EMPTY";
  $("#mugState").textContent="EMPTY";
  render();
}

function currentOrder(){return orders[orderIndex];}

function centerOf(el) {
  return {x:el.offsetLeft+el.offsetWidth/2,y:el.offsetTop+el.offsetHeight/2};
}

function distance(a,b){return Math.hypot(a.x-b.x,a.y-b.y);}

function nearestStation(id) {
  const pos=centerOf($("#"+id));
  const centers={...stationCenters,mug:centerOf($("#mug")),moka:centerOf($("#moka"))};
  let result=null,best=Infinity;
  Object.entries(centers).forEach(([name,point])=>{
    if(name===id||!point)return;
    const d=distance(pos,point);
    if(d<best){best=d;result=name;}
  });
  return best<145?{name:result,distance:best}:null;
}

function select(id) {
  selected=id;
  document.querySelectorAll(".object").forEach(el=>el.classList.toggle("selected",el.id===id));
  updateNear();
}

function updateNear() {
  document.querySelectorAll(".object").forEach(el=>el.classList.remove("near"));
  if(!selected){$("#proximityLine").textContent="Nothing selected";return;}
  const near=nearestStation(selected);
  if(near) {
    const station=document.querySelector('[data-station="'+near.name+'"]')||$("#"+near.name);
    station?.classList.add("near");
    $("#proximityLine").textContent=selected.toUpperCase()+" near "+near.name.toUpperCase()+" · SPACE OR RIGHT-CLICK TO USE";
  } else {
    $("#proximityLine").textContent=selected.toUpperCase()+" selected · move it near a station";
  }
}

function instruction() {
  const o=currentOrder();
  if(state.burnt)return "The coffee burned. Reset this order.";
  if(!state.grounds)return "Bring the "+o.coffee+" coffee to the Moka pot.";
  if(!state.bagReturned)return "Put the coffee bag back on the shelf.";
  if(!state.water)return "Bring the Moka pot to the sink and fill it.";
  if(!state.onStove&&!state.brewed)return "Set the Moka pot on the stove.";
  if(state.heating&&!state.ready)return "Wait. The coffee is brewing.";
  if(state.heating&&state.ready)return "Ready. Take the Moka pot off the stove.";
  if(state.brewed&&!state.poured)return "Bring the Moka pot to the mug and pour.";
  if(o.milk&&!state.milk)return "Bring the milk to the mug.";
  if(o.sugar&&!state.sugar)return "Bring the sugar to the mug.";
  if(!state.stirred)return "Bring the spoon to the mug and stir.";
  if(!state.served)return "Bring the mug to the service window.";
  return "Order served.";
}

function render() {
  $("#orderNumber").textContent=orderIndex+1;
  $("#orderText").textContent=currentOrder().label;
  $("#instruction").textContent=instruction();
  $("#score").textContent=totalScore;
  $("#mokaState").textContent=state.burnt?"BURNT":state.brewed?"BREWED":state.ready?"READY":state.heating?"HEATING":state.water&&state.grounds?"FILLED":state.grounds?"COFFEE":state.water?"WATER":"EMPTY";
  const mugBits=[];
  if(state.poured)mugBits.push("COFFEE");
  if(state.milk)mugBits.push("MILK");
  if(state.sugar)mugBits.push("SUGAR");
  if(state.stirred)mugBits.push("STIRRED");
  $("#mugState").textContent=mugBits.length?mugBits.join("+"):"EMPTY";
  updateNear();
}

function fail(message) {
  mistakes++;
  $("#instruction").textContent=message;
  surface.classList.add("error");
  setTimeout(()=>{surface.classList.remove("error");render();},900);
}

function interact() {
  if(!selected||state.served)return;
  const near=nearestStation(selected);
  if(!near){fail("Move the item closer to the correct station.");return;}
  const o=currentOrder();
  const target=near.name;

  if((selected==="regular"||selected==="decaf")&&target==="moka") {
    if(state.grounds){fail("The Moka pot already has coffee.");return;}
    if(selected!==o.coffee){fail("Wrong coffee for this order.");return;}
    state.grounds=selected;
    $("#"+selected).classList.add("used");
    render();return;
  }

  if((selected==="regular"||selected==="decaf")&&target==="shelf") {
    if(state.grounds!==selected){fail("Use this coffee before returning it.");return;}
    state.bagReturned=true;
    snapTo(selected,starts[selected].x,starts[selected].y);
    render();return;
  }

  if(selected==="moka"&&target==="sink") {
    if(!state.grounds||!state.bagReturned){fail("Coffee first. Then return the bag.");return;}
    state.water=true;render();return;
  }

  if(selected==="moka"&&target==="stove") {
    if(!state.grounds||!state.water){fail("Fill the Moka pot before heating.");return;}
    if(state.burnt){fail("This batch is burned.");return;}
    startHeat();return;
  }

  if(selected==="moka"&&target==="mug") {
    if(!state.brewed){fail("Brew the coffee and remove it from the stove first.");return;}
    state.poured=true;render();return;
  }

  if(selected==="milk"&&target==="mug") {
    if(!state.poured){fail("Pour the coffee first.");return;}
    if(!o.milk){fail("This order does not include milk.");return;}
    state.milk=true;render();return;
  }

  if(selected==="sugar"&&target==="mug") {
    if(!state.poured){fail("Pour the coffee first.");return;}
    if(!o.sugar){fail("This order does not include sugar.");return;}
    state.sugar=true;render();return;
  }

  if(selected==="spoon"&&target==="mug") {
    if(!state.poured){fail("There is nothing to stir yet.");return;}
    if(o.milk&&!state.milk){fail("Add the milk before stirring.");return;}
    if(o.sugar&&!state.sugar){fail("Add the sugar before stirring.");return;}
    state.stirred=true;render();return;
  }

  if(selected==="mug"&&target==="serve") {
    if(!state.stirred){fail("Stir the drink before serving.");return;}
    if(o.milk&&!state.milk||o.sugar&&!state.sugar){fail("The order is incomplete.");return;}
    serveOrder();return;
  }

  fail("That interaction does nothing here.");
}

function startHeat() {
  if(state.heating)return;
  state.onStove=true;
  state.heating=true;
  state.ready=false;
  heatStart=Date.now();
  $("#heatMeter").hidden=false;
  $("#heatLabel").textContent="ON";
  snapTo("moka",562,92);
  clearInterval(heatTimer);
  heatTimer=setInterval(()=>{
    const seconds=(Date.now()-heatStart)/1000;
    $("#heatFill").style.width=Math.min(100,seconds/11*100)+"%";
    if(seconds>=6&&!state.ready){
      state.ready=true;
      $("#heatStatus").textContent="Ready";
      render();
    } else if(!state.ready) {
      $("#heatStatus").textContent="Heating";
    }
    if(seconds>=11) {
      clearInterval(heatTimer);
      state.heating=false;
      state.ready=false;
      state.burnt=true;
      $("#heatStatus").textContent="Burned";
      $("#heatLabel").textContent="BURNED";
      render();
    }
  },100);
  render();
}

function removeFromHeat() {
  if(!state.heating)return;
  const d=distance(centerOf($("#moka")),stationCenters.stove);
  if(d<150)return;
  if(!state.ready) {
    clearInterval(heatTimer);
    state.heating=false;state.onStove=false;state.ready=false;
    mistakes++;
    $("#heatStatus").textContent="Too soon";
    $("#heatLabel").textContent="OFF";
    $("#heatMeter").hidden=true;
    fail("Too soon. Put it back on the stove.");
  } else {
    clearInterval(heatTimer);
    state.heating=false;state.onStove=false;state.ready=false;state.brewed=true;
    $("#heatStatus").textContent="Brewed";
    $("#heatLabel").textContent="OFF";
    render();
  }
}

function snapTo(id,x,y) {
  const el=$("#"+id);el.style.left=x+"px";el.style.top=y+"px";
}

function serveOrder() {
  state.served=true;
  clearInterval(clockTimer);
  const seconds=Math.floor((Date.now()-orderStarted)/1000);
  const earned=Math.max(40,120-seconds*2-mistakes*10);
  totalScore+=earned;
  $("#score").textContent=totalScore;
  $("#instruction").textContent="Served · +"+earned+" points";
  $("#nextButton").disabled=false;
  render();
}

function updateClock() {
  const seconds=Math.floor((Date.now()-orderStarted)/1000);
  $("#timer").textContent=Math.floor(seconds/60)+":"+String(seconds%60).padStart(2,"0");
}

document.querySelectorAll(".object").forEach(el=>{
  el.addEventListener("pointerdown",e=>{
    if(e.button!==0)return;
    select(el.id);
    dragging=el;
    const rect=el.getBoundingClientRect();
    const surfaceRect=surface.getBoundingClientRect();
    offset={x:e.clientX-rect.left,y:e.clientY-rect.top};
    el.setPointerCapture(e.pointerId);
    e.preventDefault();
  });
  el.addEventListener("pointermove",e=>{
    if(dragging!==el)return;
    const rect=surface.getBoundingClientRect();
    const x=Math.max(0,Math.min(e.clientX-rect.left-offset.x,surface.clientWidth-el.offsetWidth));
    const y=Math.max(0,Math.min(e.clientY-rect.top-offset.y,surface.clientHeight-el.offsetHeight-55));
    el.style.left=x+"px";el.style.top=y+"px";updateNear();
  });
  el.addEventListener("pointerup",e=>{
    if(dragging!==el)return;
    dragging=null;
    el.releasePointerCapture(e.pointerId);
    if(el.id==="moka")removeFromHeat();
    updateNear();
  });
  el.addEventListener("contextmenu",e=>{e.preventDefault();e.stopPropagation();select(el.id);interact();});
  el.addEventListener("keydown",e=>{if(e.key===" "||e.key==="Enter"){e.preventDefault();select(el.id);interact();}});
});

document.addEventListener("keydown",e=>{
  if(e.key===" "&&selected&&!e.target.classList.contains("object")){e.preventDefault();interact();}
  if(e.key.toLowerCase()==="r")resetState();
});

surface.addEventListener("contextmenu",e=>{e.preventDefault();interact();});
$("#resetButton").addEventListener("click",resetState);
$("#nextButton").addEventListener("click",()=>{
  if(!state.served)return;
  if(orderIndex===orders.length-1) {
    $("#resultSummary").innerHTML="<p><strong>"+totalScore+" points</strong></p><p>You completed all five Moka orders.</p>";
    $("#resultDialog").showModal();
  } else {
    orderIndex++;resetState();
  }
});
$("#againButton").addEventListener("click",()=>{
  $("#resultDialog").close();orderIndex=0;totalScore=0;resetState();
});

resetState();