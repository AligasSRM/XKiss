import {runSection20SelfTest} from "./xkiss-final-master-release-self-test.js";

export function runSection20Regression(){
  const a=runSection20SelfTest();
  const b=runSection20SelfTest();
  return {
    ok:a.ok===true&&b.ok===true&&JSON.stringify(a)===JSON.stringify(b),
    section:"20",
    deterministic:true,
    first:a,
    second:b
  };
}
