const User = require('../models/User');


/**
 * GET /admin/index
 * Home page.
 */
exports.index = (req, res) => {
  res.render('admin/index', {
    title: 'Admin Mangrove Boost'
  });
};

/**
 * GET /admin/user
 * Home page.
 */
exports.user = (req, res) => {
  let campaigns = [];
  User.find({}, (err, results) => {
    if (err) { return next(err); }

    res.render('admin/user', {
      title: 'List users of Mangrove Boost',
      users: results
    });
  });
};
