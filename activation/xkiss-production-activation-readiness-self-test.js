import {runProductionActivationReadiness} from "./xkiss-production-activation-readiness-core.js";
import {validateSection19ExternalDependencies} from "./xkiss-section-19-external-dependencies.js";
import {validateSection19Lock} from "./xkiss-section-19-lock.js";

export function runSection19SelfTest(){
  const readiness=runProductionActivationReadiness();
  const deps=validateSection19ExternalDependencies();
  const lock=validateSection19Lock();
  const ok=readiness.ok===true&&
    readiness.section==="19"&&
    readiness.status==="GREEN_CLOSED"&&
    readiness.failClosed===true&&
    readiness.productionActivationAllowed===false&&
    readiness.activationDecision==="BLOCKED_UNTIL_EXTERNAL_VERIFICATION"&&
    deps.ok===true&&
    deps.allUnverified===true&&
    lock.ok===true;
  return {
    ok,
    test:"XKiss Section 19 Production Activation Readiness self-test",
    section:"19",
    status:ok?"GREEN_CLOSED":"FAULT_FAIL_CLOSED",
    failClosed:true,
    productionActivationAllowed:false,
    externalVerificationRequired:true,
    dependencyCount:Object.keys(readiness.dependencies).length
  };
}
