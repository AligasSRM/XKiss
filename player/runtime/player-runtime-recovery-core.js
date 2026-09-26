import{validateXKissPlayerRuntimeRecoveryRequest}from"./player-runtime-recovery-rules.js";
export const XKISS_PLAYER_RUNTIME_RECOVERY_CORE={section:"15.22",name:"XKiss Player Runtime Recovery Core",version:"1.0.0",status:"connected",failClosed:true};
let recovery={status:"unknown",timestamp:0,attempts:0,lastAction:null};
export function recoverXKissPlayerRuntime(input={}){const allowed=input.playerCoreConnected===true&&input.monitoringConnected===true;const healthy=allowed&&input.runtimeHealthy===true;recovery={status:healthy?"healthy":allowed?"recovery-required":"blocked",timestamp:Date.now(),attempts:allowed?recovery.attempts+1:recovery.attempts,lastAction:allowed?"recover":null};return{...recovery};}
export function resetXKissPlayerRuntimeRecovery(){recovery={status:"unknown",timestamp:0,attempts:0,lastAction:"reset"};return{ok:true,...recovery};}
export function getXKissPlayerRuntimeRecovery(){return{...recovery};}
export function evaluateXKissPlayerRuntimeRecovery(request={}){const v=validateXKissPlayerRuntimeRecoveryRequest(request);return{allowed:v.allowed===true,gates:v.gates};}