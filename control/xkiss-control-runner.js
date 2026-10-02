import {validateAutonomousControl} from "./xkiss-autonomous-control-core.js";
import {XKISS_AUTONOMOUS_POLICY} from "./xkiss-autonomous-control-policy.js";
import {validateControlLock} from "./xkiss-control-lock.js";
import {runControlRegression} from "./xkiss-control-regression.js";
import {validateDesiredState} from "./xkiss-control-desired-state.js";
import {runLiveControlCheck} from "./xkiss-control-live-check.js";
import {createControlAudit} from "./xkiss-control-audit.js";
import {runAuthSecurityMonitor} from "../security/xkiss-auth-security-monitor.js";
import {runSecretManagementMonitor} from "../security/xkiss-secret-management-monitor.js";
import {evaluateHealth} from "./xkiss-control-health.js";

export async function runAutonomousControl(){
  const core=validateAutonomousControl();
  const policy=Boolean(XKISS_AUTONOMOUS_POLICY.failClosed&&XKISS_AUTONOMOUS_POLICY.requireVerificationAfterRepair&&XKISS_AUTONOMOUS_POLICY.requireAudit);
  const lock=validateControlLock();
  const desired=validateDesiredState();
  const regression=runControlRegression();
  const live=await runLiveControlCheck();
  const auth=runAuthSecurityMonitor();
  const secrets=runSecretManagementMonitor();
  const health=evaluateHealth({pages:live.pages,worker:live.workerHealth,auth});
  const ok=core.ok&&policy&&lock.ok&&desired.ok&&regression.ok&&live.ok&&auth.ok&&secrets.ok&&health.ok;
  const audit=createControlAudit({action:ok?"CONTINUE_MONITORING":"DIAGNOSE_AND_ESCALATE",reason:ok?"CONTROL_STATE_GREEN":"CONTROL_STATE_REQUIRES_ATTENTION",result:ok?"VERIFIED":"BLOCKED_FAIL_CLOSED"});
  return {ok,section:"18",mode:"CONTINUOUS_CONTROL",core,policy,lock,desired,regression,live,auth,secrets,health,audit,automaticRepairPolicy:XKISS_AUTONOMOUS_POLICY.automaticActions,failClosed:true,productionActivationAllowed:false};
}
