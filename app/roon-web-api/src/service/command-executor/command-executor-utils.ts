interface SettledResult<T> {
  values: T[];
  errors: Error[];
}

export const awaitAll: <T>(promises: Promise<T>[]) => Promise<T[]> = async <T>(promises: Promise<T>[]) => {
  const settled = await Promise.allSettled(promises);
  const result: SettledResult<T> = {
    values: [],
    errors: [],
  };
  const results = settled.reduce((previous, current) => {
    if (current.status === "fulfilled") {
      previous.values.push(current.value);
    } else {
      previous.errors.push(current.reason as Error);
    }
    return previous;
  }, result);
  if (results.errors.length === 0) {
    return results.values;
  } else {
    throw new Error(result.errors.map((e) => e.message).join("\n"));
  }
};

export const awaitFor: (timeInMillis: number) => Promise<void> = (timeInMillis: number) => {
  return new Promise((resolve) => {
    setTimeout(resolve, timeInMillis);
  });
};
