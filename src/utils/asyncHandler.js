const asyncHandler = (reqestHandler) => {
  (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err));
  };
};

export { asyncHandler };

//same logic using try and catch above is promise
// const asyncHandler = (fn) => async (req,res,next) => {
//     try{
//         await fn(req,res,next)
//     } catch(error){
//         res.status(err.code || 500).json({
//             sucess: false,
//             mesage: err.mesage
//         })
//     }
// }
