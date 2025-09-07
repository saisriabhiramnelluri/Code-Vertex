// ==========================================
// CodeVertex - Enhanced Theme System
// ==========================================

class ThemeManager {
    constructor() {
        this.currentTheme = this.getStoredTheme() || this.getSystemTheme();
        this.themeToggle = null;
        this.init();
    }

    init() {
        this.applyTheme(this.currentTheme);
        this.setupToggle();
        this.watchSystemTheme();
        this.addTransitionClass();
    }

    getStoredTheme() {
        return localStorage.getItem('codevertex-theme');
    }

    getSystemTheme() {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    setStoredTheme(theme) {
        localStorage.setItem('codevertex-theme', theme);
    }

    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        this.currentTheme = theme;
        this.setStoredTheme(theme);
        
        // Update meta theme-color for mobile browsers
        this.updateMetaThemeColor(theme);
        
        // Trigger custom event for other components
        document.dispatchEvent(new CustomEvent('themechange', { detail: { theme } }));
    }

    updateMetaThemeColor(theme) {
        const colors = {
            light: '#ffffff',
            dark: '#0f172a'
        };
        
        let metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (!metaThemeColor) {
            metaThemeColor = document.createElement('meta');
            metaThemeColor.name = 'theme-color';
            document.head.appendChild(metaThemeColor);
        }
        metaThemeColor.content = colors[theme];
    }

    setupToggle() {
        this.themeToggle = document.getElementById('theme-toggle');
        if (!this.themeToggle) return;

        this.themeToggle.addEventListener('click', () => {
            this.toggleTheme();
        });

        // Add keyboard support
        this.themeToggle.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.toggleTheme();
            }
        });
    }

    toggleTheme() {
        const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        
        // Add toggle animation
        if (this.themeToggle) {
            this.themeToggle.style.transform = 'scale(0.9)';
            setTimeout(() => {
                this.themeToggle.style.transform = '';
            }, 150);
        }
        
        this.applyTheme(newTheme);
        
        // Animate theme transition
        this.animateThemeTransition();
    }

    animateThemeTransition() {
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: ${this.currentTheme === 'dark' ? '#0f172a' : '#ffffff'};
            opacity: 0;
            pointer-events: none;
            z-index: 9999;
            transition: opacity 200ms ease;
        `;
        
        document.body.appendChild(overlay);
        
        // Trigger animation
        requestAnimationFrame(() => {
            overlay.style.opacity = '0.3';
            setTimeout(() => {
                overlay.style.opacity = '0';
                setTimeout(() => {
                    document.body.removeChild(overlay);
                }, 200);
            }, 100);
        });
    }

    watchSystemTheme() {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        mediaQuery.addEventListener('change', (e) => {
            if (!this.getStoredTheme()) {
                this.applyTheme(e.matches ? 'dark' : 'light');
            }
        });
    }

    addTransitionClass() {
        // Add transition class after initial load to prevent flash
        setTimeout(() => {
            document.body.classList.add('theme-transitions');
        }, 100);
    }

    // Public API
    setTheme(theme) {
        if (['light', 'dark'].includes(theme)) {
            this.applyTheme(theme);
        }
    }

    getTheme() {
        return this.currentTheme;
    }
}

// ==========================================
// Enhanced UI Interactions
// ==========================================

class UIManager {
    constructor() {
        this.init();
    }

    init() {
        this.setupCustomSelects();
        this.setupAnimations();
        this.setupToasts();
        this.addLoadingStates();
    }

    setupCustomSelects() {
        const selects = document.querySelectorAll('.custom-select');
        
        selects.forEach(select => {
            const trigger = select.querySelector('.select-trigger');
            const dropdown = select.querySelector('.select-dropdown');
            const search = select.querySelector('input');
            const options = select.querySelectorAll('.option');
            
            // Toggle dropdown
            trigger.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleSelect(select);
            });
            
            // Handle option selection
            options.forEach(option => {
                option.addEventListener('click', () => {
                    this.selectOption(select, option);
                });
            });
            
            // Search functionality
            if (search) {
                search.addEventListener('input', (e) => {
                    this.filterOptions(select, e.target.value);
                });
            }
            
            // Close on outside click
            document.addEventListener('click', (e) => {
                if (!select.contains(e.target)) {
                    select.classList.remove('open');
                }
            });
        });
    }

    toggleSelect(select) {
        const isOpen = select.classList.contains('open');
        
        // Close all other selects
        document.querySelectorAll('.custom-select').forEach(s => {
            if (s !== select) s.classList.remove('open');
        });
        
        select.classList.toggle('open', !isOpen);
        
        if (!isOpen) {
            // Focus search input when opening
            const search = select.querySelector('input');
            if (search) {
                setTimeout(() => search.focus(), 100);
            }
        }
    }

    selectOption(select, option) {
        const trigger = select.querySelector('.select-text');
        const value = option.dataset.value;
        
        // Update display
        trigger.textContent = value;
        
        // Update visual state
        select.querySelectorAll('.option').forEach(opt => {
            opt.classList.remove('selected');
        });
        option.classList.add('selected');
        
        // Close dropdown
        select.classList.remove('open');
        
        // Trigger change event
        select.dispatchEvent(new CustomEvent('change', { detail: { value } }));
        
        // Add selection animation
        option.style.transform = 'scale(0.95)';
        setTimeout(() => {
            option.style.transform = '';
        }, 150);
    }

    filterOptions(select, query) {
        const options = select.querySelectorAll('.option');
        
        options.forEach(option => {
            const text = option.textContent.toLowerCase();
            const matches = text.includes(query.toLowerCase());
            
            option.style.display = matches ? 'flex' : 'none';
            
            if (matches) {
                option.classList.add('fade-in');
                setTimeout(() => option.classList.remove('fade-in'), 300);
            }
        });
    }

    setupAnimations() {
        // Intersection Observer for scroll animations
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate');
                }
            });
        }, { threshold: 0.1 });

        // Observe elements for animation
        document.querySelectorAll('.code-panel, .stat-item').forEach(el => {
            observer.observe(el);
        });
    }

    setupToasts() {
        this.toastContainer = document.getElementById('toast-container');
    }

    showToast(message, type = 'info', duration = 4000) {
    if (!this.toastContainer) {
        this.toastContainer = document.getElementById('toast-container');
    }
    
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    // Add icon based on type
    const icons = {
        success: 'fas fa-check-circle',
        error: 'fas fa-exclamation-circle',
        info: 'fas fa-info-circle',
        warning: 'fas fa-exclamation-triangle'
    };
    
    toast.innerHTML = `
        <span class="toast-icon">
            <i class="${icons[type] || icons.info}"></i>
        </span>
        <span class="toast-message">${message}</span>
    `;
    
    // Add to container
    this.toastContainer.appendChild(toast);
    
    // Trigger show animation
    requestAnimationFrame(() => {
        toast.classList.add('show');
    });
    
    // Auto remove with smooth transition
    const removeToast = () => {
        toast.classList.remove('show');
        toast.classList.add('hide');
        
        // Remove from DOM after animation
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    };
    
    // Auto-remove after duration
    setTimeout(removeToast, duration);
    
    // Click to dismiss
    toast.addEventListener('click', removeToast);
    
    return toast;
}


    addLoadingStates() {
        // Add loading state to translate button
        const translateBtn = document.getElementById('translate-btn');
        if (translateBtn) {
            this.translateBtn = translateBtn;
        }
    }

    setTranslateLoading(loading) {
        if (this.translateBtn) {
            this.translateBtn.classList.toggle('loading', loading);
            this.translateBtn.disabled = loading;
        }
    }

    updateProgress(step) {
        const steps = document.querySelectorAll('.progress-step');
        steps.forEach((stepEl, index) => {
            stepEl.classList.toggle('active', index < step);
        });
    }
}

// ==========================================
// Line Numbers Manager
// ==========================================

class LineNumbersManager {
    constructor() {
        this.init();
    }

    init() {
        const textareas = document.querySelectorAll('.code-area textarea');
        textareas.forEach(textarea => {
            this.setupLineNumbers(textarea);
        });
    }

    setupLineNumbers(textarea) {
        const lineNumbers = textarea.parentNode.querySelector('.line-numbers');
        if (!lineNumbers) return;

        const updateLineNumbers = () => {
            const lines = textarea.value.split('\n').length;
            const numbers = Array.from({ length: lines }, (_, i) => i + 1).join('\n');
            lineNumbers.textContent = numbers;
        };

        // Initial update
        updateLineNumbers();

        // Update on input
        textarea.addEventListener('input', updateLineNumbers);
        textarea.addEventListener('scroll', () => {
            lineNumbers.scrollTop = textarea.scrollTop;
        });
    }
}

// ==========================================
// Initialization
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    // Initialize theme manager
    window.themeManager = new ThemeManager();
    
    // Initialize UI manager
    window.uiManager = new UIManager();
    
    // Initialize line numbers
    window.lineNumbersManager = new LineNumbersManager();
    
    console.log('🚀 CodeVertex UI initialized successfully!');
});

// ==========================================
// Global Utilities
// ==========================================

// Debounce function for performance
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Animation frame helper
function nextFrame(callback) {
    requestAnimationFrame(() => {
        requestAnimationFrame(callback);
    });
}

// CSS animation end helper
function onAnimationEnd(element, callback) {
    const onEnd = () => {
        element.removeEventListener('animationend', onEnd);
        callback();
    };
    element.addEventListener('animationend', onEnd);
}

// Export for global access
window.CodeVertexUI = {
    themeManager: null,
    uiManager: null,
    lineNumbersManager: null,
    utils: { debounce, nextFrame, onAnimationEnd }
};
