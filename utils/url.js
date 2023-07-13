const addFullUrl = (req, res, next) => {
    req.fullUrl = `${req.protocol}://${req.headers.host}`;
    next();
};

module.exports = addFullUrl;