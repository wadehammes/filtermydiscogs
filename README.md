# Discogs Collection Filter

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

### Default branch is `staging`!
To develop, create a feature/chore/bug branch (`(feature/chore/bug)/<branch name>-<pivotal id>`) off of `staging`. All PRs merged into `staging` will be viewable via https://staging.gotrhythm.com.

To create a production release, create a tag sequential to the latest. (Tags should be named `vX.X.X` - check [Releases](https://github.com/gotrhythm/rhythm-marketing/releases) for latest version or run `git tag`). This will kick off an action viewable in [Actions](https://github.com/gotrhythm/rhythm-marketing/actions), deploy `main`, and create a new release with changelog history between tags.

Steps:
1. checkout `staging` and pull the latest changes
2. Run `make release tag=` with the tag name:
```
make release tag=vX.X.X
```