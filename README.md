# Validator Services

## Prerequisities

-   nvm - [nvm](https://github.com/nvm-sh/nvm) - Node version manager
-   Node v14 LTS (lts/fermium)
    -   once you've installed nvm run `nvm use` which will look at `.nvmrc` for the node version, if it's not installed then it will prompt you to install it with `nvm install <version>`
-   [Azure Functions Core Tools v3](https://github.com/Azure/azure-functions-core-tools)
-   [Azure CLI](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli) version 2.4 or later.

## Getting Started

1. Create a new repository from the template
1. Follow instructions for nvm/node prerequisties above
1. Update package.json with application name, repository, etc.
1. Run `npm i`
1. Run `npm start` to run the function locally using the Azure Functions Core Tools

## Environment Variables

### Set Up

`cp .env.example .env`

### Description

APPINSIGHTS_INSTRUMENTATIONKEY=

-   Needs to be set for running locally, but will not actually report telemetry to the AppInsights instance in my experience

### Adding New

Add in:

1. .env.example
1. .env
1. `/config/config.js`

Import

```
const config = require("./config");

let myEnvVariable = config.ENV_VAR
```

## Attached Debugging (VSCode)

-   Set a breakpoint
-   Press F5 to start the Azure Function and Attach the VSCode debugger
    -   Configuration is contained in `.vscode/launch.json` and `.vscode/tasks.json`
-   Trigger a request that will hit your break point
-   Enojy!

## Linting and Code Formatting

### Prerequisities

-   To show linting inline install [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) for VSCode

### Info

-   This is done with eslint following the airbnb-base style and using [Prettier](https://prettier.io). Implemented with [this](https://sourcelevel.io/blog/how-to-setup-eslint-and-prettier-on-node) guide.
-   If you use VSCode the formatting will happen automagically on save due to the `.vscode/settings.json` > `"editor.formatOnSave": true` setting

## Endpoints /api

### pub-get-version: `[GET] /pub/version`

### pvt-get-publishers: `[GET] /pvt/publishers`

### pvt-get-single-publisher: `[GET] /pvt/publishers/{lookupValue}?lookupKey={lookupKey}`

-   Query Params:
    -   `lookupKey` - REQ - `id` or `name`

### pvt-get-publisher-documents: `[GET] /pvt/publishers/{id}/documents`

### pvt-get-single-document: `[GET] /pvt/documents/{id}`

### pub-get-report: `[GET] /pub/validation/existing`

-   Response - JSON Schema Available `docs/validationReport.schema.json`

### pvt-patch-validation-regenerate `[PATCH] /pvt/validation/regenerate`

-   Body - JSON Object with a key of ids equal to an array of document IDs to flag for regeneration of its validation report

```json
{ "ids": ["id1", "id2"] }
```

-   Documents flagged as needing a validation report regeneration are moved to the top of the validation queue

### pvt-patch-validation-regenerate-all `[PATCH] /pvt/validation/regenerate/all`

-   Body - none

-   Flags ALL documents (that already have an associated validation report), for regeneration of a validation report

### pvt-get-guidance-links: `[GET] /pvt/guidance-links/{version}`

-   `version` - IATI version e.g. `2.03`

-   Query Params:
    -   `id`
    -   `hash`
    -   `url`

## Creating a new route

`func new --name <routename> --template "HTTP trigger" --authlevel "function"`

## AppInsights SDK

-   An example of using the `config/appInsights.js` utility is available in the `pvt-get/index.js` where execution time of the function is measured and then logged in 2 ways to the AppInsights Telemetry.

## Filesystem

-   Provided in `config/fileSystem.js` which can be imported to get the promisified versions of common `fs` functions since we're stuck with Node v12 for now (these are standard in Node v14)

## Integration Tests

### Running

-   Install newman globally `npm i -g newman`
-   Start function `npm start`
-   Run Tests `npm test`

### Modifying/Adding

Integration tests are written in Postman v2.1 format and run with newman
Import the `integrations-tests/azure-function-node-microservice-template.postman_collection.json` into Postman and write additional tests there

## Deployment

-   Update relevant items in `.github/workflows/develop-func-deploy.yml` (see comments inline)
-   Create a [Service Principal](https://github.com/IATI/IATI-Internal-Wiki/blob/main/IATI-Unified-Infra/ServicePrincipals.md) and set the DEV_AZURE_CREDENTIALS GitHub Secret

## Release / Version Management

Increment the version on `main` branch using npm:

`npm version major | minor | patch`

Push the new tag and commit to gitHub

```bash
git push origin main
git push —-tags
```

Create a new Release in GitHub based on the latest tag. Publishing that release deploys the application.

Once deployed successfully PR `main` back into `develop`.
