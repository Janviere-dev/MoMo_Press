// Login functionality
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const identifierInput = document.getElementById('identifier');
    const passwordInput = document.getElementById('password');
    const togglePasswordBtn = document.getElementById('togglePassword');
    const rememberMeCheckbox = document.getElementById('rememberMe');

    // Password toggle functionality
    togglePasswordBtn.addEventListener('click', function() {
        const icon = this.querySelector('i');
        
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
        } else {
            passwordInput.type = 'password';
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
        }
    });

    // Load remembered credentials
    const rememberedPhone = localStorage.getItem('momopress_remembered_phone');
    if (rememberedPhone) {
        identifierInput.value = rememberedPhone;
        rememberMeCheckbox.checked = true;
    }

    // Rwandan MTN phone validation (allows spaces anywhere)
    function validateRwandanPhone(phone) {
        // Remove all spaces, dashes, parentheses
        const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
        // Rwandan MTN numbers: 078/079 or +250 78/79 followed by 7 digits
        const rwandaRegex = /^(\+?250|0)?(78|79)\d{7}$/;
        return rwandaRegex.test(cleanPhone);
    }

    // Normalize phone number (convert to +250 format)
    function normalizePhone(phone) {
        // Remove all spaces, dashes, parentheses
        const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
        
        if (cleanPhone.startsWith('+250')) {
            return cleanPhone;
        } else if (cleanPhone.startsWith('250')) {
            return '+' + cleanPhone;
        } else if (cleanPhone.startsWith('0')) {
            return '+250' + cleanPhone.substring(1);
        } else {
            return '+250' + cleanPhone;
        }
    }

    // Form submission
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Clear all errors
        document.querySelectorAll('.error-message').forEach(el => el.style.display = 'none');
        document.querySelectorAll('.form-input').forEach(el => el.classList.remove('error'));
        
        let isValid = true;

        // Validate phone
        if (!validateRwandanPhone(identifierInput.value)) {
            document.getElementById('identifierError').textContent = 'Please enter a valid Rwandan MTN number (078/079...)';
            document.getElementById('identifierError').style.display = 'block';
            identifierInput.classList.add('error');
            isValid = false;
        }

        // Validate password
        if (passwordInput.value.length === 0) {
            document.getElementById('passwordError').textContent = 'Password is required';
            document.getElementById('passwordError').style.display = 'block';
            passwordInput.classList.add('error');
            isValid = false;
        }

        if (isValid) {
            const normalizedPhone = normalizePhone(identifierInput.value);
            
            // Get users from localStorage(db)
            const users = JSON.parse(localStorage.getItem('momopress_users') || '[]');
            const user = users.find(u => u.phone === normalizedPhone);

            if (!user) {
                document.getElementById('identifierError').textContent = 'Account not found. Please sign up.';
                document.getElementById('identifierError').style.display = 'block';
                identifierInput.classList.add('error');
                return;
            }

            if (user.password !== passwordInput.value) {
                document.getElementById('passwordError').textContent = 'Incorrect password';
                document.getElementById('passwordError').style.display = 'block';
                passwordInput.classList.add('error');
                return;
            }

            // Handle remember me
            if (rememberMeCheckbox.checked) {
                localStorage.setItem('momopress_remembered_phone', normalizedPhone);
            } else {
                localStorage.removeItem('momopress_remembered_phone');
            }

            // Save current session
            localStorage.setItem('momopress_current_user', JSON.stringify({
                fullName: user.fullName,
                phone: user.phone,
                loginTime: new Date().toISOString()
            }));

            // Show success and redirect
            alert('Login successful!');
            
            // Redirect to personalized page
            window.location.href = '../html/personalize.html';
        }
    });
});