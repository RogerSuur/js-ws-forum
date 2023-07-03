export let socket = null;
import {
  currentUser,
  otherUser,
  getUsers,
  mDB,
  messagesWrapper,
  postsWrapper,
  getPosts,
  makeLinksClickable,
  updateCommentCount,
} from "./app.js";
import { createSingleMessage } from "./messages.js";
import { createDiv, $, qS, formatTimeStamp } from "./DOM_helpers.js";
import { hide, show, toggleLoginVisibility } from "./visibility_togglers.js";
import { checkCookie } from "./validate.js";
import { spinner, sleep, loadTime } from "./infinity_scroll.js";

export let webSocketUsers;
let formattedDate = new Date().toISOString();
let shouldCheck = true;

export function Forum() {
  let mDBlength = 0;

  window.onbeforeunload = function () {
    let jsonData = {};
    jsonData["action"] = "left";
    socket.send(JSON.stringify(jsonData));
  };

  document.addEventListener("DOMContentLoaded", function () {
    function startWs() {
      socket = new WebSocket("ws://localhost:8080/ws");

      socket.onopen = () => {
        console.log("Successfully connected to server");
        checkCookie(currentUser.innerHTML);
        shouldCheck = false;
      };

      socket.onclose = () => {
        console.log("Connection closed");

        shouldCheck = true;
        toggleLoginVisibility(true);
      };

      socket.onmessage = (msg) => {
        let data = JSON.parse(msg.data);
        switch (data.action) {
          case "new_post":
            if (data.from != currentUser.innerHTML) {
              let loadMore = createDiv(
                [`load-more`, `posts`],
                `New posts have been added in real time! Load more ...`
              );
              postsWrapper.prepend(loadMore);
              loadMore.addEventListener("click", () => {
                loadMore.remove();
                let postsAreaRect = qS("posts-area").getBoundingClientRect();
                let x = postsAreaRect.left + postsAreaRect.width / 2 - 40;
                let y = postsAreaRect.bottom - 100;
                spinner.setAttribute("style", `left: ${x}px; top: ${y}px;`);
                show(spinner);
                sleep(loadTime);
                hide(spinner);
                getPosts(0, true)
                  .then(() => {
                    makeLinksClickable();
                  })
                  .catch((error) => console.error("Loading new posts:", error));
              });
            }
            break;
          case "new_comment":
            if (data.from != currentUser.innerHTML) {
              updateCommentCount(data.message_id, true);
            }
            break;
          case "list_users":
            webSocketUsers = data.connected_users;
            getUsers();
            break;
          case "typing":
            // display typing to user
            let chatBubble = qS("chat-bubble");
            if (
              chatBubble.style.display === "" ||
              chatBubble.style.display === "none"
            ) {
              chatBubble.style.display = "block";
            } else {
              chatBubble.style.display = "none";
            }
            // toggle the typing class
            break;
          case "broadcast":
            sortUsersbyLastMessage(data.from);
            //check whether to send notification or display msg
            if (!sendNotification(currentUser.innerHTML, data.from)) {
              if (mDB.length - 1 > mDBlength) {
                mDBlength = mDB.length;
              } else {
                mDBlength += 1;
              }
              let newMessage = createSingleMessage(
                mDBlength,
                data.content,
                data.from,
                formatTimeStamp(formattedDate)
              );
              messagesWrapper.prepend(newMessage);
            } else {
              //display notification
              const user = $(`${data.from}`);

              let notification = user.querySelector(".notification");
              if (notification) {
                const currentValue = parseInt(notification.innerHTML);
                notification.innerHTML = currentValue + 1;
              } else {
                notification = document.createElement("span");
                notification.setAttribute("class", "notification");
                user.appendChild(notification);
                notification.innerHTML = 1;
              }
            }
            break;
          default:
            console.log("Unknown action:", data.action);
        }
      };

      socket.onerror = (error) => {
        console.error("Socket:", error);
      };
    }

    function check() {
      if (shouldCheck) {
        console.log("Checking WebSocket connection status...");
        if (!socket || socket.readyState == 3) {
          console.log(
            "WebSocket connection is not open or has been closed. Starting new connection..."
          );
          startWs();
        }
      }
    }

    // Set up the setInterval to call the check function every 5 seconds
    let intervalId = setInterval(check, 5000);
    // Cancel the setInterval after 1 minute (60000 milliseconds)
    setTimeout(() => {
      clearInterval(intervalId);
    }, 60000);

    startWs();
  });
}

export async function sendTyping() {
  const jsonData = {};
  jsonData["action"] = "typing";
  jsonData["from"] = currentUser.innerHTML;
  jsonData["to"] = otherUser;

  socket.send(JSON.stringify(jsonData));
}

//send messages to server
export async function sendMessage() {
  try {
    const jsonData = {};
    jsonData["action"] = "broadcast";
    jsonData["from"] = currentUser.innerHTML;
    jsonData["to"] = otherUser;
    jsonData["content"] = $("messageID").value;
    jsonData["timestamp"] = formattedDate;

    const res = await fetch("/src/server/addMessageHandler", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(jsonData),
    });

    if (res.status === 200) {
      socket.send(JSON.stringify(jsonData));
    } else {
      console.error("Message not sent:", res.status);
    }
  } catch (error) {
    console.error("Sending message:", error);
  }

  sortUsersbyLastMessage(otherUser);
  $("messageID").value = "";
}

//Sorts usersDiv by last message sent
function sortUsersbyLastMessage(receiver) {
  const userDiv = $(receiver);

  if (userDiv) {
    const parentDiv = userDiv.parentElement;
    const userIsOnline = parentDiv.classList.contains("online");

    if (userIsOnline) {
      var onlineGroup = document.getElementsByClassName("online-group")[0];
      onlineGroup.after(userDiv);
    } else {
      var offlineGroup = document.getElementsByClassName("offline-group")[0];
      offlineGroup.after(userDiv);
    }
  }
}

//Checks which conversation is open and wether to send notification or display msg
function sendNotification(currentUser, sender) {
  if (sender === currentUser) {
    return false;
  }

  let messagesWindow = qS("messages-area");
  let messagesHeaderText = qS("messages-header-text");

  if (messagesWindow.classList.contains("hidden")) {
    return true;
  } else {
    //check the user with whom the chat is open
    if (messagesHeaderText.textContent === `Your conversation with ${sender}`) {
      return false;
    }
    return true;
  }
}

//gives loginwsconnection a username
export function userConnected(username) {
  let jsonData = {};
  jsonData["action"] = "username";
  jsonData["username"] = username;
  socket.send(JSON.stringify(jsonData));
}

//removes wsconnections
export function userLogoutConnection() {
  let jsonData = {};
  jsonData["action"] = "left";
  socket.send(JSON.stringify(jsonData));
}
