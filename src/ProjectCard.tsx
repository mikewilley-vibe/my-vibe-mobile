import { Image, Text, View } from 'react-native';
import type { HubApp } from './hubApps';
import {
 projectAppStoreUrl,
 projectDescription,
 projectGithubUrl,
 projectType,
 projectUrl,
 statusLabel,
 typeLabel,
 type Project,
} from './projects';
import { Button, Card, openAppOrWeb, openLink, styles } from './ui';

function openHubApp(app: HubApp) {
  const missing = app.urlNeeded
    ? `${app.name} needs a URL. Set ${app.urlEnv ?? 'the app URL env var'} in .env — this repo does not ship a production link.`
    : `${app.name} isn’t installed, and no web URL is configured.`;
  void openAppOrWeb(app.scheme ? `${app.scheme}://` : undefined, app.url, missing);
}

/** Reusable project card. Actions appear only when a URL or matching hub app exists. */
export function ProjectCard({ project, hubApp }: { project: Project; hubApp?: HubApp }) {
  const type = projectType(project);
  const url = projectUrl(project);
  const github = projectGithubUrl(project);
  const appStore = projectAppStoreUrl(project);
  const appLink = project.appLink;
  const canOpenHub = !!hubApp && !(hubApp.urlNeeded && !hubApp.scheme);

  return (
    <Card>
      <View style={styles.row}>
        {project.image
          ? <Image accessibilityIgnoresInvertColors source={{ uri: project.image }} style={{ width: 40, height: 40, borderRadius: 10 }} />
          : <Text accessible={false} style={{ fontSize: 28 }}>{project.icon ?? '◈'}</Text>}
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={styles.eyebrow}>{typeLabel(type).toUpperCase()} · {statusLabel(project.status).toUpperCase()}</Text>
          <Text style={styles.heading}>{project.name}</Text>
        </View>
      </View>
      <Text style={styles.body}>{projectDescription(project)}</Text>
      {!!project.technologies?.length && <Text style={styles.body}>{project.technologies.join(' · ')}</Text>}
      {!!project.longDescription && <Text style={styles.body}>{project.longDescription}</Text>}
      <View style={styles.row}>
        {!!url && <Button title="Visit" onPress={() => void openLink(url)} />}
        {!!appLink && <Button title="View Project" onPress={() => void openLink(appLink)} />}
        {!!appStore && <Button title="App Store" onPress={() => void openLink(appStore)} />}
        {!!github && <Button title="GitHub" onPress={() => void openLink(github)} />}
        {hubApp && (
          <Button
            title={canOpenHub ? `Open ${hubApp.name}` : 'URL not configured'}
            disabled={!canOpenHub}
            onPress={() => openHubApp(hubApp)}
          />
        )}
      </View>
    </Card>
  );
}
