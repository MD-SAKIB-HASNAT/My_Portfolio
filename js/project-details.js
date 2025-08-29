// Import Firebase modules
import { db, doc, getDoc, collection } from './firebase-config.js';

// Function to handle carousel functionality
function initializeCarousel() {
    const carousel = document.querySelector('.project-image-carousel');
    if (!carousel) return;
    
    const carouselInner = carousel.querySelector('.carousel-inner');
    const items = carousel.querySelectorAll('.carousel-item');
    const indicators = carousel.querySelectorAll('.carousel-indicator');
    const prevBtn = carousel.querySelector('.carousel-control.prev');
    const nextBtn = carousel.querySelector('.carousel-control.next');
    
    // Ensure all images are loaded properly and responsively
    const allImages = carousel.querySelectorAll('img');
    
    // Set loading attributes for images
    allImages.forEach(img => {
        // Set first image to eager loading for immediate display
        if (img.parentElement.classList.contains('active')) {
            img.setAttribute('loading', 'eager');
        } else {
            img.setAttribute('loading', 'lazy');
        }
        
        // Handle image load errors
        img.onerror = function() {
            this.onerror = null;
            this.src = '../images/placeholder.jpg'; // Fallback to placeholder
            console.log('Image failed to load, using placeholder');
        };
        
        // When image loads, fade it in
        img.onload = function() {
            this.style.opacity = 1;
        };
        
        // Set initial opacity
        img.style.opacity = 0;
    });
    
    // Even with one image, we need to handle carousel controls
    if (items.length <= 1) {
        // Prevent default on any links
        const links = carousel.querySelectorAll('a');
        links.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
            });
        });
        
        // Make sure controls don't cause page refresh but do nothing for single image
        if (prevBtn) {
            prevBtn.addEventListener('click', (e) => {
                e.preventDefault();
            });
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', (e) => {
                e.preventDefault();
            });
        }
        
        // Handle indicators for single image
        indicators.forEach(indicator => {
            indicator.addEventListener('click', (e) => {
                e.preventDefault();
            });
        });
        
        // No need to continue with the rest of the carousel setup
        return;
    }
    // We've already handled image loading in the preload section above
    // This section is now redundant
    
    if (items.length <= 1) return; // No need for carousel with only one image
    
    let currentIndex = 0;
    
    // Function to show a specific slide
    function showSlide(index) {
        // Handle index bounds
        if (index < 0) index = items.length - 1;
        if (index >= items.length) index = 0;
        
        // Update current index
        currentIndex = index;
        
        // First, make sure all items are in the DOM but hidden
        items.forEach((item, i) => {
            // Keep all items in the DOM but only show the active one
            item.style.display = 'block';
            item.style.opacity = i === currentIndex ? '1' : '0';
            item.style.zIndex = i === currentIndex ? '1' : '0';
            
            // Update active class for accessibility and styling
            item.classList.toggle('active', i === currentIndex);
            
            // Ensure the image in the active slide is visible
            const img = item.querySelector('img');
            if (img && i === currentIndex) {
                // Force eager loading for the active image
                img.setAttribute('loading', 'eager');
                img.style.opacity = '1';
            }
        });
        
        // Update active class on indicators
        indicators.forEach((indicator, i) => {
            indicator.classList.toggle('active', i === currentIndex);
        });
    }
    
    // Event listeners for controls
    if (prevBtn) {
        prevBtn.addEventListener('click', (e) => {
            e.preventDefault();
            showSlide(currentIndex - 1);
        });
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', (e) => {
            e.preventDefault();
            showSlide(currentIndex + 1);
        });
    }
    
    // Event listeners for indicators
    indicators.forEach((indicator, i) => {
        indicator.addEventListener('click', (e) => {
            e.preventDefault();
            showSlide(i);
        });
    });
    
    // Optional: Auto-advance slides every 5 seconds
    let intervalId = setInterval(() => {
        showSlide(currentIndex + 1);
    }, 5000);
    
    // Pause auto-advance on hover
    carousel.addEventListener('mouseenter', () => {
        clearInterval(intervalId);
    });
    
    carousel.addEventListener('mouseleave', () => {
        intervalId = setInterval(() => {
            showSlide(currentIndex + 1);
        }, 5000);
    });
    
    // No need to adjust height on resize anymore
}

document.addEventListener('DOMContentLoaded', async () => {
    // Get the project ID from the URL query parameter
    const urlParams = new URLSearchParams(window.location.search);
    const projectId = urlParams.get('id');
    
    // No default project data - all data will be fetched from Firestore
    
    // Get the project content container
    const projectContent = document.getElementById('project-content');
    
    try {
        let project;
        
        // Try to fetch project data from Firestore
        if (projectId) {
            const projectRef = doc(db, 'projects', projectId);
            const projectSnapshot = await getDoc(projectRef);
            
            if (projectSnapshot.exists()) {
                project = projectSnapshot.data();
            }
            // No fallback to default data anymore - all projects must be in Firestore
        }
        
        // If project ID exists and is valid
        if (projectId && project) {
        
        // Create HTML content for the project details
        const content = `
            <h2 class="heading">${project.title} <span class="neon-glow">Details</span></h2>
            
            <div class="project-images">
                <div class="project-image-carousel">
                    ${(() => {
                        // Determine which images to use
                        let imagesToUse = [];
                        
                        if (project.imageUrls && project.imageUrls.length > 0) {
                            // Use the new imageUrls array
                            imagesToUse = project.imageUrls;
                        } else if (project.imageUrl) {
                            // Fallback to single imageUrl
                            imagesToUse = [project.imageUrl];
                        } else if (project.images && project.images.length > 0) {
                            // Fallback to legacy images array
                            imagesToUse = project.images.map(img => `../images/${img}`);
                        } else {
                            // Last resort fallback
                            imagesToUse = [`../images/project-${projectId}.jpg`];
                        }
                        
                        // Generate HTML for images
                        if (imagesToUse.length === 1) {
                            // Single image - still use carousel structure for consistency
                            return `
                                <div class="carousel-inner">
                                    <div class="carousel-item active">
                                        <img src="${imagesToUse[0]}" alt="${project.title}" class="neon-box-glow" loading="eager">
                                    </div>
                                </div>
                                <div class="carousel-control prev"><i class="fas fa-chevron-left"></i></div>
                                <div class="carousel-control next"><i class="fas fa-chevron-right"></i></div>
                                <div class="carousel-controls">
                                    <div class="carousel-indicators">
                                        <span class="carousel-indicator active" data-index="0"></span>
                                    </div>
                                </div>
`;
                        } else {
                            // Multiple images - create carousel
                            let carouselItems = '';
                            let indicators = '';
                            
                            imagesToUse.forEach((img, index) => {
                                carouselItems += `
                                <div class="carousel-item${index === 0 ? ' active' : ''}">
                                    <img 
                                        src="${img}" 
                                        alt="${project.title} - Image ${index + 1}" 
                                        class="neon-box-glow" 
                                        loading="${index === 0 ? 'eager' : 'lazy'}"
                                    >
                                </div>`;
                                
                                indicators += `
                                <span class="carousel-indicator${index === 0 ? ' active' : ''}" data-index="${index}"></span>`;
                            });
                            
                            return `
                                <div class="carousel-inner">
                                    ${carouselItems}
                                </div>
                                <div class="carousel-control prev"><i class="fas fa-chevron-left"></i></div>
                                <div class="carousel-control next"><i class="fas fa-chevron-right"></i></div>
                                <div class="carousel-controls">
                                    <div class="carousel-indicators">
                                        ${indicators}
                                    </div>
                                </div>
`;
                        }
                    })()} 
                </div>
            </div>
            
            <div class="project-details-content">
                <div class="project-overview">  
                    <h3>Project Overview</h3>
                    ${project.fullDescription}
                </div>
                
                <div class="project-details-section">
                    <h3>Technologies Used</h3>
                    <div class="project-tech details-tech">
                        ${project.technologies.map(tech => `<span>${tech}</span>`).join('')}
                    </div>
                </div>
                
                <div class="project-details-section">
                    <h3>Key Features</h3>
                    <ul class="features-list">
                        ${project.features.map(feature => `<li>${feature}</li>`).join('')}
                    </ul>
                </div>
                
                <div class="project-details-section">
                    <h3>Future Scope</h3>
                    <ul class="challenges-list">
                        ${project.challenges.map(challenge => `<li>${challenge}</li>`).join('')}
                    </ul>
                </div>
                
                <div class="project-links details-links">
                    ${project.github && project.github !== '#' ? 
                    `<a href="${project.github}" class="btn neon-glow"><i class="fa-brands fa-github"></i> View Code</a>` : 
                    `<button class="btn neon-glow disabled-btn" onclick="alert('GitHub link not added yet')"><i class="fa-brands fa-github"></i> View Code</button>`}
                    ${project.demo && project.demo !== '#' ? 
                    `<a href="${project.demo}" class="btn neon-glow"><i class="fa-solid fa-arrow-up-right-from-square"></i> Live Demo</a>` : 
                    `<button class="btn neon-glow disabled-btn" onclick="alert('Demo link not added yet')"><i class="fa-solid fa-arrow-up-right-from-square"></i> Live Demo</button>`}
                </div>
            </div>
        `;
        
        // Update the project content
        projectContent.innerHTML = content;
        
        // Initialize carousel if there are multiple images
        initializeCarousel();
    } else {
        // If project ID is invalid or not provided
        projectContent.innerHTML = `
            <div class="error-message">
                <h2 class="heading">Project <span class="neon-glow">Not Found</span></h2>
                <p>Sorry, the project you're looking for doesn't exist or has been removed.</p>
                <a href="../index.html#projects" class="btn neon-glow">Back to Projects</a>
            </div>
        `;
    }
    } catch (error) {
        console.error('Error fetching project details:', error);
        projectContent.innerHTML = `
            <div class="error-message">
                <h2 class="heading">Error <span class="neon-glow">Loading Project</span></h2>
                <p>Sorry, there was an error loading the project details. Please try again later.</p>
                <a href="../index.html#projects" class="btn neon-glow">Back to Projects</a>
            </div>
        `;
    }
    
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
});