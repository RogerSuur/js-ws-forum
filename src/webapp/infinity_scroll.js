import { getPosts, getMessages, otherUser, messagesIndex, currentIndex, isThread, postsWrapper, threadWrapper, makeLinksClickable, pDB } from "./app.js";
import { $, qS } from "./DOM_helpers.js";
import { show, hide } from "./visibility_togglers.js";

export const loadTime = 1500;
export const sleep = ms => new Promise(r => setTimeout(r, ms));
export const spinner = qS('lds-ellipsis');

export const keepPostInFocus = (postInFocus, position) => {
    const scrollPointItem = $(postInFocus);
    scrollPointItem.scrollIntoView({ behavior: 'auto', block: position });
}

export const sentinels = {
    topSentinelPreviousY: 0,
    topSentinelPreviousRatio: 0,
    bottomSentinelPreviousY: 0,
    bottomSentinelPreviousRatio: 0,
}

const topSentCallback = async entry => {
    const currentY = entry.boundingClientRect.top;
    const currentRatio = entry.intersectionRatio;
    const isIntersecting = entry.isIntersecting;

    if (messagesIndex == 0 && sentinels.topSentinelPreviousRatio != 0) {
        // if we are at the end of the DB, do nothing
        return;
    }

    // conditional check for Scrolling up
    if (
        currentY > sentinels.topSentinelPreviousY &&
        isIntersecting &&
        currentRatio >= sentinels.topSentinelPreviousRatio
    ) {
        // set spinner
        let messagesAreaRect = qS('messages-area').getBoundingClientRect();
        let x = messagesAreaRect.left + messagesAreaRect.width / 2 - 40;
        let y = messagesAreaRect.top + 40;
        spinner.setAttribute('style', `left: ${x}px; top: ${y}px;`);
        show(spinner);
        await sleep(loadTime);
        hide(spinner);
        // load new data
        getMessages(otherUser)
    }

    sentinels.topSentinelPreviousY = currentY;
    sentinels.topSentinelPreviousRatio = currentRatio;
}

const bottomSentCallback = async entry => {
    if (currentIndex >= pDB.length) {
        // if we are at the end of the DB, do nothing
        return;
    }
    const currentY = entry.boundingClientRect.top;
    const currentRatio = entry.intersectionRatio;
    const isIntersecting = entry.isIntersecting;

    if (
        currentY < sentinels.bottomSentinelPreviousY &&
        currentRatio > sentinels.bottomSentinelPreviousRatio &&
        isIntersecting
    ) {
        // set spinner
        let rect;
        if (isThread) {
            rect = qS('thread-area').getBoundingClientRect();
        } else {
            rect = qS('posts-area').getBoundingClientRect();
        }
        let x = rect.left + rect.width / 2 - 40;
        let y = rect.bottom - 100;
        spinner.setAttribute('style', `left: ${x}px; top: ${y}px;`);
        if (entry.target.getBoundingClientRect().top < window.innerHeight) {
            show(spinner);
            await sleep(loadTime);
            hide(spinner);
        }

        // load new data
        let postInFocus;
        if (isThread) {
            postInFocus = threadWrapper.lastChild.id;
        } else {
            postInFocus = postsWrapper.lastChild.id;
        }
        getPosts(currentIndex, false, isThread)
            .then(() => {
                if (!isThread) {
                    makeLinksClickable()
                }
            })

        keepPostInFocus(postInFocus, 'end');

    }

    sentinels.bottomSentinelPreviousY = currentY;
    sentinels.bottomSentinelPreviousRatio = currentRatio;
}

const callback = entries => {
    entries.forEach(entry => {
        bottomSentCallback(entry);
    });
}

let observer = new IntersectionObserver(callback);

export const initPostIntersectionObserver = (open) => {
    if (open) {
        observer.observe($(`intersection-observer`));
        observer.unobserve($(`thread-intersection-observer`));
    } else {
        observer.unobserve($(`intersection-observer`));
        observer.observe($(`thread-intersection-observer`));
    }
}

export const initMessageIntersectionObserver = () => {

    const messagesCallback = entries => {
        entries.forEach(entry => {
            topSentCallback(entry);
        });
    }
    let options = {
        root: qS('messages-area')
    }
    let messagesObserver = new IntersectionObserver(messagesCallback, options);
    messagesObserver.observe($(`message-intersection-observer`));
}
