const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const express = require('express');
const router = express.Router();
const User = require('../models/user');
const Application = require('../models/application')

const {protect} = require('../middleware/auth-middleware');

const generateToken = (id) => {
    return jwt.sign({id}, process.env.JWT_SECRET, {expiresIn: '30d'});
};

//signup
router.post('/register', async (req, res) => {
    const {username, email, password} = req.body;
    try{
        const userExists = await User.findOne({email});
        if(userExists){
            return res.status(400).json({error: 'User exists already'});
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = await User.create({
            username,
            email,
            password: hashedPassword
        });

        if(user){
            res.status(201).json({
                _id : user.id,
                username : user.usermame,
                email : user.email,
                token : generateToken(user._id)
            });
        }else{
            res.status(400).json({error : 'invalid user data received'});
        }
    }catch(err){
        res.status(500).json({error: 'server error during registration', details : err.message});
    }
});

//login
router.post('/login', async (req, res) => {
    const {email, password} = req.body;
    
    try{
        const user = await User.findOne({email});
        if(user && (await bcrypt.compare(password, user.password))){
            res.status(200).json({
                _id : user.id,
                username : user.username,
                email : user.email,
                token : generateToken(user._id)
            });
        }else{
            res.status(401).json({error: 'invalid email or password'});
        }
    }catch(err){
        res.status(500).json({error: 'server error during login', details : err.message});
    }
});

//change password
router.put('/password', protect, async (req, res) =>{
    const {oldPassword, newPassword} = req.body;

    try{
        const user = User.findById(req.user.id);
        if(user && bcrypt.compare(oldPassword, user.password)){
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(newPassword, salt);

            await user.save();
            res.status(200).json({message: 'password changed successfully'});
        }else{
            return res.status(401).json({error : 'incorrect password'});
        }
    }catch(err){
        res.status(500).json({error: 'server error', details : err.message});
    }
}); 

//delete account
router.delete('/profile', protect, async (req, res) => {
    try{
        const user = await User.findById(req.user.id);
        if(!user){
            return res.status(404).json({error: 'user not found'});
            await Application.deleteMany({user: req.user.id});

            await User.findByIdAndDelete(req.user.id);

            res.status(200).json({message: 'account deleted'});
        }
    }catch(err){
        res.status(500).json({error: 'server error', details: err.message});
    }
});

module.exports = router;
