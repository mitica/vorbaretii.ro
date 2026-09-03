/** Retry per bucată de lucru (nu per articol): 3 încercări, apoi eroarea ultimei. */
export async function withRetry<T>(attempt: () => Promise<T>): Promise<T> {
  let lastError: unknown;
  for (let round = 1; round <= 3; round++) {
    try {
      return await attempt();
    } catch (error) {
      lastError = error;
      console.error(`încercarea ${round} a eșuat: ${String(error)}`);
    }
  }
  throw lastError;
}
