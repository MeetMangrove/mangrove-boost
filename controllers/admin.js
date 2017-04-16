const User = require('../models/User');
const Share = require('../models/Share');
const Campaign = require('../models/Campaign');


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
  User.find({}, (err, results) => {
    if (err) { return next(err); }

    const users = [];
    results.forEach((user) => {
      const stat = {
        impact: 0,
        share: 0,
        clic: 0
      }
      Share.find({backer: user.slack}, (err, shareList) => {
        if (err) { return next(err); }

        stat.share = shareList.length;

        shareList.forEach((share) => {
          stat.impact += share.stats.clic;
        });
      });

      Campaign.count({'backers.waiting': user.slack}, (err, count) => {
        stat.clic = count
      });
console.log(stat);
      user.stat = stat;
      users.push(user);
    });

    res.render('admin/user', {
      title: 'List users of Mangrove Boost',
      users: users
    });
  });
};
