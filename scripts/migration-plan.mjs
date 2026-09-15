// @ts-check
export function migrationName(path) {
  return path.split("/").pop() ?? path;
}
export function isMigrationFile(path) {
  return path.endsWith(".sql");
}
export function pendingMigrations(paths, applied) {
  const done = new Set(applied);
  return [...paths]
    .filter(isMigrationFile)
    .map((path) => ({ name: migrationName(path), path }))
    .sort((a, b) => a.name.localeCompare(b.name))
    .filter(({ name }) => !done.has(name));
}
