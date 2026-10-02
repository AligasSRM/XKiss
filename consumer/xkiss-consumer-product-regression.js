import {validateConsumerProductFoundation} from "./xkiss-consumer-product-section-core.js";
import {validateConsumerModules} from "./xkiss-consumer-product-modules.js";
import {validatePlaylist} from "./xkiss-playlists-core.js";
import {validateSubscription} from "./xkiss-subscriptions-core.js";
import {validatePPV} from "./xkiss-ppv-core.js";
import {validateTip} from "./xkiss-tips-gifting-core.js";
import {validateMessage} from "./xkiss-messaging-core.js";
import {validateNotification} from "./xkiss-notifications-core.js";
import {validateRecommendationContext} from "./xkiss-recommendations-core.js";
import {validateWatchEvent} from "./xkiss-watch-history-core.js";
import {validateSavedItem} from "./xkiss-saved-favorites-core.js";
import {validateInteraction} from "./xkiss-viewer-creator-interactions-core.js";
import {validatePrivacyAction} from "./xkiss-privacy-blocking-core.js";
import {validateDiscoveryQuery} from "./xkiss-discovery-core.js";
const checks=[
()=>validatePlaylist({title:"Test"}).ok,()=>validateSubscription({creatorId:"creator"}).ok,
()=>validatePPV({contentId:"video"}).ok,()=>validateTip({creatorId:"creator",amount:1}).ok,
()=>validateMessage({recipientId:"user",body:"test"}).ok,()=>validateNotification({type:"creator"}).ok,
()=>validateRecommendationContext({history:[],preferences:[]}).ok,()=>validateWatchEvent({videoId:"video",position:0}).ok,
()=>validateSavedItem({videoId:"video"}).ok,()=>validateInteraction({creatorId:"creator",action:"follow"}).ok,
()=>validatePrivacyAction({targetId:"user"}).ok,()=>validateDiscoveryQuery({query:"video"}).ok];
export function runConsumerProductRegression(){const foundation=validateConsumerProductFoundation();const modules=validateConsumerModules();const results=checks.map(fn=>fn());return {ok:foundation.ok&&modules.ok&&results.every(Boolean),foundation,modules,checksPassed:results.filter(Boolean).length,checksTotal:results.length,failClosed:true,productionActivationAllowed:false};}