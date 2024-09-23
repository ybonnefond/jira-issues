import { StringUtils } from './StringUtils';

describe('StringUtils', () => {
  describe('toScreamingCase', () => {
    describe.each([
      ['empty', '', '', {}],
      ['upper case alpha', 'ABC', 'ABC', {}],
      ['lower case alpha', 'abc', 'ABC', {}],
      ['mixed case', 'aBc', 'ABC', {}],
      ['mixed case, space', 'aB c', 'AB_C', {}],
      ['mixed case, space and noSpace:true', 'aB c', 'ABC', { noSpace: true }],
      ['mixed case, space, specials', 'aB&4 c@4 d-2', 'AB4_C4_D2', {}],
      ['mixed case, space, specials and noSpace:true', 'aB&4 c@4 d-2', 'AB4C4D2', { noSpace: true }],
    ])('Given %s string "%s"', (label, from, to, options) => {
      it(`should return "${to}"`, () => {
        expect(StringUtils.toScreamingCase(from, options)).toBe(to);
      });
    });
  });
});
