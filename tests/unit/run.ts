import { run as runLeads } from './validation.leads.test';
import { run as runOpps } from './validation.opportunities.test';
import { run as runOrgs } from './validation.organizations.test';
import { run as runFedCfg } from './federation.config.test';
import { run as runAuthHelpers } from './middleware.auth.test';
import { run as runFedServices } from './federation.services.test';
import { run as runOwnerAuth } from './owner.auth.test';
import { run as runOnboardToken } from './onboarding.token.test';
import { run as runAcceptPublic } from './onboarding.accept-public.api.test';
import { run as runAcceptService } from './onboarding.accept.service.test';
import { run as runNegativePaths } from './onboarding.negative-paths.test';

import { run as runRouting } from './routing.test';
import { run as runAgreementsRolloff } from './agreements_rolloff.test';
import { run as runImporters } from './importers.test';
import { run as runAgreementsEval } from './agreements_eval.test';
import { run as runWallet } from './wallet.test';
import { run as runRoutingOptimization } from './routing_optimization.test';
import { run as runUiComponents } from './ui_components.test';
import { run as runImportersSchema } from './importers_schema.test';
import { run as runVerticals } from './verticals.test';

process.env.UNIT_TESTS = '1';

async function main() {
  const results = [
    await runLeads(),
    await runOpps(),
    await runOrgs(),
    await runFedCfg(),
    await runAuthHelpers(),
    await runFedServices(),
    await runOwnerAuth(),
    await runOnboardToken(),
    await runAcceptPublic(),
    await runAcceptService(),
    await runNegativePaths(),
    await runRouting(),
    await runAgreementsRolloff(),
    await runImporters(),
    await runAgreementsEval(),
    await runWallet(),
    await runRoutingOptimization(),
    await runUiComponents(),
    await runImportersSchema(),
    await runVerticals(),
  ];
  const totals = results.reduce((acc, r) => ({
    passed: acc.passed + r.passed,
    failed: acc.failed + r.failed,
    total: acc.total + r.total,
  }), { passed: 0, failed: 0, total: 0 });

  for (const r of results) {
    console.log(`[RESULT] ${r.name}: ${r.passed}/${r.total} passed`);
  }
  console.log(`[SUMMARY] total: ${totals.passed}/${totals.total} passed`);

  if (totals.failed > 0) {
    process.exit(1);
  } else {
    // Force exit even if event loop has pending tasks
    process.exit(0);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

