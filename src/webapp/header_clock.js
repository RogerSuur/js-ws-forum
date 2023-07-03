const hoursHand = document.querySelector('.hour');
const minutesHand = document.querySelector('.minute');
const secondsHand = document.querySelector('.second');

export const startHeaderClock = setInterval(() => {
    let currentTime = new Date();
    let hour = currentTime.getHours();
    let min = currentTime.getMinutes();
    let sec = currentTime.getSeconds();
    let hour_rotation = 30 * hour + min / 2; //converting time to 360 degrees
    let min_rotation = 6 * min;
    let sec_rotation = 6 * sec;

    hoursHand.style.transform = `rotate(${hour_rotation}deg)`;
    minutesHand.style.transform = `rotate(${min_rotation}deg)`;
    secondsHand.style.transform = `rotate(${sec_rotation}deg)`;
}, 1000);
