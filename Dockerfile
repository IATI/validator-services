FROM mcr.microsoft.com/azure-functions/node:4.9.0-node16

ENV AzureWebJobsScriptRoot=/home/site/wwwroot \
    AzureFunctionsJobHost__Logging__Console__IsEnabled=true

# Install application
COPY . /home/site/wwwroot

# Install node_modules 
WORKDIR /home/site/wwwroot
RUN \
    npm i -g npm && \
    npm set-script prepare "" && \
    npm ci --production
