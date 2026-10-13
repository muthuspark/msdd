export function fileSignature(file) {
  return `${file.relativePath}\u0000${file.lastModified ?? ''}\u0000${file.size ?? ''}`;
}

export function compareFiles(previous = [], next = []) {
  const before = new Map(previous.map((file) => [file.relativePath, file]));
  const after = new Map(next.map((file) => [file.relativePath, file]));
  const added = next.filter((file) => !before.has(file.relativePath));
  const removed = previous.filter((file) => !after.has(file.relativePath));
  const changed = next.filter((file) => before.has(file.relativePath) && fileSignature(before.get(file)) !== fileSignature(file));
  return { added, removed, changed, hasChanges: added.length > 0 || removed.length > 0 || changed.length > 0 };
}

export function createRefreshController({
  scan,
  onChange,
  onError = () => {},
  intervalMs = 1000,
  debounceMs = 250,
  documentObject = globalThis.document,
  setIntervalFn = globalThis.setInterval,
  clearIntervalFn = globalThis.clearInterval,
  setTimeoutFn = globalThis.setTimeout,
  clearTimeoutFn = globalThis.clearTimeout
}) {
  let currentFiles = [];
  let pendingFiles;
  let interval;
  let debounce;
  let running = false;
  let checking = false;

  const pause = () => {
    if (interval !== undefined) { clearIntervalFn(interval); interval = undefined; }
  };

  const flush = () => {
    if (debounce !== undefined) { clearTimeoutFn(debounce); debounce = undefined; }
    if (!pendingFiles) return;
    const files = pendingFiles;
    pendingFiles = undefined;
    const changes = compareFiles(currentFiles, files);
    if (!changes.hasChanges) return;
    currentFiles = files;
    onChange({ files, changes });
  };

  const queue = (files) => {
    pendingFiles = files;
    if (debounce !== undefined) clearTimeoutFn(debounce);
    debounce = setTimeoutFn(flush, debounceMs);
  };

  const check = async () => {
    if (!running || checking || documentObject?.hidden) return;
    checking = true;
    try {
      const files = await scan();
      if (compareFiles(currentFiles, files).hasChanges) queue(files);
    } catch (error) {
      onError(error);
    } finally {
      checking = false;
    }
  };

  const resume = () => {
    if (!running || documentObject?.hidden || interval !== undefined) return;
    interval = setIntervalFn(check, intervalMs);
    void check();
  };

  const onVisibilityChange = () => {
    if (documentObject?.hidden) pause();
    else resume();
  };

  return {
    start(initialFiles = []) {
      if (running) return;
      running = true;
      currentFiles = initialFiles;
      documentObject?.addEventListener('visibilitychange', onVisibilityChange);
      resume();
    },
    stop() {
      running = false;
      pause();
      if (debounce !== undefined) { clearTimeoutFn(debounce); debounce = undefined; }
      pendingFiles = undefined;
      documentObject?.removeEventListener('visibilitychange', onVisibilityChange);
    },
    check,
    flush,
    pause,
    resume,
    get files() { return currentFiles; }
  };
}
