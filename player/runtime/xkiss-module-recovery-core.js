import {XKISS_MODULE_RECOVERY_RULES,validateRecoveryRequest} from "./xkiss-module-recovery-rules.js";
export function createXKissModuleRecovery(core){
  if(!core?.moduleHealth||!core?.moduleDiagnostics||!core?.moduleLifecycle||!core?.moduleContracts)throw new Error("Recovery requires Health, Diagnostics, Lifecycle and Contracts.");
  const health=core.moduleHealth,diagnostics=core.moduleDiagnostics,lifecycle=core.moduleLifecycle,contracts=core.moduleContracts;
  const repairs=new Map(),history=[];
  function emit(type,detail={}){const e={id:"recovery-"+(history.length+1),type,timestamp:Date.now(),detail};history.push(e);if(history.length>XKISS_MODULE_RECOVERY_RULES.maxHistory)history.shift();return e;}
  function registerRepair(module,handler){
    const v=validateRecoveryRequest({module}); if(!v.ok||typeof handler!=="function")return{ok:false,error:v.error||"invalid-handler"};
    if(!contracts.has(module))return{ok:false,error:"unknown-module"};
    if(repairs.has(module))return{ok:false,error:"repair-handler-already-registered"};
    repairs.set(module,handler); return{ok:true,module};
  }
  async function recover(request){
    const v=validateRecoveryRequest(request); if(!v.ok)return{ok:false,status:"FAILED",...v};
    const module=request.module;
    if(!contracts.has(module))return{ok:false,status:"FAILED",error:"unknown-module"};
    const fault=health.get(module);
    if(!fault||!["FAULT","OFFLINE","LOCKED"].includes(fault.status))return{ok:true,status:"SKIPPED",reason:"no-recoverable-fault",module};
    const handler=repairs.get(module);
    if(!handler){emit("recovery-failed",{module,reason:"no-safe-repair-handler"});return{ok:false,status:"FAILED",module,error:"no-safe-repair-handler",requiresManualIntervention:true};}
    try{
      const locked=health.lock(module,"auto-recovery");
      if(!locked.ok)throw new Error(locked.error||"isolation-failed");
      emit("module-isolated",{module});
      const result=await handler({core,module,reason:request.reason||"health-fault"});
      if(result?.ok!==true)throw new Error(result?.error||"repair-handler-failed");
      const current=lifecycle.getStatus(module);
      if(current?.state==="inactive")lifecycle.activate(module);
      const after=lifecycle.getStatus(module);
      if(after?.state!=="active")throw new Error("module-restart-failed");
      const report=health.report({module,status:"HEALTHY",severity:"INFO",timestamp:Date.now(),reason:"auto-recovered"});
      if(!report.ok)throw new Error("health-restore-failed");
      const check=diagnostics.locate().find(x=>x.module===module);
      if(check)throw new Error("fault-remains");
      emit("module-recovered",{module});
      return{ok:true,status:"RECOVERED",module};
    }catch(error){
      emit("recovery-failed",{module,error:String(error?.message||error)});
      return{ok:false,status:"FAILED",module,error:String(error?.message||error),requiresManualIntervention:true};
    }
  }
  function getStatus(){const failed=history.filter(e=>e.type==="recovery-failed").length;return{stage:"15.30",status:failed?"WARNING":"HEALTHY",repairHandlers:repairs.size,events:history.length,recoveryReady:true};}
  return Object.freeze({stage:"15.30",rules:XKISS_MODULE_RECOVERY_RULES,registerRepair,recover,getStatus,getEvents:()=>history.map(e=>({...e,detail:{...e.detail}}))});
}