export type RatingOptionField = { key: string; label: string };

export const DEFAULT_RATING_OPTION_FIELDS: RatingOptionField[] = [
  { key: '1', label: 'Never Demonstrated' },
  { key: '2', label: 'Inconsistently Demonstrated' },
  { key: '3', label: 'Consistently Demonstrated' },
  { key: '4', label: 'Role Model' },
];

export const DEFAULT_RATING_OPTION_RECORD = DEFAULT_RATING_OPTION_FIELDS.reduce<Record<string, string>>(
  (acc, option) => {
    acc[option.key] = option.label;
    return acc;
  },
  {}
);

export const cloneDefaultRatingOptions = (): RatingOptionField[] =>
  DEFAULT_RATING_OPTION_FIELDS.map((option) => ({ ...option }));

export const normalizeRatingOptionFields = (
  options?: Record<string, string> | null
): RatingOptionField[] => {
  if (!options || typeof options !== 'object') {
    return cloneDefaultRatingOptions();
  }

  const entries = Object.entries(options)
    .filter(([key, value]) => key && typeof value === 'string' && value.trim().length > 0)
    .sort((a, b) => Number(a[0]) - Number(b[0]));

  if (!entries.length) {
    return cloneDefaultRatingOptions();
  }

  return entries.map(([key, value], index) => ({
    key: key || String(index + 1),
    label: value.trim(),
  }));
};

export const serializeRatingOptionFields = (
  fields: RatingOptionField[]
): Record<string, string> => {
  const trimmed = fields
    .map((field, index) => ({ key: String(index + 1), label: field.label?.trim() || '' }))
    .filter((field) => field.label.length > 0);

  if (!trimmed.length) {
    return { ...DEFAULT_RATING_OPTION_RECORD };
  }

  return trimmed.reduce<Record<string, string>>((acc, field) => {
    acc[field.key] = field.label;
    return acc;
  }, {});
};

export const getNumericRatingOptions = (
  options?: Record<string, string> | null
): Array<{ value: number; label: string }> => {
  return normalizeRatingOptionFields(options).map((field, index) => ({
    value: Number(field.key) || index + 1,
    label: field.label,
  }));
};

export const MIN_RATING_OPTIONS = 2;
export const MAX_RATING_OPTIONS = 5;
