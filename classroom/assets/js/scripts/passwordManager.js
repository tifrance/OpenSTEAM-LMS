if ($_GET('page')) {
    let page = $_GET('page');
    switch (page) {
        case 'update':
            $("#password-change-container").toggle();
            break;
        default:
            break;
    }
} else {
    $('#password-recovery').toggle();
}

function changeTypeInputPassword(input) {
    if ($('#' + input).attr('type') == "password")
        $('#' + input).prop('type', 'text');
    else
        $('#' + input).prop('type', 'password');
}

function displayNotification(div, message, status, options = '{}') {
    let randId = Math.floor(Math.random() * Math.floor(10000))
    let html = `<div id='notif-` + randId + `' class="vitta-notif status-` + status + `" data-i18n="` + message + `" data-i18n-options=` + options + `><div class="vitta-notif-exit-btn"><i class="fa fa-times-circle"></i></div></div>`
    $(div).append(html)
    $(div).localize()
    
    let notificationElement = $('#notif-' + randId);
    let notificationText = notificationElement.text().trim();
    notifyA11y(notificationText);
    
    setTimeout(function () {
        $('#notif-' + randId).remove()
    }, 15000);
}

function showFormInputError(id) {
    document.getElementById(id).classList.add('form-input-error');
}

function passwordFormCheck(formData) {
    let formValues = {
            'password': {
                value: formData.get('password'),
                id: 'profile-form-password'
            },
            'confirmPassword': {
                value: formData.get('confirm-password'),
                id: 'profile-form-confirm-password'
            }
        },
        errors = [];
    for (let input in formValues) {
        let currentElt = document.getElementById(formValues[input].id);
        if (currentElt.classList.contains('form-input-error')) {
            currentElt.classList.remove('form-input-error');
        }
    }

    if (!formValues.password.value.length > 7) {
        errors.push('invalidPassword');
        showFormInputError(formValues.password.id);
    }

    if (formValues.password.value != formValues.confirmPassword.value) {
        errors.push('passwordAndConfirmMismatch');
        showFormInputError(formValues.password.id);
        showFormInputError(formValues.confirmPassword.id);
    }

    if (errors.length) {
        for (let error of errors) {
            displayNotification('#notif-div', `classroom.notif.${error}`, "error");
        }
        return false;
    } else {
        return true;
    }
}

function checkMailValid() {
    if (!$('#form-email').val().match(
            /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/
        )) {
        displayNotification('#notif-div', `classroom.notif.invalidEmail`, "error");
        return false
    }
    return true
}


document.getElementById('password-change-form').addEventListener('submit', (e) => {
    e.preventDefault();
    let data = new FormData(e.target);
    let token = getCookie('token');
    if (passwordFormCheck(data)) {
        finalizePasswordChange(data, token).then((response) => {
            if (response.changed == true) {
                $("#profile-form-password").val("");
                $("#profile-form-confirm-password").val("");
                displayNotification('#notif-div', "manager.account.passwordUpdatedMessage",
                    "success");
                $('#password-change-container').toggle();
                $('#password-updated-success').toggle();
            } else {
                if (response.message) {
                    if (response.message == "no user") {
                        displayNotification('#notif-div',
                            "manager.account.noUserFoundToken",
                            "error");
                    } else if (response.message == "missing data") {
                        displayNotification('#notif-div',
                            "manager.account.missingData",
                            "error");
                    }
                }
            }
        });
    }
});


function sendMail() {
    if (!checkMailValid()) return;
    
    sendRecoveryMail().then((response) => {
        if (response.emailSent) {
            toggleElementDisplay('email-send-success');
            toggleElementDisplay('password-recovery');
        } else if (response.message) {
            const errorMessages = {
                "sending error": "manager.account.errorSending",
                "no user": "manager.account.noUserFound",
                "missing data": "manager.account.missingData"
            };
            
            const notificationKey = errorMessages[response.message];
            if (notificationKey) {
                displayNotification('#notif-div', notificationKey, "error");
            }
        }
    });
}

// Helper function to toggle element display with existence check
function toggleElementDisplay(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.style.display = element.style.display === 'none' ? 'block' : 'none';
    } else {
        console.warn(`Element with ID '${elementId}' not found in the DOM`);
    }
}


function sendRecoveryMail(formData) {
    return new Promise((resolve, reject) => {
        $.ajax({
            type: 'POST',
            url: '/routing/Routing.php?controller=groupadmin&action=get_recovery_mail',
            data: {
                'mail': $('#form-email').val(),
            },
            success: function (response) {
                resolve(JSON.parse(response));
            },
            error: function () {
                reject();
            }
        });
    });
}


function finalizePasswordChange(formData, token) {
    return new Promise((resolve, reject) => {
        $.ajax({
            type: 'POST',
            url: '/routing/Routing.php?controller=groupadmin&action=password_change',
            data: {
                'password': formData.get('password'),
                'token': token
            },
            success: function (response) {
                resolve(JSON.parse(response));
            },
            error: function () {
                reject();
            }
        });
    });
}

function goToLogin() {
    document.location = "/classroom/login.php";
}

function goToRecovery() {
    document.location = "/classroom/password_manager.php";
}