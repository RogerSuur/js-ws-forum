import { webSocketUsers } from './ws.js';
import { currentUser } from './app.js';
import { qS, createDiv } from './DOM_helpers.js';

let onlineUsersWrapper = qS("online");
let offlineUsersWrapper = qS("offline");

export async function populateUsers() {
    //loads fresh set of user
    let usersObject = await loadUsersObject();


    if (usersObject.offline !== null) {
        onlineUsersWrapper.innerHTML = '';
        offlineUsersWrapper.innerHTML = '';

        usersObject.online = webSocketUsers.data.online

        usersObject.online = removeDoubleOnlineUsers(usersObject.online)
        usersObject.online = sortOnlineUsers(usersObject.online, usersObject.offline)
        usersObject.offline = removeDoubleUsers(usersObject.online, usersObject.offline)

        constructUserLists(usersObject.online, onlineUsersWrapper, 'online');
        constructUserLists(usersObject.offline, offlineUsersWrapper, 'offline');
    }
}

const removeDoubleOnlineUsers = function (onlineUsers) {
    return onlineUsers.filter((user, index, self) => {
        return index === self.findIndex(u => u.name === user.name);
    });
}

async function loadUsersObject() {
    const data = await fetch('/src/server/getUsersHandler', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Username': currentUser.innerHTML,
        },
        body: JSON.stringify({
        }),
    })
        .then((response) => response.json())
        .then((result) => {
            if (!Object.prototype.hasOwnProperty.call(result, "data")) console.err("No user data:", result.message);
            else {
                return result.data
            }
        })
        .catch((err) => {
            console.error("Fetching users:", err);
        });
    return data
}

// If user comes online, remove from offline list
const removeDoubleUsers = function (onlineUsers, allUsers) {
    allUsers.forEach(function (user) {
        if (onlineUsers.find(e => e.name === user.name)) {
            allUsers = allUsers.filter(item => item !== user)
        }
    })
    return allUsers
}

const sortOnlineUsers = function (onlineUsers, allUsers) {
    const allUsersIndexMap = {};
    for (let i = 0; i < allUsers.length; i++) {
        const userName = allUsers[i].name;
        allUsersIndexMap[userName] = i;
    }

    onlineUsers.sort((a, b) => {
        const aIndex = allUsersIndexMap[a.name];
        const bIndex = allUsersIndexMap[b.name];
        if (aIndex === undefined || bIndex === undefined) {
            return 0;
        } else {
            return aIndex - bIndex;
        }
    });

    return onlineUsers
}

const constructUserLists = (usersArray, usersWrapper, type) => {
    let heading = createDiv(`${type}-group`, `<i class="fa-solid fa-comments"></i>${usersArray.length} users ${type}`);
    usersWrapper.appendChild(heading);
    usersArray.forEach((user) => {
        if (user.name !== currentUser.innerHTML) {
            let singleUser = createDiv('user-name', user.name, user.name);
            if (user.unread) {
                singleUser.classList.add('unread-messages');
            }
            usersWrapper.appendChild(singleUser);
        }
        if (user.name === currentUser.innerHTML) {
            const headingElement = document.querySelector(".online-group");
            headingElement.innerText = `${usersArray.length - 1} users ${type}`
        }
    });
}