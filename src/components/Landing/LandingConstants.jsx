import React from 'react';

// ─── Inline SVG Icons ─────────────────────────────────────────────────────────
export const IconBolt = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
  </svg>
);
export const IconWrench = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
  </svg>
);
export const IconBook = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
  </svg>
);
export const IconPlay = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <polygon points="10 8 16 12 10 16 10 8" />
  </svg>
);
export const IconTest = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="9 11 12 14 22 4" />
    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
  </svg>
);
export const IconUsers = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);
export const IconCloud = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="16 16 12 12 8 16" />
    <line x1="12" y1="12" x2="12" y2="21" />
    <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
  </svg>
);
export const IconCode = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="16 18 22 12 16 6" />
    <polyline points="8 6 2 12 8 18" />
  </svg>
);
export const IconTerminal = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="4 17 10 11 4 5" />
    <line x1="12" y1="19" x2="20" y2="19" />
  </svg>
);

// ─── Feature Data ─────────────────────────────────────────────────────────────
export const FEATURES = [
  {
    icon: <IconBolt />,
    accent: '#8b5cf6',
    tag: 'AI',
    title: 'Error Explainer',
    desc: 'Paste an error — get the root cause and exact fix in plain language, instantly.',
    size: 'large', // spans 2 cols on desktop
  },
  {
    icon: <IconWrench />,
    accent: '#10b981',
    tag: 'AI',
    title: 'One-Click Fix',
    desc: 'Rewrites your buggy code with a clean, working version. One button.',
    size: 'normal',
  },
  {
    icon: <IconPlay />,
    accent: '#f97316',
    tag: 'AI',
    title: 'Execution Visualizer',
    desc: 'Step through your code line-by-line. Watch every variable change in real time.',
    size: 'normal',
  },
  {
    icon: <IconBook />,
    accent: '#3b82f6',
    tag: 'AI',
    title: 'Logic Breakdown',
    desc: 'Get a step-by-step explanation of what your code actually does, with Big-O complexity.',
    size: 'normal',
  },
  {
    icon: <IconTest />,
    accent: '#ec4899',
    tag: 'AI',
    title: 'Test Case Generator',
    desc: 'Auto-generate edge cases, corner cases, and stress tests for your solution.',
    size: 'normal',
  },
  {
    icon: <IconUsers />,
    accent: '#4ec9b0',
    tag: 'Collab',
    title: 'Real-Time Rooms',
    desc: 'Create a room, share the ID. Edit together with access control and live team chat.',
    size: 'large',
  },
  {
    icon: <IconCode />,
    accent: '#dcdcaa',
    tag: 'Editor',
    title: 'Monaco Editor',
    desc: 'The same engine powering VS Code — with syntax highlighting, snippets, and autocomplete.',
    size: 'normal',
  },
  {
    icon: <IconCloud />,
    accent: '#60a5fa',
    tag: 'Editor',
    title: 'Save & Download',
    desc: 'Sign in to save code to Firestore. Download any file with one click.',
    size: 'normal',
  },
  {
    icon: <IconTerminal />,
    accent: '#a78bfa',
    tag: 'Engine',
    title: '18+ Languages',
    desc: 'Python, C++, Java, Go, Rust, SQLite and more — powered by Wandbox, always free.',
    size: 'normal',
  },
];

export const LANGUAGES = [
  'Python',
  'JavaScript',
  'TypeScript',
  'Java',
  'C++',
  'C',
  'C#',
  'Go',
  'Rust',
  'Ruby',
  'PHP',
  'Swift',
  'Perl',
  'Lua',
  'Scala',
  'Haskell',
  'SQL',
  'Bash',
];
export const STATS = [
  { value: '18+', label: 'Languages' },
  { value: '5', label: 'AI Features' },
  { value: '∞', label: 'Free Forever' },
  { value: '0', label: 'Setup Required' },
];
export const FAQ_ITEMS = [
  {
    question: 'What is Debugra?',
    answer:
      'Debugra is a browser-based coding workspace with an editor, execution engine, AI debugging tools, and real-time collaboration.',
  },
  {
    question: 'Do I need an account to try it?',
    answer:
      'No. You can open the editor and start coding right away. An account is only needed if you want to save code or use sign-in features.',
  },
  {
    question: 'Can I use Debugra for job applications or recruiter reviews?',
    answer:
      'Debugra is built for coding, debugging, and collaboration. It is not a job-application portal, but you can use it to prepare code samples, demos, and live walkthroughs for interviews or reviews.',
  },
  {
    question: 'How does shared access work?',
    answer:
      'You can create a room and share the room ID with collaborators. Room owners control access and can manage who joins and edits.',
  },
  {
    question: 'What happens to saved code and account data?',
    answer:
      'Signed-in users can save snippets and revisit them later. Authentication and saved content are handled through the app’s Firebase-backed services.',
  },
  {
    question: 'How is privacy handled?',
    answer:
      'Use the editor without sharing anything sensitive. For saved code, room data, and authentication, Debugra only keeps what is needed to support those features. If a formal privacy policy is required, it should be published alongside the site.',
  },
];

// ─── Tag accent colors ─────────────────────────────────────────────────────────
export const TAG_COLORS = {
  AI: { bg: 'rgba(139,92,246,0.15)', color: '#a78bfa' },
  Collab: { bg: 'rgba(78,201,176,0.12)', color: '#4ec9b0' },
  Editor: { bg: 'rgba(59,130,246,0.12)', color: '#60a5fa' },
  Engine: { bg: 'rgba(249,115,22,0.12)', color: '#fb923c' },
};
export const REVIEWS = [
  {
    name: 'Alex',
    rating: 5,
    review: 'Excellent debugging platform. The AI explanations are incredibly helpful.',
  },
  {
    name: 'Sarah',
    rating: 5,
    review: 'The execution visualizer helped me understand recursion much faster.',
  },
  {
    name: 'John',
    rating: 4,
    review: 'Clean interface and smooth collaboration features.',
  },
];
