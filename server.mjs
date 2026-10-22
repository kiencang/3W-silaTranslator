import('./dist/app/server/server.mjs').then((module) => {
  const app = module.app;
  const port = Number(process.env.PORT) || 3000;
  app.listen(port, '0.0.0.0', (error) => {
    if (error) {
      throw error;
    }
    console.log(`Node Express server listening on http://0.0.0.0:${port}`);
  });
}).catch(err => {
  console.error('Failed to load server.mjs', err);
});
