const { app } = require('./src/routes');
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  process.stdout.write(`Server listening on ${PORT} \n`);
});
