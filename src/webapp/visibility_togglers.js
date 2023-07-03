import { $, qS } from "./DOM_helpers.js";

const messagesBackgroundOverlay = qS("overlay");
const postsWrapper = qS("posts-wrapper");
const threadWrapper = qS("thread-wrapper");
const messagesWrapper = qS("messages-wrapper");

const profile = qS("user-profile-container");
const logout = $("logout-user");
const adsArea = qS("ads-area");
const loginArea = qS("login-area");
const registerArea = qS("register-area");
const userArea = qS("user-list");

export function hide(x) {
  return x.classList.add("hidden");
}
export function show(x) {
  return x.classList.remove("hidden");
}

export function toggleMessageBoxVisibility(makeVisible) {
  if (makeVisible) {
    messagesBackgroundOverlay.style.zIndex = "1"; // bring overlay in front of posts area
    show(messagesWrapper.parentElement); // make messages box visible
  } else {
    messagesBackgroundOverlay.style.zIndex = "-1";
    hide(messagesWrapper.parentElement); // make messages box hidden
  }
}

export function toggleThreadVisibility(makeVisible) {
  if (makeVisible) {
    hide(postsWrapper.parentElement); // make posts hidden
    show(threadWrapper.parentElement); // make thread visible
  } else {
    show(postsWrapper.parentElement);
    hide(threadWrapper.parentElement);
  }
}

export function toggleLoginVisibility(makeVisible) {
  if (makeVisible) {
    toggleMessageBoxVisibility(false);
    hide(adsArea);
    hide(postsWrapper.parentElement);
    hide(userArea);
    hide(profile);
    hide(registerArea);
    logout.innerHTML = "Login";
    show(loginArea);
  } else {
    show(adsArea);
    show(postsWrapper.parentElement);
    show(userArea);
    show(profile);

    logout.innerHTML = "Logout";
    hide(loginArea);
  }
}

export function toggleRegisterVisibility(makeVisible) {
  if (makeVisible) {
    hide(adsArea);
    hide(postsWrapper.parentElement);
    hide(userArea);
    hide(profile);
    hide(loginArea);
    logout.innerHTML = "Login";
    show(registerArea);
  } else {
    show(adsArea);
    show(postsWrapper.parentElement);
    show(userArea);
    show(profile);
    logout.innerHTML = "Logout";
    hide(registerArea);
  }
}
