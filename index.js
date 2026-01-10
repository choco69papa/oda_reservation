$(function () {
    // =================================================================
    // ★設定エリア：成功した「GASのURL」をここに貼ってください
    // =================================================================
    const GAS_API_URL = 'https://script.google.com/macros/s/AKfycbzxZRuvjfmievN-4d4Lack3cl40d3mWegDthbBsg4gn7lnoRy50SdBnLGgqOb3Bde0H/exec';

    // ページ読み込み時にフォームの送信先（宛先）をGASに設定する
    $('form').attr('action', GAS_API_URL);

    // LIFF初期化
    initializeLiff();

    // 既存処理
    $('#form-number').click(function () {
        $('#form-name').empty();
        var namelabel = $('input[name="namelabel"]').val();
    });

    // --- カレンダー変数 ---
    let currentBaseDate = new Date();
    // 日曜日から始まるように調整
    currentBaseDate.setDate(currentBaseDate.getDate() - currentBaseDate.getDay());
    const startH = 9;  
    const endH = 17;   
    let bookedSlots = [];

    // --- 読み込み処理 ---
    function fetchAndRender() {
        $('#loadingMsg').show();
        fetch(GAS_API_URL)
            .then(response => response.json())
            .then(data => {
                console.log("予約済みリスト:", data); // 確認用ログ
                bookedSlots = data;
                renderCalendar(currentBaseDate);
                $('#loadingMsg').hide();
            })
            .catch(error => {
                console.error(error);
                renderCalendar(currentBaseDate); 
                $('#loadingMsg').hide();
            });
    }

    // --- カレンダー描画 ---
    function renderCalendar(baseDate) {
        const $header = $('#dateHeader');
        const $body = $('#timeBody');
        const days = ['日', '月', '火', '水', '木', '金', '土'];
        const now = new Date(); 
        
        $header.empty().append('<th>時間</th>');
        $body.empty();
        
        $('#currentMonthDisplay').text((baseDate.getMonth() + 1) + "月");

        let weekDates = [];
        let tempDate = new Date(baseDate);

        // ヘッダー（日付）作成
        for (let i = 0; i < 7; i++) {
            let m = tempDate.getMonth() + 1;
            let d = tempDate.getDate();
            let w = tempDate.getDay();
            
            // ★重要：データの照合に使う「シンプルな日付」 (例: 2026/1/10)
            let fullDate = `${tempDate.getFullYear()}/${m}/${d}`; 
            
            // 表示用 (例: 2026年01月10日)
            let displayDate = `${tempDate.getFullYear()}年${('0'+m).slice(-2)}月${('0'+d).slice(-2)}日`;
            
            weekDates.push({ fullDate: fullDate, displayDate: displayDate });
            
            let color = (w === 0) ? 'text-danger' : (w === 6) ? 'text-primary' : '';
            $header.append(`<th class="${color}">${d}<br><small>(${days[w]})</small></th>`);
            tempDate.setDate(tempDate.getDate() + 1);
        }

        // 時間枠作成
        for (let h = startH; h < endH; h++) {
            let timeStr = `${h}:00`;     // ★シンプル時間（判定・保存用）
            let timeLabel = `${h}：00～`; // 表示用（画面に出す文字）
            
            let row = `<tr><td class="bg-light font-weight-bold">${timeStr}</td>`;
            
            weekDates.forEach((dateObj) => {
                let dObj = new Date(dateObj.fullDate + " " + timeStr);
                
                // 判定用キー (例: 2026/1/10 9:00)
                let checkKey = dateObj.fullDate + " " + timeStr;

                let isMonday = (dObj.getDay() === 1);
                let isThirdTuesday = (dObj.getDay() === 2 && Math.ceil(dObj.getDate() / 7) === 3);
                let isPast = (dObj < now);
                
                // 予約済み判定
                let isBooked = bookedSlots.includes(checkKey);

                if (isMonday || isThirdTuesday || isPast || isBooked) {
                    row += `<td><span class="symbol-ng">×</span></td>`;
                } else {
                    // ★ここを修正しました！ data-date と data-time に「シンプルな値」を入れるように変更
                    row += `<td><div class="time-slot" data-date="${dateObj.fullDate}" data-time="${timeStr}">
                                <span class="symbol-ok">〇</span>
                            </div></td>`;
                }
            });
            $body.append(row + '</tr>');
        }
    }

    fetchAndRender();

    $('#prevWeek').on('click', function(e){ e.preventDefault(); currentBaseDate.setDate(currentBaseDate.getDate() - 7); renderCalendar(currentBaseDate); });
    $('#nextWeek').on('click', function(e){ e.preventDefault(); currentBaseDate.setDate(currentBaseDate.getDate() + 7); renderCalendar(currentBaseDate); });

    $(document).on('click', '.time-slot', function() {
        $('.selected-slot').removeClass('selected-slot');
        $(this).addClass('selected-slot');
        $('#selected_date').val($(this).data('date'));
        $('#selected_time').val($(this).data('time'));
    });

    // =================================================================
    // 送信処理（シンプル版）
    // =================================================================
    let submitted = false;

    $('form').submit(function (e) {
        var date = $('#selected_date').val();
        var minute = $('#selected_time').val();
        
        if(!date || !minute) {
            alert("予約日時を選択してください");
            return false;
        }
        
        submitted = true;
        $('input[type="submit"]').prop('disabled', true).val('送信中...');
    });

    $('#hidden_iframe').on('load', function() {
        if(submitted) {
            var namelabel = $('input[name="namelabel"]').val();
            var date = $('#selected_date').val();
            var minute = $('#selected_time').val();
            var names = $('select[name="names"]').val();
            var inquiries = $('textarea[name="inquiries"]').val();

            var msg = `＊＊ご予約内容＊＊\nお名前：\n ${namelabel}\n希望日：\n ${date}\n時間：\n ${minute}\nメニュー：\n ${names}\n問い合わせ内容：\n ${inquiries}`;
            
            sendText(msg);
        }
    });

    function initializeLiff() {
        liff.init({ liffId: "LIFF_ID_HERE" }) 
            .then(() => { if (!liff.isLoggedIn()) { liff.login(); } })
            .catch((err) => { console.log('LIFF Init failed ', err); });
    }

    function sendText(text) {
        if (!liff.isInClient()) {
            alert('予約完了しました！');
            window.location.reload();
            return;
        }
        liff.sendMessages([{ 'type': 'text', 'text': text }])
            .then(function () { liff.closeWindow(); })
            .catch(function (error) {
                alert('予約は完了しましたが、LINEメッセージが送れませんでした。');
                window.location.reload();
            });
    }
});
