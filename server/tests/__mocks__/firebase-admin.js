const rooms = {};

module.exports = {
  // Allow tests to mutate `rooms` via require.cache if desired
  __setRooms: (r) => Object.assign(rooms, r),
  firestore: () => ({
    collection: () => ({
      doc: (id) => ({
        get: async () => ({
          exists: id in rooms,
          data: () => rooms[id] || {},
        }),
      }),
    }),
  }),
};
