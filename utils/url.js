const addFullUrl = (req, res, next) => {
    req.fullUrl = process.env.REACT_APP_BASE_API_PREFIX;
    next();
};

module.exports = addFullUrl;