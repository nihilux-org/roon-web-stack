export const buildRoonWorker = (): Worker => {
  if (typeof Worker !== "undefined") {
    return new Worker(new URL("./roon.worker", import.meta.url), {
      type: "module",
    });
  } else {
    throw new Error("web worker are not supported in your browser, sorry");
  }
};
