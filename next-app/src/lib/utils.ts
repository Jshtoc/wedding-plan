// Minimal className joiner — drop-in replacement for clsx so we don't
// need an extra dependency. Accepts strings, falsy values (filtered out),
// and arrays. Use whenever you need to conditionally combine classes.
type ClassValue = string | number | null | false | undefined | ClassValue[];

export function cn(...inputs: ClassValue[]): string {
  const flat: string[] = [];
  const walk = (v: ClassValue): void => {
    if (!v && v !== 0) return;
    if (Array.isArray(v)) {
      v.forEach(walk);
      return;
    }
    flat.push(String(v));
  };
  inputs.forEach(walk);
  return flat.join(" ");
}
