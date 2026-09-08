export function reportError(err: unknown) {
  const message = err instanceof Error ? err.message : "Something went wrong. Please try again.";
  alert(message);
}
