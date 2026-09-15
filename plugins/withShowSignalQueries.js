const { withAndroidManifest } = require('expo/config-plugins');

/**
 * Lets Linking.canOpenURL see sibling-app custom schemes on Android 11+.
 */
const QUERY_SCHEMES = ['showsignal', 'workouttimermobile'];

function withShowSignalQueries(config) {
  return withAndroidManifest(config, (cfg) => {
    const manifest = cfg.modResults.manifest;
    const queries = Array.isArray(manifest.queries) ? manifest.queries : [];
    const encoded = JSON.stringify(queries);
    for (const scheme of QUERY_SCHEMES) {
      if (encoded.includes(scheme)) continue;
      queries.push({
        intent: [
          {
            action: [{ $: { 'android:name': 'android.intent.action.VIEW' } }],
            data: [{ $: { 'android:scheme': scheme } }],
          },
        ],
      });
    }
    manifest.queries = queries;
    return cfg;
  });
}

module.exports = withShowSignalQueries;
