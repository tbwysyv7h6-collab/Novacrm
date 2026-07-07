import type { CrmField } from "@novacrm/db";

const PUBLIC_FIELD_TYPES = [
  "TEXT",
  "LONG_TEXT",
  "NUMBER",
  "CURRENCY",
  "BOOLEAN",
  "DATE",
  "DATETIME",
  "EMAIL",
  "PHONE",
  "URL",
  "SELECT",
  "MULTI_SELECT",
];

export function isPublicFormField(field: CrmField) {
  return PUBLIC_FIELD_TYPES.includes(field.type);
}
