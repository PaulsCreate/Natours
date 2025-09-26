const mongoose = require('mongoose');
const dotenv = require('dotenv');

// process.on('uncaughtException', err => {
//   console.log('UNCAUGHT EXCEPTION ⚠️ Shutting Down');
//   console.log(err.name, err.message);
//   process.exit(1);
// });

dotenv.config({ path: './config.env' });

const app = require('./app');

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    // useCreateIndex:true,s
    useUnifiedTopology: true
    // ssl: false
    // useFindAndModify:false
  })
  .then(con => {
    console.log(con.connections);
    console.log('Database Connections Successful');
  })
  .catch(err => {
    console.error('Database Connection Error', err.message);
  });

console.log(app.get('env'));
console.log(process.env);

// et('env')) //Envrionent variable - are global variable use to define the envrionment in which node app is environment
// console.log(process.env)

const port = process.env.PORT || 300;
app.listen(port, () => {
  console.log(`App is Running on Port ${port}....`);
});

// process.on('unhandledRejection', err => {
//   console.log(err.name, err.message);
//   console.log('Unhandle Rejection 🪖⚠️ Shutting Down');
//   server.close(() => {
//     process.exit(1);
//   });
// });

// ESLINT -- for debug; formmate code, best pracits and higlights the errors
// eslint is all about coding rules
// TEST
