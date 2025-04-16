[DE](DE%3AAuth.md)

# Authentication (Login)

Lasius supports [OAuth2](https://auth0.com/de/intro-to-iam/what-is-oauth-2) and [OpenId Connect](https://openid.net/developers/how-connect-works/-based user authentication. That allows Lasius to be operated with existing identity providers (IDPs) and support single sign-on or machine-to-machine communication.

Lasius supports the configuration of several authentication providers. If multiple authentication providers are configured, they will be displayed to the user for selection. If only one authentication provider is configured, the user will be automatically redirected to the corresponding login mask.

![Selection of authentication providers](images/Lasius_Login_Provider_Selection.png)

### Configuration

Available authentication providers must be enabled both in the frontend and backend if login via the Lasius frontend is possible.

#### Backend Configuration

Providers allowed by the backend must be registered in the backend configuration under the property `lasius.security.external-issuer`. As a starting point, all previously available providers are provided as examples in the `all_providers.conf` configuration file. However, it is recommended to copy this configuration according to the application case and to list the providers that should be allowed for login.
Provider-specific credentials are available through corresponding environment variables.

#### Frontend Configuration

In the frontend, the available authentication providers are automatically enabled if the corresponding environment variables are available at startup.
In the example backend configuration, care has been taken to ensure that the providers are also configured whit the same environment variables, so that the same `.env` file can be used for both the backend and the frontend.

## Providers

### Lasius internal OAuth2 provider

> This IDP is intended only for development and demo environments

However, to simplify installations for demonstration purposes and development environments, without requiring an IDP to be provided, Lasius offers a simple OAuth2-based implementation of an IDP.

The internal OAuth2 provider can be activated and configured either using environment variables or a separate backend configuration. For the frontend, only `LASIUS_OAUTH_CLIENT_ID` and `LASIUS_OAUTH_CLIENT_SECRET` need to be defined, so that the provider appears in the list of authentication providers.

#### Configuration

| Environment variable                       | Description                                                                                                     |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| LASIUS_OAUTH_PROVIDER_ENABLED              | Enable or disable the internal OAuth2 provider                                                                  |
| LASIUS_OAUTH_PROVIDER_ALLOW_REGISTER_USERS | Allow registration of new users on the internal OAuth provider                                                  |
| LASIUS_OAUTH_CLIENT_ID                     | Client ID of the frontend application. It is recommended to use a unique ID per application case                |
| LASIUS_OAUTH_CLIENT_SECRET                 | Client secret of the frontend application. It is recommended to use a unique secret per application case        |
| LASIUS_INTERNAL_JWT_PRIVATE_KEY            | Private key used for signing the internal JWT token. It is recommended to use a unique key per application case |

Additional parameters such as the lifespan of the JWT token must be defined using a separate backend configuration. The corresponding default values in the `lasius.security.oauth-2-provider` section of the [application.conf](https://github.com/tegonal/Lasius/blob/main/backend/conf/application.conf) configuration can be overridden accordingly.

### Gitlab

To enable authentication via a public [Gitlab](https://gitlab.com) instance or a self-hosted instance, the application must be registered on the respective instance:

https://gitlab.com/-/profile/applications

The callback-Url need to be created based on the following pattern: `https://<hostname>/api/auth/callback/gitlab`, where `<hostname>` needs to be replaced with the public name of the lasius instance. Die application needs to have the scopes `openid` and `email`.

Once the provider is entered in the backend configuration, Gitlab integration can be configured using the following environment variables:

| Environment variable                       | Description                                                         |
| ------------------------------------------ | ------------------------------------------------------------------- |
| GITLAB_OAUTH_URL (optional)                | URL of the Gitlab instance to be used as an authentication provider |
| GITLAB_OAUTH_CLIENT_ID                     | Client ID of the application registered with Gitlab                 |
| GITLAB_OAUTH_CLIENT_SECRET                 | Client secret of the application registered with Gitlab             |
| GITLAB_OAUTH_INTROSPECTION_PATH (optional) | Path for the introspection endpoint to verify the access token      |
| GITLAB_OAUTH_USER_INFO_PATH (optional)     | Path for loading the user profile                                   |

### Github

To integrate [Github](https://github.com) as an authentication provider, the Oauth application must be registered with Github:

https://github.com/settings/developers

The callback-Url need to be created based on the following pattern: `https://<hostname>/api/auth/callback/github`, where `<hostname>` needs to be replaced with the public name of the lasius instance.

Once the provider is entered in the backend configuration, Github integration can be configured using the following environment variables:

| Environment variable       | Description                                             |
| -------------------------- | ------------------------------------------------------- |
| GITHUB_OAUTH_CLIENT_ID     | Client ID of the application registered with Github     |
| GITHUB_OAUTH_CLIENT_SECRET | Client secret of the application registered with Github |

### Keycloak

Lasius supports the integration of a [Keycloak](https://keycloak.org) instance as an authentication provider. To do this, a corresponding [OpenID Connect client](https://www.keycloak.org/docs/latest/server_admin/index.html#_oidc_clients) must be registered in the Keycloak instance.

The callback-Url need to be created based on the following pattern: `https://<hostname>/api/auth/callback/custom_keycloak`, where `<hostname>` needs to be replaced with the public name of the lasius instance.

Once the client is entered in the Keycloak configuration, Keycloak integration can be configured using the following environment variables:

| Environment variable         | Description                                 |
| ---------------------------- | ------------------------------------------- |
| KEYCLOAK_OAUTH_URL           | URL of the Keycloak instance                |
| KEYCLOAK_OAUTH_CLIENT_ID     | Client ID of the registered application     |
| KEYCLOAK_OAUTH_CLIENT_SECRET | Client secret of the registered application |

Additionally, the integration in the frontend can be customized using the following environment variables:
| Environment variable | Description |
|---|--|
| KEYCLOAK_OAUTH_PROVIDER_NAME | Name in the list of authentication providers |
| KEYCLOAK_OAUTH_PROVIDER_ICON | Path to a specific icon. This must be included in the frontend, either through a custom build or by including a local file when starting a Docker image |
