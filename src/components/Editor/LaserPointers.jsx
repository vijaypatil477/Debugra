import { useRef, useEffect } from 'react';
import './LaserPointers.css';

const MAX_TRAIL = 4;

/**
 * LaserPointers
 * Renders a transparent overlay on top of the editor that displays
 * remote users' cursor positions as glowing laser dots with trailing effect.
 *
 * @param {{ uid, x, y, displayName, color }[]} pointers - remote pointer data
 */
export default function LaserPointers({ pointers }) {
  const trailsRef = useRef({});

  // Maintain a short trail history per user
  useEffect(() => {
    const trails = trailsRef.current;
    pointers.forEach((p) => {
      if (!trails[p.uid]) trails[p.uid] = [];
      const history = trails[p.uid];
      const last = history[history.length - 1];
      if (!last || last.x !== p.x || last.y !== p.y) {
        history.push({ x: p.x, y: p.y });
        if (history.length > MAX_TRAIL) history.shift();
      }
    });

    // Clean up trails for users who left
    Object.keys(trails).forEach((uid) => {
      if (!pointers.find((p) => p.uid === uid)) {
        delete trails[uid];
      }
    });
  }, [pointers]);

  if (!pointers.length) return null;

  return (
    <div className="laser-overlay" aria-hidden="true">
      {pointers.map((pointer) => {
        const trail = trailsRef.current[pointer.uid] || [];

        return (
          <div key={pointer.uid}>
            {/* Trail dots */}
            {trail.slice(0, -1).map((pos, i) => (
              <div
                key={`trail-${pointer.uid}-${i}`}
                className="laser-trail"
                style={{
                  left: `${pos.x}%`,
                  top: `${pos.y}%`,
                  background: pointer.color,
                  opacity: ((i + 1) / trail.length) * 0.3,
                  width: `${4 + i * 1.5}px`,
                  height: `${4 + i * 1.5}px`,
                }}
              />
            ))}

            {/* Main laser dot */}
            <div
              className="laser-dot"
              style={{
                left: `${pointer.x}%`,
                top: `${pointer.y}%`,
                background: pointer.color,
                '--laser-color': pointer.color,
              }}
            >
              <span
                className="laser-label"
                style={{ background: `${pointer.color}cc` }}
              >
                {pointer.displayName}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
