
const express = require('express');
const cors = require('cors');

const ipfsRouter = require('./routes/ipfs')

const app = express();
app.use(express.json());
app.use(express.urlencoded({
  extended: true
}));
app.use(cors({ origin: '*', credentials: true }));

app.use('/upload', ipfsRouter);

app.use((err, req, res) => {
  if (res.headersSent) {
    return next(err);
  }

  console.error(err);
  return res.status(res.statusCode || 500).send({ message: err.message });
});

const main = async () => {
  try {
    app.listen(8081);
    console.log("Application started on port 8081");
  } catch (err) {
    process.exit(1);
  }
};

main().catch(console.error);