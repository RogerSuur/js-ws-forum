import { messagesWrapper, currentUser } from "./app.js";
import { createDiv, $, formatTimeStamp } from "./DOM_helpers.js";

export const initMessages = (DB, fromIndex, toIndex) => {

    let interSection = $('message-intersection-observer');

    if (fromIndex === DB.length) {
        messagesWrapper.innerHTML = '';
        messagesWrapper.appendChild(interSection);
    }

    let i = fromIndex - 1;
    let nextUser;
    while (i >= toIndex) {

        if (i === toIndex) {
            interSection.remove();
            messagesWrapper.appendChild(interSection);
        }
        if (i === 0) {
            nextUser = '';
        } else {
            nextUser = DB[i - 1].sender;
        }

        let singleMessage = createSingleMessage(DB[i], DB[i].content, DB[i].sender, formatTimeStamp(DB[i].timestamp), nextUser)

        messagesWrapper.appendChild(singleMessage);

        i--;
    }
}

export const createSingleMessage = (index, content, from, timestamp, previousUser) => {

    let singleMessage = createDiv('single-message');

    if (content == '#beginningofconversation#') {

        singleMessage.classList.add('no-messages');
        singleMessage.innerHTML = 'This is the beginning of your conversation. Be the first to speak up!';

    } else {

        singleMessage.setAttribute('id', `message-${index}`);

        let messageContent = createDiv('message-content', content);

        if (from !== previousUser) {
            let messageAuthor = createDiv('message-user', from);
            if (from === currentUser.innerHTML) {
                messageAuthor.innerHTML = `Me`;
                singleMessage.classList.add('me');
                messageAuthor.classList.add('me');
                messageContent.classList.add('me');
            }
            singleMessage.appendChild(messageAuthor);

        } else if (previousUser === currentUser.innerHTML) {

            singleMessage.classList.add('me');
            messageContent.classList.add('me');
        }

        singleMessage.appendChild(messageContent);

        let messageDate = createDiv('message-date', timestamp);

        singleMessage.appendChild(messageDate);
    }

    return singleMessage

}
