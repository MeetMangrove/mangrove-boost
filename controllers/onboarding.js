/**
 * GET /onboarding/step1
 * Slack register.
 */
exports.step1 = (req, res) => {
  if(req.user && req.user.slack){
    return res.redirect('/onboarding/step2');
  }

  res.render('onboarding/step1', {
    title: 'Create account'
  });
};

/**
 * GET /onboarding/step2
 * Link social Network account.
 */
exports.step2 = (req, res) => {
  if(req.user && req.user.twitter && req.user.facebook){
    return res.redirect('/onboarding/step3');
  }

  res.render('onboarding/step2', {
    title: 'Link Social Network Account'
  });
};


/**
 * GET /onboarding/step3
 * Thank user
 */
exports.step3 = (req, res) => {
  res.render('onboarding/step3', {
    title: 'Keep in touch !'
  });
};
