$(function () {
    const gasUrl = "https://script.google.com/macros/s/AKfycbz7pR1AsO_H4YX2xDz31N4NgQ5pfQgHzZX-8MjDKPJyPU02JIPPt-iWqWblOZ6nJBWY6w/exec";

    function renderCalendar(baseDate) {
        // GASから予約済みリストを取得
        $.getJSON(gasUrl, function(reservedList) {
            const $header = $('#dateHeader');
            const $body = $('#timeBody');
            // ... (中略：ヘッダー生成などは今のまま) ...

            weekDates.forEach((dateObj) => {
                let dObj = new Date(dateObj.fullDate + " " + timeStr);
                let checkKey = dateObj.displayDate + timeLabel; // 予約済み判定用のキー
                
                let isMonday = (dObj.getDay() === 1);
                let isThirdTuesday = (dObj.getDay() === 2 && Math.ceil(dObj.getDate() / 7) === 3);
                let isPast = (dObj < now);
                
                // ★追加：予約済みリストに含まれているかチェック
                let isReserved = reservedList.includes(checkKey);

                if (isMonday || isThirdTuesday || isPast || isReserved) {
                    row += `<td><span class="symbol-ng">×</span></td>`;
                } else {
                    row += `<td><div class="time-slot" data-date="${dateObj.displayDate}" data-time="${timeLabel}">
                                <span class="symbol-ok">〇</span>
                            </div></td>`;
                }
            });
            // ... (以下略) ...
        });
    }
});
