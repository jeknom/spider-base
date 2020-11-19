export async function waitForMilliseconds(millisecondsToWait: number) {
  await new Promise(resolve => setTimeout(resolve, millisecondsToWait));
}

export async function waitUntilTrue(predicate: () => boolean, checkIntervalInMilliseconds?: number) {
  const timeToWait = checkIntervalInMilliseconds || 100;
  
  while (!predicate()) {
    await waitForMilliseconds(timeToWait);
  }
}