import {XKISS_SECTION_19_EXTERNAL_DEPENDENCIES} from "./xkiss-section-19-external-dependencies.js";
import {validateSection19Lock} from "./xkiss-section-19-lock.js";

const REQUIRED_SECTIONS=Object.freeze(["1","2","3","4","5","6","7","8","9","10","11","12","13","14","15","16","17","18"]);

export function runProductionActivationReadiness(){
  const deps=XKISS_SECTION_19_EXTERNAL_DEPENDENCIES.dependencies;
  const externalVerified=Object.values(deps).every(v=>v===true);
  const lock=validateSection19Lock();
  return {
    ok:lock.ok===true,
    section:"19",
    status:"GREEN_CLOSED",
    readiness:externalVerified?"EXTERNAL_VERIFIED":"EXTERNAL_VERIFICATION_REQUIRED",
    requiredSections:REQUIRED_SECTIONS,
    dependencies:deps,
    allExternalVerified:externalVerified,
    productionActivationAllowed:false,
    failClosed:true,
    activationDecision:"BLOCKED_UNTIL_EXTERNAL_VERIFICATION"
  };
}
