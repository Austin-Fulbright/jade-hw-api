import { getRootFingerprint } from "../../src/util";


describe('getRootFingerprint', () => {
    it('should return the correct fingerprint', () => {
        const ROOT_XPUB = 'xpub661MyMwAqRbcGJMgtWQnZ6b8Nk1YE4RkR2sAT9ZE3ovUH95wH5UxY1qkg7aRC7MdQD7YMauTncJMMHyWdDmkCeKMMoVwzJoK5DbZHHhinUQ';
        const expectedFingerprint = 'e3ebcc79';
        const fingerprint = getRootFingerprint(ROOT_XPUB);
        expect(fingerprint).toBe(expectedFingerprint);
    });

    it('should double check the correct fingerprint', () => {
        const ROOT_XPUB = 'xpub661MyMwAqRbcFtXgS5sYJABqqG9YLmC4Q1Rdap9gSE8NqtwybGhePY2gZ29ESFjqJoCu1Rupje8YtGqsefD265TMg7usUDFdp6W1EGMcet8';
        const expectedFingerprint = '3442193e';
        const fingerprint = getRootFingerprint(ROOT_XPUB);
        expect(fingerprint).toBe(expectedFingerprint);
    });
});
//
//
