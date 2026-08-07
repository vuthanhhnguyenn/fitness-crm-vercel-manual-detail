import concurrently from 'concurrently';

const scripts = concurrently(
  [
    {
      name: 'Next',
      prefixColor: 'cyan',
      command: 'npx next dev',
    },
    {
      name: 'Watch',
      prefixColor: 'magenta',
      command: 'npx tsx src/lib/routes/scripts/start-watch.ts',
    },
  ],
  {
    prefix: 'name',
    handleInput: true,
    killOthersOn: ['failure'],
  },
);

scripts.result.then(
  (success) => {
    console.log('All scripts completed', success);
  },
  (error) => {
    console.error('Error:', error);
  },
);
