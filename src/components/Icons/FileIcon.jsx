import { FILE_ICON_LABELS, getFileIconType } from '../../utils/fileIconConfig';
import { FILE_ICON_COMPONENTS } from './FileIcons';

export default function FileIcon({ filename, size = 16 }) {
  const iconType = getFileIconType(filename);
  const Icon = FILE_ICON_COMPONENTS[iconType] || FILE_ICON_COMPONENTS.code;
  const label = FILE_ICON_LABELS[iconType] || FILE_ICON_LABELS.code;

  return (
    <span className="file-icon" title={label}>
      <Icon size={size} label={label} />
    </span>
  );
}
