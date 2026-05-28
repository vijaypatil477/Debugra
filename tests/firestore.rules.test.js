import { test, expect } from '@playwright/test';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing';
import { readFileSync } from 'fs';
import { resolve } from 'path';

let testEnv;

test.describe.skip('Firestore Rules - Rooms', () => {
  test.beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: 'debugra-test-rules',
      firestore: {
        rules: readFileSync(resolve(process.cwd(), 'firestore.rules'), 'utf8'),
      },
    });
  });

  test.afterAll(async () => {
    await testEnv.cleanup();
  });

  test.beforeEach(async () => {
    await testEnv.clearFirestore();
  });
  test('should allow anyone to read a room', async () => {
    const unauthDb = testEnv.unauthenticatedContext().firestore();
    await assertSucceeds(unauthDb.collection('rooms').doc('room123').get());
  });

  test('should allow authenticated user to create a room if they are host', async () => {
    const aliceDb = testEnv.authenticatedContext('alice').firestore();
    await assertSucceeds(
      aliceDb.collection('rooms').doc('room123').set({
        roles: { alice: 'host' },
      })
    );
  });

  test('should deny authenticated user from creating a room without host role', async () => {
    const bobDb = testEnv.authenticatedContext('bob').firestore();
    await assertFails(
      bobDb.collection('rooms').doc('room456').set({
        roles: { bob: 'viewer' },
      })
    );
  });

  test('should allow host to update the room', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await context.firestore().collection('rooms').doc('room789').set({
        roles: { charlie: 'host' },
        code: 'console.log("hello");',
      });
    });

    const charlieDb = testEnv.authenticatedContext('charlie').firestore();
    await assertSucceeds(
      charlieDb.collection('rooms').doc('room789').update({
        code: 'console.log("updated");',
      })
    );
  });
});
