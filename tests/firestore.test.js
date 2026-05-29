import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { describe, beforeAll, afterAll, beforeEach, it } from 'vitest';

const PROJECT_ID = 'demo-debugra-project';
let testEnv;

beforeAll(async () => {
  const rulesPath = resolve(process.cwd(), 'firestore.rules');
  const rules = readFileSync(rulesPath, 'utf8');
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules,
      host: '127.0.0.1',
      port: 8080,
    },
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

beforeEach(async () => {
  await testEnv.clearFirestore();
});

describe('Firestore Security Rules', () => {
  // Test User Profiles
  describe('Users collection', () => {
    it('allows a user to read and write their own user profile', async () => {
      const bobDb = testEnv.authenticatedContext('bob').firestore();
      const profileRef = bobDb.doc('users/bob');

      await assertSucceeds(profileRef.set({ displayName: 'Bob', email: 'bob@example.com' }));
      await assertSucceeds(profileRef.get());
    });

    it('denies a user from reading or writing other user profiles', async () => {
      const aliceDb = testEnv.authenticatedContext('alice').firestore();
      const bobProfileRef = aliceDb.doc('users/bob');

      await assertFails(bobProfileRef.get());
      await assertFails(bobProfileRef.set({ displayName: 'Hacker' }));
    });

    it('allows a user to read and write their own savedCode documents', async () => {
      const bobDb = testEnv.authenticatedContext('bob').firestore();
      const codeRef = bobDb.doc('users/bob/savedCode/code1');

      await assertSucceeds(
        codeRef.set({ name: 'main.py', code: 'print("hello")', language: 'python' })
      );
      await assertSucceeds(codeRef.get());
    });

    it('denies a user from reading or writing other users savedCode documents', async () => {
      const aliceDb = testEnv.authenticatedContext('alice').firestore();
      const bobCodeRef = aliceDb.doc('users/bob/savedCode/code1');

      await assertFails(bobCodeRef.get());
      await assertFails(bobCodeRef.set({ code: 'hacked' }));
    });
  });

  // Test Room Creation and Access
  describe('Rooms collection', () => {
    const validRoomData = {
      name: 'Room 1',
      createdBy: 'bob',
      isPrivate: false,
      code: 'print("hello")',
      language: 'python',
      activeUsers: [{ uid: 'bob', displayName: 'Bob' }],
      allowedEditors: ['bob'],
      currentEditor: 'bob',
      editRequests: [],
    };

    it('allows authenticated users to create a room if they set themselves as creator', async () => {
      const bobDb = testEnv.authenticatedContext('bob').firestore();
      const roomRef = bobDb.doc('rooms/room1');

      await assertSucceeds(roomRef.set(validRoomData));
    });

    it('denies room creation if the creator ID does not match the authenticated user', async () => {
      const aliceDb = testEnv.authenticatedContext('alice').firestore();
      const roomRef = aliceDb.doc('rooms/room1');

      await assertFails(roomRef.set(validRoomData)); // bob is creator, but authenticated as alice
    });

    it('denies unauthenticated users from creating a room', async () => {
      const guestDb = testEnv.unauthenticatedContext().firestore();
      const roomRef = guestDb.doc('rooms/room1');

      await assertFails(roomRef.set(validRoomData));
    });

    it('allows authenticated users to read room documents', async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().doc('rooms/room1').set(validRoomData);
      });

      const aliceDb = testEnv.authenticatedContext('alice').firestore();
      await assertSucceeds(aliceDb.doc('rooms/room1').get());
    });
  });

  // Test Room Collaboration & Modification
  describe('Room Updates & Collaborative Gates', () => {
    const initialRoom = {
      name: 'Room 1',
      createdBy: 'bob',
      isPrivate: false,
      code: 'print("hello")',
      language: 'python',
      activeUsers: [{ uid: 'bob', displayName: 'Bob' }],
      allowedEditors: ['bob'],
      currentEditor: 'bob',
      editRequests: [],
    };

    beforeEach(async () => {
      // Seed room with rules disabled
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().doc('rooms/room1').set(initialRoom);
      });
    });

    it('allows the room creator (bob) to modify any field', async () => {
      const bobDb = testEnv.authenticatedContext('bob').firestore();
      const roomRef = bobDb.doc('rooms/room1');

      await assertSucceeds(
        roomRef.update({
          code: 'print("bob was here")',
          allowedEditors: ['bob', 'alice'],
        })
      );
    });

    it('denies non-members (alice) from updating core room fields like code or language', async () => {
      const aliceDb = testEnv.authenticatedContext('alice').firestore();
      const roomRef = aliceDb.doc('rooms/room1');

      await assertFails(
        roomRef.update({
          code: 'print("hacked")',
        })
      );

      await assertFails(
        roomRef.update({
          language: 'javascript',
        })
      );
    });

    it('allows non-members (alice) to join the room by modifying only activeUsers', async () => {
      const aliceDb = testEnv.authenticatedContext('alice').firestore();
      const roomRef = aliceDb.doc('rooms/room1');

      await assertSucceeds(
        roomRef.update({
          activeUsers: [
            { uid: 'bob', displayName: 'Bob' },
            { uid: 'alice', displayName: 'Alice' },
          ],
        })
      );
    });

    it('allows non-members (alice) to request access by modifying only editRequests', async () => {
      const aliceDb = testEnv.authenticatedContext('alice').firestore();
      const roomRef = aliceDb.doc('rooms/room1');

      await assertSucceeds(
        roomRef.update({
          editRequests: [{ uid: 'alice', displayName: 'Alice' }],
        })
      );
    });

    it('allows an allowed editor to take control (update currentEditor)', async () => {
      // Add alice to allowedEditors first
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context
          .firestore()
          .doc('rooms/room1')
          .update({
            allowedEditors: ['bob', 'alice'],
          });
      });

      const aliceDb = testEnv.authenticatedContext('alice').firestore();
      const roomRef = aliceDb.doc('rooms/room1');

      await assertSucceeds(
        roomRef.update({
          currentEditor: 'alice',
        })
      );
    });

    it('allows the currentEditor (alice) to update code, language, and stdin', async () => {
      // Set alice as currentEditor first
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context
          .firestore()
          .doc('rooms/room1')
          .update({
            allowedEditors: ['bob', 'alice'],
            currentEditor: 'alice',
          });
      });

      const aliceDb = testEnv.authenticatedContext('alice').firestore();
      const roomRef = aliceDb.doc('rooms/room1');

      await assertSucceeds(
        roomRef.update({
          code: 'console.log("alice code")',
          language: 'javascript',
          _lastEditor: 'alice',
        })
      );
    });
  });

  // Test Chat Messages
  describe('Messages subcollection', () => {
    beforeEach(async () => {
      const initialRoom = {
        name: 'Room 1',
        createdBy: 'bob',
        activeUsers: [{ uid: 'bob', displayName: 'Bob' }],
      };
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().doc('rooms/room1').set(initialRoom);
      });
    });

    it('allows authenticated users to read messages', async () => {
      const aliceDb = testEnv.authenticatedContext('alice').firestore();
      const msgRef = aliceDb.collection('rooms/room1/messages');
      await assertSucceeds(msgRef.get());
    });

    it('allows users to create messages with their own uid', async () => {
      const bobDb = testEnv.authenticatedContext('bob').firestore();
      const msgRef = bobDb.collection('rooms/room1/messages').doc('msg1');

      await assertSucceeds(
        msgRef.set({
          text: 'Hello team!',
          uid: 'bob',
          displayName: 'Bob',
          createdAt: new Date(),
        })
      );
    });

    it('denies users from creating messages with another users uid', async () => {
      const aliceDb = testEnv.authenticatedContext('alice').firestore();
      const msgRef = aliceDb.collection('rooms/room1/messages').doc('msg1');

      await assertFails(
        msgRef.set({
          text: 'Im bob!',
          uid: 'bob', // Alice tries to post as Bob
          displayName: 'Bob',
          createdAt: new Date(),
        })
      );
    });

    it('denies users from updating or deleting others messages', async () => {
      // Seed Bob's message
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().doc('rooms/room1/messages/msg1').set({
          text: 'Bob message',
          uid: 'bob',
          displayName: 'Bob',
        });
      });

      const aliceDb = testEnv.authenticatedContext('alice').firestore();
      const bobMsgRef = aliceDb.doc('rooms/room1/messages/msg1');

      await assertFails(bobMsgRef.update({ text: 'Edited by Alice' }));
      await assertFails(bobMsgRef.delete());
    });
  });
});
