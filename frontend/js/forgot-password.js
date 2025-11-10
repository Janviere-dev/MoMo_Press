// Forgot Password functionality
document.addEventListener('DOMContentLoaded', function() {
    let currentStep = 1;
    let userPhone = '';
    let verificationCode = '';
    let resendTimer = null;

    // Elements
    const step1 = document.getElementById('step1');
    const step2 = document.getElementById('step2');
    const step3 = document.getElementById('step3');
    const successStep = document.getElementById('successStep');
    
    const step1Dot = document.getElementById('step1Dot');
    const step2Dot = document.getElementById('step2Dot');
    const step3Dot = document.getElementById('step3Dot');
    
    const pageTitle = document.getElementById('pageTitle');
    const pageSubtitle = document.getElementById('pageSubtitle');
    
    const identifierInput = document.getElementById('identifier');
    const sendCodeBtn = document.getElementById('sendCodeBtn');
    
    const codeInputs = [
        document.getElementById('code1'),
        document.getElementById('code2'),
        document.getElementById('code3'),
        document.getElementById('code4')
    ];
    const verifyCodeBtn = document.getElementById('verifyCodeBtn');
    const resendBtn = document.getElementById('resendBtn');
    const timerSpan = document.getElementById('timer');
    const backToEmailBtn = document.getElementById('backToEmailBtn');
    
    const newPasswordInput = document.getElementById('newPassword');
    const confirmNewPasswordInput = document.getElementById('confirmNewPassword');
    const toggleNewPasswordBtn = document.getElementById('toggleNewPassword');
    const toggleConfirmNewPasswordBtn = document.getElementById('toggleConfirmNewPassword');
    const resetPasswordBtn = document.getElementById('resetPasswordBtn');

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

    // Generate random 4-digit code
    function generateVerificationCode() {
        return Math.floor(1000 + Math.random() * 9000).toString();
    }

    // Show step
    function showStep(step) {
        [step1, step2, step3, successStep].forEach(s => s.classList.remove('active'));
        [step1Dot, step2Dot, step3Dot].forEach(d => d.classList.remove('active'));
        
        if (step === 1) {
            step1.classList.add('active');
            step1Dot.classList.add('active');
            pageTitle.textContent = 'Forgot Password?';
            pageSubtitle.textContent = "Enter your phone number and we'll send you a verification code";
        } else if (step === 2) {
            step2.classList.add('active');
            step1Dot.classList.add('active');
            step2Dot.classList.add('active');
            pageTitle.textContent = 'Verify Code';
            pageSubtitle.textContent = `Enter the 4-digit code sent to ${userPhone}`;
        } else if (step === 3) {
            step3.classList.add('active');
            step1Dot.classList.add('active');
            step2Dot.classList.add('active');
            step3Dot.classList.add('active');
            pageTitle.textContent = 'Reset Password';
            pageSubtitle.textContent = 'Enter your new password';
        } else if (step === 4) {
            successStep.classList.add('active');
            pageTitle.textContent = 'Password Reset Successful!';
            pageSubtitle.textContent = 'Your password has been reset successfully';
        }
        
        currentStep = step;
    }

    // Start resend timer
    function startResendTimer() {
        let timeLeft = 60;
        resendBtn.disabled = true;
        
        resendTimer = setInterval(() => {
            timeLeft--;
            timerSpan.textContent = `(${timeLeft}s)`;
            
            if (timeLeft <= 0) {
                clearInterval(resendTimer);
                resendBtn.disabled = false;
                timerSpan.textContent = '';
            }
        }, 1000);
    }

    // Password toggle functionality
    [toggleNewPasswordBtn, toggleConfirmNewPasswordBtn].forEach(btn => {
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

    // Code input navigation
    codeInputs.forEach((input, index) => {
        input.addEventListener('input', function() {
            if (this.value.length === 1 && index < 3) {
                codeInputs[index + 1].focus();
            }
        });
        
        input.addEventListener('keydown', function(e) {
            if (e.key === 'Backspace' && this.value === '' && index > 0) {
                codeInputs[index - 1].focus();
            }
        });
    });

    // Step 1: Send verification code
    sendCodeBtn.addEventListener('click', function() {
        const identifierError = document.getElementById('identifierError');
        identifierError.style.display = 'none';
        identifierInput.classList.remove('error');
        
        if (!validateRwandanPhone(identifierInput.value)) {
            identifierError.textContent = 'Please enter a valid Rwandan MTN number (078/079...)';
            identifierError.style.display = 'block';
            identifierInput.classList.add('error');
            return;
        }
        
        userPhone = normalizePhone(identifierInput.value);
        
        // Check if user exists
        const users = JSON.parse(localStorage.getItem('momopress_users') || '[]');
        const user = users.find(u => u.phone === userPhone);
        
        if (!user) {
            identifierError.textContent = 'No account found with this phone number';
            identifierError.style.display = 'block';
            identifierInput.classList.add('error');
            return;
        }
        
        // Generate and store verification code
        verificationCode = generateVerificationCode();
        console.log('Verification code:', verificationCode); // In real time, this would be sent via SMS instead of demo code 
        alert(`Verification code sent! (For demo: ${verificationCode})`);
        
        showStep(2);
        startResendTimer();
        codeInputs[0].focus();
    });

    // Resend code
    resendBtn.addEventListener('click', function() {
        verificationCode = generateVerificationCode();
        console.log('New verification code:', verificationCode);
        alert(`New verification code sent! (For demo: ${verificationCode})`);
        
        codeInputs.forEach(input => input.value = '');
        document.getElementById('codeError').style.display = 'none';
        startResendTimer();
        codeInputs[0].focus();
    });

    // Back to Phone number 
    backTophoneNumberBtn.addEventListener('click', function(e) {
        e.preventDefault();
        showStep(1);
        if (resendTimer) clearInterval(resendTimer);
    });

    // Step 2: Verify code
    verifyCodeBtn.addEventListener('click', function() {
        const enteredCode = codeInputs.map(input => input.value).join('');
        const codeError = document.getElementById('codeError');
        
        if (enteredCode.length !== 4) {
            codeError.textContent = 'Please enter the complete 4-digit code';
            codeError.style.display = 'block';
            return;
        }
        
        if (enteredCode !== verificationCode) {
            codeError.textContent = 'Invalid verification code. Please try again.';
            codeError.style.display = 'block';
            codeInputs.forEach(input => {
                input.value = '';
                input.classList.add('error');
            });
            codeInputs[0].focus();
            return;
        }
        
        codeError.style.display = 'none';
        if (resendTimer) clearInterval(resendTimer);
        showStep(3);
    });

    // Step 3: Reset your password
    resetPasswordBtn.addEventListener('click', function() {
        const newPasswordError = document.getElementById('newPasswordError');
        const confirmNewPasswordError = document.getElementById('confirmNewPasswordError');
        
        // Clear errors
        newPasswordError.style.display = 'none';
        confirmNewPasswordError.style.display = 'none';
        newPasswordInput.classList.remove('error');
        confirmNewPasswordInput.classList.remove('error');
        
        let isValid = true;
        
        // Validate your new password
        if (newPasswordInput.value.length < 6) {
            newPasswordError.textContent = 'Password must be at least 6 characters';
            newPasswordError.style.display = 'block';
            newPasswordInput.classList.add('error');
            isValid = false;
        }
        
        // Validate confirmed password
        if (confirmNewPasswordInput.value !== newPasswordInput.value) {
            confirmNewPasswordError.textContent = 'Passwords do not match';
            confirmNewPasswordError.style.display = 'block';
            confirmNewPasswordInput.classList.add('error');
            isValid = false;
        }
        
        if (isValid) {
            // Update password in localStorage
            const users = JSON.parse(localStorage.getItem('momopress_users') || '[]');
            const userIndex = users.findIndex(u => u.phone === userPhone);
            
            if (userIndex !== -1) {
                users[userIndex].password = newPasswordInput.value;
                localStorage.setItem('momopress_users', JSON.stringify(users));
                
                showStep(4);
                
                // Redirect to login after 2 seconds
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 2000);
            }
        }
    });
});