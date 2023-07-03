import { createDiv, $ } from "./DOM_helpers.js";
import { currentUser, start } from "./app.js";
import { toggleLoginVisibility } from "./visibility_togglers.js";
import { userConnected } from "./ws.js";

const patterns = {
    "username-register": /^[a-zA-Z\d]{1,15}$/,
    // this rexex may contain an unnecessary escape character (the backsplash before the dot)
    "email-register": /^([a-z\d\.]+)@([a-z\d]+)\.([a-z]{2,8})$/,
    "password-register": /^[\w]{1,15}$/,
}

export const newPostValidation = () => {

    let data = new FormData($('new-post'));
    let dataToSend = Object.fromEntries(data)

    let errors = document.getElementsByClassName('error-message');
    while (errors[0]) {
        errors[0].parentNode.removeChild(errors[0]);
    }

    if (dataToSend.title == "") {
        badValidation("title", "Please add a title")
        return false
    } else {
        let title_input_area = $("titleID")
        title_input_area.style.borderColor = "";
    }

    if (dataToSend.content == "") {
        badValidation("content", "We are not mind-readers")
        return false
    } else {
        let input_area = $("contentID")
        input_area.style.borderColor = "";
    }

    return true
}

export const newCommentValidation = () => {

    let data = new FormData($('new-comment'));
    let dataToSend = Object.fromEntries(data)

    let errors = document.getElementsByClassName('error-message');
    while (errors[0]) {
        errors[0].parentNode.removeChild(errors[0]);
    }

    if (dataToSend.content == "") {
        badValidation("commentContent", "We are not mind-readers")
        return false
    } else {
        let input_area = $("commentContentID")
        input_area.style.borderColor = "";
    }

    return true
}

export const newMessageValidation = () => {

    let data = new FormData($('new-message'));
    let dataToSend = Object.fromEntries(data)

    let errors = document.getElementsByClassName('error-message');
    while (errors[0]) {
        errors[0].parentNode.removeChild(errors[0]);
    }

    if (dataToSend.message == "") {
        badValidation("message", "We are not mind-readers")
        return false
    } else {
        let input_area = $("messageID")
        input_area.style.borderColor = "";
    }

    return true
}

export const loginValidation = () => {
    let data = new FormData($('login-form'));
    let dataToSend = Object.fromEntries(data)

    let errors = document.getElementsByClassName('error-message');
    while (errors[0]) {
        errors[0].parentNode.removeChild(errors[0]);
    }

    if (dataToSend.username_login == "") {
        badValidation("username_login", "Please add a username")
        return false
    } else {
        let username_input_area = $("username_loginID")
        username_input_area.style.borderColor = "";
    }

    if (dataToSend.password_login == "") {
        badValidation("password_login", "Please enter password")
        return false
    } else {
        let input_area = $("password_loginID")
        input_area.style.borderColor = "";
    }

    return true
}

export const signUpValidation = () => {

    let data = new FormData($('register-form'));
    let dataToSend = Object.fromEntries(data)

    let errors = document.getElementsByClassName('error-message');
    while (errors[0]) {
        errors[0].parentNode.removeChild(errors[0]);
    }


    for (const [key, value] of Object.entries(dataToSend)) {
        switch (key) {
            case "username-register":
                if (!validateRegex(key, value, "Username needs to be up to 1-15 alphanumerical characters")) {
                    return false
                }
                break;
            case "email-register":
                if (!validateRegex(key, value, "Insert valid email, e.x. your@domain.com")) {
                    return false
                }
                break;
            case "password-register":
                if (!validateRegex(key, value, "Password needs to be up to 1-15 alphanumerical characters")) {
                    return false
                }
                break;
            case "password-register-confirm":
                if (value !== dataToSend["password-register"]) {
                    badValidation("password-register-confirm", "Passwords don't match")
                    return false
                } else {
                    goodValidation("password-register-confirm")
                }
                break;
            default:
                return true
        }
    }
}

function validateRegex(field, value, requirement) {
    if (!patterns[field].test(value)) {
        badValidation(field, requirement)
        return false
    } else {
        goodValidation(field)
        return true
    }
}

export function badValidation(field, requirement) {
    let input_area = $(field + "ID")
    input_area.style.borderColor = 'red'
    let errorMessage = createDiv('error-message', requirement, 'error-message');
    input_area.parentNode.insertBefore(errorMessage, input_area)

}

function goodValidation(field) {
    let div = $(field + "ID")
    div.style.borderColor = 'green'
}

export function checkCookie() {
    //let currentUser
    if (document.cookie == "") {
        toggleLoginVisibility(true)
    } else {
        let user_uuid = getCookie();

        fetch('/src/server/checkCookieHandler', {
            method: "POST",
            headers: { 'Content-Type': 'application/json' },
            body: user_uuid
        })

            .then((res) => {
                if (res.ok) {
                    toggleLoginVisibility(false)
                    start()
                    return res.json()
                } else {
                    throw res.statusText
                }
            })

            .then((result) => {
                //set username to result.user
                userConnected(result.user)
                currentUser.innerHTML = result.user;
            })

            .catch((error) => {
                console.error('Error:', error);
            });
    }
}

export function createNewCookie(uuid) {
    const d = new Date();
    // Make cookie last for 2 hours
    d.setTime(d.getTime() + (2 * 60 * 60 * 1000));
    let expires = "expires=" + d.toUTCString();
    document.cookie = "username=" + encodeURI(uuid) + "; Path=/; " + expires + ";";
}

export function getCookie() {
    let decodedCookie = decodeURIComponent(document.cookie);
    let ca = decodedCookie.split('=');
    return ca[1]
}
