const cc = DataStudioApp.createCommunityConnector();
const AUTH_PROPERTY_PATH = 'dscc.key';

// TODO - implement your credentials validation logic here.
function validateCredentials(): boolean {
  return true;
}

// https://developers.google.com/datastudio/connector/auth#getauthtype
function getAuthType() {
  return cc
    .newAuthTypeResponse()
    .setAuthType(cc.AuthType.KEY)
    .setHelpUrl('https://www.example.org/connector-auth-help')
    .build();
}

// https://developers.google.com/datastudio/connector/auth#isauthvalid
function isAuthValid() {
  return validateCredentials();
}

// https://developers.google.com/datastudio/connector/auth#setcredentials
function setCredentials(request) {
  const key = request.key;

  const validKey = validateCredentials();
  if (!validKey) {
    return {
      errorCode: 'INVALID_CREDENTIALS',
    };
  }
  const userProperties = PropertiesService.getUserProperties();
  userProperties.setProperty(AUTH_PROPERTY_PATH, key);
  return {
    errorCode: 'NONE',
  };
}

// https://developers.google.com/datastudio/connector/auth#resetauth
function resetAuth() {
  const userProperties = PropertiesService.getUserProperties();
  userProperties.deleteProperty(AUTH_PROPERTY_PATH);
}
