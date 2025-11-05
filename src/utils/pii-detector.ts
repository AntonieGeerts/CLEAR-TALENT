import { PIIDetectionResult, PIIReplacement } from '../types';

/**
 * PII Detection and Redaction Utility
 * Detects and redacts personally identifiable information from text
 */

// PII patterns
const PII_PATTERNS = {
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  phone: /\b(\+\d{1,3}[-.]?)?\(?\d{3}\)?[-.]?\d{3}[-.]?\d{4}\b/g,
  ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
  creditCard: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,
  ipAddress: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
  // More conservative patterns that are less likely to match normal text
  passport: /\b[A-Z]{1,2}\d{6,9}\b/g,
  driverLicense: /\b[A-Z]{1,2}\d{5,8}\b/g,
};

export class PIIDetector {
  /**
   * Detect PII in text
   */
  static detect(text: string): PIIDetectionResult {
    const replacements: PIIReplacement[] = [];
    let redactedText = text;
    const detectedTypes: Set<string> = new Set();

    // Check each PII pattern
    for (const [type, pattern] of Object.entries(PII_PATTERNS)) {
      const matches = text.matchAll(pattern);

      for (const match of matches) {
        if (match.index !== undefined && match[0]) {
          const original = match[0];
          const placeholder = this.getPlaceholder(type);

          replacements.push({
            type,
            original,
            placeholder,
            startIndex: match.index,
            endIndex: match.index + original.length,
          });

          detectedTypes.add(type);
        }
      }
    }

    // Sort replacements by start index (descending) to avoid index shifts
    replacements.sort((a, b) => b.startIndex - a.startIndex);

    // Apply replacements
    for (const replacement of replacements) {
      redactedText =
        redactedText.slice(0, replacement.startIndex) +
        replacement.placeholder +
        redactedText.slice(replacement.endIndex);
    }

    return {
      hasPII: replacements.length > 0,
      detectedTypes: Array.from(detectedTypes),
      redactedText,
      replacements: replacements.reverse(), // Return in original order
    };
  }

  /**
   * Redact PII from text
   */
  static redact(text: string): string {
    return this.detect(text).redactedText;
  }

  /**
   * Get placeholder for PII type
   */
  private static getPlaceholder(type: string): string {
    const placeholders: Record<string, string> = {
      email: '[EMAIL_REDACTED]',
      phone: '[PHONE_REDACTED]',
      ssn: '[SSN_REDACTED]',
      creditCard: '[CC_REDACTED]',
      ipAddress: '[IP_REDACTED]',
      passport: '[PASSPORT_REDACTED]',
      driverLicense: '[DL_REDACTED]',
    };

    return placeholders[type] || '[PII_REDACTED]';
  }

  /**
   * Check if text contains PII
   */
  static containsPII(text: string): boolean {
    return this.detect(text).hasPII;
  }
}

export default PIIDetector;
