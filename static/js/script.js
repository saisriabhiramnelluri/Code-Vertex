// ==========================================
// CodeVertex - Complete Translation Logic
// ==========================================

class CodeVertexApp {
    constructor() {
        this.sourceLanguage = '';
        this.targetLanguage = '';
        this.isTranslating = false;
        this.init();
    }

    init() {
        this.setupLanguageSelectors();
        this.setupTranslationButton();
        this.setupSwapButton();
        this.setupCopyButton();
        this.setupClearButton();
        this.setupTextareaSync();
    }

    // ==========================================
    // Language Selector Setup
    // ==========================================
    setupLanguageSelectors() {
        const sourceSelect = document.getElementById('source-select');
        const targetSelect = document.getElementById('target-select');

        if (sourceSelect) {
            sourceSelect.addEventListener('change', (e) => {
                this.sourceLanguage = e.detail.value;
                this.updateTabName('source', e.detail.value);
                this.updateProgressStep(1);
                console.log('Source language set:', this.sourceLanguage);
            });
        }

        if (targetSelect) {
            targetSelect.addEventListener('change', (e) => {
                this.targetLanguage = e.detail.value;
                this.updateTabName('target', e.detail.value);
                this.updateProgressStep(2);
                console.log('Target language set:', this.targetLanguage);
            });
        }
    }

    updateTabName(type, language) {
        const extensions = {
            'Python': 'py', 'JavaScript': 'js', 'Java': 'java', 'C++': 'cpp',
            'C': 'c', 'C#': 'cs', 'PHP': 'php', 'Ruby': 'rb', 'Go': 'go',
            'Rust': 'rs', 'TypeScript': 'ts', 'Swift': 'swift', 'Kotlin': 'kt'
        };

        const extension = extensions[language] || 'txt';
        const filename = type === 'source' ? `main.${extension}` : `output.${extension}`;
        
        const tab = document.querySelector(`.${type}-panel .tab span`);
        if (tab) {
            tab.textContent = filename;
        }
    }

    updateProgressStep(step) {
        if (window.uiManager) {
            window.uiManager.updateProgress(step);
        }
    }

    // ==========================================
    // Translation Logic
    // ==========================================
    setupTranslationButton() {
        const translateBtn = document.getElementById('translate-btn');
        if (!translateBtn) return;

        translateBtn.addEventListener('click', () => {
            this.translateCode();
        });
    }

    async translateCode() {
        const sourceCode = document.getElementById('source-code')?.value.trim();
        
        // Validation
        if (!sourceCode) {
            this.showToast('Please enter some code to translate', 'error');
            return;
        }

        if (!this.sourceLanguage) {
            this.showToast('Please select a source language', 'error');
            return;
        }

        if (!this.targetLanguage) {
            this.showToast('Please select a target language', 'error');
            return;
        }

        if (this.sourceLanguage === this.targetLanguage) {
            this.showToast('Source and target languages cannot be the same', 'error');
            return;
        }

        // Start translation
        this.setTranslating(true);
        this.updateProgressStep(3);
        
        try {
            const response = await fetch('/api/translate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    code: sourceCode,
                    source_lang: this.sourceLanguage,
                    target_lang: this.targetLanguage
                })
            });

            const result = await response.json();

            if (result.success) {
                document.getElementById('target-code').value = result.translated_code;
                this.showToast('Code translated successfully!', 'success');
                this.updateLineNumbers();
            } else {
                this.showToast(result.message || 'Translation failed', 'error');
            }

        } catch (error) {
            console.error('Translation error:', error);
            this.showToast('Network error. Please try again.', 'error');
        } finally {
            this.setTranslating(false);
        }
    }

    setTranslating(isTranslating) {
        this.isTranslating = isTranslating;
        
        if (window.uiManager) {
            window.uiManager.setTranslateLoading(isTranslating);
        }

        // Update AI indicator
        const aiIndicator = document.querySelector('.ai-indicator span');
        if (aiIndicator) {
            aiIndicator.textContent = isTranslating ? 'AI Processing...' : 'AI Ready';
        }
    }

    // ==========================================
    // Utility Functions
    // ==========================================
    setupSwapButton() {
        const swapBtn = document.getElementById('swap-btn');
        if (!swapBtn) return;

        swapBtn.addEventListener('click', () => {
            this.swapLanguages();
        });
    }

    swapLanguages() {
        // Swap language selections
        const tempLang = this.sourceLanguage;
        this.sourceLanguage = this.targetLanguage;
        this.targetLanguage = tempLang;

        // Update UI selectors
        this.updateSelectorDisplay('source-select', this.sourceLanguage);
        this.updateSelectorDisplay('target-select', this.targetLanguage);

        // Swap code content
        const sourceTextarea = document.getElementById('source-code');
        const targetTextarea = document.getElementById('target-code');
        
        if (sourceTextarea && targetTextarea) {
            const tempCode = sourceTextarea.value;
            sourceTextarea.value = targetTextarea.value;
            targetTextarea.value = tempCode;
        }

        // Update tab names
        this.updateTabName('source', this.sourceLanguage);
        this.updateTabName('target', this.targetLanguage);

        this.showToast('Languages and code swapped', 'info');
        this.updateLineNumbers();
    }

    updateSelectorDisplay(selectorId, language) {
        const selector = document.getElementById(selectorId);
        if (selector) {
            const trigger = selector.querySelector('.select-text');
            if (trigger) {
                trigger.textContent = language || 'Select Language';
            }

            // Update selected option
            const options = selector.querySelectorAll('.option');
            options.forEach(option => {
                option.classList.toggle('selected', option.dataset.value === language);
            });
        }
    }

    setupCopyButton() {
        const copyBtn = document.getElementById('copy-btn');
        if (!copyBtn) return;

        copyBtn.addEventListener('click', async () => {
            const targetCode = document.getElementById('target-code')?.value;
            
            if (!targetCode?.trim()) {
                this.showToast('No code to copy', 'error');
                return;
            }

            try {
                await navigator.clipboard.writeText(targetCode);
                
                // Visual feedback
                const icon = copyBtn.querySelector('i');
                const originalClass = icon.className;
                icon.className = 'fas fa-check';
                copyBtn.style.color = 'var(--success)';
                
                setTimeout(() => {
                    icon.className = originalClass;
                    copyBtn.style.color = '';
                }, 2000);
                
                this.showToast('Code copied to clipboard!', 'success');
            } catch (error) {
                this.showToast('Failed to copy code', 'error');
                console.error('Copy failed:', error);
            }
        });
    }

    setupClearButton() {
        const sourcePanel = document.querySelector('.source-panel');
        const clearBtn = sourcePanel?.querySelector('.action-btn[title="Clear"]');
        
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                const sourceTextarea = document.getElementById('source-code');
                if (sourceTextarea) {
                    sourceTextarea.value = '';
                    this.updateLineNumbers();
                    this.showToast('Source code cleared', 'info');
                }
            });
        }
    }

    setupTextareaSync() {
        const sourceTextarea = document.getElementById('source-code');
        const targetTextarea = document.getElementById('target-code');

        if (sourceTextarea) {
            sourceTextarea.addEventListener('input', () => {
                this.updateLineNumbers();
            });
        }

        if (targetTextarea) {
            targetTextarea.addEventListener('input', () => {
                this.updateLineNumbers();
            });
        }
    }

    updateLineNumbers() {
        if (window.lineNumbersManager) {
            // Re-initialize line numbers for both textareas
            const textareas = document.querySelectorAll('.code-area textarea');
            textareas.forEach(textarea => {
                const lineNumbers = textarea.parentNode.querySelector('.line-numbers');
                if (lineNumbers) {
                    const lines = textarea.value.split('\n').length;
                    const numbers = Array.from({ length: Math.max(lines, 10) }, (_, i) => i + 1).join('\n');
                    lineNumbers.textContent = numbers;
                }
            });
        }
    }

    showToast(message, type = 'info') {
        if (window.uiManager) {
            window.uiManager.showToast(message, type);
        } else {
            // Fallback alert
            alert(message);
        }
    }
}

// ==========================================
// Enhanced Custom Select Integration
// ==========================================

// Override the UIManager's selectOption method to integrate with our app
document.addEventListener('DOMContentLoaded', () => {
    // Wait for UI components to initialize
    setTimeout(() => {
        // Initialize the main app
        window.codeVertexApp = new CodeVertexApp();
        
        // Override select behavior
        const originalSelectOption = window.uiManager?.selectOption;
        if (originalSelectOption) {
            window.uiManager.selectOption = function(select, option) {
                // Call original method
                originalSelectOption.call(this, select, option);
                
                // Additional integration
                const selectId = select.id;
                const value = option.dataset.value;
                
                if (selectId === 'source-select') {
                    window.codeVertexApp.sourceLanguage = value;
                    window.codeVertexApp.updateTabName('source', value);
                    window.codeVertexApp.updateProgressStep(1);
                } else if (selectId === 'target-select') {
                    window.codeVertexApp.targetLanguage = value;
                    window.codeVertexApp.updateTabName('target', value);
                    window.codeVertexApp.updateProgressStep(2);
                }
            };
        }
        
        console.log('🚀 CodeVertex App initialized with translation functionality!');
    }, 100);
});

// ==========================================
// Keyboard Shortcuts
// ==========================================
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + Enter to translate
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (window.codeVertexApp && !window.codeVertexApp.isTranslating) {
            window.codeVertexApp.translateCode();
        }
    }
    
    // Ctrl/Cmd + Shift + S to swap languages
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'S') {
        e.preventDefault();
        if (window.codeVertexApp) {
            window.codeVertexApp.swapLanguages();
        }
    }
    
    // Ctrl/Cmd + Shift + C to copy result
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'C') {
        e.preventDefault();
        const copyBtn = document.getElementById('copy-btn');
        if (copyBtn) copyBtn.click();
    }
});

// ==========================================
// Auto-save functionality
// ==========================================
class AutoSave {
    constructor() {
        this.debounceTimer = null;
        this.init();
    }

    init() {
        const sourceTextarea = document.getElementById('source-code');
        if (sourceTextarea) {
            sourceTextarea.addEventListener('input', () => {
                this.debouncedSave();
            });
            
            // Load saved content on page load
            this.loadSavedContent();
        }
    }

    debouncedSave() {
        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => {
            this.saveContent();
        }, 1000); // Save after 1 second of no typing
    }

    saveContent() {
        const sourceTextarea = document.getElementById('source-code');
        if (sourceTextarea) {
            localStorage.setItem('codevertex-source-code', sourceTextarea.value);
        }
    }

    loadSavedContent() {
    const saved = localStorage.getItem('codevertex-source-code');
    const sourceTextarea = document.getElementById('source-code');
    
    if (saved && sourceTextarea) {
        localStorage.removeItem('codevertex-source-code'); 
    }
}

}

// Initialize auto-save
document.addEventListener('DOMContentLoaded', () => {
    new AutoSave();
});
