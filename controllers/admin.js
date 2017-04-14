/**
 * GET /admin/index
 * Home page.
 */
exports.index = (req, res) => {
  res.render('admin/index', {
    title: 'Admin Mangrove Boost'
  });
};
