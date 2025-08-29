# Abdullah Al Mamun - Portfolio Website

## Overview
This is a modern, responsive portfolio website for Abdullah Al Mamun, a Flutter & ML Developer. The website showcases his skills, education, projects, and provides a contact form for potential clients or employers to reach out.

## Features
- **Responsive Design**: Fully responsive layout that works on all devices (mobile, tablet, desktop)
- **Modern UI**: Neon-themed design with smooth animations and transitions
- **Project Showcase**: Detailed project cards with expandable view and project details page
- **Contact Form**: Integrated with EmailJS for sending messages directly from the website
- **Admin Dashboard**: Content management system to update projects and other content
- **Local Storage**: Project data is stored in the browser's localStorage

## Technologies Used
- HTML5
- CSS3 (with custom animations and responsive design)
- JavaScript (Vanilla JS, no frameworks)
- EmailJS for contact form functionality
- Font Awesome for icons
- Google Fonts (Orbitron, Poppins)

## Pages
1. **Home Page (index.html)**: Main portfolio page with sections for:
   - Hero/Introduction
   - Skills
   - Education
   - Projects
   - Contact Form

2. **Project Details (project-details.html)**: Detailed view of individual projects

3. **Admin Dashboard (admin.html)**: Content management system for updating projects

## Setup and Installation

### Prerequisites
- Web browser (Chrome, Firefox, Safari, Edge recommended)
- Internet connection (for loading external resources like fonts and icons)

### Local Development
1. Clone or download this repository
2. Open the project folder in your code editor
3. To run locally, use a local development server:
   - With Python: `python -m http.server`
   - With Node.js: Install `http-server` package and run `http-server`
   - With VS Code: Use the Live Server extension

### Deployment to Netlify
1. Sign up for a free account at [Netlify](https://www.netlify.com/)
2. Deploy using one of these methods:
   - **Drag and Drop**: Simply drag and drop the entire project folder to the Netlify dashboard
   - **Connect to Git**: Connect your GitHub/GitLab/Bitbucket repository for continuous deployment
3. Once deployed, Netlify will provide a URL to access your live site
4. You can configure a custom domain in the Netlify settings

**Note**: When deployed to Netlify, the admin dashboard will have limited functionality as it requires server-side operations. For full functionality, consider using Netlify Functions or a headless CMS like Contentful or Sanity.

### EmailJS Setup
1. Create an account at [EmailJS](https://www.emailjs.com/)
2. Create a new email service and template
3. Update the following in `script.js`:
   - Your EmailJS User ID
   - Service ID
   - Template ID

## Deployment

### Deploying to Netlify
1. Create an account on [Netlify](https://www.netlify.com/)
2. Drag and drop the project folder to Netlify's upload area or connect to your Git repository
3. Configure build settings (not required for this static site)
4. Deploy

**Note about Admin Dashboard**: When deployed to Netlify, the admin dashboard will function with limitations:
- Data will be stored in the browser's localStorage, which is device and browser-specific
- There is no true authentication system
- For a fully functional admin dashboard, consider integrating:
  - Netlify Functions (serverless functions)
  - Firebase (Authentication and Firestore)
  - A headless CMS like Contentful or Netlify CMS

## Project Structure
```
├── index.html          # Main portfolio page
├── style.css           # Main stylesheet
├── script.js           # Main JavaScript file
├── project-details.html # Project details page
├── project-details.js  # JavaScript for project details
├── admin.html          # Admin dashboard
├── admin.js            # Admin dashboard functionality
├── main.png            # Profile image
└── resume.pdf          # Downloadable resume
```

## Customization

### Updating Content
- Edit the HTML files to update text content
- Use the admin dashboard to update projects
- Modify `style.css` to change colors, fonts, and layout

### Adding New Projects
1. Use the admin dashboard to add new projects, or
2. Manually add new project data in `script.js` and `project-details.js`

## License
This project is available for personal and commercial use with attribution.

## Contact
For questions or support, please contact Abdullah Al Mamun through the contact form on the website or via the social media links provided.