// FIX: Add declarations for gapi and google to resolve TypeScript errors
// as these are loaded from external scripts.
declare var gapi: any;
// FIX: Replaced 'declare var google: any;' with a namespace declaration to provide
// proper types for the Google Identity Services client and fix the compile error.
declare namespace google {
    namespace accounts {
        namespace oauth2 {
            interface TokenClient {
                callback: (resp: any) => void;
                requestAccessToken: (overrideConfig?: { prompt: string; }) => void;
            }
            function initTokenClient(config: {
                client_id: string;
                scope: string;
                callback: string | ((resp: any) => void);
            }): TokenClient;
            function revoke(accessToken: string, callback: () => void): void;
        }
    }
}

// This service manages Google Drive integration using the Google Identity Services (GIS)
// and Google APIs Client Library for JavaScript (GAPI).

// IMPORTANT: This CLIENT_ID is a placeholder. A real Google Cloud project
// with an OAuth 2.0 Client ID is required for this to work.
// The Client ID should be configured as an environment variable.
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || 'YOUR_CLIENT_ID.apps.googleusercontent.com';
const API_KEY = process.env.API_KEY;

const DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"];
const SCOPES = 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.profile';
const FOLDER_NAME = 'Taxi Watch Reports';

let tokenClient: google.accounts.oauth2.TokenClient | null = null;

/**
 * Loads the GAPI and GIS scripts dynamically.
 */
const loadScript = (src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    document.body.appendChild(script);
  });
};

/**
 * Initializes the GAPI and GIS clients.
 * This version separates GAPI library loading from client initialization for clarity and robustness.
 */
export const initGoogleClients = async (): Promise<void> => {
  // Load scripts sequentially.
  await loadScript('https://apis.google.com/js/api.js');
  await loadScript('https://accounts.google.com/gsi/client');

  // Wait for GAPI to load the 'client' library.
  await new Promise<void>((resolve, reject) => {
    gapi.load('client', {
      callback: resolve,
      onerror: reject, // Let the promise reject with the original error.
      timeout: 10000,
      ontimeout: () => reject(new Error('GAPI client load timed out.')),
    });
  });
  
  // Once 'client' is loaded, initialize it for the Drive API.
  // We await the `thenable` returned by gapi.client.init.
  // This helps avoid race conditions and improves readability. The `clientId`
  // is included as it's a common fix for discovery document errors.
  await gapi.client.init({
    apiKey: API_KEY,
    clientId: CLIENT_ID,
    discoveryDocs: DISCOVERY_DOCS,
  });

  // Initialize GIS token client for handling OAuth tokens.
  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: SCOPES,
    callback: '', // Handled dynamically in `signIn`.
  });
};


/**
 * Prompts the user to sign in and authorize the application.
 * @returns A promise that resolves with the user's information.
 */
export const signIn = (): Promise<{ name: string; email: string; }> => {
  return new Promise((resolve, reject) => {
    if (!tokenClient) {
      return reject(new Error("Google Identity Services not initialized."));
    }

    tokenClient.callback = async (resp: any) => {
      if (resp.error) {
        return reject(new Error(resp.error));
      }
      try {
        const userInfoResponse = await gapi.client.request({
            path: 'https://www.googleapis.com/oauth2/v3/userinfo'
        });
        const userInfo = JSON.parse(userInfoResponse.body);
        resolve({ name: userInfo.name, email: userInfo.email });
      } catch (err) {
        reject(err);
      }
    };

    if (gapi.client.getToken() === null) {
      tokenClient.requestAccessToken({ prompt: 'consent' });
    } else {
      tokenClient.requestAccessToken({ prompt: '' });
    }
  });
};

/**
 * Signs the user out of the application.
 */
export const signOut = () => {
  const token = gapi.client.getToken();
  if (token) {
    google.accounts.oauth2.revoke(token.access_token, () => {});
    gapi.client.setToken(null);
  }
};


/**
 * Searches for or creates a specific folder in Google Drive.
 * @returns The ID of the folder.
 */
const getOrCreateFolder = async (): Promise<string> => {
  // Search for the folder first
  const searchResponse = await gapi.client.drive.files.list({
    q: `mimeType='application/vnd.google-apps.folder' and name='${FOLDER_NAME}' and trashed=false`,
    fields: 'files(id, name)',
  });
  
  if (searchResponse.result.files && searchResponse.result.files.length > 0) {
    return searchResponse.result.files[0].id!;
  } else {
    // Create the folder if it doesn't exist
    const createResponse = await gapi.client.drive.files.create({
      resource: {
        name: FOLDER_NAME,
        mimeType: 'application/vnd.google-apps.folder',
      },
      fields: 'id',
    });
    return createResponse.result.id!;
  }
};

/**
 * Uploads a text file to the designated folder in Google Drive.
 * @param fileName - The name of the file to create.
 * @param content - The text content of the file.
 */
export const uploadFile = async (fileName: string, content: string): Promise<void> => {
    if (gapi.client.getToken() === null) {
        throw new Error("User not signed in.");
    }

    try {
        const folderId = await getOrCreateFolder();

        const metadata = {
            name: fileName,
            mimeType: 'text/plain',
            parents: [folderId],
        };

        const boundary = '-------314159265358979323846';
        const delimiter = `\r\n--${boundary}\r\n`;
        const close_delim = `\r\n--${boundary}--`;

        const multipartRequestBody =
            delimiter +
            'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
            JSON.stringify(metadata) +
            delimiter +
            'Content-Type: text/plain; charset=UTF-8\r\n\r\n' +
            content +
            close_delim;

        const request = gapi.client.request({
            path: '/upload/drive/v3/files',
            method: 'POST',
            params: { uploadType: 'multipart' },
            headers: {
                'Content-Type': `multipart/related; boundary="${boundary}"`,
            },
            body: multipartRequestBody,
        });
        
        await request;
    } catch (error: any) {
        console.error("Error during file upload:", error);
        throw new Error(error.result?.error?.message || "Failed to upload file to Google Drive.");
    }
};