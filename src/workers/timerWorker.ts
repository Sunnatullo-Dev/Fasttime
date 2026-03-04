
let timerId: NodeJS.Timeout | null = null;
let endTime = 0;
let remainingAtPause = 0;

self.onmessage = (e: MessageEvent) => {
    const { command, value } = e.data;

    switch (command) {
        case 'start':
            if (timerId) clearInterval(timerId);

            // value is the number of seconds left
            endTime = Date.now() + value * 1000;

            timerId = setInterval(() => {
                const now = Date.now();
                const timeLeft = Math.max(0, Math.round((endTime - now) / 1000));

                self.postMessage({ type: 'tick', timeLeft });

                if (timeLeft <= 0) {
                    if (timerId) clearInterval(timerId);
                    timerId = null;
                    self.postMessage({ type: 'complete' });
                }
            }, 100); // Check more frequently for better accuracy
            break;

        case 'pause':
            if (timerId) {
                clearInterval(timerId);
                timerId = null;
                remainingAtPause = Math.max(0, Math.round((endTime - Date.now()) / 1000));
            }
            break;

        case 'reset':
            if (timerId) clearInterval(timerId);
            timerId = null;
            break;
    }
};
