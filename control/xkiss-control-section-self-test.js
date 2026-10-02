import {runAutonomousControl} from "./xkiss-control-runner.js";
export async function runControlSectionSelfTest(){const r=await runAutonomousControl();return {...r,ok:r.ok===true&&r.failClosed===true&&r.productionActivationAllowed===false,status:r.ok?"GREEN_CLOSED":"FAULT_FAIL_CLOSED",test:"XKiss Section 18 Autonomous Control operational self-test"};}
