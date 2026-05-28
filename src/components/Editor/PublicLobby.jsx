import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';

function formatElapsed(createdAt) {
  if (!createdAt?.toDate) return 'Unknown';
  const diffMs = Date.now() - createdAt.toDate().getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ${minutes % 60}m`;
  const days = Math.floor(hours / 24);
  return `${days}d ${hours % 24}h`;
}

export default function PublicLobby() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const roomsRef = collection(db, 'rooms');
    const q = query(roomsRef, where('isPrivate', '==', false), orderBy('updatedAt', 'desc'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const activeRooms = snapshot
          .docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter((room) => Array.isArray(room.activeUsers) && room.activeUsers.length > 0);
        setRooms(activeRooms);
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setError('Unable to load public rooms.');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return (
    <div className="landing-section" style={{ paddingTop: '40px', paddingBottom: '64px' }}>
      <div className="container">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-start gap-3 mb-4">
          <div>
            <h1 className="section-title" style={{ marginBottom: '12px' }}>
              Public rooms lobby
            </h1>
            <p className="section-subtitle" style={{ maxWidth: '640px', marginTop: 0 }}>
              Browse active public coding rooms from other developers. Rooms update in real time,
              and you can join immediately to help with code or collaborate live.
            </p>
          </div>
          <button
            className="landing-btn-primary"
            style={{ height: '44px' }}
            onClick={() => navigate('/editor')}
          >
            Open editor
          </button>
        </div>

        {loading ? (
          <div
            style={{
              padding: '32px',
              background: 'rgba(255,255,255,0.04)',
              borderRadius: '18px',
              border: '1px solid rgba(255,255,255,0.05)',
            }}
          >
            Loading public rooms...
          </div>
        ) : error ? (
          <div
            style={{
              padding: '32px',
              background: 'rgba(255,80,80,0.08)',
              borderRadius: '18px',
              border: '1px solid rgba(255,80,80,0.2)',
            }}
          >
            {error}
          </div>
        ) : rooms.length === 0 ? (
          <div
            style={{
              padding: '32px',
              background: 'rgba(255,255,255,0.04)',
              borderRadius: '18px',
              border: '1px solid rgba(255,255,255,0.05)',
            }}
          >
            No public rooms are active right now. Check back soon or create your own room.
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gap: '18px',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            }}
          >
            {rooms.map((room) => {
              const hostName =
                room.activeUsers?.find((user) => user.uid === room.createdBy)?.displayName ||
                'Host';
              const participantCount = room.activeUsers?.length || 0;
              const language = room.language || 'Unknown';
              const elapsed = formatElapsed(room.createdAt);
              return (
                <div
                  key={room.id}
                  style={{
                    padding: '22px',
                    borderRadius: '18px',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    minHeight: '220px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: '0.72rem',
                        letterSpacing: '0.16em',
                        textTransform: 'uppercase',
                        color: '#8b9ebb',
                        marginBottom: '10px',
                      }}
                    >
                      Public room
                    </div>
                    <h2 style={{ margin: 0, fontSize: '1.1rem' }}>{room.name || room.id}</h2>
                    <p style={{ margin: '10px 0 18px', color: '#b3b3c3', fontSize: '0.95rem' }}>
                      Join an active room for pair-programming, debugging, and sharing code
                      immediately.
                    </p>
                    <div style={{ display: 'grid', gap: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#8b9ebb' }}>Host</span>
                        <strong>{hostName}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#8b9ebb' }}>Participants</span>
                        <strong>{participantCount}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#8b9ebb' }}>Language</span>
                        <strong>{language}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#8b9ebb' }}>Since</span>
                        <strong>{elapsed}</strong>
                      </div>
                    </div>
                  </div>

                  <button
                    className="topbar-link"
                    style={{ marginTop: '22px', width: '100%' }}
                    onClick={() => navigate(`/editor?roomId=${room.id}`)}
                  >
                    Join room
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
