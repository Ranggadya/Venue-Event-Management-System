document.addEventListener('DOMContentLoaded', function () {
    console.log('Admin Dashboard loaded');
    initConfirmDelete();
    initFormValidation();
    initTooltips();
});

function initConfirmDelete() {
    const deleteForms = document.querySelectorAll('form[action*="delete');

    deleteForms.forEach(form => {
        form.addEventListener('submit', function (e) {
            const itemName = this.dataset.itemName || 'item';
            const confirmText = `Are you sure you want to delete this ${itemName}?`;

            if (!confirm(confirmText)) {
                e.preventDefault();
            };
        });
    });
}

function initFormValidation() {
    const forms = document.querySelectorAll('form[data-validate');

    forms.forEach(form => {
        form.addEventListener('submit', function (e) {
            const requiredFields = this.querySelectorAll('[required');
            let isValid = true;

            requiredFields.forEach(field => {
                if (!field.value.trim()) {
                    isValid = false;
                    showFieldError(field, 'This field is required');
                } else {
                    clearFieldError(field);
                }
            });

            if (!isValid) {
                e.preventDefault();
            }
        });
    });
}

function showFieldError(field, message) {
    clearFieldError(field);
    field.classList.add('border-red-500');
    const errorDiv = document.createElement('div');
    errorDiv.className = 'form-error';
    errorDiv.textContent = message;
    field.parentNode.appendChild(errorDiv);
}

function clearFieldError(field) {
    field.classList.remove('border-red-500');
    const existingError = field.parentNode.querySelector('.form-error');
    if (existingError) {
        existingError.remove();
    }
}

function initTooltips() {
    const tooltipTriggers = document.querySelectorAll('[data-tooltip]');

    tooltipTriggers.forEach(trigger => {
        trigger.addEventListener('mouseenter', function () {
            const tooltipText = this.dataset.tooltip;
            const tooltip = createTooltip(tooltipText);
            this.appendChild(tooltip);
        });

        trigger.addEventListener('mouseleave', function () {
            const tooltip = this.querySelector('.tooltip');
            if (tooltip) {
                tooltip.remove();
            }
        });
    });
}

function createTooltip(text) {
    const tooltip = document.createElement('div');
    tooltip.className = 'tooltip absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-50';
    tooltip.textContent = text;
    return tooltip;
}

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

function formatCurrency(amount) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(amount);
}

function formatDate(dateString, format = 'full') {
    const date = new Date(dateString);
    const options = {
        year: 'numeric',
        month: format === 'short' ? 'short' : 'long',
        day: 'numeric',
    };

    if (format === 'full') {
        options.hour = '2-digit';
        options.minute = '2-digit';
    }

    return new Intl.DateTimeFormat('id-ID', options).format(date);
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showToast('Copied to clipboard!', 'success');
    }).catch(err => {
        console.error('Failed to copy:', err);
        showToast('Failed to copy', 'error');
    });
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg text-white animate-fade-in z-50 ${type === 'success' ? 'bg-emerald-500' :
        type === 'error' ? 'bg-red-500' :
            type === 'warning' ? 'bg-amber-500' :
                'bg-blue-500'
        }`;
    toast.textContent = message;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

window.EventManager = {
    debounce,
    formatCurrency,
    formatDate,
    copyToClipboard,
    showToast,
};