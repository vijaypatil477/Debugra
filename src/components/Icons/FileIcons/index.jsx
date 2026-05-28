const FileBase = ({ size, children, label }) => (
  <svg
    className="file-icon-svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    role="img"
    aria-label={label}
    focusable="false"
  >
    {children}
  </svg>
);

const Badge = ({ children, fill, textFill = '#ffffff', size = '8' }) => (
  <>
    <rect x="3" y="3" width="18" height="18" rx="4" fill={fill} />
    <text
      x="12"
      y="15.15"
      textAnchor="middle"
      fill={textFill}
      fontSize={size}
      fontFamily="Inter, system-ui, sans-serif"
      fontWeight="800"
      letterSpacing="0"
    >
      {children}
    </text>
  </>
);

const BadgeText = ({ children, fill = '#d4d4d4', x = '12', size = '7.5' }) => (
  <text
    x={x}
    y="15.2"
    textAnchor="middle"
    fill={fill}
    fontSize={size}
    fontFamily="Inter, system-ui, sans-serif"
    fontWeight="800"
    letterSpacing="0"
  >
    {children}
  </text>
);

export const PythonIcon = ({ size, label }) => (
  <FileBase size={size} label={label}>
    <path
      d="M11.8 2.6h4.15c2 0 3.45 1.45 3.45 3.45v4.15c0 1.35-1.1 2.45-2.45 2.45H9.4v-1.9h6.5v-1.45H7.05A2.45 2.45 0 0 1 4.6 6.85v-.8C4.6 4.05 6.05 2.6 8.05 2.6h2.35v2.05h1.4V2.6Z"
      fill="#4b8bbe"
    />
    <path
      d="M12.2 21.4H8.05c-2 0-3.45-1.45-3.45-3.45V13.8c0-1.35 1.1-2.45 2.45-2.45h7.55v1.9H8.1v1.45h8.85a2.45 2.45 0 0 1 2.45 2.45v.8c0 2-1.45 3.45-3.45 3.45H13.6v-2.05h-1.4v2.05Z"
      fill="#ffd43b"
    />
    <circle cx="8.35" cy="6" r="0.85" fill="#ffffff" opacity="0.9" />
    <circle cx="15.65" cy="18" r="0.85" fill="#1f1f1f" opacity="0.75" />
  </FileBase>
);

export const JavaScriptIcon = ({ size, label }) => (
  <FileBase size={size} label={label}>
    <Badge fill="#f7df1e" textFill="#1f1f1f">
      JS
    </Badge>
  </FileBase>
);

export const TypeScriptIcon = ({ size, label }) => (
  <FileBase size={size} label={label}>
    <Badge fill="#3178c6">TS</Badge>
  </FileBase>
);

export const JavaIcon = ({ size, label }) => (
  <FileBase size={size} label={label}>
    <path
      d="M8.2 18.2c3.15 1.25 7.3.65 8.8-.6"
      fill="none"
      stroke="#f89820"
      strokeWidth="1.7"
      strokeLinecap="round"
    />
    <path
      d="M9.6 15.1c2.25.72 5.15.38 6.25-.38"
      fill="none"
      stroke="#5382a1"
      strokeWidth="1.55"
      strokeLinecap="round"
    />
    <path
      d="M12.3 4.1c1.5 1.6-1.35 2.25-.42 3.9.65 1.15 2.25 1.65.45 3.55"
      fill="none"
      stroke="#f89820"
      strokeWidth="1.55"
      strokeLinecap="round"
    />
    <path
      d="M7.5 20.7c3.95.9 8.75.55 10.15-.95"
      fill="none"
      stroke="#5382a1"
      strokeWidth="1.3"
      strokeLinecap="round"
    />
  </FileBase>
);

export const CppIcon = ({ size, label }) => (
  <FileBase size={size} label={label}>
    <path d="M12 2.75 20 7.35v9.3l-8 4.6-8-4.6v-9.3l8-4.6Z" fill="#659ad2" />
    <BadgeText fill="#ffffff" size="6.1">
      C++
    </BadgeText>
  </FileBase>
);

export const CIcon = ({ size, label }) => (
  <FileBase size={size} label={label}>
    <path d="M12 2.75 20 7.35v9.3l-8 4.6-8-4.6v-9.3l8-4.6Z" fill="#6b7f99" />
    <BadgeText fill="#ffffff" size="9">
      C
    </BadgeText>
  </FileBase>
);

export const CSharpIcon = ({ size, label }) => (
  <FileBase size={size} label={label}>
    <path d="M12 2.75 20 7.35v9.3l-8 4.6-8-4.6v-9.3l8-4.6Z" fill="#9b4f96" />
    <BadgeText fill="#ffffff" size="7.1">
      C#
    </BadgeText>
  </FileBase>
);

export const GoIcon = ({ size, label }) => (
  <FileBase size={size} label={label}>
    <path
      d="M3.8 9.6h9.1M2.8 12h8.4M4.1 14.4h8.7"
      stroke="#00add8"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
    <circle cx="15.4" cy="12" r="5.15" fill="none" stroke="#00add8" strokeWidth="1.8" />
    <circle cx="16.8" cy="10.7" r="0.85" fill="#00add8" />
  </FileBase>
);

export const RustIcon = ({ size, label }) => (
  <FileBase size={size} label={label}>
    <circle cx="12" cy="12" r="6.1" fill="none" stroke="#dea584" strokeWidth="1.75" />
    <circle cx="12" cy="12" r="2.1" fill="#dea584" />
    <path
      d="M12 2.9v2.2M12 18.9v2.2M2.9 12h2.2M18.9 12h2.2M5.55 5.55l1.55 1.55M16.9 16.9l1.55 1.55M18.45 5.55 16.9 7.1M7.1 16.9l-1.55 1.55"
      stroke="#dea584"
      strokeWidth="1.25"
      strokeLinecap="round"
    />
  </FileBase>
);

export const RubyIcon = ({ size, label }) => (
  <FileBase size={size} label={label}>
    <path d="M5.1 9.2 9.6 4.9h7.3l1.85 7.05L11.25 20 5.1 9.2Z" fill="#cc342d" />
    <path d="M5.1 9.2h13.65L11.25 20Z" fill="#ef6f67" opacity="0.76" />
    <path d="M9.6 4.9 11.25 20l5.65-15.1Z" fill="#b31217" opacity="0.55" />
  </FileBase>
);

export const PhpIcon = ({ size, label }) => (
  <FileBase size={size} label={label}>
    <ellipse cx="12" cy="12" rx="9.4" ry="5.8" fill="#777bb4" />
    <BadgeText fill="#ffffff" size="6.2">
      PHP
    </BadgeText>
  </FileBase>
);

export const SwiftIcon = ({ size, label }) => (
  <FileBase size={size} label={label}>
    <rect x="3" y="3" width="18" height="18" rx="4" fill="#f05138" />
    <path
      d="M6.6 7.1c3.7 3.55 7 5.35 11.15 6.45-2.4.65-4.4.5-6.55-.22 1.78 1.42 3.85 2.35 6 2.62-3.75 1.45-7.9.15-10.6-3.05 2.15 1.08 3.85 1.4 5.42 1.28-2.2-1.35-3.92-3.35-5.42-7.08Z"
      fill="#ffffff"
    />
  </FileBase>
);

export const SqliteIcon = ({ size, label }) => (
  <FileBase size={size} label={label}>
    <ellipse cx="12" cy="6.7" rx="7.6" ry="2.35" fill="#8a63d2" />
    <path
      d="M4.4 6.7v9.2c0 1.3 3.4 2.35 7.6 2.35s7.6-1.05 7.6-2.35V6.7"
      fill="none"
      stroke="#8a63d2"
      strokeWidth="1.8"
    />
    <path
      d="M4.4 11.25c0 1.3 3.4 2.35 7.6 2.35s7.6-1.05 7.6-2.35"
      fill="none"
      stroke="#c4a8ff"
      strokeWidth="1.25"
    />
  </FileBase>
);

export const BashIcon = ({ size, label }) => (
  <FileBase size={size} label={label}>
    <rect
      x="3"
      y="4"
      width="18"
      height="16"
      rx="3"
      fill="#1f2933"
      stroke="#4ec9b0"
      strokeWidth="1.35"
    />
    <path
      d="m7.1 9.2 3.05 2.8-3.05 2.8"
      fill="none"
      stroke="#4ec9b0"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M12 15.1h5.1" stroke="#d4d4d4" strokeWidth="1.65" strokeLinecap="round" />
  </FileBase>
);

export const JsonIcon = ({ size, label }) => (
  <FileBase size={size} label={label}>
    <path
      d="M9.7 5.4c-2 .95-2.9 3.15-2.9 6.6s.9 5.65 2.9 6.6M14.3 5.4c2 .95 2.9 3.15 2.9 6.6s-.9 5.65-2.9 6.6"
      fill="none"
      stroke="#dcdcaa"
      strokeWidth="1.9"
      strokeLinecap="round"
    />
    <circle cx="12" cy="12" r="1.15" fill="#dcdcaa" />
  </FileBase>
);

export const MarkdownIcon = ({ size, label }) => (
  <FileBase size={size} label={label}>
    <rect
      x="3"
      y="5.2"
      width="18"
      height="13.6"
      rx="2.2"
      fill="none"
      stroke="#7aa2f7"
      strokeWidth="1.55"
    />
    <path
      d="M6.1 15.7V8.9l2.75 3.55L11.6 8.9v6.8M16.2 8.9v6.8m0 0-2-2m2 2 2-2"
      fill="none"
      stroke="#7aa2f7"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </FileBase>
);

export const EnvIcon = ({ size, label }) => (
  <FileBase size={size} label={label}>
    <rect
      x="3"
      y="4"
      width="18"
      height="16"
      rx="3"
      fill="#1f2933"
      stroke="#4ec9b0"
      strokeWidth="1.35"
    />
    <path
      d="M6.8 9h10.4M6.8 12h7.9M6.8 15h10.4"
      stroke="#4ec9b0"
      strokeWidth="1.55"
      strokeLinecap="round"
    />
    <circle cx="17.2" cy="12" r="1" fill="#dcdcaa" />
  </FileBase>
);

export const CodeIcon = ({ size, label }) => (
  <FileBase size={size} label={label}>
    <path
      d="m10 7-5 5 5 5M14 7l5 5-5 5"
      fill="none"
      stroke="#9d9d9d"
      strokeWidth="2.15"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </FileBase>
);

export const DockerfileIcon = ({ size, label }) => (
  <FileBase size={size} label={label}>
    <rect x="3" y="5" width="18" height="14" rx="3" fill="#0f172a" />
    <path d="M8 9h8" stroke="#94a3b8" strokeWidth="1.7" strokeLinecap="round" />
    <path d="M8 12h6" stroke="#94a3b8" strokeWidth="1.7" strokeLinecap="round" />
    <path
      d="M6.5 16.5c1.5-2.5 3.7-2.5 5.2 0 1.5-2.5 3.7-2.5 5.2 0"
      fill="none"
      stroke="#38bdf8"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <circle cx="16.8" cy="16" r="1.05" fill="#38bdf8" />
  </FileBase>
);

export const FILE_ICON_COMPONENTS = {
  python: PythonIcon,
  javascript: JavaScriptIcon,
  typescript: TypeScriptIcon,
  java: JavaIcon,
  cpp: CppIcon,
  c: CIcon,
  csharp: CSharpIcon,
  go: GoIcon,
  rust: RustIcon,
  ruby: RubyIcon,
  php: PhpIcon,
  swift: SwiftIcon,
  sqlite: SqliteIcon,
  bash: BashIcon,
  json: JsonIcon,
  markdown: MarkdownIcon,
  env: EnvIcon,
  dockerfile: DockerfileIcon,
  code: CodeIcon,
};
