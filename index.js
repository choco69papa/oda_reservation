// ▼▼▼ ここから追記 ▼▼▼

// 設定
let currentBaseDate = new Date(); // 表示の基準日
const startHour = 9;  // 開始時間 9:00
const endHour = 18;   // 終了時間 18:00
const timeStep = 30;  // 30分刻み

// 初期表示
renderCalendar(currentBaseDate);

// 週移動ボタンの動作
$('#prevWeek').click(function() {
    currentBaseDate.setDate(currentBaseDate.getDate() - 7);
    renderCalendar(currentBaseDate);
});

$('#nextWeek').click(function() {
    currentBaseDate.setDate(currentBaseDate.getDate() + 7);
    renderCalendar(currentBaseDate);
});

// カレンダー描画関数
function renderCalendar(baseDate) {
    const $header = $('#dateHeader');
    const $body = $('#timeBody');
    $header.empty();
    $body.empty();

    // 1. ヘッダー（日付）を作る
    let weekDates = []; // 日付保持用
    let tempDate = new Date(baseDate);
    
    // 左上の空セル
    $header.append('<th style="width:60px;">時間</th>');
    
    // 月の表示更新
    $('#currentMonthDisplay').text((tempDate.getMonth() + 1) + "月");

    const days = ['日', '月', '火', '水', '木', '金', '土'];

    for (let i = 0; i < 7; i++) {
        let m = tempDate.getMonth() + 1;
        let d = tempDate.getDate();
        let w = tempDate.getDay();
        
        // 日付の文字列作成 (YYYY年MM月DD日 形式)
        let dateStr = `${tempDate.getFullYear()}年${('0'+m).slice(-2)}月${('0'+d).slice(-2)}日`;
        weekDates.push(dateStr);

        // 土日の色変えクラス
        let colorClass = (w === 0) ? 'text-danger' : (w === 6) ? 'text-primary' : '';
        
        $header.append(`
            <th class="${colorClass}">
                ${d}<br>(${days[w]})
            </th>
        `);
        tempDate.setDate(tempDate.getDate() + 1); // 翌日へ
    }

    // 2. ボディ（時間割）を作る
    for (let h = startHour; h < endHour; h++) {
        for (let min = 0; min < 60; min += timeStep) {
            let timeStr = `${h}:${('0'+min).slice(-2)}`; // 9:00形式
            let timeLabel = `${h}：${('0'+min).slice(-2)}～`; // 送信用ラベル
            
            let rowHtml = `<tr><td class="bg-light font-weight-bold">${timeStr}</td>`;

            // 横に7日分ループ
            for (let i = 0; i < 7; i++) {
                let targetDate = weekDates[i];
                
                // ★ここで「予約済み」かどうか判定します
                // 現時点では「月曜日」と「過去の日時」を×にする例を入れています
                let isNG = false;
                let checkDay = new Date(targetDate.replace(/年|月/g, '/').replace('日', ''));
                
                // 例：月曜日は定休日(×)にする
                if (checkDay.getDay() === 1) isNG = true; 

                if (isNG) {
                    rowHtml += `<td><span class="symbol-ng">×</span></td>`;
                } else {
                    // 〇のセル (クリック可能)
                    // data-date と data-time 属性に値を持たせておく
                    rowHtml += `
                        <td>
                            <span class="time-slot symbol-ok" 
                                  data-date="${targetDate}" 
                                  data-time="${timeLabel}">
                                〇
                            </span>
                        </td>`;
                }
            }
            rowHtml += '</tr>';
            $body.append(rowHtml);
        }
    }
}

// 3. 〇をクリックした時の動作（ここが選択処理）
$(document).on('click', '.time-slot', function() {
    // 他の選択を解除
    $('.selected-slot').removeClass('selected-slot');
    $('.symbol-ok').text('〇'); // 文字を〇に戻す

    // 自分を選択状態にする
    $(this).addClass('selected-slot');
    $(this).text('選択'); // 文字を「選択」に変える

    // 隠しinputに値を入れる
    let selectedDate = $(this).data('date');
    let selectedTime = $(this).data('time');

    $('input[name="date"]').val(selectedDate);
    $('select[name="minute"]').val(selectedTime); // もしselectをhiddenに変えたなら input[name="minute"]

    // ここで元のコードにある hidden input にも値が入るように調整
    $('#selected_date').val(selectedDate);
    $('#selected_time').val(selectedTime);

    // デバッグ用（確認したら消してOK）
    console.log("選択日時:", selectedDate, selectedTime);
});
// ▲▲▲ ここまで追記 ▲▲▲
