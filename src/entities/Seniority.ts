export enum Seniority {
  JUNIOR = 'junior',
  EXPERIENCED = 'experienced',
  SENIOR = 'senior',
}

export function parseSeniority(value: unknown): Seniority {
  if (typeof value !== 'string') {
    throw new Error('Seniority must be a string');
  }

  if (!Object.values(Seniority).includes(value as Seniority)) {
    throw new Error(`Invalid seniority: ${value}. Expected one of [${Object.values(Seniority).join(', ')}]`);
  }

  return value as Seniority;
}
