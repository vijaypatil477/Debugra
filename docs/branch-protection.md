# Branch protection configuration (required status checks + at least 1 approval)

This repository includes GitHub Actions workflows that report commit **status checks** for PRs.

The acceptance criteria for merge is:

- PRs must **block merges until status tests pass completely**.
- Merges must require **at least 1 approval**.

## 1) Required status checks

Status checks are produced by these workflows:

- **CI**: `.github/workflows/ci.yml`
  - Runs: `npm run lint`, `npm test`, `npm run build`

- **Playwright E2E**: `.github/workflows/e2e-playwright.yml`
  - Runs: `npx playwright test`

### Configure in GitHub

1. Go to **Repository settings** → **Branches**.
2. Select the branch `main`.
3. Under **Branch protection rules**, click **Add rule** (or edit existing).
4. Enable **Require status checks to pass before merging**.
5. Select both of the following checks (names may appear slightly differently in your UI, but they correspond to the workflows above):
   - `CI`
   - `Playwright E2E`

## 2) Require at least 1 approval

This repo includes a `.github/CODEOWNERS` file.

To require reviewers:

1. In the same **Branch protection rule** for `main`, enable:
   - **Require pull request reviews before merging**
2. Set **Required approving reviews** to: `1`
3. (Recommended) Set **Dismiss stale approvals** to enabled.

## Notes / limitations

- GitHub branch protection cannot be fully enforced purely via repository files. The workflows and CODEOWNERS are added here so that maintainers can enable the exact protections in the GitHub UI.
- If your maintainers want a different review set, update `.github/CODEOWNERS` and then adjust the branch protection rules accordingly.
