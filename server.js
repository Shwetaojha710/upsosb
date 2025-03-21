const express = require('express');
const app = express();
const http = require('http');
const body = require('body-parser');
const connection = require('./app/connection/connection')
const port = process.env.PORT || 3000;
const Helper=require('../upsosb/app/helper/helper')
const rateLimit = require('express-rate-limit');
const cors = require('cors')
const { readdirSync } = require('fs')
const path = require('path')
const menu= require('./app/models/menu')
const sequelize = require('./app/connection/sequelize');
const document = require('./app/models/document')
const user=require('./app/models/users')
const log =require('./app/models/log')
const page=require('./app/models/pages')
const managedirectory=require('./app/models/managedirectory')
const tender=require('./app/models/tender')
const orgnazilation = require('./app/models/organizational')
const news= require('./app/models/news')
sequelize.sync({ force: false }) // `force: true` will drop tables and recreate them
  .then(() => {
    console.log('Database & tables synced!');
  })
  .catch((error) => {
    console.error('Error syncing database:', error);
  });
app.use(express.static("documents"));
app.use('/documents', express.static(path.join(__dirname, 'documents')));
const blockedIPs = new Set();
app.use(express.text({ type: 'text/html' })); 
// app.use(async (req, res, next) => {
//     console.log(await Helper.getLocalIP())
//     const ip = req.ip;
//      console.log(ip,"your ip")
//     if (blockedIPs.has(ip)) {
//         return Helper.response("failed", "Too many requests. You are blocked.", {}, res, 200);
//     }

//     next();
// });


// let i =0
// const limiter = rateLimit({
//     windowMs: 1000, 
//     max: 10, 
//     keyGenerator: (req) => `${req.ip}-${req.path}`, 
//     handler: (req, res) => {
//         const ip = req.ip;
   
//         blockedIPs.add(ip);
//     console.log(req.path,`apii calling time${i++}`)
//         console.log(`Blocked IP: ${ip} for excessive requests to ${req.path}`);

//         // Unblock after 5 minutes
//         setTimeout(() => {
//             blockedIPs.delete(ip);
//             console.log(`Unblocked IP: ${ip}`);
//         }, 5 * 60 * 1000);

//         return Helper.response("failed", "Too many requests. You are blocked.", {}, res, 200);
//     }
// });


// app.use(limiter);


app.use(body.json({ limit: '10mb' }))
app.use(body.urlencoded({ extended: true }))
app.use(express.json())
app.use(cors({ origin: '*', }))

readdirSync('./app/routes').map((route) =>

    app.use('/api', require('./app/routes/' + route))
)


app.get('/', (req, res) => {
    res.send("Hello World");
});

app.listen(port, () => {
    console.log(`Server is listening at port ${port}`);
});
