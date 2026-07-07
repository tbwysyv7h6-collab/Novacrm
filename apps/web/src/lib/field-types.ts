export const FIELD_TYPE_OPTIONS = [
  { value: "TEXT", label: "Text" },
  { value: "LONG_TEXT", label: "Long text" },
  { value: "NUMBER", label: "Number" },
  { value: "CURRENCY", label: "Currency" },
  { value: "BOOLEAN", label: "Checkbox" },
  { value: "DATE", label: "Date" },
  { value: "DATETIME", label: "Date & time" },
  { value: "EMAIL", label: "Email" },
  { value: "PHONE", label: "Phone" },
  { value: "URL", label: "Link" },
  { value: "SELECT", label: "Select" },
  { value: "MULTI_SELECT", label: "Multi-select" },
  { value: "USER_REF", label: "Team member" },
  { value: "RELATION", label: "Link to another object" },
] as const;

export type FieldTypeValue = (typeof FIELD_TYPE_OPTIONS)[number]["value"];

export const FIELD_TYPES_WITH_CHOICES: FieldTypeValue[] = ["SELECT", "MULTI_SELECT"];
