const mongoose = require('mongoose');

//users Shcema
const UsersSchema = new mongoose.Schema({
  username:{
    type:String,
    required:true,
    max: 15,
    min:3,
    unique:true
  },
  password:{
    type:String,
    required:true,
    min:6
  },
  adminORuser:{
    type:Boolean,
    required:true
  },
  refreshTokens:{
    type:Array,
    default:[]
  }
})

//export Users Schema
module.exports = mongoose.model('users', UsersSchema);