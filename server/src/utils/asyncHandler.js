

const asyncHandler = (fn) => async (req, res, next) => {
    try {
        await fn(req, res, next)
    } catch (error) {
        res.status(err.status | 500).json({
            status: false,
            message: err.message
        })
    }
}

export {asyncHandler}