// Import Firebase modules
import { auth, db, signOut, onAuthStateChanged, collection, addDoc, getDocs, getDoc, doc, updateDoc, deleteDoc, query, where, onSnapshot, orderBy, limit } from './firebase-config.js';

// Confirmation Dialog Utility
const confirmDialog = {
    dialog: null,
    titleEl: null,
    messageEl: null,
    confirmBtn: null,
    cancelBtn: null,
    resolvePromise: null,
    
    init() {
        this.dialog = document.getElementById('confirmation-dialog');
        this.titleEl = document.getElementById('dialog-title');
        this.messageEl = document.getElementById('dialog-message');
        this.confirmBtn = document.getElementById('dialog-confirm');
        this.cancelBtn = document.getElementById('dialog-cancel');
        
        this.cancelBtn.addEventListener('click', () => {
            this.close(false);
        });
        
        this.confirmBtn.addEventListener('click', () => {
            this.close(true);
        });
    },
    
    show(title, message) {
        if (!this.dialog) this.init();
        
        this.titleEl.textContent = title;
        this.messageEl.textContent = message;
        this.dialog.style.display = 'block';
        
        return new Promise(resolve => {
            this.resolvePromise = resolve;
        });
    },
    
    close(result) {
        this.dialog.style.display = 'none';
        if (this.resolvePromise) {
            this.resolvePromise(result);
            this.resolvePromise = null;
        }
    }
};

// Function to clean up all Firestore listeners
function cleanupFirestoreListeners() {
    if (unsubscribeProjects) {
        unsubscribeProjects();
        unsubscribeProjects = null;
    }
    
    if (unsubscribeSkills) {
        unsubscribeSkills();
        unsubscribeSkills = null;
    }
    
    if (unsubscribeEducation) {
        unsubscribeEducation();
        unsubscribeEducation = null;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Mobile Navigation Toggle (copied from main script.js)
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
    
    // Image source toggle functionality
    const imageSourceToggle = document.getElementById('image-source-toggle');
    const imageUploadContainer = document.getElementById('image-upload-container');
    const imageUrlContainer = document.getElementById('image-url-container');
    
    if (imageSourceToggle) {
        imageSourceToggle.addEventListener('change', function() {
            if (this.checked) {
                // Show URL input, hide file upload
                imageUploadContainer.classList.add('hidden');
                imageUrlContainer.classList.remove('hidden');
            } else {
                // Show file upload, hide URL input
                imageUploadContainer.classList.remove('hidden');
                imageUrlContainer.classList.add('hidden');
            }
        });
    }
    
    // File input display functionality
    const fileInput = document.getElementById('project-image-file');
    const fileNameDisplay = document.getElementById('file-name-display');
    
    if (fileInput && fileNameDisplay) {
        fileInput.addEventListener('change', function() {
            if (this.files && this.files.length > 0) {
                if (this.files.length === 1) {
                    const file = this.files[0];
                    fileNameDisplay.textContent = file.name;
                    
                    // Validate file type and size
                    validateImageFile(file);
                } else {
                    fileNameDisplay.textContent = `${this.files.length} files selected`;
                    
                    // Validate each file
                    let allValid = true;
                    for (let i = 0; i < this.files.length; i++) {
                        if (!validateImageFile(this.files[i], false)) {
                            allValid = false;
                        }
                    }
                    
                    if (!allValid) {
                        confirmDialog.show('Validation Error', 'One or more files do not meet the requirements. Please check the file types and sizes.');
                    }
                }
            } else {
                fileNameDisplay.textContent = 'No files selected';
            }
        });
    }
    
    // Function to add an image URL input with optional initial value
    function addImageUrlInput(initialValue = '') {
        const imageUrlsContainer = document.getElementById('image-urls-container');
        if (!imageUrlsContainer) return;
        
        const newUrlGroup = document.createElement('div');
        newUrlGroup.className = 'image-url-input-group';
        newUrlGroup.innerHTML = `
            <input type="text" class="project-image-url neon-input" placeholder="https://example.com/image.jpg" value="${initialValue}">
            <button type="button" class="remove-url-btn btn"><i class="fas fa-times"></i></button>
        `;
        imageUrlsContainer.appendChild(newUrlGroup);
        
        // Add event listener to the remove button
        const removeBtn = newUrlGroup.querySelector('.remove-url-btn');
        removeBtn.addEventListener('click', function() {
            imageUrlsContainer.removeChild(newUrlGroup);
        });
        
        return newUrlGroup;
    }
    
    // Add image URL button functionality
    const addImageUrlBtn = document.getElementById('add-image-url-btn');
    const imageUrlsContainer = document.getElementById('image-urls-container');
    
    if (addImageUrlBtn && imageUrlsContainer) {
        addImageUrlBtn.addEventListener('click', function() {
            addImageUrlInput();
        });
        
        // Add event listener to the initial remove button
        const initialRemoveBtn = imageUrlsContainer.querySelector('.remove-url-btn');
        if (initialRemoveBtn) {
            initialRemoveBtn.addEventListener('click', function() {
                const inputGroup = this.closest('.image-url-input-group');
                const input = inputGroup.querySelector('.project-image-url');
                input.value = ''; // Just clear the input instead of removing the first group
            });
        }
    }
    
    // Clean up listeners when page is unloaded
    window.addEventListener('beforeunload', cleanupFirestoreListeners);

    // Admin Panel Navigation
    const adminNavItems = document.querySelectorAll('.admin-nav-item');
    const adminPanels = document.querySelectorAll('.admin-panel');

    adminNavItems.forEach(item => {
        item.addEventListener('click', () => {
            // Remove active class from all nav items and panels
            adminNavItems.forEach(navItem => navItem.classList.remove('active'));
            adminPanels.forEach(panel => panel.classList.remove('active'));
            
            // Add active class to clicked nav item and corresponding panel
            item.classList.add('active');
            const targetPanel = document.getElementById(item.dataset.target);
            if (targetPanel) {
                targetPanel.classList.add('active');
            }
        });
    });
    
    // Check authentication state when the page loads
    onAuthStateChanged(auth, (user) => {
        if (user) {
            // User is signed in
            console.log('User is signed in:', user.email);
            // Display user email in settings
            const adminEmailInput = document.getElementById('admin-email');
            if (adminEmailInput) {
                adminEmailInput.value = user.email;
            }
            // Initialize the dashboard
            initAdminDashboard();
        } else {
            // User is signed out, redirect to login
            console.log('User is signed out');
            window.location.href = 'login.html';
        }
    });

    // Initialize Firebase collections
    const projectsCollection = collection(db, 'projects');
    const skillsCollection = collection(db, 'skills');
    const educationCollection = collection(db, 'education');
    
    // Default data to use if Firestore collections are empty
    let projectsData = {
        '1': {
            title: 'AI Chatbot Assistant',
            description: 'A conversational AI assistant built with PyTorch and Transformer models that can answer questions, provide recommendations, and assist with various tasks.',
            fullDescription: `<p>This AI Chatbot Assistant is a sophisticated natural language processing system designed to provide human-like interactions and assistance across various domains. Built using state-of-the-art deep learning techniques, the chatbot can understand context, remember conversation history, and generate relevant, helpful responses.</p>
            <p>The system utilizes a transformer-based architecture similar to GPT models, with custom fine-tuning for specific use cases. It can be deployed as a web service, integrated into mobile applications, or used as an API for third-party integrations.</p>`,
            technologies: ['Python', 'PyTorch', 'Transformers', 'Flask', 'NLTK', 'SpaCy', 'Redis', 'Docker'],
            features: [
                'Natural language understanding with context awareness',
                'Multi-turn conversation memory',
                'Domain-specific knowledge integration',
                'Sentiment analysis for emotional intelligence',
                'Multi-language support',
                'Voice input/output capabilities',
                'Customizable personality and tone'
            ],
            challenges: [
                'Optimizing model size for real-time responses',
                'Handling ambiguous queries and clarification',
                'Ensuring factual accuracy and preventing hallucinations',
                'Implementing effective content filtering'
            ],
            images: ['project1-1.jpg', 'project1-2.jpg'],
            github: '#',
            demo: '#'
        },
        '2': {
            title: 'Health Tracker App',
            description: 'A mobile application that helps users track their fitness goals, nutrition intake, and overall health metrics with personalized recommendations.',
            fullDescription: `<p>The Health Tracker App is a comprehensive mobile solution designed to help users monitor and improve their overall health and wellness. The application combines fitness tracking, nutrition logging, sleep analysis, and personalized recommendations into a single, user-friendly interface.</p>
            <p>Built with Flutter for cross-platform compatibility, the app leverages Firebase for backend services and TensorFlow Lite for on-device machine learning capabilities. This architecture ensures data privacy while providing powerful insights and recommendations tailored to each user's unique health profile.</p>`,
            technologies: ['Flutter', 'Dart', 'Firebase', 'TensorFlow Lite', 'Cloud Functions', 'SQLite', 'Provider State Management'],
            features: [
                'Personalized workout plans based on user goals',
                'Nutrition tracking with barcode scanning',
                'Sleep quality analysis and recommendations',
                'Water intake monitoring',
                'Health metrics visualization with interactive charts',
                'Goal setting and progress tracking',
                'Social sharing and community challenges'
            ],
            challenges: [
                'Ensuring accurate calorie and nutrient calculations',
                'Optimizing battery usage for all-day tracking',
                'Creating intuitive UI for complex health data',
                'Implementing secure health data storage'
            ],
            images: ['project2-1.jpg', 'project2-2.jpg'],
            github: '#',
            demo: '#'
        },
        '3': {
            title: 'Smart Home Dashboard',
            description: 'A web-based dashboard for monitoring and controlling smart home devices with real-time data visualization and automated routines.',
            fullDescription: `<p>The Smart Home Dashboard is a comprehensive web application that serves as a central control hub for IoT devices throughout the home. It provides users with real-time monitoring, control capabilities, and automation tools for managing their smart home ecosystem.</p>
            <p>Built with React for the frontend and Node.js for the backend, the dashboard integrates with various IoT protocols (including MQTT, Zigbee, and Z-Wave) to communicate with a wide range of smart devices. The system uses MongoDB for data storage and includes advanced features like energy usage analytics, security monitoring, and customizable automation routines.</p>`,
            technologies: ['JavaScript', 'React', 'Node.js', 'MongoDB', 'MQTT', 'WebSockets', 'Chart.js', 'Material-UI'],
            features: [
                'Unified control interface for multiple device types',
                'Real-time device status monitoring',
                'Energy usage tracking and optimization suggestions',
                'Customizable automation routines and schedules',
                'Voice control integration (Alexa, Google Assistant)',
                'Mobile-responsive design for on-the-go control',
                'Multi-user access with permission levels'
            ],
            challenges: [
                'Ensuring compatibility with diverse IoT protocols',
                'Implementing secure device authentication',
                'Optimizing real-time data processing',
                'Creating intuitive automation tools for non-technical users'
            ],
            images: ['project3-1.jpg', 'project3-2.jpg'],
            github: '#',
            demo: '#'
        },
        '4': {
            title: 'Image Recognition System',
            description: 'A deep learning-based image recognition system that can identify objects, scenes, and faces with high accuracy using convolutional neural networks.',
            fullDescription: `<p>This Image Recognition System is a sophisticated computer vision solution capable of identifying and classifying various elements within digital images. Powered by deep learning algorithms, particularly convolutional neural networks (CNNs), the system can recognize objects, scenes, faces, and text with high accuracy.</p>
            <p>The core of the system is built with TensorFlow and Keras, utilizing transfer learning from pre-trained models like ResNet and EfficientNet to achieve excellent performance even with limited training data. OpenCV is used for image preprocessing and augmentation, while a Python Flask API enables easy integration with other applications.</p>`,
            technologies: ['Python', 'TensorFlow', 'OpenCV', 'Keras', 'NumPy', 'Flask', 'Docker', 'CUDA'],
            features: [
                'Multi-class object detection and classification',
                'Facial recognition with emotion analysis',
                'Scene understanding and context recognition',
                'Optical character recognition (OCR)',
                'Real-time video processing capabilities',
                'Customizable model training for specific domains',
                'REST API for third-party integration'
            ],
            challenges: [
                'Optimizing model performance for real-time processing',
                'Handling varying lighting conditions and image quality',
                'Ensuring privacy compliance for facial recognition',
                'Reducing false positives in complex scenes'
            ],
            images: ['project4-1.jpg', 'project4-2.jpg'],
            github: '#',
            demo: '#'
        },
        '5': {
            title: 'E-Commerce Platform',
            description: 'A full-featured e-commerce platform with product listings, shopping cart, payment processing, and admin dashboard for managing inventory and orders.',
            fullDescription: `<p>This E-Commerce Platform is a comprehensive online shopping solution designed to provide businesses with everything they need to sell products online. The platform includes both customer-facing storefronts and administrative tools for managing the business operations.</p>
            <p>Built with React for the frontend and Node.js (Express) for the backend, the platform uses MongoDB for flexible data storage. It includes features like secure payment processing, inventory management, order tracking, and analytics dashboards. The system is designed to be scalable, secure, and customizable for different business needs.</p>`,
            technologies: ['React', 'Node.js', 'Express', 'MongoDB', 'Redux', 'Stripe API', 'AWS S3', 'JWT Authentication'],
            features: [
                'Responsive product catalog with advanced filtering',
                'Secure user authentication and profile management',
                'Shopping cart and wishlist functionality',
                'Multiple payment gateway integrations',
                'Order tracking and history',
                'Admin dashboard for inventory and order management',
                'Analytics and sales reporting',
                'Email notification system'
            ],
            challenges: [
                'Implementing secure payment processing',
                'Optimizing database queries for large product catalogs',
                'Creating a responsive design for all device types',
                'Ensuring PCI compliance and data security'
            ],
            images: ['project5-1.jpg', 'project5-2.jpg'],
            github: '#',
            demo: '#'
        },
        '6': {
            title: 'Augmented Reality App',
            description: 'An AR application that overlays digital information on the real world, allowing users to interact with virtual objects in their physical environment.',
            fullDescription: `<p>This Augmented Reality App creates an immersive experience by overlaying digital content onto the real world through a mobile device's camera. Users can interact with virtual objects, access contextual information, and engage with their environment in new and innovative ways.</p>
            <p>Developed using Unity and C#, the application leverages ARCore (Android) and ARKit (iOS) to provide cross-platform functionality. The app includes features like surface detection, image tracking, and 3D object placement, creating a seamless blend between the digital and physical worlds.</p>`,
            technologies: ['Unity', 'C#', 'ARCore', 'ARKit', 'Blender', 'Shader Graph', 'Firebase', 'REST APIs'],
            features: [
                'Real-time surface detection and mapping',
                'Image and marker tracking capabilities',
                'Interactive 3D object placement and manipulation',
                'Physics-based interactions with virtual objects',
                'Location-based AR experiences',
                'Social sharing of AR creations',
                'Offline functionality for core features'
            ],
            challenges: [
                'Ensuring consistent tracking across different devices',
                'Optimizing 3D rendering for mobile performance',
                'Creating intuitive interactions for AR objects',
                'Handling varying lighting conditions and environments'
            ],
            images: ['project6-1.jpg', 'project6-2.jpg'],
            github: '#',
            demo: '#'
        }
    };

    // Default skills data to use if no data exists in Firestore
    let skillsData = {
        'Programming Languages': ['Python', 'Java', 'C++', 'C', 'C#', 'Dart', 'HTML5', 'CSS3'],
        'Python Libraries': ['TensorFlow', 'PyTorch', 'NumPy', 'Pandas', 'scikit-learn', 'HuggingFace Transformers'],
        'Databases': ['MySQL', 'SQLite', 'Firebase', 'MongoDB'],
        'Tools & Platforms': ['Google Colab', 'Android Studio', 'Flutter', 'Git & GitHub', 'Visual Studio Code', 'Jupyter Notebook']
    };
    
    // Default education data to use if no data exists in Firestore
    let educationData = {
        '1': {
            degree: 'B.Sc. in Computer Science & Engineering',
            institution: 'International University of Business Agriculture and Technology (IUBAT)',
            location: 'Dhaka, Bangladesh',
            gpa: 'CGPA: 3.87 / 4.00',
            field: '',
            status: 'Currently pursuing',
            year: '2022 – Present'
        },
        '2': {
            degree: 'Higher Secondary Certificate (HSC)',
            institution: 'Shafiuddin Sarkar Academy & College',
            location: 'Gazipur, Bangladesh',
            gpa: 'GPA: 5.00 / 5.00',
            field: 'Group: Science',
            status: '',
            year: '2018 – 2020'
        }
    };

    // Function to save data to Firestore is no longer needed as we're using individual save functions for each collection

    // Function to populate project table
async function populateProjectTable() {
    const tableBody = document.getElementById('project-table-body');
    if (!tableBody) return;
    
    // Clear the table body before populating
    tableBody.innerHTML = '';
    
    try {
        // Get projects sorted by order field
        const projectEntries = Object.entries(projectsData);
        
        // Sort by order field if it exists, otherwise use index
        projectEntries.sort((a, b) => {
            const orderA = a[1].order !== undefined ? a[1].order : Number.MAX_SAFE_INTEGER;
            const orderB = b[1].order !== undefined ? b[1].order : Number.MAX_SAFE_INTEGER;
            return orderA - orderB;
        });
        
        projectEntries.forEach(([id, project], index) => {
            const row = document.createElement('tr');
            row.setAttribute('data-id', id);
            
            const techList = project.technologies.slice(0, 3).join(', ') + 
                (project.technologies.length > 3 ? '...' : '');
            
            // Add drag handle and use order number instead of index
            row.innerHTML = `
                <td class="drag-handle"><i class="fas fa-grip-vertical"></i></td>
                <td>${project.title}</td>
                <td>${techList}</td>
                <td>
                    <button class="edit-btn" data-id="${id}"><i class="fas fa-edit"></i></button>
                    <button class="delete-btn" data-id="${id}"><i class="fas fa-trash"></i></button>
                </td>
            `;
            
            tableBody.appendChild(row);
        });
            
            // Use event delegation for edit and delete buttons
            // Remove any existing event listener
            if (tableBody._hasProjectListeners) {
                tableBody.removeEventListener('click', tableBody._projectClickHandler);
            }
            
            // Define the click handler function
            tableBody._projectClickHandler = function(e) {
                const target = e.target.closest('.edit-btn, .delete-btn');
                if (!target) return;
                
                const id = target.dataset.id;
                
                if (target.classList.contains('edit-btn')) {
                    editProject(id);
                } else if (target.classList.contains('delete-btn')) {
                    confirmDialog.show('Delete Project', 'Are you sure you want to delete this project?').then(confirmed => {
                        if (confirmed) {
                            deleteProject(id);
                        }
                    });
                }
            };
            
            // Add the event listener to the table body
            tableBody.addEventListener('click', tableBody._projectClickHandler);
            tableBody._hasProjectListeners = true;
        } catch (error) {
            console.error('Error getting projects: ', error);
        }
    }

    // Function to populate skill categories
async function populateSkillCategories() {
    const categoriesList = document.getElementById('skill-categories-list');
    if (!categoriesList) return;
    
    // Clear the categories list before populating
    categoriesList.innerHTML = '';
    
    try {
        // Get all skill categories with their document IDs
        const categoryDocs = [];
        const q = query(skillsCollection);
        const querySnapshot = await getDocs(q);
        
        querySnapshot.forEach(doc => {
            categoryDocs.push({
                id: doc.id,
                categoryName: doc.data().categoryName,
                order: doc.data().order
            });
        });
        
        // Sort by order field if it exists
        categoryDocs.sort((a, b) => {
            const orderA = a.order !== undefined ? a.order : Number.MAX_SAFE_INTEGER;
            const orderB = b.order !== undefined ? b.order : Number.MAX_SAFE_INTEGER;
            return orderA - orderB;
        });
        
        categoryDocs.forEach(categoryDoc => {
            const li = document.createElement('li');
            li.setAttribute('data-id', categoryDoc.id);
            li.innerHTML = `
                <span class="drag-handle"><i class="fas fa-grip-vertical"></i></span>
                <span class="category-name">${categoryDoc.categoryName}</span>
                <button class="delete-category-btn" data-category="${categoryDoc.categoryName}" data-id="${categoryDoc.id}">
                    <i class="fas fa-times"></i>
                </button>
            `;
            
            // Add click event to the category name span
            const categoryNameSpan = li.querySelector('.category-name');
            categoryNameSpan.addEventListener('click', () => selectSkillCategory(categoryDoc.categoryName));
            
            categoriesList.appendChild(li);
        });
        
        // Use event delegation for delete buttons
        // Remove any existing event listener
        if (categoriesList._hasCategoryListeners) {
            categoriesList.removeEventListener('click', categoriesList._categoryClickHandler);
        }
        
        // Define the click handler function
        categoriesList._categoryClickHandler = function(e) {
            const target = e.target.closest('.delete-category-btn');
            if (!target) return;
            
            const category = target.dataset.category;
            
            confirmDialog.show('Delete Category', `Are you sure you want to delete the category "${category}" and all its skills?`).then(confirmed => {
                if (confirmed) {
                    deleteSkillCategory(category);
                }
            });
        };
        
        // Add the event listener to the categories list
        categoriesList.addEventListener('click', categoriesList._categoryClickHandler);
        categoriesList._hasCategoryListeners = true;
        
        } catch (error) {
            console.error('Error getting skill categories:', error);
        }
    }

    // Function to populate skills for a category
async function populateSkills(category) {
    const skillsList = document.getElementById('skills-list');
    const currentCategory = document.getElementById('current-category');
    if (!skillsList || !currentCategory) return;
    
    currentCategory.textContent = category;
    
    // Clear the skills list before populating
    skillsList.innerHTML = '';
    
    try {
        // Find the document for this category
        let docId = '';
        let skillsWithOrder = [];
        
        const q = query(skillsCollection, where("categoryName", "==", category));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
            console.log(`No skills found for category: ${category}`);
            return;
        }
        
        querySnapshot.forEach(doc => {
            docId = doc.id;
            const data = doc.data();
            
            // Get skills with their order information if available
            if (data.skillsOrder && Array.isArray(data.skillsOrder)) {
                // If we have order information, use it
                skillsWithOrder = data.skillsOrder;
            } else {
                // Otherwise create order information from the skills list
                skillsWithOrder = (data.skillsList || []).map((skill, index) => ({
                    name: skill,
                    order: index
                }));
            }
        });
        
        // Sort skills by order
        skillsWithOrder.sort((a, b) => a.order - b.order);
        
        skillsWithOrder.forEach((skillObj, index) => {
            const skill = typeof skillObj === 'string' ? skillObj : skillObj.name;
            const li = document.createElement('li');
            li.setAttribute('data-skill', skill);
            li.setAttribute('data-index', index);
            li.innerHTML = `
                <span class="drag-handle"><i class="fas fa-grip-vertical"></i></span>
                <span class="skill-name">${skill}</span>
                <button class="delete-skill-btn" data-category="${category}" data-skill="${skill}" data-docid="${docId}">
                    <i class="fas fa-times"></i>
                </button>
            `;
            skillsList.appendChild(li);
        });
            
            // Use event delegation for delete buttons
            // Remove any existing event listener
            if (skillsList._hasSkillListeners) {
                skillsList.removeEventListener('click', skillsList._skillClickHandler);
            }
            
            // Define the click handler function
            skillsList._skillClickHandler = function(e) {
                const target = e.target.closest('.delete-skill-btn');
                if (!target) return;
                
                const category = target.dataset.category;
                const skill = target.dataset.skill;
                const docId = target.dataset.docid;
                
                confirmDialog.show('Delete Skill', `Are you sure you want to delete the skill "${skill}"?`).then(confirmed => {
                    if (confirmed) {
                        deleteSkill(category, skill, docId);
                    }
                });
            };
            
            // Add the event listener to the skills list
            skillsList.addEventListener('click', skillsList._skillClickHandler);
            skillsList._hasSkillListeners = true;
        } catch (error) {
            console.error('Error getting skills:', error);
        }
    }

    // Function to select a skill category
    function selectSkillCategory(category) {
        document.querySelectorAll('#skill-categories-list li').forEach(li => {
            li.classList.remove('active');
            if (li.textContent === category) {
                li.classList.add('active');
            }
        });
        
        populateSkills(category);
    }

    // Function to delete a skill category and all its skills
    async function deleteSkillCategory(category) {
        try {
            // Find the document for this category
            const q = query(skillsCollection, where("categoryName", "==", category));
            const querySnapshot = await getDocs(q);
            
            if (querySnapshot.empty) {
                console.error('Category not found');
                confirmDialog.show('Error', 'Skill category not found. It may have been deleted already.');
                return;
            }
            
            // Delete the category document
            let docId;
            querySnapshot.forEach(doc => {
                docId = doc.id;
            });
            
            if (docId) {
                await deleteDoc(doc(db, 'skills', docId));
                
                // Update the cached skillsData
                delete skillsData[category];
                
                // Refresh the categories list
                await populateSkillCategories();
                
                // Clear the skills list if the current category was deleted
                const currentCategory = document.getElementById('current-category');
                if (currentCategory && currentCategory.textContent === category) {
                    const skillsList = document.getElementById('skills-list');
                    if (skillsList) skillsList.innerHTML = '';
                    currentCategory.textContent = 'Select a category';
                }
                
                // Success message removed
            }
        } catch (error) {
            console.error('Error deleting category:', error);
            confirmDialog.show('Error', `Failed to delete category: ${error.message}. Please try again.`);
        }
    }
    
    // Function to add a new skill category
    async function addSkillCategory() {
        const newCategoryInput = document.getElementById('new-category-name');
        if (!newCategoryInput) return;
        
        const categoryName = newCategoryInput.value.trim();
        if (!categoryName) return;
        
        try {
            // Check if category already exists
            const q = query(skillsCollection, where("categoryName", "==", categoryName));
            const querySnapshot = await getDocs(q);
            
            if (!querySnapshot.empty) {
                confirmDialog.show('Error', 'Category already exists!');
                return;
            }
            
            // Get the current count of skill categories to set the order field
            const skillCategoriesQuery = query(skillsCollection);
            const skillCategoriesSnapshot = await getDocs(skillCategoriesQuery);
            
            // Add new category to Firestore with order field
            await addDoc(skillsCollection, {
                categoryName,
                skillsList: [],
                createdAt: new Date(),
                order: skillCategoriesSnapshot.size
            });
            
            await populateSkillCategories();
            selectSkillCategory(categoryName);
            newCategoryInput.value = '';
            
            // No success message, just update the UI
        } catch (error) {
            console.error('Error adding category:', error);
            confirmDialog.show('Error', `Failed to add category: ${error.message}. Please try again.`);
        }
    }

    // Function to add a new skill to a category
    async function addSkill() {
        const newSkillInput = document.getElementById('new-skill-name');
        const currentCategory = document.getElementById('current-category');
        if (!newSkillInput || !currentCategory) return;
        
        const skillNamesInput = newSkillInput.value.trim();
        const category = currentCategory.textContent;
        
        if (!skillNamesInput || !category) return;
        
        // Store the active category to maintain state after update
        const activeCategory = category;
        
        // Split input by commas and clean up each skill name
        const skillNamesArray = skillNamesInput.split(',')
            .map(name => name.trim())
            .filter(name => name.length > 0);
        
        if (skillNamesArray.length === 0) return;
        
        try {
            // Get the document for this category
            const q = query(skillsCollection, where("categoryName", "==", category));
            const querySnapshot = await getDocs(q);
            
            let docId;
            let existingSkills = [];
            let newSkills = [];
            let duplicateSkills = [];
            
            if (querySnapshot.empty) {
                // Create new category with these skills
                await addDoc(skillsCollection, {
                    categoryName: category,
                    skillsList: skillNamesArray,
                    createdAt: new Date()
                });
                newSkills = skillNamesArray;
            } else {
                // Update existing category
                querySnapshot.forEach(doc => {
                    docId = doc.id;
                    existingSkills = doc.data().skillsList || [];
                });
                
                // Check for duplicates and add only new skills
                skillNamesArray.forEach(skillName => {
                    if (existingSkills.includes(skillName)) {
                        duplicateSkills.push(skillName);
                    } else {
                        newSkills.push(skillName);
                        existingSkills.push(skillName);
                    }
                });
                
                if (newSkills.length === 0) {
                    const duplicateMessage = duplicateSkills.length === 1 
                        ? `Skill "${duplicateSkills[0]}" already exists` 
                        : `All skills already exist`;
                    confirmDialog.show('Error', `${duplicateMessage} in the ${category} category!`);
                    return;
                }
                
                const docRef = doc(db, 'skills', docId);
                
                // Get existing skillsOrder if it exists
                const docSnap = await getDoc(docRef);
                const data = docSnap.data();
                let updateData = {
                    skillsList: existingSkills,
                    updatedAt: new Date()
                };
                
                // Update skillsOrder if it exists
                if (data.skillsOrder && Array.isArray(data.skillsOrder)) {
                    const skillsOrder = [...data.skillsOrder];
                    // Add new skills to skillsOrder
                    newSkills.forEach(skillName => {
                        skillsOrder.push({
                            name: skillName,
                            order: skillsOrder.length
                        });
                    });
                    updateData.skillsOrder = skillsOrder;
                }
                
                await updateDoc(docRef, updateData);
            }
            
            // Clear the input field
            newSkillInput.value = '';
            
            // Re-select the active category to maintain state
            await populateSkillCategories();
            selectSkillCategory(activeCategory);
            
            // Only show error messages for duplicates if that's all we have
            if (duplicateSkills.length > 0 && newSkills.length === 0) {
                const duplicateMessage = duplicateSkills.length === 1 
                    ? `Note: "${duplicateSkills[0]}" was skipped as it already exists.`
                    : `Note: ${duplicateSkills.length} skills were skipped as they already exist.`;
                confirmDialog.show('Error', duplicateMessage);
            }
        } catch (error) {
            console.error('Error adding skill:', error);
            confirmDialog.show('Error', `Failed to add skill: ${error.message}. Please try again.`);
        }
    }

    // Function to delete a skill from a category
    async function deleteSkill(category, skill, docId) {
        try {
            const docRef = doc(db, 'skills', docId);
            const docSnap = await getDoc(docRef);
            
            if (!docSnap.exists()) {
                console.error('Document not found');
                confirmDialog.show('Error', 'Skill category not found. It may have been deleted already.');
                return;
            }
            
            const data = docSnap.data();
            const skills = data.skillsList || [];
            const updatedSkills = skills.filter(s => s !== skill);
            
            // Also update the skillsOrder array if it exists
            let updateData = {
                skillsList: updatedSkills,
                updatedAt: new Date()
            };
            
            if (data.skillsOrder && Array.isArray(data.skillsOrder)) {
                const updatedSkillsOrder = data.skillsOrder.filter(s => s.name !== skill);
                // Reindex the order values
                updatedSkillsOrder.forEach((s, index) => {
                    s.order = index;
                });
                updateData.skillsOrder = updatedSkillsOrder;
            }
            
            await updateDoc(docRef, updateData);
            
            await populateSkills(category);
        } catch (error) {
            console.error('Error deleting skill:', error);
            confirmDialog.show('Error', `Failed to delete skill: ${error.message}. Please try again.`);
        }
    }

    // Function to show the project form for adding a new project
    function showAddProjectForm() {
        const formContainer = document.getElementById('project-form-container');
        const formTitle = document.getElementById('project-form-title');
        const form = document.getElementById('project-form');
        
        if (!formContainer || !formTitle || !form) return;
        
        formTitle.textContent = 'Add New Project';
        form.reset();
        document.getElementById('project-id').value = '';
        
        // We don't need to generate an ID as Firestore will do this for us
        // when we add a new document
        
        formContainer.classList.remove('hidden');
    }

    // Function to edit an existing project
    async function editProject(projectId) {
        try {
            // Get the project from Firestore
            const projectDoc = doc(db, 'projects', projectId);
            const projectSnapshot = await getDoc(projectDoc);
            
            if (!projectSnapshot.exists()) {
                console.error('Project not found');
                confirmDialog.show('Error', 'Project not found');
                return;
            }
            
            const project = projectSnapshot.data();
            
            const formContainer = document.getElementById('project-form-container');
            const formTitle = document.getElementById('project-form-title');
            const form = document.getElementById('project-form');
            
            if (!formContainer || !formTitle || !form) return;
            
            formTitle.textContent = 'Edit Project';
            
            // Fill the form with project data
            document.getElementById('project-id').value = projectId;
            document.getElementById('project-title').value = project.title;
            document.getElementById('project-description').value = project.description;
            document.getElementById('project-full-description').value = project.fullDescription;
            document.getElementById('project-technologies').value = project.technologies.join(', ');
            document.getElementById('project-features').value = project.features.join('\n');
            document.getElementById('project-challenges').value = project.challenges.join('\n');
            document.getElementById('project-github').value = project.github;
            document.getElementById('project-demo').value = project.demo;
            
            // Clear any existing URL inputs except the first one
            const imageUrlsContainer = document.getElementById('image-urls-container');
            if (imageUrlsContainer) {
                while (imageUrlsContainer.children.length > 1) {
                    imageUrlsContainer.removeChild(imageUrlsContainer.lastChild);
                }
                
                // Clear the first URL input
                const firstUrlInput = imageUrlsContainer.querySelector('.project-image-url');
                if (firstUrlInput) {
                    firstUrlInput.value = '';
                }
            }
            
            // Handle image URLs
            let imageUrls = [];
            if (project.imageUrls && project.imageUrls.length > 0) {
                imageUrls = project.imageUrls;
            } else if (project.imageUrl) {
                // For backward compatibility
                imageUrls = [project.imageUrl];
            }
            
            if (imageUrls.length > 0) {
                // Set the toggle to URL mode
                const imageSourceToggle = document.getElementById('image-source-toggle');
                if (imageSourceToggle) {
                    imageSourceToggle.checked = true;
                    // Trigger the change event to update UI
                    const event = new Event('change');
                    imageSourceToggle.dispatchEvent(event);
                }
                
                // Set the first image URL in the existing input
                const firstUrlInput = document.querySelector('.project-image-url');
                if (firstUrlInput) {
                    firstUrlInput.value = imageUrls[0];
                }
                
                // Add additional URL inputs for the rest of the URLs
                for (let i = 1; i < imageUrls.length; i++) {
                    addImageUrlInput(imageUrls[i]);
                }
            } else {
                // Set the toggle to Upload mode
                const imageSourceToggle = document.getElementById('image-source-toggle');
                if (imageSourceToggle) {
                    imageSourceToggle.checked = false;
                    // Trigger the change event to update UI
                    const event = new Event('change');
                    imageSourceToggle.dispatchEvent(event);
                }
            }
            
            formContainer.classList.remove('hidden');
        } catch (error) {
            console.error('Error editing project:', error);
            confirmDialog.show('Error', 'Error loading project data. Please try again.');
        }
    }

    // Function to validate image file type and size
    function validateImageFile(file) {
        // Check file type
        const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            confirmDialog.show('Upload Error', 'Invalid file type. Please select a JPG, PNG, or WebP image.');
            return false;
        }
        
        // Check file size (2MB = 2 * 1024 * 1024 bytes)
        const maxSize = 2 * 1024 * 1024;
        if (file.size > maxSize) {
            confirmDialog.show('Upload Error', 'File size exceeds 2MB limit. Please select a smaller image.');
            return false;
        }
        
        return true;
    }
    
    // Function to save a project (add or update)
    async function saveProject(e) {
        e.preventDefault();
        
        try {
            const projectId = document.getElementById('project-id').value;
            const title = document.getElementById('project-title').value;
            const description = document.getElementById('project-description').value;
            const fullDescription = document.getElementById('project-full-description').value;
            const technologies = document.getElementById('project-technologies').value.split(',').map(tech => tech.trim());
            const features = document.getElementById('project-features').value.split('\n').filter(feature => feature.trim());
            const challenges = document.getElementById('project-challenges').value.split('\n').filter(challenge => challenge.trim());
            // Get GitHub and Demo URLs
            let github = document.getElementById('project-github').value.trim();
            let demo = document.getElementById('project-demo').value.trim();
            
            // Validate URLs if provided
            const urlPattern = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/;
            
            // If GitHub URL is provided but invalid, show error
            if (github && !urlPattern.test(github)) {
                confirmDialog.show('Validation Error', 'Please enter a valid GitHub URL or leave it empty');
                return;
            }
            
            // If Demo URL is provided but invalid, show error
            if (demo && !urlPattern.test(demo)) {
                confirmDialog.show('Validation Error', 'Please enter a valid Demo URL or leave it empty');
                return;
            }
            
            // Set default value if empty
            github = github || '#';
            demo = demo || '#';
            
            // Handle image upload or URL
            let imageUrls = [];
            const isImageUrlMode = document.getElementById('image-source-toggle').checked;
            
            if (!isImageUrlMode) {
                // Upload Images mode
                const fileInput = document.getElementById('project-image-file');
                const files = fileInput.files;
                
                if (files && files.length > 0) {
                    // Validate all files before uploading
                    let allValid = true;
                    for (let i = 0; i < files.length; i++) {
                        if (!validateImageFile(files[i], false)) {
                            allValid = false;
                            break;
                        }
                    }
                    
                    if (!allValid) {
                        confirmDialog.show('Validation Error', 'One or more files do not meet the requirements. Please check the file types and sizes.');
                        return;
                    }
                    
                    try {
                        // Show loading indicator
                        const saveButton = document.querySelector('#project-form button[type="submit"]');
                        const originalText = saveButton.textContent;
                        saveButton.textContent = `Uploading ${files.length} image${files.length > 1 ? 's' : ''}...`;
                        saveButton.disabled = true;
                        
                        // Upload all files to Cloudinary concurrently
                        const uploadPromises = [];
                        
                        for (let i = 0; i < files.length; i++) {
                            const formData = new FormData();
                            formData.append('file', files[i]);
                            formData.append('upload_preset', 'my-portfolio-uploads');
                            formData.append('cloud_name', 'dyiw0azly');
                            
                            const uploadPromise = fetch('https://api.cloudinary.com/v1_1/dyiw0azly/image/upload', {
                                method: 'POST',
                                body: formData
                            }).then(response => {
                                if (!response.ok) {
                                    throw new Error(`Cloudinary upload failed with status: ${response.status}`);
                                }
                                return response.json();
                            }).then(data => data.secure_url);
                            
                            uploadPromises.push(uploadPromise);
                        }
                        
                        // Wait for all uploads to complete
                        imageUrls = await Promise.all(uploadPromises);
                        console.log('Files uploaded successfully to Cloudinary. URLs:', imageUrls);
                        
                        // Reset button
                        saveButton.textContent = originalText;
                        saveButton.disabled = false;
                    } catch (uploadError) {
                        console.error('Error uploading files to Cloudinary:', uploadError);
                        confirmDialog.show('Upload Error', 'Failed to upload images to Cloudinary. Please try again or use image URLs instead.');
                        
                        // Reset button if there was an error
                        const saveButton = document.querySelector('#project-form button[type="submit"]');
                        if (saveButton.textContent.includes('Uploading')) {
                            saveButton.textContent = 'Save Project';
                            saveButton.disabled = false;
                        }
                        return;
                    }
                }
            } else {
                // Image URLs mode
                const urlInputs = document.querySelectorAll('.project-image-url');
                
                for (let i = 0; i < urlInputs.length; i++) {
                    const url = urlInputs[i].value.trim();
                    
                    // Skip empty URLs
                    if (!url) continue;
                    
                    // Validate the image URL
                    if (!urlPattern.test(url)) {
                        confirmDialog.show('Validation Error', `Please enter a valid image URL or leave it empty (URL #${i+1})`);
                        return;
                    }
                    
                    imageUrls.push(url);
                }
            }
            
            const projectData = {
                title,
                description,
                fullDescription,
                technologies,
                features,
                challenges,
                github,
                demo,
                updatedAt: new Date()
            };
            
            // Add imageUrls to projectData if they exist
            if (imageUrls.length > 0) {
                projectData.imageUrls = imageUrls;
                
                // For backward compatibility, set the first image as imageUrl
                projectData.imageUrl = imageUrls[0];
            }
            
            if (projectId) {
                // Update existing project
                const projectDoc = doc(db, 'projects', projectId);
                // Get existing project data
                const snapshot = await getDoc(projectDoc);
                
                // If no new images were provided, keep the existing ones
                if (imageUrls.length === 0 && snapshot.exists()) {
                    if (snapshot.data().imageUrls) {
                        projectData.imageUrls = snapshot.data().imageUrls;
                    } else if (snapshot.data().imageUrl) {
                        // Convert old single imageUrl to imageUrls array
                        projectData.imageUrls = [snapshot.data().imageUrl];
                        projectData.imageUrl = snapshot.data().imageUrl;
                    }
                }
                
                // Preserve the images array if it exists (for backward compatibility)
                if (snapshot.exists()) {
                    projectData.images = snapshot.data().images || [`project-${projectId}.jpg`];
                } else {
                    projectData.images = [`project-${projectId}.jpg`];
                }
                
                await updateDoc(projectDoc, projectData);
            } else {
                // Add new project
                projectData.createdAt = new Date();
                projectData.images = ['project-default.jpg']; // For backward compatibility
                
                // If no images were provided, set a default
                if (imageUrls.length === 0) {
                    projectData.imageUrls = [];
                }
                
                // Get the current count of projects to set the order field
                const projectsQuery = query(projectsCollection);
                const projectsSnapshot = await getDocs(projectsQuery);
                projectData.order = projectsSnapshot.size;
                
                await addDoc(projectsCollection, projectData);
            }
            
            // Update the UI
            await populateProjectTable();
            
            // Hide the form
            document.getElementById('project-form-container').classList.add('hidden');
        } catch (error) {
            console.error('Error saving project:', error);
            confirmDialog.show('Error', 'Error saving project. Please try again.');
        }
    }

    // Function to delete a project
    async function deleteProject(projectId) {
        try {
            const projectDoc = doc(db, 'projects', projectId);
            const projectSnapshot = await getDoc(projectDoc);
            
            if (!projectSnapshot.exists()) {
                console.error('Project not found');
                confirmDialog.show('Error', 'Project not found. It may have been deleted already.');
                return;
            }
            
            // Delete from Firestore
            await deleteDoc(projectDoc);
            
            // Update the UI
            await populateProjectTable();
            
            // Show success message
            const projectData = projectSnapshot.data();
            const projectTitle = projectData.title || 'Unknown';
            confirmDialog.show('Success', `Project "${projectTitle}" has been successfully deleted.`);
        } catch (error) {
            console.error('Error deleting project:', error);
            confirmDialog.show('Error', `Failed to delete project: ${error.message}. Please try again.`);
        }
    }

    // Function to save settings
    function saveSettings() {
        alert('Password changes are managed through Firebase Authentication. Please contact the administrator for password resets.');
    }
    
    // Function to logout
    async function logout() {
        try {
            await signOut(auth);
            sessionStorage.removeItem('adminLoggedIn');
            sessionStorage.removeItem('adminEmail');
            window.location.href = 'login.html';
        } catch (error) {
            console.error('Error signing out:', error);
            alert('Error signing out. Please try again.');
        }
    }

    // Function to populate education table
async function populateEducationTable() {
    const tableBody = document.getElementById('education-table-body');
    if (!tableBody) return;
    
    // Clear the table body before populating
    tableBody.innerHTML = '';
    
    try {
        // Get education entries sorted by order field
        const educationEntries = Object.entries(educationData);
        
        // Sort by order field if it exists, otherwise use index
        educationEntries.sort((a, b) => {
            const orderA = a[1].order !== undefined ? a[1].order : Number.MAX_SAFE_INTEGER;
            const orderB = b[1].order !== undefined ? b[1].order : Number.MAX_SAFE_INTEGER;
            return orderA - orderB;
        });
        
        educationEntries.forEach(([id, education], index) => {
            const row = document.createElement('tr');
            row.setAttribute('data-id', id);
            
            // Add drag handle and use order number instead of index
            row.innerHTML = `
                <td class="drag-handle"><i class="fas fa-grip-vertical"></i></td>
                <td>${education.degree}</td>
                <td>${education.institution}</td>
                <td>
                    <button class="edit-education-btn" data-id="${id}"><i class="fas fa-edit"></i></button>
                    <button class="delete-education-btn" data-id="${id}"><i class="fas fa-trash"></i></button>
                </td>
            `;
            
            tableBody.appendChild(row);
        });
            
            // Use event delegation for edit and delete buttons
            // Remove any existing event listener
            if (tableBody._hasEducationListeners) {
                tableBody.removeEventListener('click', tableBody._educationClickHandler);
            }
            
            // Define the click handler function
            tableBody._educationClickHandler = function(e) {
                const target = e.target.closest('.edit-education-btn, .delete-education-btn');
                if (!target) return;
                
                const id = target.dataset.id;
                
                if (target.classList.contains('edit-education-btn')) {
                    editEducation(id);
                } else if (target.classList.contains('delete-education-btn')) {
                    confirmDialog.show('Delete Education', 'Are you sure you want to delete this education entry?').then(confirmed => {
                        if (confirmed) {
                            deleteEducation(id);
                        }
                    });
                }
            };
            
            // Add the event listener to the table body
            tableBody.addEventListener('click', tableBody._educationClickHandler);
            tableBody._hasEducationListeners = true;
        } catch (error) {
            console.error('Error getting education data:', error);
        }
    }
    
    // Function to show the education form for adding a new education entry
    function showAddEducationForm() {
        const formContainer = document.getElementById('education-form-container');
        const formTitle = document.getElementById('education-form-title');
        const form = document.getElementById('education-form');
        
        if (!formContainer || !formTitle || !form) return;
        
        formTitle.textContent = 'Add New Education';
        form.reset();
        
        // Generate a new ID (max ID + 1)
        const ids = Object.keys(educationData).map(id => parseInt(id));
        const newId = ids.length > 0 ? Math.max(...ids) + 1 : 1;
        document.getElementById('education-id').value = newId;
        
        formContainer.classList.remove('hidden');
    }
    
    // Function to edit an education entry
    async function editEducation(id) {
        const formContainer = document.getElementById('education-form-container');
        const formTitle = document.getElementById('education-form-title');
        const form = document.getElementById('education-form');
        
        if (!formContainer || !formTitle || !form) return;
        
        try {
            const educationDoc = doc(db, 'education', id);
            const educationSnapshot = await getDoc(educationDoc);
            
            if (!educationSnapshot.exists()) {
                console.error('Education document not found');
                return;
            }
            
            const education = educationSnapshot.data();
            formTitle.textContent = 'Edit Education';
            
            document.getElementById('education-id').value = id;
            document.getElementById('education-degree').value = education.degree;
            document.getElementById('education-institution').value = education.institution;
            document.getElementById('education-location').value = education.location;
            document.getElementById('education-gpa').value = education.gpa.replace(/^(CGPA|GPA): /, '');
            document.getElementById('education-field').value = education.field.replace(/^Group: /, '');
            document.getElementById('education-status').value = education.status;
            document.getElementById('education-year').value = education.year;
            
            formContainer.classList.remove('hidden');
        } catch (error) {
            console.error('Error editing education:', error);
            alert('Error loading education data. Please try again.');
        }
    }
    
    // Function to delete an education entry
    async function deleteEducation(id) {
        try {
            const educationDoc = doc(db, 'education', id);
            const educationSnapshot = await getDoc(educationDoc);
            
            if (!educationSnapshot.exists()) {
                console.error('Education entry not found');
                confirmDialog.show('Error', 'Education entry not found. It may have been deleted already.');
                return;
            }
            
            // Get education data for success message
            const educationData = educationSnapshot.data();
            const degreeName = educationData.degree || 'Unknown';
            const institutionName = educationData.institution || 'Unknown';
            
            // Delete from Firestore
            await deleteDoc(educationDoc);
            
            // Update the UI
            await populateEducationTable();
            
            // Show success message
            confirmDialog.show('Success', `Education entry "${degreeName} at ${institutionName}" has been successfully deleted.`);
        } catch (error) {
            console.error('Error deleting education:', error);
            confirmDialog.show('Error', `Failed to delete education entry: ${error.message}. Please try again.`);
        }
    }
    
    // Function to save an education entry (add or update)
    async function saveEducation(e) {
        e.preventDefault();
        
        try {
            const educationId = document.getElementById('education-id').value;
            const degree = document.getElementById('education-degree').value;
            const institution = document.getElementById('education-institution').value;
            const location = document.getElementById('education-location').value;
            const gpa = document.getElementById('education-gpa').value;
            const field = document.getElementById('education-field').value;
            const status = document.getElementById('education-status').value;
            const year = document.getElementById('education-year').value;
            
            const educationData = {
                degree,
                institution,
                location,
                gpa: gpa ? (gpa.includes('/') ? `${gpa.includes('CGPA') ? 'CGPA' : 'GPA'}: ${gpa}` : `${gpa.includes('CGPA') ? 'CGPA' : 'GPA'}: ${gpa}`) : '',
                field: field ? (field.includes('Group') ? field : `Group: ${field}`) : '',
                status,
                year,
                updatedAt: new Date()
            };
            
            if (educationId) {
                // Update existing education
                const educationDoc = doc(db, 'education', educationId);
                await updateDoc(educationDoc, educationData);
            } else {
                // Add new education
                educationData.createdAt = new Date();
                
                // Get the current count of education entries to set the order field
                const educationQuery = query(educationCollection);
                const educationSnapshot = await getDocs(educationQuery);
                educationData.order = educationSnapshot.size;
                
                await addDoc(educationCollection, educationData);
            }
            
            // Update the UI
            await populateEducationTable();
            
            // Hide the form
            document.getElementById('education-form-container').classList.add('hidden');
        } catch (error) {
            console.error('Error saving education:', error);
            alert('Error saving education data. Please try again.');
        }
    }
    
    // Variables to store unsubscribe functions for onSnapshot listeners
var unsubscribeProjects = null;
var unsubscribeSkills = null;
var unsubscribeEducation = null;

// Initialize the admin dashboard
async function initAdminDashboard() {
    try {
        // Load data from Firestore with onSnapshot listeners
        // These will automatically update the UI when data changes
        await loadProjectsFromFirestore();
        await loadSkillsFromFirestore();
        await loadEducationFromFirestore();
        
        // Note: We don't need to call populate functions here
        // as they are now called by the onSnapshot listeners
            
        // Add event listeners
        document.getElementById('add-project-btn')?.addEventListener('click', showAddProjectForm);
        document.getElementById('cancel-project-btn')?.addEventListener('click', () => {
            document.getElementById('project-form-container').classList.add('hidden');
        });
        document.getElementById('project-form')?.addEventListener('submit', saveProject);
        document.getElementById('add-category-btn')?.addEventListener('click', addSkillCategory);
        document.getElementById('add-skill-btn')?.addEventListener('click', addSkill);
        document.getElementById('add-education-btn')?.addEventListener('click', showAddEducationForm);
        document.getElementById('cancel-education-btn')?.addEventListener('click', () => {
            document.getElementById('education-form-container').classList.add('hidden');
        });
        document.getElementById('education-form')?.addEventListener('submit', saveEducation);
        document.getElementById('save-settings-btn')?.addEventListener('click', saveSettings);
        document.getElementById('logout-btn')?.addEventListener('click', logout);
        
        // Initialize SortableJS for all sortable lists
        initSortableLists();
    } catch (error) {
        console.error('Error initializing dashboard:', error);
        alert('Error loading data. Please try again later.');
    }
}
    
    // Function to initialize SortableJS for all sortable lists
    function initSortableLists() {
        // Initialize SortableJS for projects table
        const projectsTableBody = document.getElementById('project-table-body');
        if (projectsTableBody) {
            new Sortable(projectsTableBody, {
                animation: 150,
                handle: '.drag-handle',
                onEnd: async (evt) => {
                    // Get all the table rows in their new order
                    const rows = projectsTableBody.querySelectorAll('tr');
                    
                    // Create an array to hold all the update promises
                    const updatePromises = [];
                    
                    rows.forEach((row, index) => {
                        const docId = row.dataset.id;
                        
                        if (docId) {
                            const docRef = doc(db, 'projects', docId);
                            // Update the 'order' field of the document with its new index
                            updatePromises.push(updateDoc(docRef, { order: index }));
                        }
                    });
                    
                    // Execute all updates concurrently
                    try {
                        await Promise.all(updatePromises);
                        console.log('Projects order updated successfully!');
                    } catch (error) {
                        console.error('Error updating projects order:', error);
                    }
                }
            });
        }
        
        // Initialize SortableJS for skill categories list
        const skillCategoriesList = document.getElementById('skill-categories-list');
        if (skillCategoriesList) {
            new Sortable(skillCategoriesList, {
                animation: 150,
                handle: '.drag-handle',
                onEnd: async (evt) => {
                    // Get all the list items in their new order
                    const items = skillCategoriesList.querySelectorAll('li');
                    
                    // Create an array to hold all the update promises
                    const updatePromises = [];
                    
                    // Create a Set to track processed document IDs to prevent duplicates
                    const processedDocIds = new Set();
                    
                    items.forEach((item, index) => {
                        const docId = item.dataset.id;
                        
                        if (docId && !processedDocIds.has(docId)) {
                            processedDocIds.add(docId); // Mark this docId as processed
                            const docRef = doc(db, 'skills', docId);
                            // Update the 'order' field of the document with its new index
                            updatePromises.push(updateDoc(docRef, { order: index }));
                        }
                    });
                    
                    // Execute all updates concurrently
                    try {
                        await Promise.all(updatePromises);
                        console.log('Skill categories order updated successfully!');
                        // Refresh the categories list to ensure UI is in sync with database
                        await populateSkillCategories();
                    } catch (error) {
                        console.error('Error updating skill categories order:', error);
                        confirmDialog.show('Error', `Failed to update skill categories order: ${error.message}. Please try again.`);
                    }
                }
            });
        }
        
        // Initialize SortableJS for skills list
        const skillsList = document.getElementById('skills-list');
        if (skillsList) {
            new Sortable(skillsList, {
                animation: 150,
                handle: '.drag-handle',
                onEnd: async (evt) => {
                    // Get all the list items in their new order
                    const items = skillsList.querySelectorAll('li');
                    const currentCategory = document.getElementById('current-category')?.textContent;
                    
                    if (!currentCategory) return;
                    
                    // Find the document for this category
                    const q = query(skillsCollection, where("categoryName", "==", currentCategory));
                    const querySnapshot = await getDocs(q);
                    
                    if (querySnapshot.empty) return;
                    
                    let docId;
                    let skillsListData = [];
                    
                    querySnapshot.forEach(doc => {
                        docId = doc.id;
                        skillsListData = doc.data().skillsList || [];
                    });
                    
                    if (!docId) return;
                    
                    // Create a new skillsOrder array with updated order
                    const skillsOrder = [];
                    
                    items.forEach((item, index) => {
                        const skill = item.dataset.skill;
                        if (skill) {
                            skillsOrder.push({
                                name: skill,
                                order: index
                            });
                        }
                    });
                    
                    // Update the document with the new skillsOrder
                    try {
                        const docRef = doc(db, 'skills', docId);
                        await updateDoc(docRef, { skillsOrder: skillsOrder });
                        console.log('Skills order updated successfully!');
                    } catch (error) {
                        console.error('Error updating skills order:', error);
                    }
                }
            });
        }
        
        // Initialize SortableJS for education table
        const educationTableBody = document.getElementById('education-table-body');
        if (educationTableBody) {
            new Sortable(educationTableBody, {
                animation: 150,
                handle: '.drag-handle',
                onEnd: async (evt) => {
                    // Get all the table rows in their new order
                    const rows = educationTableBody.querySelectorAll('tr');
                    
                    // Create an array to hold all the update promises
                    const updatePromises = [];
                    
                    rows.forEach((row, index) => {
                        const docId = row.dataset.id;
                        
                        if (docId) {
                            const docRef = doc(db, 'education', docId);
                            // Update the 'order' field of the document with its new index
                            updatePromises.push(updateDoc(docRef, { order: index }));
                        }
                    });
                    
                    // Execute all updates concurrently
                    try {
                        await Promise.all(updatePromises);
                        console.log('Education order updated successfully!');
                    } catch (error) {
                        console.error('Error updating education order:', error);
                    }
                }
            });
        }
    }
    
    // Function to load projects from Firestore
async function loadProjectsFromFirestore() {
    try {
        // Unsubscribe from previous listener if exists
        if (unsubscribeProjects) {
            unsubscribeProjects();
        }
        
        // Set up new onSnapshot listener
        unsubscribeProjects = onSnapshot(projectsCollection, (querySnapshot) => {
            projectsData = {};
            querySnapshot.forEach((doc) => {
                projectsData[doc.id] = doc.data();
            });
            
            // Update UI when data changes
            populateProjectTable();
        }, (error) => {
            console.error('Error in projects snapshot listener:', error);
        });
        
        // Initial load with getDocs for backward compatibility
        const querySnapshot = await getDocs(projectsCollection);
        if (querySnapshot.empty && Object.keys(projectsData).length > 0) {
            // If no projects in Firestore, initialize with default data
            for (const [id, project] of Object.entries(projectsData)) {
                await addDoc(projectsCollection, {
                    ...project
                    // Removed id field to prevent duplication
                });
            }
        }
    } catch (error) {
        console.error('Error loading projects:', error);
        throw error;
    }
    }
    
    // Function to load skills from Firestore
async function loadSkillsFromFirestore() {
    try {
        // Unsubscribe from previous listener if exists
        if (unsubscribeSkills) {
            unsubscribeSkills();
        }
        
        // Set up new onSnapshot listener
        unsubscribeSkills = onSnapshot(skillsCollection, (querySnapshot) => {
            skillsData = {};
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                skillsData[data.categoryName] = data.skillsList;
            });
            
            // Update UI when data changes
            populateSkillCategories();
            const firstCategory = Object.keys(skillsData)[0];
            if (firstCategory) {
                selectSkillCategory(firstCategory);
            }
        }, (error) => {
            console.error('Error in skills snapshot listener:', error);
        });
        
        // Initial load with getDocs for backward compatibility
        const querySnapshot = await getDocs(skillsCollection);
        if (querySnapshot.empty && Object.keys(skillsData).length > 0) {
            // If no skills in Firestore, initialize with default data
            for (const [categoryName, skillsList] of Object.entries(skillsData)) {
                await addDoc(skillsCollection, {
                    categoryName,
                    skillsList
                });
            }
        }
    } catch (error) {
        console.error('Error loading skills:', error);
        throw error;
    }
    }
    
    // Function to load education from Firestore
async function loadEducationFromFirestore() {
    try {
        // Unsubscribe from previous listener if exists
        if (unsubscribeEducation) {
            unsubscribeEducation();
        }
        
        // Set up new onSnapshot listener
        unsubscribeEducation = onSnapshot(educationCollection, (querySnapshot) => {
            educationData = {};
            querySnapshot.forEach((doc) => {
                educationData[doc.id] = doc.data();
            });
            
            // Update UI when data changes
            populateEducationTable();
        }, (error) => {
            console.error('Error in education snapshot listener:', error);
        });
        
        // Initial load with getDocs for backward compatibility
        const querySnapshot = await getDocs(educationCollection);
        if (querySnapshot.empty && Object.keys(educationData).length > 0) {
            // If no education in Firestore, initialize with default data
            for (const [id, education] of Object.entries(educationData)) {
                await addDoc(educationCollection, {
                    ...education
                    // Removed id field to prevent duplication
                });
            }
        }
    } catch (error) {
        console.error('Error loading education:', error);
        throw error;
    }
    }

    // Check for admin password and redirect if not authenticated
    function checkAdminAccess() {
        // Check if user is logged in via session storage
        const isLoggedIn = sessionStorage.getItem('adminLoggedIn') === 'true';
        
        if (isLoggedIn) {
            // User is authenticated, initialize the dashboard
            initAdminDashboard();
        } else {
            // User is not authenticated, redirect to login page
            window.location.href = 'login.html';
        }
    }

    // Start the admin dashboard
    checkAdminAccess();
});
