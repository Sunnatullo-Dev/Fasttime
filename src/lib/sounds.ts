export const sounds = {
    click: new Audio('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3'),
    complete: new Audio('https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3'),
    achievement: new Audio('https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3'),
    break: new Audio('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3'),
};

export const playSound = (name: keyof typeof sounds) => {
    try {
        const audio = sounds[name];
        audio.currentTime = 0;
        audio.volume = 0.5;
        audio.play().catch(e => console.log('Sound blocked by browser:', e));
    } catch (err) {
        console.error('Sound error:', err);
    }
};
