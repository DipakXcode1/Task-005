const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = 'your-secret-key-change-in-production';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// File upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|mp4|mov|avi/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image and video files are allowed!'));
    }
  }
});

// Data storage (in production, use a real database)
let users = [];
let posts = [];
let comments = [];
let likes = [];
let follows = [];
let notifications = [];

// Helper functions
const findUserById = (id) => users.find(user => user.id === id);
const findPostById = (id) => posts.find(post => post.id === id);
const findCommentById = (id) => comments.find(comment => comment.id === id);

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Routes

// User registration
app.post('/api/register', async (req, res) => {
  try {
    const { username, email, password, fullName, bio } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required' });
    }

    if (users.find(user => user.email === email)) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    if (users.find(user => user.username === username)) {
      return res.status(400).json({ error: 'Username already taken' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
      id: uuidv4(),
      username,
      email,
      password: hashedPassword,
      fullName: fullName || username,
      bio: bio || '',
      avatar: '',
      createdAt: new Date().toISOString(),
      followers: [],
      following: []
    };

    users.push(newUser);
    
    const token = jwt.sign({ id: newUser.id, username: newUser.username }, JWT_SECRET);
    
    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        fullName: newUser.fullName,
        bio: newUser.bio,
        avatar: newUser.avatar
      },
      token
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// User login
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = users.find(u => u.email === email);
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET);
    
    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        bio: user.bio,
        avatar: user.avatar
      },
      token
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user profile
app.get('/api/users/:id', authenticateToken, (req, res) => {
  const user = findUserById(req.params.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const userPosts = posts.filter(post => post.userId === user.id);
  const followers = users.filter(u => user.followers.includes(u.id));
  const following = users.filter(u => user.following.includes(u.id));

  res.json({
    user: {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      bio: user.bio,
      avatar: user.avatar,
      createdAt: user.createdAt,
      followersCount: user.followers.length,
      followingCount: user.following.length,
      postsCount: userPosts.length
    },
    posts: userPosts,
    followers,
    following
  });
});

// Update user profile
app.put('/api/users/:id', authenticateToken, upload.single('avatar'), (req, res) => {
  const user = findUserById(req.params.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  if (req.user.id !== user.id) {
    return res.status(403).json({ error: 'Not authorized' });
  }

  const { fullName, bio } = req.body;
  
  if (fullName) user.fullName = fullName;
  if (bio !== undefined) user.bio = bio;
  if (req.file) {
    user.avatar = `/uploads/${req.file.filename}`;
  }

  res.json({
    message: 'Profile updated successfully',
    user: {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      bio: user.bio,
      avatar: user.avatar
    }
  });
});

// Create post
app.post('/api/posts', authenticateToken, upload.single('media'), (req, res) => {
  try {
    const { content, tags } = req.body;
    const userId = req.user.id;

    if (!content && !req.file) {
      return res.status(400).json({ error: 'Post content or media is required' });
    }

    const newPost = {
      id: uuidv4(),
      userId,
      content: content || '',
      media: req.file ? `/uploads/${req.file.filename}` : '',
      tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
      likes: [],
      comments: [],
      createdAt: new Date().toISOString()
    };

    posts.push(newPost);

    // Create notification for followers
    const user = findUserById(userId);
    user.followers.forEach(followerId => {
      notifications.push({
        id: uuidv4(),
        userId: followerId,
        type: 'new_post',
        message: `${user.username} created a new post`,
        postId: newPost.id,
        createdAt: new Date().toISOString(),
        read: false
      });
    });

    res.status(201).json({
      message: 'Post created successfully',
      post: newPost
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all posts (feed)
app.get('/api/posts', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const user = findUserById(userId);
  
  // Get posts from user and people they follow
  const followingIds = [userId, ...user.following];
  const feedPosts = posts
    .filter(post => followingIds.includes(post.userId))
    .map(post => {
      const postUser = findUserById(post.userId);
      return {
        ...post,
        user: {
          id: postUser.id,
          username: postUser.username,
          fullName: postUser.fullName,
          avatar: postUser.avatar
        },
        likesCount: post.likes.length,
        commentsCount: post.comments.length,
        isLiked: post.likes.includes(userId)
      };
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  res.json(feedPosts);
});

// Get trending posts
app.get('/api/posts/trending', authenticateToken, (req, res) => {
  const trendingPosts = posts
    .map(post => {
      const postUser = findUserById(post.userId);
      return {
        ...post,
        user: {
          id: postUser.id,
          username: postUser.username,
          fullName: postUser.fullName,
          avatar: postUser.avatar
        },
        likesCount: post.likes.length,
        commentsCount: post.comments.length
      };
    })
    .sort((a, b) => (b.likes.length + b.comments.length) - (a.likes.length + a.comments.length))
    .slice(0, 10);

  res.json(trendingPosts);
});

// Like/unlike post
app.post('/api/posts/:id/like', authenticateToken, (req, res) => {
  const post = findPostById(req.params.id);
  if (!post) {
    return res.status(404).json({ error: 'Post not found' });
  }

  const userId = req.user.id;
  const likeIndex = post.likes.indexOf(userId);

  if (likeIndex === -1) {
    // Like the post
    post.likes.push(userId);
    
    // Create notification
    if (post.userId !== userId) {
      const user = findUserById(userId);
      notifications.push({
        id: uuidv4(),
        userId: post.userId,
        type: 'like',
        message: `${user.username} liked your post`,
        postId: post.id,
        createdAt: new Date().toISOString(),
        read: false
      });
    }
  } else {
    // Unlike the post
    post.likes.splice(likeIndex, 1);
  }

  res.json({
    message: likeIndex === -1 ? 'Post liked' : 'Post unliked',
    likesCount: post.likes.length,
    isLiked: likeIndex === -1
  });
});

// Comment on post
app.post('/api/posts/:id/comments', authenticateToken, (req, res) => {
  const { content } = req.body;
  const postId = req.params.id;
  const userId = req.user.id;

  if (!content) {
    return res.status(400).json({ error: 'Comment content is required' });
  }

  const post = findPostById(postId);
  if (!post) {
    return res.status(404).json({ error: 'Post not found' });
  }

  const newComment = {
    id: uuidv4(),
    postId,
    userId,
    content,
    createdAt: new Date().toISOString()
  };

  comments.push(newComment);
  post.comments.push(newComment.id);

  // Create notification
  if (post.userId !== userId) {
    const user = findUserById(userId);
    notifications.push({
      id: uuidv4(),
      userId: post.userId,
      type: 'comment',
      message: `${user.username} commented on your post`,
      postId: post.id,
      commentId: newComment.id,
      createdAt: new Date().toISOString(),
      read: false
    });
  }

  res.status(201).json({
    message: 'Comment added successfully',
    comment: {
      ...newComment,
      user: {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        avatar: user.avatar
      }
    }
  });
});

// Follow/unfollow user
app.post('/api/users/:id/follow', authenticateToken, (req, res) => {
  const targetUserId = req.params.id;
  const currentUserId = req.user.id;

  if (targetUserId === currentUserId) {
    return res.status(400).json({ error: 'Cannot follow yourself' });
  }

  const targetUser = findUserById(targetUserId);
  const currentUser = findUserById(currentUserId);

  if (!targetUser || !currentUser) {
    return res.status(404).json({ error: 'User not found' });
  }

  const isFollowing = currentUser.following.includes(targetUserId);

  if (isFollowing) {
    // Unfollow
    currentUser.following = currentUser.following.filter(id => id !== targetUserId);
    targetUser.followers = targetUser.followers.filter(id => id !== currentUserId);
  } else {
    // Follow
    currentUser.following.push(targetUserId);
    targetUser.followers.push(currentUserId);

    // Create notification
    notifications.push({
      id: uuidv4(),
      userId: targetUserId,
      type: 'follow',
      message: `${currentUser.username} started following you`,
      createdAt: new Date().toISOString(),
      read: false
    });
  }

  res.json({
    message: isFollowing ? 'Unfollowed successfully' : 'Followed successfully',
    isFollowing: !isFollowing
  });
});

// Get notifications
app.get('/api/notifications', authenticateToken, (req, res) => {
  const userNotifications = notifications
    .filter(notification => notification.userId === req.user.id)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  res.json(userNotifications);
});

// Mark notification as read
app.put('/api/notifications/:id/read', authenticateToken, (req, res) => {
  const notification = notifications.find(n => n.id === req.params.id);
  
  if (!notification) {
    return res.status(404).json({ error: 'Notification not found' });
  }

  if (notification.userId !== req.user.id) {
    return res.status(403).json({ error: 'Not authorized' });
  }

  notification.read = true;
  res.json({ message: 'Notification marked as read' });
});

// Search users and posts
app.get('/api/search', authenticateToken, (req, res) => {
  const { q } = req.query;
  
  if (!q) {
    return res.status(400).json({ error: 'Search query is required' });
  }

  const searchTerm = q.toLowerCase();
  
  const matchingUsers = users
    .filter(user => 
      user.username.toLowerCase().includes(searchTerm) ||
      user.fullName.toLowerCase().includes(searchTerm)
    )
    .map(user => ({
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      avatar: user.avatar
    }));

  const matchingPosts = posts
    .filter(post => 
      post.content.toLowerCase().includes(searchTerm) ||
      post.tags.some(tag => tag.toLowerCase().includes(searchTerm))
    )
    .map(post => {
      const postUser = findUserById(post.userId);
      return {
        ...post,
        user: {
          id: postUser.id,
          username: postUser.username,
          fullName: postUser.fullName,
          avatar: postUser.avatar
        }
      };
    });

  res.json({
    users: matchingUsers,
    posts: matchingPosts
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 10MB.' });
    }
  }
  res.status(500).json({ error: 'Server error' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Frontend available at http://localhost:${PORT}`);
}); 