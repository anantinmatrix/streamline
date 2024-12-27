

const asyncHandler = (fn) => async (req, res, next) => {
    try {
        await fn(req, res, next)
    } catch (error) {
        console.log(error)
        res.status(error.status | 500).json({
            status: false,
            message: error.message
        })
    }
}

export {asyncHandler}