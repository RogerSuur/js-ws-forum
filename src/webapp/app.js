import { createDiv, $, qS } from "./DOM_helpers.js";
import { startHeaderClock } from "./header_clock.js";
import {
  getJSON,
  logoutJSON,
  makeNewCommentJSON,
  signUpJSON,
  loginJSON,
  makeNewPostJSON,
} from "./read_JSON.js";
import { initPosts } from "./posts.js";
import { initMessages } from "./messages.js";
import { populateUsers } from "./users.js";
import { Forum, socket, sendMessage, sendTyping } from "./ws.js";
import {
  getCookie,
  newPostValidation,
  newCommentValidation,
  newMessageValidation,
  signUpValidation,
  loginValidation,
} from "./validate.js";
import {
  toggleMessageBoxVisibility,
  toggleThreadVisibility,
  toggleLoginVisibility,
  toggleRegisterVisibility,
} from "./visibility_togglers.js";
import { sentinels, initPostIntersectionObserver } from "./infinity_scroll.js";

new Forum();
startHeaderClock;

export const postsWrapper = qS("posts-wrapper");
export const threadWrapper = qS("thread-wrapper");
export const messagesWrapper = qS("messages-wrapper");

let postsObject = { posts: [] };
let messagesObject = { messages: [] };
// export let currentUser = 'Petra Marsh';
export let currentUser = $("current-userID");
export let otherUser;

const nrOfItemsToLoad = 10;
export let pDB = postsObject.posts;
export let mDB = messagesObject.messages;
export let isThread = false;

export let currentIndex = 0,
  postsIndex,
  messagesIndex = mDB.length;
let firstTyping = false;

function signUp() {
  let data = new FormData($("register-form"));
  let dataToSend = Object.fromEntries(data);

  signUpJSON(dataToSend);
}

function login() {
  let data = new FormData($("login-form"));
  let dataToSend = Object.fromEntries(data);

  loginJSON(dataToSend);
}

export const start = async () => {
  await getPosts().then(() => {
    makeLinksClickable();
  });
  getUsers();
};

/* Loads next batch of posts */
export async function getPosts(
  index = currentIndex,
  prepend = false,
  isThread = false
) {
  if (!isThread) {
    postsObject = await getJSON("/src/server/getPostsHandler");
    pDB = postsObject.posts;
  }

  if (index + nrOfItemsToLoad > pDB.length) {
    initPosts(pDB, index, pDB.length, isThread, prepend);
  } else {
    initPosts(pDB, index, index + nrOfItemsToLoad, isThread, prepend);
  }
  currentIndex = index + nrOfItemsToLoad;
}

/* Loads next batch of messages in a conversation */
export async function getMessages(toUser) {
  await updateMessages(currentUser.innerHTML, toUser);
  if (messagesIndex == 0) {
    messagesIndex = mDB.length;
  }
  if (messagesIndex - nrOfItemsToLoad < 0) {
    initMessages(mDB, messagesIndex, 0, toUser);
    messagesIndex = 0;
  } else {
    initMessages(mDB, messagesIndex, messagesIndex - nrOfItemsToLoad, toUser);
    messagesIndex = messagesIndex - nrOfItemsToLoad;
  }
}

export async function updateMessages(sender, receiver) {
  try {
    const query = {
      sender: sender,
      receiver: receiver,
    };
    let response = await fetch("/src/server/getMessagesHandler", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-cache",
      body: JSON.stringify(query),
    });
    let data = await response.json();
    if (data.data.messages == undefined || data.data.messages == null) {
      return (mDB = [{ content: "#beginningofconversation#" }]);
    }
    return (mDB = await data.data.messages);
  } catch (err) {
    console.error("Updating messages:", err);
  }
}

async function updateComments(postID) {
  try {
    const query = {
      postID: postID.toString(),
    };
    let response = await fetch("/src/server/getCommentsHandler", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-cache",
      body: JSON.stringify(query),
    });
    let data = await response.json();
    return (pDB = await data.data.comments);
  } catch (err) {
    console.error("Updating comments:", err);
  }
}

/* Loads user lists and creates event listeners for them to load the conversations */
export async function getUsers() {
  await populateUsers();
  const userElements = document.querySelectorAll(".user-name");
  userElements.forEach((user) => {
    user.addEventListener("click", () => {
      toggleMessageBoxVisibility(true);
      firstTyping = true;
      let interSection = $("message-intersection-observer");
      messagesWrapper.innerHTML = ""; // clear messages box contents
      messagesWrapper.appendChild(interSection);
      otherUser = user.id;

      let notification = user.querySelector(".notification");
      if (notification) {
        notification.remove();
      }

      messagesIndex = 0;
      sentinels.topSentinelPreviousY = 0;
      getMessages(otherUser);
      messagesWrapper.scrollTop = messagesWrapper.scrollHeight; // scroll to bottom of messages (to the last message)
      qS(
        "messages-header-text"
      ).textContent = `Your conversation with ${otherUser}`;
    });
  });

  qS("close-messages-button").addEventListener("click", () => {
    toggleMessageBoxVisibility(false);
    clearTimeout(typingTimer);
    firstTyping = false;
    messagesIndex = mDB.length;
    $("messageID").value = "";
  });
}

$("register-form").addEventListener("submit", (e) => {
  if (signUpValidation()) {
    signUp();
  }
  e.preventDefault(); // prevent page reload
});

$("login-form").addEventListener("submit", (e) => {
  if (loginValidation()) {
    login();
  }
  e.preventDefault(); // prevent page reload
});

$("register").addEventListener("click", () => {
  toggleRegisterVisibility(true);
});

$("back-to-login").addEventListener("click", () => {
  toggleLoginVisibility(true);
});

$("new-post").addEventListener("submit", (e) => {
  if (newPostValidation()) {
    makeNewPost();
  }
  e.preventDefault();
});

$("new-comment").addEventListener("submit", (e) => {
  if (newCommentValidation()) {
    makeNewComment();
  }
  e.preventDefault();
});

var typingTimer; //timer identifier
var resetTime = 1500;

$("messageID").addEventListener("keydown", (e) => {
  if (firstTyping) {
    sendTyping();
  }
  clearTimeout(typingTimer);
  typingTimer = setTimeout(() => {
    firstTyping = false;
    sendTyping();
  }, resetTime);

  if (e.code === "Enter" || e.code === "NumpadEnter") {
    checkSocketAndSend();
    e.preventDefault();
    clearTimeout(typingTimer);
    // here an 'else' block triggers typing-in-progress
    // make a buffer for it so it wouldnt trigger with every key
  }
});

function doneTyping() {
  console.log("doneTyping");
  sendTyping();
}

$("send-message").addEventListener("click", (e) => {
  checkSocketAndSend();
  e.preventDefault();
});

function checkSocketAndSend() {
  if (!socket) {
    console.error("No websocket connection");
    return;
  }
  if (newMessageValidation()) {
    sendMessage();
  }
}

$("logout-user").addEventListener("click", () => {
  let user_uuid = getCookie();

  //fetch to send db request deleting cookie
  logoutJSON(user_uuid);

  document.cookie = "username" + "=" + ";" + "Max-Age=-99999999" + ";path=/;";
  let input_area = $("username_loginID");
  let input_area2 = $("password_loginID");
  input_area.style.borderColor = "";
  input_area2.style.borderColor = "";
  $("login-form").reset();

  toggleLoginVisibility(true);
});

async function makeNewComment() {
  let data = new FormData($("new-comment"));
  let dataToSend = Object.fromEntries(data);

  dataToSend.timestamp = new Date().toISOString();
  dataToSend.user = currentUser.innerHTML;

  await makeNewCommentJSON(dataToSend);

  // resetting form values
  $("new-comment").reset();
}

export function updateCommentCount(postID, markUnread = false) {
  postsWrapper.querySelectorAll(`.post-comments`).forEach((comment) => {
    if (comment.id == postID) {
      let previousComments =
        comment.innerHTML.replace(/^\D+/g, "").replace(" comments", "") * 1;
      comment.innerHTML = comment.innerHTML.replace(
        /\d+/g,
        previousComments + 1
      );
      if (markUnread) {
        comment.classList.add("unread");
      }
    }
  });
}

async function makeNewPost() {
  let data = new FormData($("new-post"));
  let dataToSend = Object.fromEntries(data);

  dataToSend.timestamp = new Date().toISOString();
  dataToSend.comments = 0;
  dataToSend.user = currentUser.innerHTML;

  await makeNewPostJSON(dataToSend);

  // resetting form values
  $("new-post").reset();
}

export function makeLinksClickable() {
  const threadOpeningElements = document.querySelectorAll(
    ".post-title, .post-comments"
  );
  threadOpeningElements.forEach((threadLink) => {
    threadLink.addEventListener("click", () => {
      if (threadLink.classList.contains("unread")) {
        threadLink.classList.remove("unread");
      }
      toggleThreadVisibility(true);
      isThread = true;
      let interSection = $("thread-intersection-observer");
      threadWrapper.innerHTML = ""; // clear thread box contents
      threadWrapper.appendChild(interSection);
      postsIndex = currentIndex;
      updateComments(threadLink.id)
        .then(() => {
          getPosts(0, false, isThread);
          let selectedPost = postsObject.posts.filter(
            (post) => post.postID === threadLink.id
          )[0];
          let category = createDiv(
            "post-category",
            selectedPost.category,
            selectedPost.category
          );
          qS("thread-header-text").innerHTML = selectedPost.title;
          $("parentID").value = selectedPost.postID;
          qS("thread-header-text").prepend(category);
        })
        .then(() => {
          initPostIntersectionObserver(false);
        })
        .catch((err) => {
          console.error("Displaying comments: ", err);
        });
    });
  });

  qS("close-thread-button").addEventListener("click", () => {
    toggleThreadVisibility(false);
    initPostIntersectionObserver(true);
    currentIndex = postsIndex;
    pDB = postsObject.posts;
    isThread = false;
  });
}
