const router = require('express').Router();

const UsersModel = require('../models/users');
//import verification token function
const { verifyToken } = require('../jwt/verifyToken');

//Get all users
router.get('/users/all', async (req, res) => {
  try{
    const users = await UsersModel.find()
    const usersData=[]
    users.map(user=>{
      usersData.push({id:user._id, username: user.username, adminORuser: user.adminORuser})
    } )
    res.status(200).json(usersData);
  }catch(err){
    res.status(500).json(err)
  }
})

//Delete user
router.post('/users/:id/delete', verifyToken, async (req, res)=>{
  try{
    const currentUser = await UsersModel.findById(req.body.userId)
    if(req.body.userId === req.params.id || currentUser.adminORuser){
    const user = await UsersModel.findByIdAndDelete(req.params.id)
      res.status(200).json('User have been deleted.')
    }else{
      res.status(401).json('You can only delete your account.')
    }
  }catch(err){
    res.status(500).json(err)
  }
})


module.exports = router;