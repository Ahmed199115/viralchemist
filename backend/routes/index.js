const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

// Import route handlers
const postAlchemyRoute = require('./postAlchemy');
const commentAlchemyRoute = require('./commentAlchemy');
const hashtagGenerateRoute = require('./hashtagGenerate');

// API Routes
router.post('/post-alchemy', postAlchemyRoute);
router.post('/comment-alchemy', upload.single('image'), commentAlchemyRoute);
router.post('/hashtags-generate', hashtagGenerateRoute);

// Placeholder routes
router.post('/login', (req, res) => {
    console.log('Login request received:', req.body);
    res.json({ message: 'Login functionality is under development.', success: false });
});

router.post('/signup', (req, res) => {
    console.log('Signup request received:', req.body);
    res.json({ message: 'Signup functionality is under development.', success: false });
});

router.post('/blog/create', (req, res) => {
    console.log('Blog post creation request received:', req.body);
    res.json({ message: 'Blog creation functionality is under development.', success: false });
});

router.get('/blog', (req, res) => {
    res.json({ message: 'Fetching blog posts is under development.', posts: [] });
});

module.exports = router;
