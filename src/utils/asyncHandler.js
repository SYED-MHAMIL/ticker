const AsyncHandler =(func) => {
   return  async (req,res,next)=>{
          await Promise.resolve(func(req,res,next)).catch((error)=>{
              return next(error)
          })
    }
}   

export {AsyncHandler}