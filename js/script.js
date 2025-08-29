// Mobile Navigation Toggle
const menuBtn = document.querySelector('.menu-btn');
const navbar = document.querySelector('.navbar');
const navLinks = document.querySelectorAll('.navbar a');

menuBtn.addEventListener('click', () => {
    menuBtn.classList.toggle('active');
    navbar.classList.toggle('active');
});

// Close mobile menu when a link is clicked
navLinks.forEach(link => {
    link.addEventListener('click', () => {
        menuBtn.classList.remove('active');
        navbar.classList.remove('active');
    });
});

// Handle Admin link visibility and click based on authentication status
const adminLink = document.getElementById('admin-link');
if (adminLink) {
    // Check if user is logged in via session storage
    if (sessionStorage.getItem('adminLoggedIn') === 'true') {
        // Show admin link and set click handler to go directly to admin dashboard
        adminLink.style.display = 'inline-block';
        adminLink.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = 'pages/admin.html';
        });
    } else {
        // Hide admin link when not logged in
        adminLink.style.display = 'none';
        
        // Add a hidden route for admin to access login page
        // Listen for '/admin' in the URL
        if (window.location.pathname.endsWith('/admin')) {
            window.location.href = 'pages/login.html';
        }
    }
}

// Scroll Animations
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('show');
        }
    });
}, { threshold: 0.1 });

// Observe all sections for scroll animations
document.querySelectorAll('section').forEach(section => {
    observer.observe(section);
});

// Import Firebase modules
import { db, collection, getDocs, query, onSnapshot, orderBy, limit } from './firebase-config.js';

// Projects Load More Functionality
document.addEventListener('DOMContentLoaded', function() {
    // Update projects and education from Firestore
    console.log('DOMContentLoaded: About to call updateProjectsFromFirestore');
    
    // Add visible indicator that JavaScript is working
    const testProjectsContainer = document.querySelector('.projects-container');
    if (testProjectsContainer) {
        testProjectsContainer.innerHTML = '<div style="color: red; font-size: 20px; text-align: center; padding: 20px;">JavaScript is executing! Attempting to load projects...</div>';
    }
    
    // Add a small delay to ensure Firebase is fully initialized
    setTimeout(() => {
        console.log('Calling updateProjectsFromFirestore after delay');
        
        // Test Firebase connection first
        if (testFirebaseConnection()) {
            setupProjectsListener();
            updateSkillsFromFirestore();
            updateEducationFromFirestore();
        } else {
            // Display clear error message if Firebase connection fails
            const projectsContainer = document.querySelector('.projects-container');
            if (projectsContainer) {
                projectsContainer.innerHTML = `
                    <div style="text-align: center; padding: 20px; color: #ff6b6b;">
                        <h3>Error Loading Projects</h3>
                        <p>Firebase connection failed. Please check your internet connection and try again.</p>
                        <button id="retry-connection" class="btn neon-glow">Retry Connection</button>
                    </div>
                `;
                
                // Add retry button functionality
                const retryBtn = document.getElementById('retry-connection');
                if (retryBtn) {
                    retryBtn.addEventListener('click', () => {
                        projectsContainer.innerHTML = '<div style="color: red; font-size: 20px; text-align: center; padding: 20px;">Retrying connection...</div>';
                        setTimeout(() => {
                            if (testFirebaseConnection()) {
                                setupProjectsListener();
                                updateSkillsFromFirestore();
                                updateEducationFromFirestore();
                            }
                        }, 1000);
                    });
                }
            }
        }
    }, 1000);
    
    const loadMoreBtn = document.getElementById('load-more-btn');
    const projectsContainer = document.querySelector('.projects-container');
    let projectsExpanded = false;
    let allProjects = [];
    
    console.log('DOM Content Loaded');
    console.log('Load More button found:', loadMoreBtn);
    console.log('Projects container found:', projectsContainer);
    
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', function() {
            console.log('Load More button clicked, current state:', projectsExpanded);
            
            // Toggle the expanded state
            projectsExpanded = !projectsExpanded;
            
            if (projectsExpanded) {
                // Show all projects
                console.log('Expanding to show all projects:', allProjects.length);
                renderProjects(allProjects.length);
                loadMoreBtn.textContent = 'Show Less';
            } else {
                // Show only the first 3 projects
                console.log('Collapsing to show only 3 projects');
                renderProjects(3);
                loadMoreBtn.textContent = 'Load More';

                // Scroll back to the projects section
                const projectsSection = document.getElementById('projects');
                if (projectsSection) {
                    window.scrollTo({
                        top: projectsSection.offsetTop - 100,
                        behavior: 'smooth'
                    });
                }
            }
            
            // Update button visibility based on project count
            updateButtonVisibility();
        });
    }

    // Variable to store the unsubscribe function for the projects listener
    let unsubscribeProjects = null;

    function setupProjectsListener() {
    // Clean up previous listener if it exists
    if (unsubscribeProjects) {
        unsubscribeProjects();
        unsubscribeProjects = null;
    }
    
    const projectsCollection = collection(db, 'projects');
    const q = query(projectsCollection, orderBy('order', 'asc'));
    const loadingIndicator = document.getElementById('projects-loading');
    
    if (loadingIndicator) {
        loadingIndicator.style.display = 'block';
    }

    try {
        unsubscribeProjects = onSnapshot(q, 
            (projectsSnapshot) => {
                // Success handler
                allProjects = [];
                projectsSnapshot.forEach(doc => {
                    allProjects.push({ id: doc.id, ...doc.data() });
                });

                // Projects are already sorted by order in the query
                // No need for additional sorting here

                console.log('Projects loaded from Firestore:', allProjects.length, 'projects');
                
                // Reset expanded state when projects are loaded
                projectsExpanded = false;
                
                // Render initial projects (limited to 3)
                renderProjects(3);
                
                // Update button visibility and text
                updateButtonVisibility();
            },
            (error) => {
                // Error handler
                console.error('Error in projects listener:', error);
                if (loadingIndicator) {
                    loadingIndicator.style.display = 'none';
                }
                const projectsContainer = document.querySelector('.projects-container');
                if (projectsContainer) {
                    projectsContainer.innerHTML = `
                        <div class="error-message">
                            <h3>Error Loading Projects</h3>
                            <p>Error: ${error.message}</p>
                            <button id="retry-projects" class="btn neon-glow">Retry</button>
                        </div>
                    `;
                    
                    document.getElementById('retry-projects')?.addEventListener('click', () => {
                        setupProjectsListener();
                    });
                }
            }
        );
    } catch (error) {
        console.error('Failed to set up projects listener:', error);
        if (loadingIndicator) {
            loadingIndicator.style.display = 'none';
        }
        return null;
    }
}

    function renderProjects(limitCount) {
        console.log(`renderProjects called with limitCount: ${limitCount}`);
        
        const loadingIndicator = document.getElementById('projects-loading');
        if (loadingIndicator) {
            loadingIndicator.style.display = 'none';
        }

        const projectsContainer = document.querySelector('.projects-container');
        if (!projectsContainer) {
            console.error('Projects container not found in the DOM');
            return;
        }

        console.log(`Before clearing, container has children: ${projectsContainer.children.length}`);
        
        // Clear existing projects
        projectsContainer.innerHTML = '';
        
        console.log(`After clearing, container has children: ${projectsContainer.children.length}`);

        // Take only the first limitCount projects after sorting
        const displayedProjects = allProjects.slice(0, limitCount);
        
        // Debug output
        console.log(`Rendering ${displayedProjects.length} projects out of ${allProjects.length} total, expanded state: ${projectsExpanded}`);

        // Create and append project cards
        if (displayedProjects.length === 0) {
            projectsContainer.innerHTML = '<div class="no-projects">No projects found</div>';
        } else {
            displayedProjects.forEach((project, index) => {
                try {
                    const newCard = createProjectCard(project, project.id, index);
                    projectsContainer.appendChild(newCard);
                    console.log(`Added project card: ${project.title || 'Untitled Project'}`);
                } catch (err) {
                    console.error('Error creating project card:', err, 'Project:', project);
                    // Add an error card instead of failing silently
                    projectsContainer.appendChild(createErrorCard('Error loading this project'));
                }
            });
        }
    }

    function updateButtonVisibility() {
        const loadMoreBtn = document.getElementById('load-more-btn');
        if (loadMoreBtn) {
            // Only show the button if there are more than 3 projects
            if (allProjects.length > 3) {
                loadMoreBtn.style.display = 'inline-block';
                // Update button text based on current state
                loadMoreBtn.textContent = projectsExpanded ? 'Show Less' : 'Load More';
            } else {
                loadMoreBtn.style.display = 'none';
            }
            console.log('Button visibility updated, projects count:', allProjects.length, 'expanded:', projectsExpanded);
        }
    }
    
    // Helper function to create error cards when project loading fails
    function createErrorCard(message) {
        const errorCard = document.createElement('div');
        errorCard.className = 'project-card neon-box-glow error-card';
        errorCard.innerHTML = `
            <div class="project-header">
                <h3>Error Loading Project</h3>
            </div>
            <p>${message || 'There was an error loading this project. Please try refreshing the page.'}</p>
        `;
        return errorCard;
    }
    
    // Clean up listeners when page unloads
    window.addEventListener('beforeunload', () => {
        if (unsubscribeProjects) {
            unsubscribeProjects();
        }
    });
});


// Form Validation and Email Sending
const contactForm = document.getElementById('contact-form');
const nameInput = document.getElementById('name');
const emailInput = document.getElementById('email');
const subjectInput = document.getElementById('subject');
const messageInput = document.getElementById('message');
const submitBtn = document.getElementById('submit-btn');
const formMessage = document.getElementById('form-message');

if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        let isValid = true;
        
        // Reset previous error states
        if (nameInput && emailInput && subjectInput && messageInput) {
            [nameInput, emailInput, subjectInput, messageInput].forEach(input => {
                if (input) {
                    input.style.borderColor = 'var(--neon-blue)';
                    input.style.boxShadow = '0 0 5px var(--neon-blue)';
                }
            });
            
            // Validate name
            if (nameInput && nameInput.value.trim() === '') {
                nameInput.style.borderColor = '#ff0000';
                nameInput.style.boxShadow = '0 0 10px #ff0000';
                isValid = false;
            }
            
            // Validate email
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (emailInput && !emailRegex.test(emailInput.value.trim())) {
                emailInput.style.borderColor = '#ff0000';
                emailInput.style.boxShadow = '0 0 10px #ff0000';
                isValid = false;
            }
            
            // Validate subject
            if (subjectInput && subjectInput.value.trim() === '') {
                subjectInput.style.borderColor = '#ff0000';
                subjectInput.style.boxShadow = '0 0 10px #ff0000';
                isValid = false;
            }
            
            // Validate message
            if (messageInput && messageInput.value.trim() === '') {
                messageInput.style.borderColor = '#ff0000';
                messageInput.style.boxShadow = '0 0 10px #ff0000';
                isValid = false;
            }
            
            if (isValid) {
                // Disable submit button and show loading state
                submitBtn.disabled = true;
                submitBtn.textContent = 'Sending...';
                
                // Prepare template parameters for EmailJS
                const templateParams = {
                    from_name: nameInput.value.trim(),
                    from_email: emailInput.value.trim(),
                    subject: subjectInput.value.trim(),
                    message: messageInput.value.trim()
                };
                
                // Send email using EmailJS
                // Using the configured service ID and template ID
                emailjs.send('service_mamun', 'template_portfolio', templateParams)
                    .then(function(response) {
                        console.log('SUCCESS!', response.status, response.text);
                        
                        // Show success message
                        formMessage.textContent = 'Message sent successfully!';
                        formMessage.style.color = 'var(--neon-blue)';
                        formMessage.style.textShadow = '0 0 5px var(--neon-blue)';
                        
                        // Reset form
                        contactForm.reset();
                        
                        // Reset button
                        submitBtn.disabled = false;
                        submitBtn.textContent = 'Send Message';
                        
                        // Remove success message after 5 seconds
                        setTimeout(() => {
                            formMessage.textContent = '';
                        }, 5000);
                    })
                    .catch(function(error) {
                        console.log('FAILED...', error);
                        
                        // Show error message
                        formMessage.textContent = 'Failed to send message. Please try again.';
                        formMessage.style.color = '#ff0000';
                        formMessage.style.textShadow = '0 0 5px #ff0000';
                        
                        // Reset button
                        submitBtn.disabled = false;
                        submitBtn.textContent = 'Send Message';
                    });
            }
        }
    });
}

// Hover effects for skill items
const skillItems = document.querySelectorAll('.skills-content span');

if (skillItems.length > 0) {
    skillItems.forEach(item => {
        item.addEventListener('mouseenter', () => {
            item.style.transform = 'scale(1.1)';
        });
        
        item.addEventListener('mouseleave', () => {
            item.style.transform = 'scale(1)';
        });
    });
}

// Scroll to section when nav link is clicked
document.querySelectorAll('.navbar a').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        
        const targetId = this.getAttribute('href');
        const targetSection = document.querySelector(targetId);
        
        if (targetSection) {
            window.scrollTo({
                top: targetSection.offsetTop - 100,
                behavior: 'smooth'
            });
        }
    });
});

// Add active class to nav links on scroll
window.addEventListener('scroll', () => {
    const sections = document.querySelectorAll('section');
    const navLinks = document.querySelectorAll('.navbar a');
    
    let current = '';
    
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        
        if (window.scrollY >= sectionTop - 200) {
            current = section.getAttribute('id');
        }
    });
    
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${current}`) {
            link.classList.add('active');
        }
    });
});

// Sticky header
window.addEventListener('scroll', () => {
    const header = document.querySelector('.header');
    header.classList.toggle('sticky', window.scrollY > 100);
});

// Function to load sample projects as fallback
function loadSampleProjects(container) {
    const loadingElement = document.getElementById('projects-loading');
    if (loadingElement) loadingElement.style.display = 'none';
    
    // Clear container
    container.innerHTML = '';
    
    // Add a message indicating these are sample projects
    const messageDiv = document.createElement('div');
    messageDiv.className = 'sample-projects-message';
    messageDiv.innerHTML = `
        <div style="text-align: center; padding: 10px; margin-bottom: 20px; color: #ff6b6b;">
            <p>Unable to connect to the database. Showing sample projects instead.</p>
            <button id="retry-connection" class="btn neon-glow">Retry Connection</button>
        </div>
    `;
    container.appendChild(messageDiv);
    
    // Add sample projects
    sampleProjects.forEach((project, index) => {
        const card = createProjectCard(project, project.id, index);
        container.appendChild(card);
    });
    
    // Add retry button functionality
    const retryBtn = document.getElementById('retry-connection');
    if (retryBtn) {
        retryBtn.addEventListener('click', () => {
            if (loadingElement) loadingElement.style.display = 'block';
            container.innerHTML = '';
            container.appendChild(loadingElement);
            setTimeout(() => {
                updateProjectsFromFirestore(3);
            }, 1000);
        });
    }
    
    // Hide load more button since we're showing sample data
    const loadMoreBtn = document.getElementById('load-more-btn');
    if (loadMoreBtn) {
        loadMoreBtn.style.display = 'none';
    }
}

// Test Firebase connection and collection access
async function testFirebaseConnection() {
    try {
        console.log('Testing Firebase connection...');
        console.log('Database instance available:', !!db);
        
        if (!db) {
            console.error('Database instance is null or undefined');
            const projectsContainer = document.querySelector('.projects-container');
            
            if (projectsContainer) {
                console.log('Loading sample projects as fallback...');
                loadSampleProjects(projectsContainer);
            }
            return false;
        }
        
        // Create a timeout promise that rejects after 5 seconds
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => {
                reject(new Error('Connection test timed out after 5 seconds'));
            }, 5000);
        });
        
        // Create the connection test promise
        const connectionPromise = async () => {
            const testCollection = collection(db, 'projects');
            console.log('Collection reference created:', !!testCollection);
            const snapshot = await getDocs(testCollection);
            console.log('Connection test successful, documents:', snapshot.size);
            return true;
        };
        
        // Race the connection test against the timeout
        const result = await Promise.race([
            connectionPromise(),
            timeoutPromise
        ]);
        
        return result; // This will be true if connectionPromise resolves first
        
    } catch (error) {
        console.error('Firebase connection test failed:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        return false;
    }
}

// Sample projects data as fallback
const sampleProjects = [
    {
        id: 'sample1',
        title: 'Portfolio Website',
        description: 'A personal portfolio website built with HTML, CSS, and JavaScript.',
        technologies: ['HTML', 'CSS', 'JavaScript', 'Firebase'],
        github: 'https://github.com/almamun-cse/portfolio',
        demo: 'https://portfolio-almamun.web.app'
    },
    {
        id: 'sample2',
        title: 'E-commerce App',
        description: 'A full-featured e-commerce application with product listings and cart functionality.',
        technologies: ['React', 'Node.js', 'MongoDB', 'Express'],
        github: 'https://github.com/almamun-cse/ecommerce-app',
        demo: '#'
    },
    {
        id: 'sample3',
        title: 'Weather Dashboard',
        description: 'A weather dashboard that shows current and forecasted weather data.',
        technologies: ['JavaScript', 'API', 'Bootstrap', 'HTML/CSS'],
        github: 'https://github.com/almamun-cse/weather-app',
        demo: '#'
    }
];

// Function to load sample projects as fallback
// (keeping loadSampleProjects as is)

// Note: updateProjectsFromFirestore is replaced by setupProjectsListener and renderProjects

// Function to create a project card element
function createProjectCard(project, id, index = 0) {
    try {
        if (!project) {
            console.error('Project data is undefined or null');
            return document.createElement('div'); // Return empty div to avoid errors
        }
        
        // Validate project fields with defaults
        const validatedProject = {
            title: project.title || 'Untitled Project',
            description: project.description || 'No description available',
            technologies: Array.isArray(project.technologies) ? project.technologies : [],
            github: project.github || '#',
            demo: project.demo || '#',
            id: id || 'unknown'
        };
        
        const card = document.createElement('div');
        card.className = 'project-card neon-box-glow';
        card.setAttribute('data-id', validatedProject.id);

        // Log project data for debugging
        console.log('Creating project card:', {
            id: validatedProject.id,
            title: validatedProject.title,
            techCount: validatedProject.technologies.length
        });
        
        // No image display on project cards as per requirements

        card.innerHTML = `
            <div class="project-header">
                <h3>${validatedProject.title}</h3>
                <a href="pages/project-details.html?id=${validatedProject.id}" class="details-btn"><i class="fa-solid fa-circle-info"></i>&nbsp;Details</a>
            </div>
            <p>${validatedProject.description}</p>
            <div class="project-tech">
                ${validatedProject.technologies.map(tech => `<span>${tech}</span>`).join('')}
            </div>
            <div class="project-links">
                <a href="${validatedProject.github}" class="${validatedProject.github === '#' ? 'disabled-link' : ''}" ${validatedProject.github === '#' ? 'onclick="event.preventDefault(); alert(\'GitHub link not added yet\');"' : ''}><i class="fa-brands fa-github"></i> View Code</a>
                <a href="${validatedProject.demo}" class="${validatedProject.demo === '#' ? 'disabled-link' : ''}" ${validatedProject.demo === '#' ? 'onclick="event.preventDefault(); alert(\'Demo link not added yet\');"' : ''}><i class="fa-solid fa-arrow-up-right-from-square"></i> Live Demo</a>
            </div>
        `;

        return card;
    } catch (error) {
        console.error('Error creating project card:', error);
        const errorCard = document.createElement('div');
        errorCard.className = 'project-card neon-box-glow error-card';
        errorCard.innerHTML = `
            <div class="project-header">
                <h3>Error Loading Project</h3>
            </div>
            <p>There was an error loading this project. Please try refreshing the page.</p>
        `;
        return errorCard;
    }
}

// Function to update a project card with new data
function updateProjectCard(card, project) {
    const titleElement = card.querySelector('h3');
    const descriptionElement = card.querySelector('p');
    const techContainer = card.querySelector('.project-tech');
    const githubLink = card.querySelector('.project-links a:first-child');
    const demoLink = card.querySelector('.project-links a:last-child');

    if (titleElement) titleElement.textContent = project.title || 'Untitled Project';
    if (descriptionElement) descriptionElement.textContent = project.description || 'No description available';

    if (techContainer) {
        techContainer.innerHTML = '';
        if (Array.isArray(project.technologies)) {
            project.technologies.forEach(tech => {
                const span = document.createElement('span');
                span.textContent = tech;
                techContainer.appendChild(span);
            });
        }
    }

    if (githubLink) {
        githubLink.href = project.github || '#';
        if (!project.github || project.github === '#') {
            githubLink.classList.add('disabled-link');
            githubLink.setAttribute('onclick', "event.preventDefault(); alert('GitHub link not added yet');");
        } else {
            githubLink.classList.remove('disabled-link');
            githubLink.removeAttribute('onclick');
        }
    }

    if (demoLink) {
        demoLink.href = project.demo || '#';
        if (!project.demo || project.demo === '#') {
            demoLink.classList.add('disabled-link');
            demoLink.setAttribute('onclick', "event.preventDefault(); alert('Demo link not added yet');");
        } else {
            demoLink.classList.remove('disabled-link');
            demoLink.removeAttribute('onclick');
        }
    }
}

// Sample skills data as fallback
const sampleSkills = [
    { categoryName: 'Programming Languages', skillsList: [ 'Java', 'C++', 'C', 'C#', 'Dart','PHP'] },
    { categoryName: 'Technology & Framework', skillsList: [ 'Native Android (Java)', 'Flutter', 'XML', 'HTML5', 'CSS3', 'Git/GitHub'] },
    { categoryName: 'Databases', skillsList: ['MySQL', 'SQLite', 'Firebase', 'Hive'] },
    { categoryName: 'Tools & Platforms', skillsList: ['Google Colab', 'Android Studio', 'Visual Studio Code', 'CodeBlocks', 'Kaggle'] }
];

// Function to load sample skills as fallback
function loadSampleSkills() {
    const skillsContainer = document.querySelector('.skills-container');
    if (!skillsContainer) return;
    
    skillsContainer.innerHTML = '';
    
    sampleSkills.forEach(categoryData => {
        const newBox = document.createElement('div');
        newBox.className = 'skills-box neon-box-glow';
        newBox.innerHTML = `
            <i class="fas fa-tools"></i>
            <h3>${categoryData.categoryName}</h3>
            <div class="skills-content">
                ${categoryData.skillsList.map(skill => `<span>${skill}</span>`).join('')}
            </div>
        `;
        skillsContainer.appendChild(newBox);
    });
}

// Function to update skills from Firestore
async function updateSkillsFromFirestore(maxItems = 10) {
    try {
        console.log('Attempting to fetch skills from Firestore...');
        const skillsCollection = collection(db, 'skills');
        console.log('Skills collection reference created');
        const q = query(skillsCollection, orderBy("order", "asc"), maxItems ? limit(maxItems) : limit(100));
        console.log('Skills query created');
        const skillsSnapshot = await getDocs(q);
        console.log('Skills snapshot received, doc count:', skillsSnapshot.size);
        
        if (skillsSnapshot.empty) {
            console.log('No skills found in Firestore, loading sample skills');
            loadSampleSkills();
            return;
        }
        
        const skillsByCategory = new Map();
        skillsSnapshot.forEach(doc => {
            const skillData = doc.data();
            if (skillData.categoryName && skillData.skillsList) {
                skillsByCategory.set(skillData.categoryName, skillData.skillsList);
            }
        });
        
        const skillsContainer = document.querySelector('.skills-container');
        if (skillsContainer) skillsContainer.innerHTML = '';
        
        skillsByCategory.forEach((skills, category) => {
            const newBox = document.createElement('div');
            newBox.className = 'skills-box neon-box-glow';
            
            // Check if skills is an array of strings or objects with skillsOrder
            let skillsToRender = skills;
            
            // If we have a skillsOrder array, use it for ordering
            const skillData = skillsSnapshot.docs.find(doc => doc.data().categoryName === category)?.data();
            if (skillData && skillData.skillsOrder && Array.isArray(skillData.skillsOrder)) {
                // Use the skillsOrder array for ordering
                skillsToRender = skillData.skillsOrder.sort((a, b) => a.order - b.order).map(item => item.name);
            }
            
            newBox.innerHTML = `
                <i class="fas fa-tools"></i>
                <h3>${category}</h3>
                <div class="skills-content">
                    ${skillsToRender.map(skill => {
                        // Handle both string and object formats
                        const skillName = typeof skill === 'string' ? skill : skill.name;
                        return `<span>${skillName}</span>`;
                    }).join('')}
                </div>
            `;
            skillsContainer.appendChild(newBox);
        });
    } catch (error) {
        console.error('Error updating skills from Firestore:', error);
        loadSampleSkills();
    }
    // Update education from Firestore
    updateEducationFromFirestore();
}

// Sample education data as fallback
const sampleEducation = [
    { degree: 'B.Sc. in Computer Science & Engineering', institution: 'International University of Business Agriculture and Technology', location: 'Uttara, Dhaka, Bangladesh', gpa: 'CGPA: 3.87 / 4.00', status: 'Currently pursuing', year: '2022 – Present' },
    { degree: 'Higher Secondary Certificate', institution: 'Hatimara High School And Colllege', location: 'Gazipur, Bangladesh', gpa: 'GPA: 5.00 / 5.00', field: 'Group: Science', status: 'Completed', year: '2018 – 2020' }
];

// Function to load sample education as fallback
function loadSampleEducation() {
    const educationContainer = document.querySelector('.education-container');
    if (!educationContainer) return;
    
    educationContainer.innerHTML = '';
    
    sampleEducation.forEach((edu, index) => {
        const educationBox = document.createElement('div');
        educationBox.className = 'education-box neon-box-glow';
        educationBox.innerHTML = `
            <h3>${edu.degree}</h3>
            <h4>${edu.institution}</h4>
            <h5>${edu.location}</h5>
            ${edu.gpa ? `<p>${edu.gpa}</p>` : ''}
            ${edu.field ? `<p>${edu.field}</p>` : ''}
            ${edu.status ? `<p>${edu.status}</p>` : ''}
            <div class="year">${edu.year}</div>
        `;
        educationContainer.appendChild(educationBox);
        
        educationBox.style.animation = `fadeInUp 0.8s forwards ${0.2 + (index * 0.2)}s`;
    });
}

// Function to update education from Firestore
async function updateEducationFromFirestore(maxItems = 10) {
    try {
        console.log('Attempting to fetch education from Firestore...');
        const educationCollection = collection(db, 'education');
        console.log('Education collection reference created');
        const q = query(educationCollection, orderBy('order', 'asc'), maxItems ? limit(maxItems) : limit(100));
        console.log('Education query created');
        const educationSnapshot = await getDocs(q);
        console.log('Education snapshot received, doc count:', educationSnapshot.size);
        
        if (educationSnapshot.empty) {
            console.log('No education entries found in Firestore, loading sample education');
            loadSampleEducation();
            return;
        }
        
        const educationContainer = document.querySelector('.education-container');
        if (!educationContainer) return;
        
        educationContainer.innerHTML = '';
        
        educationSnapshot.forEach(doc => {
            const education = doc.data();
            const id = doc.id;
            
            const educationBox = document.createElement('div');
            educationBox.className = 'education-box neon-box-glow';
            educationBox.setAttribute('data-id', id);
            educationBox.innerHTML = `
                <h3>${education.degree}</h3>
                <h4>${education.institution}</h4>
                <h5>${education.location}</h5>
                ${education.gpa ? `<p>${education.gpa}</p>` : ''}
                ${education.field ? `<p>${education.field}</p>` : ''}
                ${education.status ? `<p>${education.status}</p>` : ''}
                <div class="year">${education.year}</div>
            `;
            educationContainer.appendChild(educationBox);
        });
        
        const educationBoxes = document.querySelectorAll('.education-box');
        educationBoxes.forEach((box, index) => {
            box.style.animation = `fadeInUp 0.8s forwards ${0.2 + (index * 0.2)}s`;
        });
    } catch (error) {
        console.error('Error updating education from Firestore:', error);
        loadSampleEducation();
    }
}