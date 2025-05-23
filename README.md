# Jira issues

## Prerequisites

## .env file

Copy the `.env.dist` file to `.env` and fill in the values.

> Github values are not necessary for the time being as processing github data is currently disabled

## Jira credentials
Jira username is your email address.

You can generate an API key for your Atlassian account by following these steps:
https://support.atlassian.com/atlassian-account/docs/manage-api-tokens-for-your-atlassian-account/

### Google credentials
Create a file google-service-account.json at project root with the data from 1password secure note:
```
VGP - jira issue spreadsheet updater google credentials
```

Or from GCP,
- project `VGP - XLS importer`
- service account `jira issue importer`


## Run the script

```bash
npm run start
```
