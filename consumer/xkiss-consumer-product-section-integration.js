import {validateConsumerProductFoundation} from "./xkiss-consumer-product-section-core.js";
import {validateConsumerModules} from "./xkiss-consumer-product-modules.js";
import {runConsumerProductRegression} from "./xkiss-consumer-product-regression.js";
import {validateSection17Lock} from "./xkiss-section-17-lock.js";
export function runConsumerProductIntegration(){const foundation=validateConsumerProductFoundation();const modules=validateConsumerModules();const regression=runConsumerProductRegression();const lock=validateSection17Lock();return {ok:foundation.ok&&modules.ok&&regression.ok&&lock.ok,section:"17",status:"GREEN_CLOSED",locked:true,failClosed:true,productionActivationAllowed:false,externalActivationRequired:true,foundation,modules,regression,lock};}