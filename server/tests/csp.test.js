describe('Content Security Policy', () => {
  let buildCspDirectives;

  beforeEach(() => {
    jest.resetModules();
    ({ buildCspDirectives } = require('../server'));
  });

  it('does not allow unsafe inline styles', () => {
    const directives = buildCspDirectives();

    expect(directives.styleSrc).not.toContain("'unsafe-inline'");
    expect(directives.styleSrcElem).not.toContain("'unsafe-inline'");
    expect(directives.styleSrcAttr).not.toContain("'unsafe-inline'");
  });

  it('uses a nonce-capable style source while preserving trusted stylesheet origins', () => {
    const directives = buildCspDirectives();
    const nonceSource = directives.styleSrc.find((source) => typeof source === 'function');
    const res = { locals: { cspNonce: 'test-nonce' } };

    expect(directives.styleSrc).toEqual(
      expect.arrayContaining(["'self'", 'https://fonts.googleapis.com'])
    );
    expect(directives.styleSrcElem).toEqual(directives.styleSrc);
    expect(nonceSource({}, res)).toBe("'nonce-test-nonce'");
  });

  it('blocks inline style attributes explicitly', () => {
    const directives = buildCspDirectives();

    expect(directives.styleSrcAttr).toEqual(["'none'"]);
  });
});
