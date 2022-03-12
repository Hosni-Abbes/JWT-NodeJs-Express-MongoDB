const jwt = require('jsonwebtoken');


//Generate accesstoken
exports.generateAccessToken = (user) => {
  return jwt.sign(
    {id:user._id, adminORuser:user.adminORuser},
    process.env.ACCESS_SECRET_KEY,
    {expiresIn: "15m"}
  )
}

//Generate refreshtoken
exports.generateRefreshToken = (user) => {
  return jwt.sign(
    {id:user._id, adminORuser:user.adminORuser},
    process.env.REFRESH_SECRET_KEY
  )
}