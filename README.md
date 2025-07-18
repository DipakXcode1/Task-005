# Social Media Platform

A modern, full-featured social media application built with Node.js, Express, and vanilla JavaScript. This platform includes all the essential features of a social media site with a beautiful, responsive UI.

## Features

### Core Features
- **User Authentication**: Register, login, and secure JWT-based authentication
- **User Profiles**: Customizable profiles with avatars, bios, and statistics
- **Posts**: Create posts with text content and media uploads (images/videos)
- **Likes & Comments**: Interactive engagement with posts
- **Following System**: Follow/unfollow other users
- **Real-time Feed**: Personalized feed showing posts from followed users
- **Notifications**: Real-time notifications for interactions
- **Search**: Search for users and posts
- **Trending Posts**: Discover popular content

### Advanced Features
- **Media Upload**: Support for images and videos (up to 10MB)
- **Post Tagging**: Add hashtags to posts for better discoverability
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile
- **Modern UI**: Beautiful, intuitive interface with smooth animations
- **Real-time Updates**: Dynamic content updates without page refresh

## Tech Stack

### Backend
- **Node.js**: Runtime environment
- **Express.js**: Web framework
- **JWT**: Authentication tokens
- **bcryptjs**: Password hashing
- **multer**: File upload handling
- **CORS**: Cross-origin resource sharing
- **express-rate-limit**: Rate limiting for API protection

### Frontend
- **Vanilla JavaScript**: No framework dependencies
- **HTML5 & CSS3**: Modern web standards
- **Font Awesome**: Icons
- **Google Fonts**: Typography
- **Responsive Design**: Mobile-first approach

## Installation & Setup

### Prerequisites
- Node.js (version 14 or higher)
- npm or yarn

### Step 1: Clone and Install Dependencies
```bash
# Navigate to the project directory
cd social-media-platform

# Install dependencies
npm install
```

### Step 2: Start the Server
```bash
# Start the development server
npm run dev

# Or start in production mode
npm start
```

The server will start on `http://localhost:3000`

### Step 3: Access the Application
Open your browser and navigate to `http://localhost:3000`

## Usage Guide

### Getting Started

1. **Registration**: Create a new account with your email, username, and password
2. **Login**: Sign in with your credentials
3. **Profile Setup**: Add a profile picture and bio to personalize your account

### Creating Content

1. **Create Posts**: Use the post creation area on the feed page
2. **Add Media**: Upload images or videos to enhance your posts
3. **Add Tags**: Include hashtags to make your posts discoverable
4. **Engage**: Like and comment on posts from other users

### Social Features

1. **Follow Users**: Click on user profiles to follow them
2. **Explore Content**: Use the explore page to discover trending posts
3. **Search**: Find users and posts using the search functionality
4. **Notifications**: Stay updated with real-time notifications

### Profile Management

1. **Edit Profile**: Update your information and avatar
2. **View Statistics**: Check your posts, followers, and following counts
3. **Manage Content**: View and manage your posts

## API Endpoints

### Authentication
- `POST /api/register` - User registration
- `POST /api/login` - User login

### Users
- `GET /api/users/:id` - Get user profile
- `PUT /api/users/:id` - Update user profile
- `POST /api/users/:id/follow` - Follow/unfollow user

### Posts
- `GET /api/posts` - Get user feed
- `POST /api/posts` - Create new post
- `GET /api/posts/trending` - Get trending posts
- `POST /api/posts/:id/like` - Like/unlike post
- `POST /api/posts/:id/comments` - Add comment to post

### Notifications
- `GET /api/notifications` - Get user notifications
- `PUT /api/notifications/:id/read` - Mark notification as read

### Search
- `GET /api/search?q=query` - Search users and posts

## File Structure

```
social-media-platform/
├── server.js              # Main server file
├── package.json           # Dependencies and scripts
├── public/               # Frontend files
│   ├── index.html        # Main HTML file
│   ├── styles.css        # CSS styles
│   ├── app.js           # Frontend JavaScript
│   └── uploads/         # Uploaded media files
├── uploads/              # Server-side uploads directory
└── README.md            # This file
```

## Features in Detail

### User Authentication
- Secure JWT-based authentication
- Password hashing with bcrypt
- Session management
- Protected routes

### Post System
- Text content with rich formatting
- Image and video uploads
- Hashtag support for discoverability
- Like and comment functionality
- Real-time engagement tracking

### Social Features
- Follow/unfollow system
- Personalized feed algorithm
- Trending posts discovery
- User search and discovery
- Real-time notifications

### Media Handling
- Support for images (JPEG, PNG, GIF)
- Support for videos (MP4, MOV, AVI)
- File size limits (10MB)
- Automatic file naming and organization
- Responsive media display

### UI/UX Features
- Modern, clean design
- Responsive layout for all devices
- Smooth animations and transitions
- Intuitive navigation
- Loading states and feedback
- Toast notifications for user feedback

## Security Features

- JWT token authentication
- Password hashing
- Rate limiting on API endpoints
- File upload validation
- CORS protection
- Input sanitization

## Performance Optimizations

- Efficient database queries
- Optimized file uploads
- Responsive image handling
- Minimal JavaScript bundle
- CSS optimizations

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers

## Development

### Running in Development Mode
```bash
npm run dev
```

This will start the server with nodemon for automatic restarts on file changes.

### Production Deployment
```bash
npm start
```

For production deployment, consider:
- Using a process manager like PM2
- Setting up a reverse proxy (nginx)
- Using a proper database (MongoDB, PostgreSQL)
- Implementing HTTPS
- Setting up proper environment variables

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Future Enhancements

- Real-time messaging
- Story/status features
- Advanced post privacy settings
- Analytics dashboard
- Mobile app development
- Advanced search filters
- Post scheduling
- Content moderation tools

## Support

For issues and questions:
1. Check the documentation
2. Review existing issues
3. Create a new issue with detailed information

---

**Built with ❤️ using modern web technologies** # Task-005
