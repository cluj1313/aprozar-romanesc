export function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

export function emailsMatch(a: string, b: string) {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

export function phonesMatch(a: string, b: string) {
  const left = digitsOnly(a);
  const right = digitsOnly(b);
  if (!left || !right) return false;
  return left === right || left.endsWith(right) || right.endsWith(left);
}
