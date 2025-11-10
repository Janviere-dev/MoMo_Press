// Signup functionality
document.addEventListener('DOMContentLoaded', function() {
    const signupForm = document.getElementById('signupForm');
    const fullNameInput = document.getElementById('fullName');
    const phoneInput = document.getElementById('phone');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const togglePasswordBtns = document.querySelectorAll('.password-toggle');

    // Password toggle functionality
    togglePasswordBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const input = this.parentElement.querySelector('input');
            const icon = this.querySelector('i');
            
            if (input.type === 'password') {
                input.type = 'text';
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            } else {
                input.type = 'password';
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            }
        });
    });

    // Rwandan MTN phone validation (allows spaces anywhere)
    function validateRwandanPhone(phone) {
        // Remove all spaces, dashes, parentheses
        const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
        // Rwandan MTN numbers: 078/079 or +250 78/79 followed by 7 digits
        const rwandaRegex = /^(\+?250|0)?(78|79)\d{7}$/;
        return rwandaRegex.test(cleanPhone);
    }

    // Password strength checker
    function checkPasswordStrength(password) {
        const strengthFill = document.getElementById('strengthFill');
        const strengthText = document.getElementById('strengthText');
        
        if (!password) {
            strengthFill.style.width = '0%';
            strengthText.textContent = '';
            strengthFill.className = 'strength-fill';
            return;
        }

        let strength = 0;
        if (password.length >= 6) strength++;
        if (password.length >= 10) strength++;
        if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
        if (/\d/.test(password)) strength++;
        if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++;

        const strengthLevels = ['Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
        const strengthColors = ['weak', 'fair', 'good', 'strong', 'very-strong'];
        const widthPercent = (strength / 5) * 100;

        strengthFill.style.width = widthPercent + '%';
        strengthFill.className = 'strength-fill ' + strengthColors[strength - 1];
        strengthText.textContent = strengthLevels[strength - 1];
    }

    // Real-time phone validation
    phoneInput.addEventListener('input', function() {
        const phoneError = document.getElementById('phoneError');
        const phoneSuccess = document.getElementById('phoneSuccess');
        
        if (this.value.length > 0) {
            if (validateRwandanPhone(this.value)) {
                phoneError.style.display = 'none';
                phoneSuccess.style.display = 'block';
                this.classList.remove('error');
            } else {
                phoneError.textContent = 'Please enter a valid Rwandan MTN number (078/079...)';
                phoneError.style.display = 'block';
                phoneSuccess.style.display = 'none';
                this.classList.add('error');
            }
        } else {
            phoneError.style.display = 'none';
            phoneSuccess.style.display = 'none';
            this.classList.remove('error');
        }
    });

    // Real-time password strength checking
    passwordInput.addEventListener('input', function() {
        checkPasswordStrength(this.value);
    });

    // Real-time confirm password validation
    confirmPasswordInput.addEventListener('input', function() {
        const confirmError = document.getElementById('confirmPasswordError');
        const confirmSuccess = document.getElementById('confirmPasswordSuccess');
        
        if (this.value.length > 0) {
            if (this.value === passwordInput.value) {
                confirmError.style.display = 'none';
                confirmSuccess.style.display = 'block';
                this.classList.remove('error');
            } else {
                confirmError.textContent = 'Passwords do not match';
                confirmError.style.display = 'block';
                confirmSuccess.style.display = 'none';
                this.classList.add('error');
            }
        } else {
            confirmError.style.display = 'none';
            confirmSuccess.style.display = 'none';
            this.classList.remove('error');
        }
    });

    // Form submission
    signupForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Clear all errors
        document.querySelectorAll('.error-message').forEach(el => el.style.display = 'none');
        document.querySelectorAll('.form-input').forEach(el => el.classList.remove('error'));
        
        let isValid = true;

        // Validate full name
        if (fullNameInput.value.trim() === '') {
            document.getElementById('fullNameError').textContent = 'Full name is required';
            document.getElementById('fullNameError').style.display = 'block';
            fullNameInput.classList.add('error');
            isValid = false;
        }

        // Validate phone
        if (!validateRwandanPhone(phoneInput.value)) {
            document.getElementById('phoneError').textContent = 'Please enter a valid Rwandan MTN number (078/079...)';
            document.getElementById('phoneError').style.display = 'block';
            phoneInput.classList.add('error');
            isValid = false;
        }

        // Validate password
        if (passwordInput.value.length < 6) {
            document.getElementById('passwordError').textContent = 'Password must be at least 6 characters';
            document.getElementById('passwordError').style.display = 'block';
            passwordInput.classList.add('error');
            isValid = false;
        }

        // Validate confirm password
        if (confirmPasswordInput.value !== passwordInput.value) {
            document.getElementById('confirmPasswordError').textContent = 'Passwords do not match';
            document.getElementById('confirmPasswordError').style.display = 'block';
            confirmPasswordInput.classList.add('error');
            isValid = false;
        }

        if (isValid) {
            // Normalize phone number (convert to +250 format)
            const cleanPhone = phoneInput.value.replace(/[\s\-\(\)]/g, '');
            let normalizedPhone;
            
            if (cleanPhone.startsWith('+250')) {
                normalizedPhone = cleanPhone;
            } else if (cleanPhone.startsWith('250')) {
                normalizedPhone = '+' + cleanPhone;
            } else if (cleanPhone.startsWith('0')) {
                normalizedPhone = '+250' + cleanPhone.substring(1);
            } else {
                normalizedPhone = '+250' + cleanPhone;
            }

            // Check if user already exists
            const users = JSON.parse(localStorage.getItem('momopress_users') || '[]');
            const existingUser = users.find(u => u.phone === normalizedPhone);
            
            if (existingUser) {
                document.getElementById('phoneError').textContent = 'This phone number is already registered';
                document.getElementById('phoneError').style.display = 'block';
                phoneInput.classList.add('error');
                return;
            }

            // Save user to localStorage
            const newUser = {
                fullName: fullNameInput.value.trim(),
                phone: normalizedPhone,
                password: passwordInput.value,
                createdAt: new Date().toISOString()
            };

            users.push(newUser);
            localStorage.setItem('momopress_users', JSON.stringify(users));

            // Show success message
            alert('Account created successfully! Please sign in.');
            
            // Redirect to login page
            window.location.href = 'login.html';
        }
    });
});