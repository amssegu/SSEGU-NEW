if (process.env.WORK_SNAPSHOT_BUILD !== 'true') {
  await import('./export-work-data.mjs');
}
