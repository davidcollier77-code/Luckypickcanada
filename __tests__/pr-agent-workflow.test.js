import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const workflowPath = resolve(process.cwd(), '.github', 'workflows', 'pr-agent.yml');
const workflow = readFileSync(workflowPath, 'utf8');

describe('Gemini PR-Agent workflow configuration', () => {
  it('places action configuration in a step-level env block, not under uses', () => {
    expect(workflow).toMatch(/^        uses: the-pr-agent\/pr-agent@[0-9a-f]{40}$/m);
    expect(workflow).toMatch(/^        env:\s*$/m);
    expect(workflow).toMatch(/^          GITHUB_TOKEN: \$\{\{ secrets\.GITHUB_TOKEN \}\}$/m);
    expect(workflow).toMatch(/^          GOOGLE_AI_STUDIO\.GEMINI_API_KEY: \$\{\{ secrets\.GEMINI_API_KEY \}\}$/m);
  });

  it('selects the intended Gemini 3.8 Flash model', () => {
    expect(workflow).toMatch(/^          config\.model: "gemini\/gemini-3\.8-flash"$/m);
    expect(workflow).toContain("          config.fallback_models: '[\"gemini/gemini-3.8-flash\"]'");
    expect(workflow).not.toContain('gemini/gemini-2.0-flash');
    expect(workflow).not.toContain('gpt-5.6-terra');
  });

  it('runs a review for opened, reopened, synchronized, ready, and review-requested PRs', () => {
    expect(workflow).toMatch(/types: \[opened, reopened, synchronize, ready_for_review, review_requested\]/);
    expect(workflow).toContain('github_action_config.pr_actions: \'["opened", "reopened", "synchronize", "ready_for_review", "review_requested"]\'');
    expect(workflow).not.toMatch(/^\s*if:.*github\.event\.sender\.type/m);
  });

  it('runs only the review command and never prints the secret value', () => {
    expect(workflow).toContain('github_action_config.auto_review: "true"');
    expect(workflow).toContain('github_action_config.auto_describe: "false"');
    expect(workflow).toContain('github_action_config.auto_improve: "false"');
    expect(workflow).toContain('Gemini credential is configured; its value will not be printed.');
    expect(workflow).not.toMatch(/echo .*GEMINI_API_KEY\s*$/m);
  });
});
