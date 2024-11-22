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
   - Note: depending on which aspect of this app you are developing, or testing, running the app locally may require also running locally the validator ([js-validator-api](https://github.com/iati/js-validator-api)) and/or the database part of the unified pipeline refresher ([refresher]https://github.com/iati/refresher)).

## Environment Variables

### Initial set up

#### `.env` app configuration file

When running locally the app is configured using the `.env` environment file.

- Copy the example environment file
  - `cp .env.example .env`
- Edit as needed, variables explained below:

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

MAINTENANCE_MODE=DISABLED  # DISABLED | NO_WRITE | NO_READ
MAINTENANCE_MODE_MESSAGE="The Validator website is in read-only mode for essential maintenance."
```

See below for explanation of `MAINTENANCE_MODE` variable.

#### `local.settings.json` for VS Code

If you run the app through VS Code, you need to put the Azure details in `local.settings.json` as well as the `.env` file. This is needed due to the storage binding used by this function.

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

#### Maintenance Mode

There is a maintenance mode which is controlled via the `MAINTENANCE_MODE` and `MAINTENANCE_MODE_MESSAGE` environment variables.
For the Function App on Azure, these are stored in Github secrets and populated using Github actions, there being two copies with
the standard `DEV_` and `PROD_` prefixes.

`MAINTENANCE_MODE` can take values:

- `DISABLED` - off
- `NO_WRITE` - those API end points which write to the Pipeline refresher DB are disabled
  - API end points: `adhoc/upload`, `adhoc/url`, `validation/regenerate`, `validation/regenerate/all`, `blob-trigger-adhoc-file`
  - These endpoints will return 503 Service Unavailable, with the message in `MAINTENANCE_MODE_MESSAGE`
- `NO_READ` - currently unused by this app, but the code which implements maintenance mode could be (spun out as module and) used elsewhere, so this common use-case was included. `NO_READ` implies `NO_WRITE`.

## Attached Debugging (VSCode)

- Set a breakpoint
- Press F5 to start the Azure Function and Attach the VSCode debugger
  - Configuration is contained in `.vscode/launch.json` and `.vscode/tasks.json`
- Trigger a request that will hit your break point
- Enojy!

## Linting and Code Formatting

[ESlint](https://eslint.org/) is used for code quality and [Prettier](https://prettier.io/) is used for formatting rules, see [Prettier vs. Linters](https://prettier.io/docs/en/comparison).

To run linting, use `npm run lint`. This will run `eslint` and `prettier` in checking/read-only mode, and show you if there are any errors.

To format the code, run `npm run format`.

There is a pre-commit hook which checks the code is formatted properly, so it should not be possible to commit without properly formatting the code. If this is bypassed, linting is also done on Github when creating a PR, and this will produce an error is the code is not properly formatted.

### VS Code Integration

Autosave is enabled in `.vscode/settings.json`.

Recommended Plugins:

- [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)
- [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)

## Creating a new API route using the Azure Functions cli

`func new --name <routename> --template "HTTP trigger" --authlevel "function"`

## Integration Tests

Integration tests are written in Postman v2.1 format. They should be edited in Postman, and then exported into the repository. During development the test suite can be run from Postman or locally using `newman`. During deployment, they are run on Github using `newman`.

The tests currently run against an actual server (i.e., dev, production, or a local instance). This means the test runner does not control the instance being tested. This caused an issue with the new maintenance mode (introduced October 2024) because we expect different results according to whether maintenance mode is active or not, but the test runner can't control this. For now, the Github Actions workflow has been setup to run two different sets of tests: when maintenance mode is active, certain folders in the test suite aren't run.

It would be better to spin up a dedicate test environment on Github using docker compose. There is a Github issue for doing this work: see #487.

### Running the tests locally

#### Against a local instance of `validator-services`

If you want to test against a local instance of `validator-services` you need to have it pointed to a Unified Pipeline database and an Azure storage account.

If you use a local database, you will need to ensure that you have run the Pipeline refresher with a reasonable number of datasets through to the validate stage, because the tests search for a dataset which has warnings, to check various things.

- Install the dev dependencies, or ensure you have newman installed globally (`npm i newman -g`)
- Start function `npm start`
- Run Tests `npm test`

#### Against a remote instance

You can also run the tests locally against the dev or production instance. (This can be useful if a problem has been reported with dev or production).

To run against the dev instance:

```
npx newman run integration-tests/validator-services-tests.postman_collection.json -e integration-tests/envs/validator-services-direct-dev.postman_environment.json --working-dir integration-tests/test-files --env-var "keyValue=REPLACE_WITH_FUNCTIONS_KEY"
```

You need to replace `REPLACE_WITH_FUNCTIONS_KEY` with the Azure Functions App dev key.

To run against production, use `integration-tests/envs/validator-services-direct-PROD.postman_environment.json` with the `-e` flag instead and use the production Azure key.

### Modifying/Adding Tets

1. Check the tests in Postman are in sync with the Github repo:

   - Export the `validator-services` collection from the Postman client to `./integration-tests`
   - Run `npm run format`
   - Run `git diff integration-tests/validator-services-tests.postman_collection.json`

2. If this confirms the tests are in sync, then edit / update the tests in Postman.

3. When done editin gin Postman, export from Postman again, format again, and commit.

### Limitations

#### Tests of the Maintenance Mode

The final folder of Postman tests is called `Maintenance Mode`. The app can be put in Maintenance Mode by setting an environment variable. But because the integration tests are run against an already started instance of the app (that is, Newman does not control the instance of the app to test against), it is not possible for Newman to turn this mode on part way through the test run.

As such, the Maintenance Mode tests have to be run separately from all the other tests, and they can only be run locally, not as part of the CI/CD pipeline.

To run the Maintenance Mode tests locally:

1. Edit `.env` to turn on Maintenance Mode.
2. Start the application as normal (with `npm start`)
3. Run just the Maintenance Mode tests with `npm run test-maintenance-mode`

## Release / Version Management

https://github.com/IATI/IATI-Internal-Wiki#detailed-workflow-steps
