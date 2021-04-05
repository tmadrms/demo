const fetch = require('node-fetch');

const {
  env: { FASTLY_API_TOKEN, FASTLY_SERVICE_ID},
} = require('process');

let authMethod = 'na';
switch( true ) {
  case typeof FASTLY_API_TOKEN !== 'undefined' && typeof FASTLY_SERVICE_ID !== 'undefined':
    authMethod = 'TOKEN';
    break;
}

module.exports = {
  onPostBuild({
    utils: {
      build: { failBuild },
    },
  }) {
    if( authMethod !== 'TOKEN' && authMethod !== 'KEY' ) {
      return failBuild(
          "'" + authMethod + "' is not a valid Authentication Method.  Please report this issue to the developer."
      );
    }
    else {
      console.log('FASTLY ' + authMethod + ' Authentication method detected.');
    }
  },
  async onSuccess({
                utils: {
                  build: { failPlugin },
                },
              }) {
    console.log('Preparing to trigger Fastly cache purge');
    //let baseUrl = `https://api.fastly.com/service/${FASTLY_SERVICE_ID}/purge_all`;
    let baseUrl = `https://api.fastly.com/service/${FASTLY_SERVICE_ID}/purge/css`; //purge only surrogate key
    let headers;
    switch( authMethod ) {
      case 'TOKEN':
        headers = {
          'Fastly-Key': FASTLY_API_TOKEN,
          'Content-Type': 'application/json',
          //'Fastly-Soft-Purge' : '1'
        };
        break;

    }
    let body = { purge_everything: true };

    try {
      const { status, statusText } = await fetch(baseUrl, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(body),
      });

      if (status != 200) {
        return failPlugin(
            "Fastly cache couldn't be purged. Status: " + status + " " + statusText
        );
      }
      console.log('Fastly cache purged successfully!');
    } catch (error) {
      return failPlugin('Fastly cache purge failed', { error });
    }
  },
};
