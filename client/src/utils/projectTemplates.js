import { LayoutTemplate, Code2, Megaphone } from 'lucide-react';

export const PROJECT_TEMPLATES = [
  {
    key: 'blank',
    name: 'Blank Project',
    description: 'Start from scratch',
    icon: LayoutTemplate,
    tasks: [],
  },
  {
    key: 'software',
    name: 'Software Development',
    description: 'Planning, development, testing, deployment',
    icon: Code2,
    tasks: [
      { label: 'Planning', title: 'Define requirements' },
      { label: 'Planning', title: 'Create wireframes' },
      { label: 'Development', title: 'Build backend API' },
      { label: 'Development', title: 'Set up database' },
      { label: 'Development', title: 'Build frontend' },
      { label: 'Testing', title: 'Write unit tests' },
      { label: 'Testing', title: 'Run integration tests' },
      { label: 'Deployment', title: 'Deploy to production' },
    ],
  },
  {
    key: 'marketing',
    name: 'Marketing Campaign',
    description: 'Research, content, launch, analytics',
    icon: Megaphone,
    tasks: [
      { label: 'Research', title: 'Market research' },
      { label: 'Research', title: 'Competitor analysis' },
      { label: 'Content', title: 'Write campaign copy' },
      { label: 'Content', title: 'Design creatives' },
      { label: 'Launch', title: 'Schedule campaign' },
      { label: 'Launch', title: 'Go live' },
      { label: 'Analytics', title: 'Track performance' },
    ],
  },
];
