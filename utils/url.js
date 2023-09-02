const addFullUrl = (req, res, next) => {
    req.fullUrl = process.env.SERVER_API_URL;
    next();
};

module.exports = addFullUrl;