import { useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { Button, Page, styles } from '../../src/ui';
import { hubApps } from '../../src/hubApps';
import { ProjectCard } from '../../src/ProjectCard';
import { PROJECT_TYPES, PROJECTS, projectType, type ProjectType } from '../../src/projects';

export default function Projects() {
  const [type, setType] = useState<ProjectType | 'all'>('all');
  const apps = hubApps();
  const visible = useMemo(
    () => type === 'all' ? PROJECTS : PROJECTS.filter(project => projectType(project) === type),
    [type],
  );

  return (
    <Page>
      <Text style={styles.eyebrow}>PORTFOLIO</Text>
      <Text style={styles.title}>My Projects</Text>
      <Text style={styles.body}>Work and apps from the My Vibe hub. Add a project in src/projects.ts — name, description, type, status, and public links only when they already exist.</Text>

      <View style={styles.row}>
        <Button title={type === 'all' ? '✓ All' : 'All'} onPress={() => setType('all')} />
        {PROJECT_TYPES.map(item => (
          <Button
            key={item.id}
            title={`${type === item.id ? '✓ ' : ''}${item.label}`}
            onPress={() => setType(item.id)}
          />
        ))}
      </View>
      {visible.length
        ? visible.map(project => (
          <ProjectCard
            key={project.id}
            project={project}
            hubApp={apps.find(app => app.id === project.id)}
          />
        ))
        : <Text style={styles.body}>No projects of this type yet. Add one in src/projects.ts.</Text>}
    </Page>
  );
}
