[DE](DE%3ATOS)

# Provide terms of service

Lasius allows operators to require users to accept the operator's terms of service before they can use Lasius. To activate this feature, the environment variable `LASIUS_TERMSOFSERVICE_VERSION` must be set in the .env file of the frontend with a value, such as a version or a date. Additionally, HTML files containing the terms of service must be provided in the frontend docker image under the path `/app/public/termsofservice`. Example templates can be found in the [lasius-docker-compose repository](https://github.com/tegonal/lasius-docker-compose/tree/main/templates/termsofservice). One template per supported language is required.

The terms of service can be embedded using a volume when using Lasius as a Docker, as follows:

```
docker run --volume <TERM_OF_SERVICE_PATH>:/app/public/termsofservice tegonal/lasius-frontend:latest
```

# Updating terms of service

To customize the terms of service and require users to accept them again, the following steps must be taken:

1. Capture new terms of service as HTML
2. Adjust the value of the environment variable `LASIUS_TERMSOFSERVICE_VERSION`
3. Restart the frontend

Upon the next login, users will be shown the new terms of service, which must be accepted before use.

