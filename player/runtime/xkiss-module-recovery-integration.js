import {createXKissModuleRecovery} from "./xkiss-module-recovery-core.js";
export function installXKissModuleRecovery(core){
  if(!core)return{ok:false,error:"player-core-required",stage:"15.30"};
  if(!core.moduleHealth||!core.moduleDiagnostics||!core.moduleLifecycle||!core.moduleContracts)return{ok:false,error:"recovery-prerequisite-missing",stage:"15.30"};
  if(core.moduleRecovery)return{ok:true,stage:"15.30",coreControlled:true,reused:true,recovery:core.moduleRecovery};
  try{const recovery=createXKissModuleRecovery(core);core.moduleRecovery=recovery;core.registerModule("module-recovery","active");return{ok:true,stage:"15.30",coreControlled:core.moduleRecovery===recovery,recovery};}
  catch(error){return{ok:false,error:String(error?.message||error),stage:"15.30"};}
}