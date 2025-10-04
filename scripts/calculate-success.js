import fs from "fs";

const preData = JSON.parse(fs.readFileSync('ops/reports/validation_pre.json', 'utf8'));
const postData = JSON.parse(fs.readFileSync('ops/reports/validation_post.json', 'utf8'));

let processedBinders = 0;
let totalBinders = 0;

for (const [binder, preInfo] of Object.entries(preData.results)) {
  totalBinders++;
  const postInfo = postData.results[binder];
  
  // Success if post >= pre and pre > 0, OR if both are 0 (empty binder)
  if ((postInfo.detected >= preInfo.detected && preInfo.detected > 0) || (preInfo.detected === 0 && postInfo.detected === 0)) {
    processedBinders++;
  }
}

const successRate = totalBinders > 0 ? (processedBinders / totalBinders) * 100 : 0;

console.log(`\n📊 SUCCESS RATE CALCULATION:`);
console.log(`  Total Binders: ${totalBinders}`);
console.log(`  Processed Successfully: ${processedBinders}`);
console.log(`  Success Rate: ${successRate.toFixed(1)}%`);
console.log(`  Threshold: 95.0%`);

if (successRate >= 95) {
  console.log(`\n✅ SUCCESS: Meets 95% threshold`);
  process.exit(0);
} else {
  console.log(`\n❌ FAILED: Below 95% threshold`);
  process.exit(1);
}

