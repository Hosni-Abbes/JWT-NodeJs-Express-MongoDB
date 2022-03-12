//require jwt
const jwt = require('jsonwebtoken');


exports.verifyToken = (req, res, next) => {
  const authHeader = req.headers.accesstoken;
  //check if there is access token in headers
  if(authHeader){
    //define the token
    const token = authHeader.split(' ')[1];
    //verify this token
    jwt.verify(token, process.env.ACCESS_SECRET_KEY, (err, payload)=>{
      //if there is an error return err msg
      if(err) return res.status(403).json('Invalid Access Token. You dont have access to this action.')
      //else return data
      req.payload = payload;
      next();
    })

  }else{
    res.status(401).json('No Access Token in headers. You are not authorized to this action.')
  }
}