type ClassValue = string | false | null | undefined | ClassValue[];

function flattenClasses(value: ClassValue): string[] {
  if (!value) return [];
  return Array.isArray(value) ? value.flatMap(flattenClasses) : [value];
}

export function cn(...values: ClassValue[]): string {
  return values.flatMap(flattenClasses).join(' ');
}
