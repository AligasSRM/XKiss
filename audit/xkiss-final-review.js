import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const root = process.cwd();
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");
const exists = (p) => fs.existsSync(path.join(root, p));

const sections = [
  ["1","Home",["index.html","home/home-core.js"]],
  ["2","Videos",["videos.html","videos/videos-core.js"]],
  ["3","Live",["live.html","live/live-core.js"]],
  ["4","Creators",["index.html","home/home-creators.js"]],
  ["5","User Account",["index.html"]],
  ["6","Creator Dashboard",["creator-dashboard.html","creator/creator-dashboard.js"]],
  ["7","Video Upload",["creator-upload.html","upload/upload-core.js"]],
  ["8","Monetization",["monetization.html","monetization/monetization.js"]],
  ["9","Views & Revenue System",["views-revenue/view-pipeline.js","views-revenue/view-event-store.js"]],
  ["10","Creator Wallet & Payouts",["wallet/wallet-ledger-store.js","wallet/payout-lifecycle.js"]],
  ["11","Search & Categories",["search.html","search/search-core.js"]],
  ["12","Safety & Verification",["safety/safety-integration.js","safety/age-verification.js"]],
  ["13","Admin Dashboard",["admin.html","admin/admin-integration.js"]],
  ["14","Super Admin & Security",["security/super-admin-security-core.js","security/super-admin-mfa.js"]],
  ["15","Platform Settings",["settings/xkiss-platform-settings-section-core.js","settings/xkiss-platform-settings-section-self-test.js"]]
];

const jsFiles = [];
const htmlFiles = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir,{withFileTypes:true})) {
    if ([".git","node_modules"].includes(entry.name)) continue;
    const full = path.join(dir,entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.name.endsWith(".js")) jsFiles.push(path.relative(root,full).replaceAll(path.sep,"/"));
    else if (entry.name.endsWith(".html")) htmlFiles.push(path.relative(root,full).replaceAll(path.sep,"/"));
  }
}
walk(root);

const syntaxErrors = [];
for (const file of jsFiles) {
  try { execFileSync(process.execPath,["--check",file],{stdio:"pipe"}); }
  catch (e) { syntaxErrors.push({file,error:String(e.stderr||e.message)}); }
}

const importErrors = [];
const importRe = /(?:import\s+(?:[^'"]+?\s+from\s+)?|export\s+[^'"]+?\s+from\s+|import\()(['"])(\.\.?\/[^'"]+)\1/g;
for (const file of jsFiles) {
  const content = read(file);
  for (const m of content.matchAll(importRe)) {
    const target = path.posix.normalize(path.posix.join(path.posix.dirname(file),m[2]));
    if (!exists(target)) importErrors.push({file,target});
  }
}

const htmlAssetErrors = [];
const assetRe = /(?:src|href)\s*=\s*["']([^"']+)["']/gi;
for (const file of htmlFiles) {
  const content = read(file);
  for (const m of content.matchAll(assetRe)) {
    const target = m[1];
    if (/^(https?:|data:|mailto:|javascript:)/i.test(target)) continue;
    const pathOnly = target.split("#")[0].split("?")[0];
    if (!pathOnly) continue;
    const resolved = path.posix.normalize(path.posix.join(path.posix.dirname(file),pathOnly));
    if (!exists(resolved)) htmlAssetErrors.push({file,target:resolved});
  }
}

const sectionPresence = Object.fromEntries(
  sections.map(([id,name,files]) => [id,{
    name,
    present: files.every(exists),
    missing: files.filter(f=>!exists(f))
  }])
);

const qualityFile = "js/player/player-quality.js";
const qualityContent = exists(qualityFile) ? read(qualityFile) : "";
const requiredQualities = ["340p","460p","720p","1080p"];
const qualityOk = requiredQualities.every(q=>qualityContent.includes(q)) &&
  !/\b(?:360p|400p|1040p)\b/.test(qualityContent);

const releaseLock = exists("core/xkiss-release-lock.js") ? read("core/xkiss-release-lock.js") : "";
const lockStateOk = releaseLock.includes('state: "DEVELOPMENT_ACTIVE"');

const section15 = await import(path.join(root,"settings/xkiss-platform-settings-section-self-test.js").replaceAll(path.sep,"/"));
const section15Result = section15.runXKissPlatformSettingsSectionSelfTest();

const result = {
  stage:"FINAL-REVIEW",
  sections,
  sectionPresence,
  syntaxErrors,
  importErrors,
  htmlAssetErrors,
  qualityOk,
  lockStateOk,
  section15: section15Result
};

const allSectionsPresent = Object.values(sectionPresence).every(x=>x.present);
const ok =
  allSectionsPresent &&
  syntaxErrors.length === 0 &&
  importErrors.length === 0 &&
  htmlAssetErrors.length === 0 &&
  qualityOk &&
  lockStateOk &&
  section15Result.ok === true;

console.log(JSON.stringify({...result,ok},null,2));
if (!ok) process.exit(1);
