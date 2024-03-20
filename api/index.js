
//mongodb+srv://rodriguezr1016:KQ12X2Yf9tzVOvXs@cluster0.tjqbolj.mongodb.net/mern-blog?retryWrites=true&w=majority

const express = require('express');
const cors = require('cors');
const mongoose = require("mongoose");
const User = require('./models/User');
const Post = require('./models/Post');
const bcrypt = require('bcryptjs');
const app = express();
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const fs = require('fs');
const multer = require('multer');
const uploadMiddleware = multer({ dest: '/tmp' });
require('dotenv').config();
const {S3Client, PutObjectCommand} = require('@aws-sdk/client-s3')
const salt = bcrypt.genSaltSync(10);
const secret = 'asdfe45we45w345wegw345werjktjwertkj';
const bucket = 'yvettes-blog-app'

app.use(cors({credentials:true,origin:'http://localhost:3000'}));
app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static(__dirname + '/uploads'));


async function uploadToS3(path, originalFilename, mimetype) {
  const client = new S3Client({
    region: 'us-west-1',
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
    },
  });
  const parts = originalFilename.split('.');
  const ext = parts[parts.length - 1];
  const newFileName = Date.now() + '.' + ext;
    const data = await client.send(new PutObjectCommand({
      Bucket: bucket,
      Body: fs.readFileSync(path),
      Key: newFileName,
      ContentType: mimetype,
      ACL: 'public-read',
    }));
    return `https://${bucket}.s3.amazonaws.com/${newFileName}`;
    // console.log({data})


}

app.post('/register', async (req,res) => {
     mongoose.connect(process.env.MONGODB_URI);
    const {username,email, password, firstName, lastName} = req.body;
    try{
      const userDoc = await User.create({
        username,
        email,
        firstName,
        lastName,
        password:bcrypt.hashSync(password,salt),
      });
      res.json(userDoc);
    } catch(e) {
      console.log(e);
      res.status(400).json(e);
    }
  });

app.post('/login', async (req,res) => {
  mongoose.connect(process.env.MONGODB_URI);
  const {username,password} = req.body;
  const userDoc = await User.findOne({username});
  const passOk = bcrypt.compareSync(password, userDoc.password);
  if (passOk) {
    // logged in
    jwt.sign({username,id:userDoc._id, firstName: userDoc.firstName, lastName: userDoc.lastName}, secret, {}, (err,token) => {
      if (err) throw err;
      res.cookie('token', token).json({
        id:userDoc._id,
        username,
      });
    });
  } else {
    res.status(400).json('wrong credentials');
  }
});

app.get('/profile', (req,res) => {
  mongoose.connect(process.env.MONGODB_URI);
  const {token} = req.cookies;
  jwt.verify(token, secret, {}, (err,info) => {
    if (err) throw err;
    res.json(info);
  });
});

app.post('/logout', (req,res) => {
  res.cookie('token', '').json('ok');
});

app.post('/post', uploadMiddleware.single('file'), async (req,res) => {
  mongoose.connect(process.env.MONGODB_URI);
  const {originalname,path, mimetype} = req.file;
  // const parts = originalname.split('.');
  // const ext = parts[parts.length - 1];
  // const newPath = path+'.'+ext;
  // fs.renameSync(path, newPath);
  const url = await uploadToS3(path, originalname, mimetype);
  console.log(url)

  const {token} = req.cookies;
  jwt.verify(token, secret, {}, async (err,info) => {
    if (err) throw err;
    const {title,summary,content} = req.body;
    const postDoc = await Post.create({
      title,
      summary,
      content,
      cover:url,
      author:info.id,
      firstName: info.firstName,
      lastName: info.lastName
    });
    res.json(postDoc);
  });

});

app.put('/post', uploadMiddleware.single('file'), async (req,res) => {
  mongoose.connect(process.env.MONGODB_URI);
  let newPath = null;
  let url = '';
  if (req.file) {
    const {originalname,path, mimetype} = req.file;
    url = await uploadToS3(path, originalname, mimetype);

    // fs.renameSync(path, newPath);
  }

  const {token} = req.cookies;
  jwt.verify(token, secret, {}, async (err,info) => {
    if (err) throw err;
    const {id,title,summary,content} = req.body;
    const postDoc = await Post.findById(id);
    const isAuthor = JSON.stringify(postDoc.author) === JSON.stringify(info.id);
    if (!isAuthor) {
      return res.status(400).json('you are not the author');
    }
    await postDoc.updateOne({
      title,
      summary,
      content,
      cover: url ? url : postDoc.cover,
    });

    res.json(url);
  });

});

app.get('/post', async (req,res) => {
  mongoose.connect(process.env.MONGODB_URI);
  res.json(
    await Post.find()
      .populate('author', ['username'])
      .sort({createdAt: -1})
      .limit(20)
  );
});

app.get('/post/:id', async (req, res) => {
  mongoose.connect(process.env.MONGODB_URI);
  const {id} = req.params;
  const postDoc = await Post.findById(id).populate('author', ['username']);
  res.json(postDoc);
})
app.delete('/post/:id', async (req,res) => {
       mongoose.connect(process.env.MONGODB_URI);
    
      const {id} = req.params;
      const postDoc = await Post.findById(id);
      
      await Post.deleteOne({ _id: id });
      res.json({ message: 'Post deleted successfully' });
    });



app.listen(4000);
