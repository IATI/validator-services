# Validator Services

## Prerequisities

-   nvm - [nvm](https://github.com/nvm-sh/nvm) - Node version manager
-   Node LTS
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

### pvt-get-publishers-flagged: `[GET] /pvt/publishers/flagged`

-   Returns publishers that have been black flagged by the validation by activity process.

### pvt-get-single-publisher: `[GET] /pvt/publishers/{lookupValue}?lookupKey={lookupKey}`

-   Query Params:
    -   `lookupKey` - REQ - `id` or `name`

### pvt-get-publisher-documents: `[GET] /pvt/publishers/{id}/documents`

-   Response
    -   NOTE: Does not return `errors` object of the validation report to limit the size of the response, use `[GET] /pvt/documents/{id}` to get errors

### pvt-get-single-document: `[GET] /pvt/documents/{lookupValue}?lookupKey={lookupKey}`

-   Query Params:
    -   `lookupKey` - REQ - `id` (default) or `name`

### pub-get-report: `[GET] /pub/validation/existing?id={id}&hash={hash}&url={url}&name={name}&showerrors={showerrors}`

-   Query Params:

    -   `id` - provide document id to retrieve validation report for this id
    -   `hash` - provide document hash to retrieve validation report for this hash
    -   `url`- provide document url to retrieve validation report for this url
    -   `name` - provide document name to retrieve validation report for this name
    -   `showerrors` - default true - if false only return summary object of validation report

-   Response - JSON Schema Available `docs/validationReport.schema.json`

### pvt-patch-validation-regenerate `[PATCH] /pvt/validation/regenerate`

-   Body - JSON Object with a key of ids equal to an array of document IDs to flag for regeneration of its validation report

```json
{ "ids": ["id1", "id2"] }
```

-   Documents flagged as needing a validation report regeneration are moved to the top of the validation queue
-   This will only retrigger a "Full" Validation for the file, not the initial Schema check which sets `document.file_schema_valid`. This is because the Schema shouldn't change for a specific file because the files are versioned with the standard. If something does change that would make a specific file change it's validity against the schema, a manual re-trigger should be performed.
-   REFRESHER ACI CONTAINERS SHOULD BE STOPPED BEFORE INVOKING THIS ENDPOINT FOR SAFETY

### pvt-patch-validation-regenerate-all `[PATCH] /pvt/validation/regenerate/all`

-   Body - none

-   Flags ALL documents (that already have an associated validation report), for regeneration of a validation report
-   This will only retrigger a "Full" Validation for the file, not the initial Schema check which sets `document.file_schema_valid`. This is because the Schema shouldn't change for a specific file because the files are versioned with the standard. If something does change that would make a specific file change it's validity against the schema, a manual re-trigger should be performed.
-   REFRESHER ACI CONTAINERS SHOULD BE STOPPED BEFORE INVOKING THIS ENDPOINT FOR SAFETY

### pvt-get-guidance-links: `[GET] /pvt/guidance-links/{version}`

-   `version` - IATI version e.g. `2.03`

### pvt-get-adhoc-session `[GET] pvt/adhoc/session?sessionId={sessionId}`

-   Query Params:

    -   `sessionId` - session Id of user doing ad-hoc validation

-   Response
    -   NOTE: Does not return `errors` object of the validation report to limit the size of the response, use `[GET] /pvt/documents/{id}` to get errors

### pvt-post-adhoc-file: `[POST] /pvt/adhoc/upload?filename={filename}&sessionId={sessionId}&guid={guid}`

-   Query Params:

    -   `filename` - file name of file to be uploaded
    -   `sessionId` - browser session id for the adhoc uploading session
    -   `guid` - unique identifier for the file, since filename is not unique

-   Response - 200

-   Actions
    -   Saves file to Blob storage with path/name `"%ADHOC_CONTAINER%/{sessionId}###{filename}###{guid}"`
    -   Adds entry into `adhoc_validation` database table with `.session_id`, `.filename`, `.guid`

### pvt-post-adhoc-url: `[POST] /pvt/adhoc/url?url={url}&sessionId={sessionId}&guid={guid}`

-   Query Params:

    -   `url` - url of the file to be uploaded
    -   `sessionId` - browser session id for the adhoc uploading session
    -   `guid` - unique identifier for the file, since filename is not unique

-   Response - 200

-   Actions
    -   Saves file to Blob storage with path/name `"%ADHOC_CONTAINER%/{sessionId}###{url}###{guid}"`
    -   Adds entry into `adhoc_validation` table with `.session_id`, `.filename`, `.guid`

### blob-trigger-adhoc-file

-   Blob Trigger

    -   When file is added to blob storage container with name `ADHOC_CONTAINER`, this Function is triggered.

-   Actions
    -   Sends file to Validator API
    -   Saves validation report and metadata to `adhoc_validation` table

## Creating a new route

`func new --name <routename> --template "HTTP trigger" --authlevel "function"`

## Integration Tests

### Running

-   Install newman globally `npm i -g newman`
-   Start function `npm start`
-   Run Tests `npm test`

### Modifying/Adding

Integration tests are written in Postman v2.1 format and run with newman
Import the `integrations-tests/azure-function-node-microservice-template.postman_collection.json` into Postman and write additional tests there

## Release / Version Management

https://github.com/IATI/IATI-Internal-Wiki#detailed-workflow-steps
