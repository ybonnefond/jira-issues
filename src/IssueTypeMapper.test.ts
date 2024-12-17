import { IssueTypeMapper } from './IssueTypeMapper';

describe('IssueTypeMap', () => {
  describe('given a string with issue types', () => {
    it('should return a map with issue types', () => {
      const result = IssueTypeMapper.fromString('Support(Support;Incident),Maturation(Maturation;Study;Spike),Tech(Tech;Task)');

      expect(result).toStrictEqual({
        Support: ['Support', 'Incident'],
        Maturation: ['Maturation', 'Study', 'Spike'],
        Tech: ['Tech', 'Task'],
      });
    });
  });

  describe('given a string with issue types', () => {
    it('should return a map with issue types', () => {
      const result = IssueTypeMapper.fromString('Support(Support;Incident),Maturation(Maturation;Study;Spike),Tech(Tech;Task)');

      expect(result).toStrictEqual({
        Support: ['Support', 'Incident'],
        Maturation: ['Maturation', 'Study', 'Spike'],
        Tech: ['Tech', 'Task'],
      });
    });
  });
});
