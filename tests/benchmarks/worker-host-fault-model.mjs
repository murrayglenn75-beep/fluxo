// Sandbox-only deterministic fault-model benchmark. No real provider I/O.
import assert from 'node:assert/strict';
import {performance} from 'node:perf_hooks';

function runScenario({workers, crashAfterSubmit=false, duplicateEvents=0, networkTimeout=false}) {
 const state={status:'pending',lease:null,submitted:0,posted:0,reconcile:0,events:new Set()};
 function lease(worker) {
  if(state.status!=='pending') return false;
  state.status='leased';state.lease=worker;return true;
 }
 assert.equal(lease('worker-a'),true);
 if(workers>1)assert.equal(lease('worker-b'),false,'second worker must not acquire lease');
 // Provider request may have reached provider even when the worker crashes.
 state.submitted++;
 if(crashAfterSubmit||networkTimeout) {
  state.status='reconcile';state.lease=null;state.reconcile++;
  assert.equal(lease('worker-b'),false,'uncertain effect must not be resubmitted');
 } else {
  state.status='settled';
  for(let i=0;i<=duplicateEvents;i++){
   const eventId='signed-provider-event-1';
   if(state.events.has(eventId))continue;
   state.events.add(eventId);
   state.posted++;
  }
 }
 assert.equal(state.submitted,1);
 assert.ok(state.posted<=1);
 return state;
}
const scenarios=[
 {name:'single-worker',workers:1},
 {name:'two-worker-contention',workers:2},
 {name:'crash-after-provider-submit',workers:2,crashAfterSubmit:true},
 {name:'provider-timeout',workers:2,networkTimeout:true},
 {name:'duplicate-provider-events',workers:2,duplicateEvents:1000}
];
const result=scenarios.map(({name,...args})=>{
 const start=performance.now();
 const state=runScenario(args);
 return {name,passed:true,elapsedMs:Number((performance.now()-start).toFixed(3)),submitted:state.submitted,posted:state.posted,reconcile:state.reconcile};
});
console.log(JSON.stringify({kind:'sandbox-fault-model',note:'Not a PostgreSQL or Vercel Daemons integration benchmark',result},null,2));
