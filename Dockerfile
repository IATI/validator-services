FROM mcr.microsoft.com/azure-functions/node:4.1.3-node14

ENV AzureWebJobsScriptRoot=/home/site/wwwroot \
    AzureFunctionsJobHost__Logging__Console__IsEnabled=true

# Install application
COPY . /home/site/wwwroot

# Install node_modules 
WORKDIR /home/site/wwwroot
RUN \
    npm i -g npm && \
    npm set-script prepare "" && \
    npm install --production
