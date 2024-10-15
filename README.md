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

### Prerequisities

- To show linting inline install [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) for VSCode

### Info

- This is done with eslint following the airbnb-base style and using [Prettier](https://prettier.io). Implemented with [this](https://sourcelevel.io/blog/how-to-setup-eslint-and-prettier-on-node) guide.
- If you use VSCode the formatting will happen automagically on save due to the `.vscode/settings.json` > `"editor.formatOnSave": true` setting

## Creating a new route

`func new --name <routename> --template "HTTP trigger" --authlevel "function"`

## Integration Tests

### Running

- Install newman globally `npm i -g newman`
- Start function `npm start`
- Run Tests `npm test`

### Modifying/Adding

Integration tests are written in Postman v2.1 format and run with newman
Import the `integrations-tests/azure-function-node-microservice-template.postman_collection.json` into Postman and write additional tests there

## Release / Version Management

https://github.com/IATI/IATI-Internal-Wiki#detailed-workflow-steps
