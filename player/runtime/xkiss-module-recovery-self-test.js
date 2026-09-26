import {installXKissModuleLifecycle} from "./xkiss-module-lifecycle-integration.js";
import {installXKissModuleContractRegistry} from "./xkiss-module-contract-integration.js";
import {installXKissModuleHealth} from "./xkiss-module-health-integration.js";
import {installXKissModuleDiagnostics} from "./xkiss-module-diagnostics-integration.js";
import {installXKissModuleRecovery} from "./xkiss-module-recovery-integration.js";
export async function runXKissModuleRecoverySelfCheck(){
  const core={modules:{},registerModule(n,s="ready"){this.modules[n]=s;},getModuleStatus(){return{...this.modules}}};
  const lifecycle=installXKissModuleLifecycle(core); const contracts=installXKissModuleContractRegistry(core);
  const reg=lifecycle.lifecycle.register("repairable"); lifecycle.lifecycle.initialize("repairable"); lifecycle.lifecycle.activate("repairable");
  contracts.contracts.register("repairable",{version:"1.0.0",dependencies:[],capabilities:["repair"]});
  const health=installXKissModuleHealth(core); const diagnostics=installXKissModuleDiagnostics(core); const recovery=installXKissModuleRecovery(core);
  const handler=recovery.recovery.registerRepair("repairable",async()=>({ok:true}));
  health.health.report({module:"repairable",status:"FAULT",severity:"HIGH",timestamp:Date.now(),reason:"test"});
  const recovered=await recovery.recovery.recover({module:"repairable",reason:"test"});
  health.health.report({module:"broken",status:"FAULT",severity:"HIGH",timestamp:Date.now()});
  const failed=await recovery.recovery.recover({module:"broken"});
  return{ok: lifecycle.ok&&contracts.ok&&reg.ok&&health.ok&&diagnostics.ok&&recovery.ok&&handler.ok&&recovered.ok&&recovered.status==="RECOVERED"&&failed.ok===false&&failed.requiresManualIntervention===true,stage:"15.30",recovered,failed};
}