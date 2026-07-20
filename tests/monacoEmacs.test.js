import { describe, test, expect, vi } from 'vitest';
import { createMonacoEmacsController } from '../src/utils/monacoEmacs';

describe('createMonacoEmacsController', () => {
  test('initializes and triggers onModeChange', () => {
    const onModeChange = vi.fn();
    const mockEditor = {
      onKeyDown: vi.fn(() => ({ dispose: vi.fn() })),
    };

    const controller = createMonacoEmacsController({
      monaco: {},
      editor: mockEditor,
      onModeChange,
    });

    expect(onModeChange).toHaveBeenCalledWith('EMACS');
    expect(controller).toHaveProperty('dispose');
    expect(typeof controller.dispose).toBe('function');
  });

  test('handles C-f, C-b, C-p, C-n movement commands', () => {
    let keyHandler;
    const mockEditor = {
      onKeyDown: vi.fn((handler) => {
        keyHandler = handler;
        return { dispose: vi.fn() };
      }),
      trigger: vi.fn(),
      getPosition: vi.fn(() => ({ lineNumber: 1, column: 5 })),
    };

    createMonacoEmacsController({
      monaco: {},
      editor: mockEditor,
    });

    const createKeyboardEvent = (key, ctrlKey = true, altKey = false) => {
      const preventDefault = vi.fn();
      const stopPropagation = vi.fn();
      return {
        browserEvent: {
          key,
          code: `Key${key.toUpperCase()}`,
          ctrlKey,
          altKey,
          shiftKey: false,
          preventDefault,
          stopPropagation,
        },
      };
    };

    // Test C-f (cursorRight)
    keyHandler(createKeyboardEvent('f'));
    expect(mockEditor.trigger).toHaveBeenCalledWith('emacs', 'cursorRight', null);

    // Test C-b (cursorLeft)
    keyHandler(createKeyboardEvent('b'));
    expect(mockEditor.trigger).toHaveBeenCalledWith('emacs', 'cursorLeft', null);

    // Test C-p (cursorUp)
    keyHandler(createKeyboardEvent('p'));
    expect(mockEditor.trigger).toHaveBeenCalledWith('emacs', 'cursorUp', null);

    // Test C-n (cursorDown)
    keyHandler(createKeyboardEvent('n'));
    expect(mockEditor.trigger).toHaveBeenCalledWith('emacs', 'cursorDown', null);
  });

  test('disposes listeners cleanly', () => {
    const disposeFn = vi.fn();
    const mockEditor = {
      onKeyDown: vi.fn(() => ({ dispose: disposeFn })),
    };

    const controller = createMonacoEmacsController({
      monaco: {},
      editor: mockEditor,
    });

    controller.dispose();
    expect(disposeFn).toHaveBeenCalled();
  });
});
