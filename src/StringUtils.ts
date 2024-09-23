export class StringUtils {
  private toAlphaNumUpperCase(val: string | null) {
    return (
      (val ?? '')
        // Remove any non alpha num chars
        .replace(/[^a-zA-Z0-9]/g, '')
        .toUpperCase()
    );
  }

  public static toScreamingCase(val: string | null, options: { noSpace?: boolean } = {}): string | null {
    if (val === null) {
      return null;
    }

    const spaceSeparator = options.noSpace === true ? '' : '_';

    return val
      .trim()
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .replace(/\s+/g, spaceSeparator)
      .toUpperCase();
  }
}
