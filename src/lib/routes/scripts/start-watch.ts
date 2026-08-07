import { FileWatcher } from './classes/FileWatcher';

async function main() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  await using _fileWatcher = new FileWatcher();
  await new Promise((res) => {
    process.on('SIGINT', res);
    process.on('SIGTERM', res);
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
