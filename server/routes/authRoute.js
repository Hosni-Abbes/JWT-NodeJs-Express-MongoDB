const router = require('express').Router();
const bcrypt = require('bcrypt');
const Joi = require('@hapi/joi');
const jwt = require('jsonwebtoken');

const usersModel = require('../models/users');

//generated accessToken and refreshtoken and verifyToken
const { generateAccessToken, generateRefreshToken } = require('../jwt/generateTokens');
const { verifyToken } = require('../jwt/verifyToken');


//register user
router.post('/auth/register', async (req, res) => {
  // form validation using JOI
  const Schema = {
    username: Joi.string().min(3).max(15).required().trim(true),
    password: Joi.string().min(6).required().trim(true),
    adminORuser: Joi.boolean().required()
  }
  //return error message if there is errors
  const {error} = Joi.validate(req.body, Schema);
  if(error) return res.send(error.details[0].message);
  //if no error continue registering user
  try{
    //hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPass = await bcrypt.hash(req.body.password, salt);
    const newUser = new usersModel({
      username: req.body.username,
      password: hashedPass,
      adminORuser: req.body.adminORuser
    })
    //save user
    const saveUser = await newUser.save()
    res.status(200).json('User Registred successfully');

  }catch(err){
    res.status(500).json(err)
  }
});


//login
router.post('/auth/login', async (req, res)=>{
  const Schema = {
    username: Joi.string().required().trim(true),
    password: Joi.string().required().trim(true)
  }
  const {error} = Joi.validate(req.body, Schema)
  if(error) return res.send(error.details[0].message);
  try{
    const user = await usersModel.findOne({username: req.body.username})
    if(!user) return res.json('Incorrect username or password!!')
    const comparedPass = await bcrypt.compare(req.body.password, user.password)
    if(!comparedPass) return res.json('Incorrect username or password!!');
    //if data is correct
    //Generate an access token and a refresh token
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    //register refresh token in database
    const addRefreshTokenToDB = await user.updateOne({$push: {refreshTokens: refreshToken}})
    //send user info and access token to client
    const {password, refreshTokens, __v, ...userInfo} = user._doc
    res.status(200).json({...userInfo, accessToken, refreshToken});
    
  }catch(err){
    res.status(500).json(err)
  }
})

//Logout
router.post('/auth/logout', verifyToken, async (req, res)=>{
  try{
    const user = await usersModel.findById(req.body.userId)
    if(user.refreshTokens.includes(req.body.refreshToken)){
      await user.updateOne({refreshTokens:[]})
      res.status(200).json('Logout Success');
    }
  }catch(err){
    res.status(500).json(err)
  }
})

//Refresh Token
router.post('/token/refresh', async (req, res)=>{
  //take refreshToken from user
  const refreshToken = req.body.token;
  //send error if token is empty
  if(!refreshToken) return res.status(401).json("No Access Token in headers. You are not authorized to this action.")
  //if there is refreshToken check if it is valid and then generate new one
  try{
    const user = await usersModel.findById(req.body.userId)
    //check if refreshToken is valid
    if(!user.refreshTokens.includes(refreshToken)){
      return res.status(403).json("Invalid Access Token. You dont have access to this action.")
    }else{
      //check and verify this token
      jwt.verify(refreshToken, process.env.REFRESH_SECRET_KEY, async (err, payload)=>{
        err && res.status(403).json("Invalid Token");
        //if everything is okey, delete this token from refreshTokens Array, create new accessToken and new refreshToken
        await user.updateOne({$pull: {refreshTokens: refreshToken}})
        const newAccessToken = generateAccessToken(payload)
        const newRefreshToken = generateRefreshToken(payload)
        //push the new refreshToken inside refreshTokens Array
        await user.updateOne({$push: {refreshTokens: newRefreshToken}})
        //send the new tokens
        res.status(200).json({adminORuser:user.adminORuser, accessToken: newAccessToken, refreshToken: newRefreshToken})
      })
    }
  }catch(err){
    res.status(500).json(err)
  }
})


//export router
module.exports = router;