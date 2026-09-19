// cognito.ts
import { COGNITO_URL, CLIENT_ID } from '@env';

async function cognitoRequest(target: string, body: object) {
  const response = await fetch(COGNITO_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-amz-json-1.1',
      'X-Amz-Target': `AWSCognitoIdentityProviderService.${target}`,
    },
    body: JSON.stringify(body),
  });

  const json = await response.json();

  if (json.__type) {
    // Cognito error responses include a __type field, e.g. "UsernameExistsException"
    throw new Error(json.message || json.__type);
  }

  return json;
}

export async function signUp(email: string, password: string) {
  return cognitoRequest('SignUp', {
    ClientId: CLIENT_ID,
    Username: email,
    Password: password,
    UserAttributes: [{ Name: 'email', Value: email }],
  });
}

export async function confirmSignUp(email: string, code: string) {
  return cognitoRequest('ConfirmSignUp', {
    ClientId: CLIENT_ID,
    Username: email,
    ConfirmationCode: code,
  });
}

export async function signIn(email: string, password: string) {
  const result = await cognitoRequest('InitiateAuth', {
    AuthFlow: 'USER_PASSWORD_AUTH',
    ClientId: CLIENT_ID,
    AuthParameters: { USERNAME: email, PASSWORD: password },
  });
  return result.AuthenticationResult; // contains IdToken, AccessToken, RefreshToken
}