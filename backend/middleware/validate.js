function validate(schema) {
    return (req, res, next) => {
        try {
            schema.parse(req.body);
            next();
        } catch (err) {
            res.status(400).json({ error: 'Validation failed', details: err.errors });
        }
    };
}
module.exports = { validate };
