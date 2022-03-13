const registerForm = document.querySelector('.register-form');
const loginForm = document.querySelector('.login-form');
const usernameInput = document.querySelector('.username');
const passwordInput = document.querySelector('.password');
const registerType = document.getElementsByName("registerType");
const registerLoginResMSG = document.querySelector('.result-msg')
const dashboardResMSG = document.querySelector('.dash-result-msg');
const logoutBtn = document.querySelector('.logout-btn');

//URL Server
const serverURL = 'http://localhost:5000';

let username='';
let password='';
let adminORuser;


//---------------------- Rgister -------------------
if(registerForm){
  registerForm.onsubmit = async (e) => {
    e.preventDefault();    
    registerType.forEach(item => {
      if(!item.checked){
        return null
      }else{
        const itemValue = item.value
        if(itemValue === 'admin'){
          adminORuser = true;
        }else{
          adminORuser = false;
        }
      }
    })
    // send data with axios
    try{
      const res = await axios.post(`${serverURL}/auth/register`, {
        username:usernameInput.value,
        password:passwordInput.value,
        adminORuser
      });
      //show messages
      if(res.data === "User Registred successfully"){
        registerLoginResMSG.style.color = "green"
        registerLoginResMSG.innerHTML = `<p>${res.data}</p><p>Click <strong><a href="login.html">Login</a></strong> To Start.</p> `
        usernameInput.value='';
        passwordInput.value =''
      }else{
        registerLoginResMSG.style.color = "red"
        registerLoginResMSG.textContent = res.data
      }
    }catch(err){
      registerLoginResMSG.style.color = "red"
      registerLoginResMSG.textContent = 'User Already Exist.'
    }
  }
}


//-------------------LOGIN ------------------------
if(loginForm){
  loginForm.onsubmit = async (e) => {
    e.preventDefault()
    try{
      const res = await axios.post(`${serverURL}/auth/login`, {
        username: usernameInput.value,
        password: passwordInput.value
      })
      if(typeof(res.data) === 'object'){ //mean login success and there is no error because if login success we send object contain user data
        registerLoginResMSG.style.color = "green"
        registerLoginResMSG.textContent = `Login success, Welcome ${res.data.username}`;
        //Redirect to dashboard page
        localStorage.setItem('connectedUser', JSON.stringify(res.data))
        document.location = "/client/dashboard.html";
      }else{
        registerLoginResMSG.style.color = "red"
        registerLoginResMSG.textContent = res.data
        console.log(res.data)
      }
    }catch(err){  
      console.log(err)
    }
  }
}



// ----------------- REFRESH TOKENS --------------
const refreshTokens = async () => {
  try{
    const res = await axios.post(`${serverURL}/token/refresh`, {
      token: JSON.parse(localStorage.connectedUser).refreshToken,
      userId:JSON.parse(localStorage.connectedUser)._id,
    })
    // set new refresh tokens 
    const newAccessToken = res.data.accessToken
    const newRefreshToken = res.data.refreshToken
    const userData = {
      _id:JSON.parse(localStorage.connectedUser)._id,
      username:JSON.parse(localStorage.connectedUser).username,
      adminORuser:res.data.adminORuser,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    }
    localStorage.setItem('connectedUser', JSON.stringify(userData))
    return res.data
  }catch(err){
    console.log(err)
  }
}
// ------------ Automatically call refreshTokens function -----------------
//function to decode token to get the exp date
const parseJwt = (token) => {
  try {
    const decode = atob(token.split('.')[1])
    return JSON.parse(decode);
  } catch (e) {
    return null;
  }
};
//use interceptors to make request auutomatically
//must create axios instance for this jwt token (to use it with every jwt request)
const axiosJWT = axios.create()
axiosJWT.interceptors.request.use(
  //do actions before every request (change headers) (check if token expires then create new token)
  async (config) => {
    //run parseJwt function get the decoded token
    const decodedToken = parseJwt(JSON.parse(localStorage.connectedUser).accessToken)
    //compare current date with accessToken expireAt date
    const currentDate = new Date();
    if(decodedToken.exp*1000 < currentDate.getTime()){
      //call refreshToken function (which returns newAccessToken and newRefreshToken )
      const data = await refreshTokens();
      //update headers to contain the new token
      config.headers["accesstoken"] = `Bearer ${data?.accessToken}`;
    }
    //return config
    return config;
  },  //if there is error cancel this request
  (error) => {
    return Promise.reject(error)
  }
)



//-------------------- Get all users -------------
const getUsers = async () => {
  try{
    let allUsers = [];
    const res = await axios.get(`${serverURL}/users/all`)
    allUsers = res.data;
    if(document.querySelector('.all-users')){
      document.querySelector('.all-users').innerHTML = usersList(allUsers)
    }
  }catch(err){
    console.log(err)
  }
}
// create users list
const usersList = (users) => {
  let list=''
  if(document.querySelector('.connected-person')){
    document.querySelector('.connected-person').textContent = JSON.parse(localStorage.connectedUser)?.username;
    document.querySelector('.is-admin').textContent = JSON.parse(localStorage.connectedUser)?.adminORuser ? 'Admin' : 'User';
  }
  users?.map(user => {
    list+= `<div class="user-item">
              <p>Username: <strong>${user.username}</strong></p>
              <span class="connected-as">${(user.adminORuser? 'Admin' : 'User' )}</span>
              <button class="delete-user-btn" onClick="deleteUser('${user.id}')" >Delete</button>
            </div>`
  })
  return list
}

// run getUsers function
getUsers();



// -----------------DELETE USER -------------------
const deleteUser = async (userToDeleteId) => {
  dashboardResMSG.textContent = ''
  const data = {
    userId:JSON.parse(localStorage.connectedUser)._id,
  }
  try{
    axiosJWT.defaults.headers = { accesstoken: `Bearer ${JSON.parse(localStorage.connectedUser).accessToken}` } 
    const res = await axiosJWT.post(`${serverURL}/users/${userToDeleteId}/delete`, data)
    if(data.userId === userToDeleteId){
      localStorage.removeItem('connectedUser');
      localStorage.clear()
      location.reload()
    }
    console.log(res.data)
    getUsers();
    dashboardResMSG.textContent = res.data
  }catch(err){
    console.log(err)
    dashboardResMSG.style.color = 'red'
    dashboardResMSG.textContent = err.response?.data
  }
}



// ---------------------LOGOUT ---------------------------
if(logoutBtn) {
  logoutBtn.onclick = async () => {
    dashboardResMSG.textContent = ''
    const data = {
      userId: JSON.parse(localStorage.connectedUser)._id,
      refreshToken: JSON.parse(localStorage.connectedUser).refreshToken
    }
    try{
      axiosJWT.defaults.headers = { accesstoken: `Bearer ${JSON.parse(localStorage.connectedUser).accessToken}` } 
      const res = await axiosJWT.post(`${serverURL}/auth/logout`, data)
      if(typeof(res.data) === 'string' ){
        dashboardResMSG.style.color = "green"
        dashboardResMSG.textContent = res.data
        localStorage.removeItem('connectedUser')
        localStorage.clear()
        const timeout = setTimeout(()=>{
          location.href = '/client/index.html'
        },1000)
      }
    }catch(err){
      dashboardResMSG.style.color = "red"
      dashboardResMSG.textContent = err?.response?.data
    }
  }
}



// --------------- REDIRECT USER TO LOGIN PAGE IF HE IS NOT CONNECTED AND HE IS TRYING TO ENTER DASHBOARD PAGE -------
window.onload = () => {
  if( !localStorage.getItem('connectedUser') && location.pathname === '/dashboard.html' ){
    document.querySelector('.dashboard').style.display ='none'
    location.href = '/login.html';
  }
}