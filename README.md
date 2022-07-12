# Rhythm Marketing

Marketing site powered by Next.js/Typescript/Styled Components utilizing Contentful CMS.

## Development Setup
```bash
yarn install
```

### Download Env Vars

Install the Vercel CLI - https://vercel.com/cli

```bash
yarn global add vercel
```

Try running `vercel`. If it errors, you may have to export the PATH:

```
export PATH=$PATH:~/.yarn/bin
```

Run:
```
vercel link
```

Follow the setup steps (you will need to auth your Vercel user, and link this Repo with the gotrhythm/marketing-site Vercel env). If you do not have a user in our Vercel environment, contact Wade (wade.hammes@gotrhythm.com), Carlos (carlos.sanchez@gotrhythm.com), or Matt Camilli (matt.camilli@gotrhythm.com).

Pull the env vars now that you are linked:
```
vercel env pull
```

Run the dev environment:
```bash
yarn dev
```
## Development & Deployment

Deployment is handled via [Vercel](https://vercel.com/gotrhythm/rhythm-marketing). Every PR will create a preview URL for the PRs branch, which will update with each commit to the PR. When accessing preview or staging urls, you will be asked for a password, which is `rhythmmarketing`.

### Default branch is `staging`!
To develop, create a feature/chore/bug branch (`(feature/chore/bug)/<branch name>-<pivotal id>`) off of `staging`. All PRs merged into `staging` will be viewable via https://staging.gotrhythm.com.

To create a production release, create a tag sequential to the latest. (Tags should be named `vX.X.X` - check [Releases](https://github.com/gotrhythm/rhythm-marketing/releases) for latest version or run `git tag`). This will kick off an action viewable in [Actions](https://github.com/gotrhythm/rhythm-marketing/actions), deploy `main`, and create a new release with changelog history between tags.

Steps:
1. checkout `staging` and pull the latest changes
2. Run `make release tag=` with the tag name:
```
make release tag=vX.X.X
```

### Component creation
We have a script to scaffold out a new component in the `src/components` directory, which will provide the necessary files to get started hacking on a new component for the site.

```
yarn scaffold <ComponentName>
```

This will create a new component in the `src/components` directory with necessary page object, spec, normalizer, component, and interface entries.

### Adding new environment keys
Adding new environment keys is done in a few places:

1. `.env.local` where you define the env key for local. You also need to add this to `next.config.js` in the env section, following the pattern of others there.
2. If you used `vercel env pull` to fetch env variables from the Vercel cloud, you will need to add the key there as well.
3. Add these keys with no value to `.env.sample`
4. Add the keys to Vercel -> https://vercel.com/gotrhythm/rhythm-marketing/settings/environment-variables (if you do not have access, please contact Wade, Carlos, or Matt)

### Managing Dependabot rollups
Instead of cherry-picking each Dependabot PR, do the following:

1. Open a new branch, `git checkout -b dependabot/rollup-080921` (replace with todays date)
2. Run `yarn upgrade-interactive --latest`
3. Select all packages you want to upgrade by pressing space bar and using arrow keys
4. Hit enter
5. Once they have updated, run `npx yarn-deduplicate && yarn` (this dedupes packages which is a known issue in Yarn 1)
6. Commit and publish
7. If everything passes on the PR branch and preview looks good, close the Dependabot PRs

### Testing
We use the same paradigm as the app here on the marketing site (page object approach). Tests are still being backfilled for components, but when getting started to test a new, a good example is `AddressLookup`.

You can find our custom render function in `.test-utils.tsx`.

## Other Resources / Documentation
- Vercel - https://vercel.com/gotrhythm/rhythm-marketing/
- Next.js Documentation - https://nextjs.org/docs/getting-started
- Styled Components Documentation - https://styled-components.com/docs
- Contentful Documentation - https://www.contentful.com/developers/docs/javascript/tutorials/using-js-cda-sdk/
- Flagship Documentation - https://developers.flagship.io/docs/sdk/react/v2.1
- AB Tasty Documenation - https://developers.abtasty.com/docs/tag/tag-getting-started
