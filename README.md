# Summary

| Product          | Validator Services API                                                                                                                                                         |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Description      | Node.JS app that provides various API end points used by the IATI Validator API; also handles the validation for ad hoc data checks in user sessions on the Validator website. |
| Website          | [https://validator.iatistandard.org](https://validator.iatistandard.org)                                                                                                       |
| Related          | [IATI/validator-web](https://github.com/IATI/validator-web), [IATI/js-validator-api](https://github.com/IATI/js-validator-api)                                                 |
| Documentation    | [https://developer.iatistandard.org/](https://developer.iatistandard.org/)                                                                                                     |
| Technical Issues | https://github.com/IATI/validator-services/issues                                                                                                                              |
| Support          | https://iatistandard.org/en/guidance/get-support/                                                                                                                              |

# validator-services

## Endpoints

See OpenAPI specification `postman/schemas/index.yaml`. To view locally in Swagger UI, you can use the `42crunch.vscode-openapi` VSCode extension.

### Non REST Functions

#### blob-trigger-adhoc-file

- Blob Trigger

  - When file is added to blob storage container with name `ADHOC_CONTAINER`, this Function is triggered.
  - `/api/pvt/adhoc/upload` or `/api/pvt/adhoc/url` are the endpoints used to add files to blob storage.

- Actions

  - Sends file to Validator API
  - Saves validation report and metadata to `adhoc_validation` table

## Prerequisities

- nvm - [nvm](https://github.com/nvm-sh/nvm) - Node version manager
- Node LTS
  - once you've installed nvm run `nvm use` which will look at `.nvmrc` for the node version, if it's not installed then it will prompt you to install it with `nvm install <version>`
- [Azure Functions Core Tools v4](https://github.com/Azure/azure-functions-core-tools)
- [Azure CLI](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli) version 2.4 or later.

## Getting Started

1. Follow instructions for nvm/node prerequisties above
1. Run `npm i`
1. Run `npm start` to run the function locally using the Azure Functions Core Tools

## Environment Variables

### Set Up

`cp .env.example .env`

### Description

#### .env

```bash
# DB connection
PGDATABASE=<dbname>
PGHOST=<host>
PGPASSWORD=
PGPORT=5432
PGSSL=true
PGUSER=<username>@<host>

# name of adhoc azure blob container
ADHOC_CONTAINER=

# validator API url and api key
VALIDATOR_API_URL=
VALIDATOR_FUNC_KEY=
```

#### local.settings.json

Required due to the storage binding used by this function

```json
{
    "IsEncrypted": false,
    "Values": {
        "FUNCTIONS_WORKER_RUNTIME": "node",
        "AzureWebJobsStorage": <storage_connection_string>,
        "STORAGECONNECTOR": <storage_connection_string>,
        "ADHOC_CONTAINER": <ADHOC_CONTAINER>
    }
}
```

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

- Set a breakpoint
- Press F5 to start the Azure Function and Attach the VSCode debugger
  - Configuration is contained in `.vscode/launch.json` and `.vscode/tasks.json`
- Trigger a request that will hit your break point
- Enojy!

## Linting and Code Formatting

[ESlint](https://eslint.org/) is used for code quality and [Prettier](https://prettier.io/) is used for formatting rules, see [Prettier vs. Linters](https://prettier.io/docs/en/comparison).

To run linting, use `npm run lint`, and to format the project, use `npm run format`.

### VS Code Integration

Autosave is enabled in `.vscode/settings.json`.

Recommended Plugins:

- [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)
- [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)

## Creating a new route

`func new --name <routename> --template "HTTP trigger" --authlevel "function"`

## Integration Tests

### Running

- Install newman globally `npm i -g newman`
- Start function `npm start`
- Run Tests `npm test`

### Modifying/Adding

Integration tests are written in Postman v2.1 format and run with newman.

#### Process for editing tests

1. Check the tests in Postman are in sync with the Github repo:

   - Export the `validator-services` collection from the Postman client to `./integration-tests`
   - Run `npm run format`
   - Run `git diff integration-tests/validator-services-tests.postman_collection.json`

2. If this confirms the tests are in sync, then edit / update the tests in Postman.

   - Export again, format again, and commit.

## Release / Version Management

https://github.com/IATI/IATI-Internal-Wiki#detailed-workflow-steps
