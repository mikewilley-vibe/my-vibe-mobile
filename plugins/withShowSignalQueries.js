const { withAndroidManifest } = require('expo/config-plugins');

/**
 * Lets Linking.canOpenURL see the ShowSignal custom scheme on Android 11+.
 */
function withShowSignalQueries(config) {
  return withAndroidManifest(config, (cfg) => {
    const manifest = cfg.modResults.manifest;
    const queries = Array.isArray(manifest.queries) ? manifest.queries : [];
    if (!JSON.stringify(queries).includes('showsignal')) {
      queries.push({
        intent: [
          {
            action: [{ $: { 'android:name': 'android.intent.action.VIEW' } }],
            data: [{ $: { 'android:scheme': 'showsignal' } }],
          },
        ],
      });
    }
    manifest.queries = queries;
    return cfg;
  });
}

module.exports = withShowSignalQueries;
