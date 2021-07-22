const router = require('express').Router();
const User = require('../models/User')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const {registerValidation, loginValidation} = require('../validation');

router.post('/api/register',async (req,res)=>{
    const {error} = registerValidation(req.body);
    if(error) return res.status(400).send(error.details[0].message);
    
    //Checking if user is in database
    const emailExist = await User.findOne({email: req.body.email});

    if(emailExist) return res.status(400).send('Email already exists !')

    //Hash the password

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password,salt);


    //Create a new user
    const user = new User({
        name: req.body.name,
        email: req.body.email,
        password: hashedPassword
    }); 

    try{
        const savedUser = await user.save();
        res.send({user: user._id})
    }catch(err){
        res.status(400).send(err);
    }

});

//Login

router.post('/api/login',async (req,res)=>{
    const {error} = loginValidation(req.body);
    if(error) return res.status(400).send(error.details[0].message);

    //Checking if email exists
    const user = await User.findOne({email: req.body.email});
    if(!user) return res.status(400).send('Email is not registered!');

    //PASSWORD IS CORRECT
    const validPass = await bcrypt.compare(req.body.password,user.password);
    if(!validPass) return res.status(400).send('Invalid Password')

    //Create and assign a token
    const token = jwt.sign({_id: user._id}, process.env.TOKEN_SECRET);
    res.cookie('jwt',token,{httpOnly: true, maxAge: 24*60*60*1000})
    const {password, ...data} = await user.toJSON();
    res.send({
        name:data.name,
        message:'success'
    })
});

router.get('/api/user',async (req,res)=>{
    try{
        const cookie = req.cookies['jwt'];

        const claims = jwt.verify(cookie,process.env.TOKEN_SECRET);

        if(!claims){
            return res.status(401).send({message:'unauthenticated'})
        }
    
        const user = await User.findOne({_id: claims._id})
        const {password, ...data} = await user.toJSON();
        res.send(data);
    } catch(e) {
        return res.status(401).send({message: 'unauthenticated'})
    }
});

router.patch('/api/addfav', async(req,res)=>{
    try{
        const cookie = req.cookies['jwt'];

        const claims = jwt.verify(cookie,process.env.TOKEN_SECRET);
        
        if(!claims){
            return res.status(401).send({message:'unauthenticated'})
        }
        const user = await User.findByIdAndUpdate(claims._id,{
            $addToSet : {
                watchlist :  {
                         "title": req.body.title,
                         "poster": req.body.poster
                       } //inserted data is the object to be inserted 
              }
        },{new:true})
        
        const {password, ...data} = await user.toJSON();
        res.send(data);
    } catch(e) {
        return res.status(401).send({message: 'unauthenticated'})
    }

})
router.patch('/api/removefav', async(req,res)=>{
    try{
        const cookie = req.cookies['jwt'];

        const claims = jwt.verify(cookie,process.env.TOKEN_SECRET);
        
        if(!claims){
            return res.status(401).send({message:'unauthenticated'})
        }
        // const user = await User.findOne({_id: claims._id});
        console.log(claims._id)
        const user = await User.findByIdAndUpdate(claims._id,{
            $pull : {
                watchlist :  {
                         "title": req.body.title,
                         "poster": req.body.poster
                       } //inserted data is the object to be inserted 
              }
        },{new:true})
        
        const {password, ...data} = await user.toJSON();
        res.send(data);
    } catch(e) {
        return res.status(401).send({message: 'unauthenticated'})
    }

})


router.post('/api/logout', async (req,res)=>{
    res.cookie('jwt','',{maxAge:0})
    res.send({
        message:'success'
    })
})

module.exports = router;