const { withDangerousMod } = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Xcode 27+ fails the build when any Pod (often SDWebImage resource bundles)
 * still has IPHONEOS_DEPLOYMENT_TARGET below 15.0. Expo's default Podfile
 * does not bump those, so we inject a post_install clamp.
 */
function withIosMinDeployment(config) {
  return withDangerousMod(config, [
    'ios',
    async (cfg) => {
      const podfilePath = path.join(cfg.modRequest.platformProjectRoot, 'Podfile');
      let contents = fs.readFileSync(podfilePath, 'utf8');
      const marker = 'Xcode 27 treats deployment targets below 15.0';
      if (contents.includes(marker)) {
        return cfg;
      }

      const inject = `
    # ${marker} as build-blocking errors
    # (SDWebImage resource bundles still ship with 9.0).
    min_ios = podfile_properties['ios.deploymentTarget'] || '16.4'
    installer.pods_project.targets.each do |target|
      target.build_configurations.each do |bc|
        current = bc.build_settings['IPHONEOS_DEPLOYMENT_TARGET']
        if current.nil? || current.to_f < min_ios.to_f
          bc.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = min_ios
        end
      end
    end
`;

      if (!contents.includes('react_native_post_install(')) {
        throw new Error('withIosMinDeployment: expected react_native_post_install in Podfile');
      }

      // Insert after the react_native_post_install(...) call's closing paren block
      contents = contents.replace(
        /(react_native_post_install\([\s\S]*?\n\s*\))\n/,
        `$1\n${inject}`
      );
      fs.writeFileSync(podfilePath, contents);
      return cfg;
    },
  ]);
}

module.exports = withIosMinDeployment;
