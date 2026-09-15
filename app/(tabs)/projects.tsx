import { useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { Button, Card, Page, openAppOrWeb, openLink, styles } from '../../src/ui';
import { hubApps, type HubApp } from '../../src/hubApps';
import { PROJECT_CATEGORIES, PROJECTS, categoryLabel, statusLabel, type Project, type ProjectCategory } from '../../src/projects';

function openApp(app: HubApp) {
  const missing = app.urlNeeded
    ? `${app.name} needs a URL. Set ${app.urlEnv ?? 'the app URL env var'} in .env — this repo does not ship a production link.`
    : `${app.name} isn’t installed, and no web URL is configured.`;
  void openAppOrWeb(app.scheme ? `${app.scheme}://` : undefined, app.url, missing);
}

function ProjectCard({ project }: { project: Project }) {
  return (
    <Card>
      <View style={styles.row}>
        <Text accessible={false} style={{ fontSize: 28 }}>{project.icon}</Text>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={styles.eyebrow}>{categoryLabel(project.category).toUpperCase()} · {statusLabel(project.status).toUpperCase()}</Text>
          <Text style={styles.heading}>{project.name}</Text>
        </View>
      </View>
      <Text style={styles.body}>{project.shortDescription}</Text>
      <Text style={styles.body}>{project.technologies.join(' · ')}</Text>
      {!!project.longDescription && <Text style={styles.body}>{project.longDescription}</Text>}
      <View style={styles.row}>
        {!!project.website && <Button title="Visit" onPress={() => void openLink(project.website!)} />}
        {!!project.appLink && <Button title="View Project" onPress={() => void openLink(project.appLink!)} />}
        {!!project.appStore && <Button title="App Store" onPress={() => void openLink(project.appStore!)} />}
        {!!project.github && <Button title="GitHub" onPress={() => void openLink(project.github!)} />}
      </View>
    </Card>
  );
}

export default function Projects() {
  const [category, setCategory] = useState<ProjectCategory | 'all'>('all');
  const apps = hubApps();
  const visible = useMemo(
    () => category === 'all' ? PROJECTS : PROJECTS.filter(project => project.category === category),
    [category],
  );

  return (
    <Page>
      <Text style={styles.eyebrow}>PORTFOLIO</Text>
      <Text style={styles.title}>My Projects</Text>
      <Text style={styles.body}>Work and apps from the My Vibe hub. Add a project in src/projects.ts — name, description, category, tech, and public links.</Text>

      <Text style={styles.heading}>My Apps</Text>
      <Text style={styles.body}>Independent apps. They stay on this screen so Home can keep the month calendar as the hero.</Text>
      {apps.map(app => (
        <Card key={app.id}>
          <Text style={styles.eyebrow}>{app.urlNeeded ? 'URL NEEDED' : 'APP'}</Text>
          <Text style={styles.heading}>{app.name}</Text>
          <Text style={styles.body}>{app.blurb}</Text>
          {app.urlNeeded
            ? <Text style={styles.body}>Set {app.urlEnv} to open {app.name}. No production URL is bundled.</Text>
            : null}
          <Button
            title={app.urlNeeded && !app.scheme ? 'URL not configured' : `Open ${app.name}`}
            disabled={app.urlNeeded && !app.scheme}
            onPress={() => openApp(app)}
          />
        </Card>
      ))}

      <Text style={styles.heading}>Projects</Text>
      <View style={styles.row}>
        <Button title={category === 'all' ? '✓ All' : 'All'} onPress={() => setCategory('all')} />
        {PROJECT_CATEGORIES.map(item => (
          <Button
            key={item.id}
            title={`${category === item.id ? '✓ ' : ''}${item.label}`}
            onPress={() => setCategory(item.id)}
          />
        ))}
      </View>
      {visible.length
        ? visible.map(project => <ProjectCard key={project.id} project={project} />)
        : <Text style={styles.body}>No projects in this category yet. Add one in src/projects.ts.</Text>}
    </Page>
  );
}
