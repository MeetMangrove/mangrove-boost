/**
 * Module dependencies.
 */
const express = require('express');
const compression = require('compression');
const session = require('express-session');
const bodyParser = require('body-parser');
const logger = require('morgan');
const chalk = require('chalk');
const errorHandler = require('errorhandler');
const lusca = require('lusca');
const dotenv = require('dotenv');
const MongoStore = require('connect-mongo')(session);
const flash = require('express-flash');
const path = require('path');
const mongoose = require('mongoose');
const passport = require('passport');
const expressValidator = require('express-validator');
const expressStatusMonitor = require('express-status-monitor');
const sass = require('node-sass-middleware');
const multer = require('multer');
const crypto = require('crypto');

const storage = multer.diskStorage({
  destination: path.join(__dirname, 'uploads'),
  filename: function (req, file, cb) {
    crypto.pseudoRandomBytes(16, function (err, raw) {
      if (err) return cb(err)

      cb(null, raw.toString('hex') + path.extname(file.originalname))
    });
  }
});

const upload = multer({ storage: storage });
// const upload = multer({ dest: path.join(__dirname, 'uploads') });

/**
 * Load environment variables from .env file, where API keys and passwords are configured.
 */
dotenv.load({ path: '.env' });

/**
 * Controllers (route handlers).
 */
const homeController = require('./controllers/home');
const adminController = require('./controllers/admin');
const userController = require('./controllers/user');
const apiController = require('./controllers/api');
const contactController = require('./controllers/contact');
const onboardingController = require('./controllers/onboarding');
const campaignController = require('./controllers/campaign');
const botController = require('./controllers/bot');
const shareController = require('./controllers/share');

/**
 * API keys and Passport configuration.
 */
const passportConfig = require('./config/passport');

/**
 * Create Express server.
 */
const app = express();

/**
 * Connect to MongoDB.
 */
mongoose.Promise = global.Promise;
mongoose.connect(process.env.MONGODB_URI || process.env.MONGOLAB_URI);
mongoose.connection.on('error', (err) => {
  console.error(err);
  console.log('%s MongoDB connection error. Please make sure MongoDB is running.', chalk.red('✗'));
  process.exit();
});

/**
 * Express configuration.
 */
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.use(expressStatusMonitor());
app.use(compression());
app.use(sass({
  src: path.join(__dirname, 'public'),
  dest: path.join(__dirname, 'public'),
  debug: true
}));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(expressValidator());
app.use(session({
  resave: true,
  saveUninitialized: true,
  secret: process.env.SESSION_SECRET,
  store: new MongoStore({
    url: process.env.MONGODB_URI || process.env.MONGOLAB_URI,
    autoReconnect: true,
    clear_interval: 3600
  })
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
app.use((req, res, next) => {
  if ((req.path.indexOf("/campaign/new/infos") != -1 ) || (req.path === '/bot'))  {
    next();
  } else {
    lusca.csrf()(req, res, next);
  }
});
app.use(lusca.xframe('SAMEORIGIN'));
app.use(lusca.xssProtection(true));
app.use((req, res, next) => {
  res.locals.user = req.user;
  next();
});
app.use((req, res, next) => {
  // After successful login, redirect back to the intended page
  if (!req.user &&
      req.path !== '/login' &&
      req.path !== '/signup' &&
      !req.path.match(/^\/auth/) &&
      !req.path.match(/\./)) {
    req.session.returnTo = req.path;
  } else if (req.user &&
      req.path == '/account') {
    req.session.returnTo = req.path;
  }
  next();
});
app.use(express.static(path.join(__dirname, 'public'), { maxAge: 31557600000 }));
app.use(express.static(path.join(__dirname, 'uploads'), { maxAge: 31557600000 }));

/**
 * Primary app routes.
 */
app.get('/', homeController.index);
app.get('/onboarding/step1', onboardingController.step1);
app.get('/onboarding/step2', passportConfig.isAuthenticated, onboardingController.step2);
app.get('/onboarding/step3', passportConfig.isAuthenticated, onboardingController.step3);

app.get('/admin/index', passportConfig.isAdmin, adminController.index);
app.get('/admin/user', passportConfig.isAdmin, adminController.user);

app.get('/test' , campaignController.testtwit);

app.get('/campaign/all', passportConfig.isAdmin, campaignController.all);
app.get('/campaign/edit/', passportConfig.isAdmin, campaignController.edit);

app.get('/campaign/new/link', passportConfig.isAdmin, campaignController.step1);
app.post('/campaign/new/link', passportConfig.isAdmin, campaignController.postLink);
app.get('/campaign/new/infos/:id', passportConfig.isAdmin, campaignController.step2);
app.post('/campaign/new/infos/:id', passportConfig.isAdmin, upload.single('image'), campaignController.postInfos);

app.get('/campaign/new/resume/:id', passportConfig.isAdmin, campaignController.step3);
app.post('/campaign/new/resume/:id', passportConfig.isAdmin, campaignController.postCampaign);

app.get('/campaign/edit/:id', passportConfig.isAdmin, campaignController.edit);
app.post('/campaign/edit/', campaignController.postCampaign);
app.get('/campaign/view/:id', campaignController.view);


app.get('/share/:id', shareController.shareLink);


// SLACKBOT
app.post('/bot', (req, res) => {
  botController.handler(req, res);
});

app.get('/login', userController.getLogin);
app.post('/login', userController.postLogin);
app.get('/logout', userController.logout);
app.get('/forgot', userController.getForgot);
app.post('/forgot', userController.postForgot);

app.get('/contact', contactController.getContact);
app.post('/contact', contactController.postContact);

app.get('/reset/:token', userController.getReset);
app.post('/reset/:token', userController.postReset);
app.get('/account', passportConfig.isAuthenticated, userController.getAccount);
app.post('/account/profile', passportConfig.isAuthenticated, userController.postUpdateProfile);
app.post('/account/password', passportConfig.isAuthenticated, userController.postUpdatePassword);
app.post('/account/delete', passportConfig.isAuthenticated, userController.postDeleteAccount);
app.get('/account/unlink/:provider', passportConfig.isAuthenticated, userController.getOauthUnlink);

/**
 * API examples routes.
 */
// app.get('/api', apiController.getApi);
// app.get('/api/facebook', passportConfig.isAuthenticated, passportConfig.isAuthorized, apiController.getFacebook);
// app.post('/api/twitter', passportConfig.isAuthenticated, passportConfig.isAuthorized, apiController.postTwitter);
// app.get('/api/upload', apiController.getFileUpload);


/**
 * OAuth authentication routes. (Sign in)
 */
app.get('/auth/facebook', passport.authenticate('facebook', { scope: ['email', 'public_profile'] }));
app.get('/auth/facebook/callback', passport.authenticate('facebook', { failureRedirect: '/onboarding/step2' }), (req, res) => {
  res.redirect('/onboarding/step2');
});
app.get('/auth/twitter', passport.authenticate('twitter'));
app.get('/auth/twitter/callback', passport.authenticate('twitter', { failureRedirect: '/onboarding/step2' }), (req, res) => {
  res.redirect('/onboarding/step2');
});

app.get('/auth/slack', passport.authenticate('slack'));
app.get('/auth/slack/callback', passport.authenticate('slack', { failureRedirect: '/onboarding/step1' }), (req, res) => {
  res.redirect('/onboarding/step2');
});



/**
 * Error Handler.
 */
app.use(errorHandler());

/**
 * Start Express server.
 */
app.listen(app.get('port'), () => {
  console.log('%s App is running at http://localhost:%d in %s mode', chalk.green('✓'), app.get('port'), app.get('env')); 
  console.log('  Press CTRL-C to stop\n');
});

app.locals.env = process.env;
module.exports = app;
