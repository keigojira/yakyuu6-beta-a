document.addEventListener('DOMContentLoaded', () => {
    // --- UI要素の取得 ---
    const elements = {
        // 設定セクション
        setupSection: document.getElementById('setup-section'),
        inningCountInput: document.getElementById('inningCount'),
        awayTeamNameInput: document.getElementById('awayTeamNameInput'),
        homeTeamNameInput: document.getElementById('homeTeamNameInput'),
        awayPlayersDiv: document.getElementById('awayPlayers'),
        homePlayersDiv: document.getElementById('homePlayers'),
        startGameButton: document.getElementById('startGameButton'),

        // スコアボード＆情報セクション
        gameSection: document.getElementById('game-section'),
        awayTeamNameDisplay: document.getElementById('awayTeamNameDisplay'),
        homeTeamNameDisplay: document.getElementById('homeTeamNameDisplay'),
        awayScoreboardRow: document.getElementById('awayScoreboardRow'),
        homeScoreboardRow: document.getElementById('homeScoreboardRow'),
        currentInningInfo: document.getElementById('currentInningInfo'),
        ballsCountElement: document.getElementById('ballsCount'),
        strikesCountElement: document.getElementById('strikesCount'),
        outsCountElement: document.getElementById('outsCount'),
        firstBase: document.getElementById('firstBase'),
        secondBase: document.getElementById('secondBase'),
        thirdBase: document.getElementById('thirdBase'),

        // コントロールパネル
        currentBatterSelect: document.getElementById('currentBatterSelect'),
        singleBtn: document.getElementById('singleBtn'),
        doubleBtn: document.getElementById('doubleBtn'),
        tripleBtn: document.getElementById('tripleBtn'),
        homeRunBtn: document.getElementById('homeRunBtn'),
        walkBtn: document.getElementById('walkBtn'),
        strikeOutBtn: document.getElementById('strikeOutBtn'),
        outBtn: document.getElementById('outBtn'),
        sacrificeBtn: document.getElementById('sacrificeBtn'),
        errorBtn: document.getElementById('errorBtn'),
        stealBtn: document.getElementById('stealBtn'),
        advanceRunnerBtn: document.getElementById('advanceRunnerBtn'),
        forceOutRunnerBtn: document.getElementById('forceOutRunner'),
        returnRunnerBtn: document.getElementById('returnRunnerBtn'),
        clearBasesBtn: document.getElementById('clearBasesBtn'),
        nextInningBtn: document.getElementById('nextInningBtn'),
        undoLastActionBtn: document.getElementById('undoLastActionBtn'),
        endGameBtn: document.getElementById('endGameBtn'),

        // 選手成績テーブル
        awayPlayerStatsBody: document.getElementById('awayPlayerStatsBody'),
        homePlayerStatsBody: document.getElementById('homePlayerStatsBody'),
        awayTeamStatsHeader: document.getElementById('awayTeamStatsHeader'),
        homeTeamStatsHeader: document.getElementById('homeTeamStatsHeader'),


        // 履歴セクション
        historySection: document.getElementById('history-section'),
        gameHistoryList: document.getElementById('gameHistoryList'),
        clearHistoryButton: document.getElementById('clearHistoryButton'),
        backToSetupButton: document.getElementById('backToSetupButton')
    };

    // --- ゲームの状態変数 ---
    let gameState = {
        totalInnings: 9,
        currentInning: 1,
        isTopInning: true, // true: 表, false: 裏

        balls: 0,
        strikes: 0,
        outs: 0,

        runners: {
            first: null, // {id: 'player_id', name: 'player_name'}
            second: null,
            third: null
        },

        awayTeam: { name: 'ビジターズ', players: [], runs: 0, hits: 0, errors: 0, inningScores: [] },
        homeTeam: { name: 'ホームズ', players: [], runs: 0, hits: 0, errors: 0, inningScores: [] },

        currentTeam: null,
        opposingTeam: null,
        currentBatterIndex: 0, // 現在の打者のインデックス (0始まり)

        gameHistory: [], // 試合の全操作履歴 (元に戻す機能用)
        actionHistory: [] // 直近の操作履歴 (元に戻す機能用)
    };

    // プレイヤーオブジェクトのプロトタイプ
    const playerPrototype = {
        id: '',
        name: '',
        atBats: 0,
        hits: 0,
        rbi: 0,
        runsScored: 0,
        walks: 0,
        strikeOuts: 0,
        singles: 0,
        doubles: 0,
        triples: 0,
        homeRuns: 0,
        sacrifices: 0, // 犠打/犠飛
        stolenBases: 0 // 盗塁数
    };

    // --- ユーティリティ関数 ---
    const generatePlayerId = (teamPrefix, index) => `${teamPrefix}_player_${index + 1}`;

    // --- UI更新関数 ---
    const updateScoreboard = () => {
        const { totalInnings, currentInning, isTopInning, awayTeam, homeTeam, balls, strikes, outs, runners } = gameState;

        // スコアボードヘッダー（イニング数）
        const scoreboardHeader = elements.scoreboardHeader || document.querySelector('.scoreboard-header');
        // 既存のイニング列をクリア（チームラベルとRHEは残す）
        scoreboardHeader.querySelectorAll('.inning-col').forEach(el => el.remove());

        // イニング列の生成
        for (let i = 1; i <= totalInnings; i++) {
            const inningCol = document.createElement('div');
            inningCol.classList.add('inning-col');
            inningCol.textContent = i;
            // R, H, Eの前にイニングを追加
            scoreboardHeader.insertBefore(inningCol, scoreboardHeader.querySelector('.rhe-header'));
        }

        // チームごとのスコア表示
        const updateTeamScoreRow = (team, rowElement) => {
            // 既存のイニングスコアをクリア
            rowElement.querySelectorAll('.inning-score').forEach(el => el.remove());

            // イニングスコアの追加
            for (let i = 0; i < totalInnings; i++) {
                const inningScoreDiv = document.createElement('div');
                inningScoreDiv.classList.add('inning-score');
                // undefined の場合は空文字列を表示
                inningScoreDiv.textContent = team.inningScores[i] !== undefined ? team.inningScores[i] : '';
                rowElement.insertBefore(inningScoreDiv, rowElement.querySelector('.rhe-score'));
            }

            // RHEの更新
            rowElement.querySelector('.rhe-score.r').textContent = team.runs;
            rowElement.querySelector('.rhe-score.h').textContent = team.hits;
            rowElement.querySelector('.rhe-score.e').textContent = team.errors;
        };

        updateTeamScoreRow(awayTeam, elements.awayScoreboardRow);
        updateTeamScoreRow(homeTeam, elements.homeScoreboardRow);

        // チーム名表示の更新
        elements.awayTeamNameDisplay.textContent = awayTeam.name;
        elements.homeTeamNameDisplay.textContent = homeTeam.name;
        elements.awayTeamStatsHeader.textContent = `${awayTeam.name}成績`;
        elements.homeTeamStatsHeader.textContent = `${homeTeam.name}成績`;

        // 現在のイニング情報
        elements.currentInningInfo.textContent = `${currentInning}回${isTopInning ? '表' : '裏'}`;

        // カウント表示
        elements.ballsCountElement.textContent = balls;
        elements.strikesCountElement.textContent = strikes;
        elements.outsCountElement.textContent = outs;

        // 塁上表示
        elements.firstBase.classList.toggle('active', runners.first !== null);
        elements.secondBase.classList.toggle('active', runners.second !== null);
        elements.thirdBase.classList.toggle('active', runners.third !== null);

        // 選手成績テーブルの更新
        updatePlayerStatsTable(awayTeam.players, elements.awayPlayerStatsBody);
        updatePlayerStatsTable(homeTeam.players, elements.homePlayerStatsBody);
    };

    const updateCurrentBatterSelect = () => {
        elements.currentBatterSelect.innerHTML = '';
        if (gameState.currentTeam && gameState.currentTeam.players.length > 0) {
            gameState.currentTeam.players.forEach((player, index) => {
                const option = document.createElement('option');
                option.value = index;
                option.textContent = player.name;
                elements.currentBatterSelect.appendChild(option);
            });
            elements.currentBatterSelect.value = gameState.currentBatterIndex;
        }
    };

    const updatePlayerStatsTable = (players, tbodyElement) => {
        tbodyElement.innerHTML = '';
        players.forEach((player, index) => {
            const row = tbodyElement.insertRow();
            row.insertCell().textContent = index + 1; // 背番号
            row.insertCell().textContent = player.name; // 選手名
            row.insertCell().textContent = player.atBats + player.walks; // 打席数
            row.insertCell().textContent = player.atBats; // 打数
            row.insertCell().textContent = player.hits; // 安打
            row.insertCell().textContent = player.rbi; // 打点
            row.insertCell().textContent = player.runsScored; // 得点
            row.insertCell().textContent = player.walks; // 四球
            row.insertCell().textContent = player.strikeOuts; // 三振
        });
    };

    const addHistoryEntry = (eventDetail) => {
        const entry = document.createElement('li');
        entry.innerHTML = `<strong>${gameState.currentInning}回${gameState.isTopInning ? '表' : '裏'}</strong>: ${eventDetail}`;
        elements.gameHistoryList.prepend(entry); // 最新のものを上に追加

        // 履歴データにも追加（元に戻す機能用）
        gameState.gameHistory.push({
            inning: gameState.currentInning,
            isTop: gameState.isTopInning,
            detail: eventDetail,
            state: JSON.parse(JSON.stringify(gameState)) // 現在のゲーム状態をディープコピーして保存
        });
        // 最大履歴数を設定（例: 50件）
        if (gameState.gameHistory.length > 50) {
            gameState.gameHistory.shift(); // 古いものから削除
            elements.gameHistoryList.lastChild.remove(); // UIからも削除
        }
    };

    const storeActionState = (actionType) => {
        // 現在のgameStateをコピーしてアクション履歴に追加
        gameState.actionHistory.push({
            type: actionType,
            prevState: JSON.parse(JSON.stringify(gameState))
        });
        // 例: 過去10アクションまで保持
        if (gameState.actionHistory.length > 10) {
            gameState.actionHistory.shift();
        }
    };

    // --- ゲームロジック ---
    const resetCounts = () => {
        gameState.balls = 0;
        gameState.strikes = 0;
        // outsはリセットしない（打席ごとに増えるため）
        updateScoreboard();
    };

    const resetBases = () => {
        gameState.runners = { first: null, second: null, third: null };
        updateScoreboard();
    };

    const nextBatter = () => {
        gameState.currentBatterIndex = (gameState.currentBatterIndex + 1) % gameState.currentTeam.players.length;
        updateCurrentBatterSelect();
    };

    const recordOut = (message) => {
        gameState.outs++;
        addHistoryEntry(message);
        resetCounts(); // アウトになったらボール・ストライクはリセット

        if (gameState.outs >= 3) {
            nextHalfInning();
        } else {
            nextBatter();
        }
        updateScoreboard(); // アウト後の状態を更新
    };

    const advanceRunners = (basesAdvanced, currentBatterResult = null) => {
        let runsScoredThisPlay = 0;
        const currentBatter = gameState.currentTeam.players[gameState.currentBatterIndex];
        const newRunnersState = { first: null, second: null, third: null };

        // 各塁のランナーを進めるロジック
        // 3塁ランナー
        if (gameState.runners.third) {
            currentTeam.players[gameState.runners.third.index].runsScored++;
            runsScoredThisPlay++;
            addHistoryEntry(`${gameState.runners.third.name}が本塁生還！`);
        }
        // 2塁ランナー
        if (gameState.runners.second) {
            newRunnersState.third = gameState.runners.second;
        }
        // 1塁ランナー
        if (gameState.runners.first) {
            newRunnersState.second = gameState.runners.first;
        }

        // 打者の進塁
        if (currentBatterResult === 'single') {
            newRunnersState.first = { id: currentBatter.id, name: currentBatter.name, index: gameState.currentBatterIndex };
        } else if (currentBatterResult === 'double') {
            newRunnersState.second = { id: currentBatter.id, name: currentBatter.name, index: gameState.currentBatterIndex };
        } else if (currentBatterResult === 'triple') {
            newRunnersState.third = { id: currentBatter.id, name: currentBatter.name, index: gameState.currentBatterIndex };
        } else if (currentBatterResult === 'homeRun') {
            // 本塁打の場合は全ランナーと打者が生還
            runsScoredThisPlay++; // 打者自身の得点
            currentTeam.players[gameState.currentBatterIndex].runsScored++;
            if (gameState.runners.third) runsScoredThisPlay++;
            if (gameState.runners.second) runsScoredThisPlay++;
            if (gameState.runners.first) runsScoredThisPlay++;
            resetBases(); // 全ランナーと打者が生還するため塁をクリア
        } else if (currentBatterResult === 'walk' || currentBatterResult === 'error') {
            // 四球またはエラーの場合の押し出しと進塁
            if (newRunnersState.second && newRunnersState.first) { // 1,2塁にランナーがいる場合
                newRunnersState.third = newRunnersState.second;
                newRunnersState.second = newRunnersState.first;
            } else if (newRunnersState.first) { // 1塁にランナーがいる場合
                newRunnersState.second = newRunnersState.first;
            }
            newRunnersState.first = { id: currentBatter.id, name: currentBatter.name, index: gameState.currentBatterIndex };
        }

        if (currentBatterResult !== 'homeRun') {
            // 新しいランナーの状態を適用
            gameState.runners = newRunnersState;
        }

        gameState.currentTeam.runs += runsScoredThisPlay;
        return runsScoredThisPlay;
    };

    const nextHalfInning = () => {
        const { currentInning, isTopInning, awayTeam, homeTeam, currentTeam } = gameState;

        // 現在のイニングのスコアを確定
        const inningIndex = currentInning - 1;
        let runsThisHalfInning = currentTeam.runs - (currentTeam.inningScores.slice(0, inningIndex).reduce((a, b) => a + (b || 0), 0));
        if (runsThisHalfInning < 0) runsThisHalfInning = 0; // マイナスにならないように

        currentTeam.inningScores[inningIndex] = runsThisHalfInning;
        addHistoryEntry(`${currentInning}回${isTopInning ? '表' : '裏'} 終了。${currentTeam.name}はこの回${runsThisHalfInning}点。`);


        if (!isTopInning) { // イニングの裏が終了した場合
            gameState.currentInning++;
            addHistoryEntry(`${currentInning}回終了。`);
        }
        gameState.isTopInning = !isTopInning; // 表と裏を切り替える

        // 試合終了判定
        if (gameState.currentInning > gameState.totalInnings) {
            // 最終イニング裏の攻撃が終了した時点で、ホームチームが勝っていればそのまま試合終了
            if (!gameState.isTopInning && homeTeam.runs > awayTeam.runs) {
                endGame();
                return;
            }
            // 延長戦突入、または最終イニング裏の攻撃がまだの場合
            if (gameState.currentInning > gameState.totalInnings + 10) { // 延長10回までなど、上限を設定
                 endGame(); // 無限延長防止
                 return;
            }
        }

        resetCounts();
        resetBases();
        gameState.currentBatterIndex = 0; // イニング開始時は先頭打者に戻る
        setTeamsForInning(); // 表/裏に応じてカレントチームを設定
        updateScoreboard();
        updateCurrentBatterSelect();
    };

    const setTeamsForInning = () => {
        if (gameState.isTopInning) {
            gameState.currentTeam = gameState.awayTeam;
            gameState.opposingTeam = gameState.homeTeam;
        } else {
            gameState.currentTeam = gameState.homeTeam;
            gameState.opposingTeam = gameState.awayTeam;
        }
    };

    const endGame = () => {
        const { awayTeam, homeTeam } = gameState;
        let winnerMessage = '';
        if (awayTeam.runs > homeTeam.runs) {
            winnerMessage = `${awayTeam.name}の勝利！`;
        } else if (homeTeam.runs > awayTeam.runs) {
            winnerMessage = `${homeTeam.name}の勝利！`;
        } else {
            winnerMessage = '引き分け！';
        }

        addHistoryEntry(`試合終了！ ${winnerMessage}`);
        addHistoryEntry(`最終スコア: ${awayTeam.name} ${awayTeam.runs} - ${homeTeam.name} ${homeTeam.runs}`);

        alert(`試合終了！\n${winnerMessage}\n\n${awayTeam.name}: ${awayTeam.runs} Runs, ${awayTeam.hits} Hits, ${awayTeam.errors} Errors\n${homeTeam.name}: ${homeTeam.runs} Runs, ${homeTeam.hits} Hits, ${homeTeam.errors} Errors`);

        elements.gameSection.classList.add('hidden');
        elements.historySection.classList.remove('hidden');
        elements.clearHistoryButton.classList.remove('hidden'); // 履歴クリアボタンを表示
        elements.backToSetupButton.classList.remove('hidden'); // 設定に戻るボタンを表示
    };

    // --- プレイヤー入力フィールドの動的生成 ---
    const createPlayerInputFields = (container, teamPrefix) => {
        container.innerHTML = ''; // 既存のフィールドをクリア
        for (let i = 0; i < 9; i++) { // デフォルト9人
            const group = document.createElement('div');
            group.classList.add('player-input-group');
            const label = document.createElement('label');
            label.textContent = `${i + 1}.`;
            const input = document.createElement('input');
            input.type = 'text';
            input.value = `${teamPrefix === 'away' ? 'ビジター' : 'ホーム'}選手${i + 1}`; // デフォルト名
            input.dataset.playerId = generatePlayerId(teamPrefix, i); // IDをデータ属性として保持

            group.appendChild(label);
            group.appendChild(input);
            container.appendChild(group);
        }
    };

    // --- イベントハンドラ ---
    elements.startGameButton.addEventListener('click', () => {
        // 入力値の取得とバリデーション
        const totalInnings = parseInt(elements.inningCountInput.value);
        if (isNaN(totalInnings) || totalInnings < 1) {
            alert('有効なイニング数を入力してください。(1以上)');
            return;
        }

        const awayTeamName = elements.awayTeamNameInput.value.trim() || 'ビジターズ';
        const homeTeamName = elements.homeTeamNameInput.value.trim() || 'ホームズ';

        // プレイヤーデータの初期化
        const getPlayersFromInput = (divElement, teamPrefix) => {
            return Array.from(divElement.querySelectorAll('.player-input-group input')).map((input, index) => {
                return {
                    ...playerPrototype,
                    id: generatePlayerId(teamPrefix, index),
                    name: input.value.trim() || `${teamPrefix === 'away' ? 'ビジター' : 'ホーム'}選手${index + 1}`
                };
            });
        };

        gameState.awayTeam = {
            name: awayTeamName,
            players: getPlayersFromInput(elements.awayPlayersDiv, 'away'),
            runs: 0, hits: 0, errors: 0, inningScores: Array(totalInnings).fill(null)
        };
        gameState.homeTeam = {
            name: homeTeamName,
            players: getPlayersFromInput(elements.homePlayersDiv, 'home'),
            runs: 0, hits: 0, errors: 0, inningScores: Array(totalInnings).fill(null)
        };

        // ゲーム状態のリセット
        gameState.totalInnings = totalInnings;
        gameState.currentInning = 1;
        gameState.isTopInning = true;
        gameState.balls = 0;
        gameState.strikes = 0;
        gameState.outs = 0;
        resetBases();
        gameState.currentBatterIndex = 0;
        gameState.gameHistory = [];
        elements.gameHistoryList.innerHTML = '';
        gameState.actionHistory = []; // アクション履歴もクリア

        setTeamsForInning(); // 初期チーム設定
        updateScoreboard();
        updateCurrentBatterSelect();

        // UIの切り替え
        elements.setupSection.classList.add('hidden');
        elements.gameSection.classList.remove('hidden');
        elements.historySection.classList.add('hidden'); // 試合中は履歴を非表示

        addHistoryEntry(`試合開始！ ${awayTeamName} vs ${homeTeamName} (${totalInnings}イニング制)`);
    });

    // 「元に戻す」ボタン
    elements.undoLastActionBtn.addEventListener('click', () => {
        if (gameState.actionHistory.length > 0) {
            const lastState = gameState.actionHistory.pop().prevState;
            // 状態を復元
            Object.assign(gameState, JSON.parse(JSON.stringify(lastState)));
            addHistoryEntry(`アクションを元に戻しました。`);

            // UIを更新
            updateScoreboard();
            updateCurrentBatterSelect();
            // 履歴リストの最新のエントリも削除 (元に戻されたアクション)
            if (elements.gameHistoryList.firstChild) {
                elements.gameHistoryList.firstChild.remove();
            }

        } else {
            alert('これ以上元に戻せる操作はありません。');
        }
    });


    // 打席操作ボタン
    elements.singleBtn.addEventListener('click', () => {
        storeActionState('single');
        const batter = gameState.currentTeam.players[gameState.currentBatterIndex];
        batter.atBats++;
        batter.hits++;
        batter.singles++;
        const runsScored = advanceRunners(1, 'single');
        batter.rbi += runsScored;
        addHistoryEntry(`${batter.name}が**単打**！`);
        resetCounts();
        nextBatter();
        updateScoreboard();
    });

    elements.doubleBtn.addEventListener('click', () => {
        storeActionState('double');
        const batter = gameState.currentTeam.players[gameState.currentBatterIndex];
        batter.atBats++;
        batter.hits++;
        batter.doubles++;
        const runsScored = advanceRunners(2, 'double');
        batter.rbi += runsScored;
        addHistoryEntry(`${batter.name}が**二塁打**！`);
        resetCounts();
        nextBatter();
        updateScoreboard();
    });

    elements.tripleBtn.addEventListener('click', () => {
        storeActionState('triple');
        const batter = gameState.currentTeam.players[gameState.currentBatterIndex];
        batter.atBats++;
        batter.hits++;
        batter.triples++;
        const runsScored = advanceRunners(3, 'triple');
        batter.rbi += runsScored;
        addHistoryEntry(`${batter.name}が**三塁打**！`);
        resetCounts();
        nextBatter();
        updateScoreboard();
    });

    elements.homeRunBtn.addEventListener('click', () => {
        storeActionState('homeRun');
        const batter = gameState.currentTeam.players[gameState.currentBatterIndex];
        batter.atBats++;
        batter.hits++;
        batter.homeRuns++;
        const runsScored = advanceRunners(4, 'homeRun'); // 本塁打は特別扱い
        batter.rbi += runsScored;
        addHistoryEntry(`${batter.name}が**本塁打**！ ${runsScored}点追加！`);
        resetCounts();
        nextBatter();
        updateScoreboard();
    });

    elements.walkBtn.addEventListener('click', () => {
        storeActionState('walk');
        const batter = gameState.currentTeam.players[gameState.currentBatterIndex];
        batter.walks++;
        const runsScored = advanceRunners(1, 'walk'); // 四球による押し出しも考慮
        batter.rbi += runsScored; // 押し出しの場合打点に加算
        addHistoryEntry(`${batter.name}が**四球**を選びました。`);
        resetCounts();
        nextBatter();
        updateScoreboard();
    });

    elements.strikeOutBtn.addEventListener('click', () => {
        storeActionState('strikeOut');
        const batter = gameState.currentTeam.players[gameState.currentBatterIndex];
        batter.atBats++;
        batter.strikeOuts++;
        recordOut(`${batter.name}が**三振**！`);
    });

    elements.outBtn.addEventListener('click', () => {
        storeActionState('out');
        const batter = gameState.currentTeam.players[gameState.currentBatterIndex];
        batter.atBats++;
        recordOut(`${batter.name}が**アウト**になりました。`);
    });

    elements.sacrificeBtn.addEventListener('click', () => {
        storeActionState('sacrifice');
        const batter = gameState.currentTeam.players[gameState.currentBatterIndex];
        batter.sacrifices++; // 犠打/犠飛は打数に含まれない

        const runsScored = 0; // 犠打/犠飛での直接的な得点はadvanceRunnersで処理されないため、別途
        // このボタンではアウトと進塁処理をユーザーに聞く
        const basesInput = prompt(`${batter.name}の犠打/犠飛です。何塁ランナーが進塁しましたか？（例: 3, 2, 1, 0(進塁なし)）\n複数いる場合はカンマ区切りで入力してください。`, '0');
        if (basesInput) {
            const bases = basesInput.split(',').map(b => parseInt(b.trim())).filter(b => !isNaN(b) && b > 0 && b < 4).sort((a,b)=>b-a); // 大きい順にソート

            let tempRunners = { ...gameState.runners }; // 一時的なランナー状態
            let tempRunsScored = 0;

            for (const base of bases) {
                if (base === 3 && tempRunners.third) {
                    gameState.currentTeam.players[tempRunners.third.index].runsScored++;
                    tempRunsScored++;
                    tempRunners.third = null;
                } else if (base === 2 && tempRunners.second) {
                    tempRunners.third = tempRunners.second;
                    tempRunners.second = null;
                } else if (base === 1 && tempRunners.first) {
                    tempRunners.second = tempRunners.first;
                    tempRunners.first = null;
                }
            }
            gameState.currentTeam.runs += tempRunsScored;
            batter.rbi += tempRunsScored;
            gameState.runners = tempRunners; // 最終状態を適用

            addHistoryEntry(`${batter.name}の**犠打/犠飛**。${tempRunsScored}点追加。`);
        } else {
             addHistoryEntry(`${batter.name}の**犠打/犠飛**（進塁なし）。`);
        }
        recordOut(`打者 ${batter.name}がアウトになりました。`); // 犠打/犠飛はアウトを伴う
    });

    elements.errorBtn.addEventListener('click', () => {
        storeActionState('error');
        const batter = gameState.currentTeam.players[gameState.currentBatterIndex];
        gameState.currentTeam.errors++;

        // エラーでの進塁ロジックは簡略化し、選択肢を提示
        const runsScored = advanceRunners(1, 'error'); // 一旦1塁出塁として進塁処理
        batter.rbi += runsScored;
        addHistoryEntry(`${batter.name}が相手チームの**失策**で出塁。`);
        resetCounts();
        nextBatter();
        updateScoreboard();
    });

    // 塁上操作ボタン
    elements.stealBtn.addEventListener('click', () => {
        storeActionState('steal');
        const availableRunners = [];
        if (gameState.runners.first) availableRunners.push({ base: '1塁', runner: gameState.runners.first });
        if (gameState.runners.second) availableRunners.push({ base: '2塁', runner: gameState.runners.second });
        if (gameState.runners.third) availableRunners.push({ base: '3塁', runner: gameState.runners.third });

        if (availableRunners.length === 0) {
            alert('塁上にランナーがいません。');
            return;
        }

        let promptMessage = 'どのランナーが何塁に盗塁しますか？\n';
        availableRunners.forEach((item, index) => {
            promptMessage += `${index + 1}. ${item.runner.name} (${item.base})\n`;
        });
        promptMessage += '例: 1,3 (1番目のランナーが3塁へ盗塁)';

        const input = prompt(promptMessage);
        if (!input) return;

        const [runnerIndexStr, targetBaseStr] = input.split(',').map(s => s.trim());
        const runnerIndex = parseInt(runnerIndexStr) - 1;
        const targetBase = parseInt(targetBaseStr);

        if (isNaN(runnerIndex) || runnerIndex < 0 || runnerIndex >= availableRunners.length ||
            isNaN(targetBase) || (targetBase !== 2 && targetBase !== 3 && targetBase !== 4)) { // 4は本塁
            alert('入力が不正です。');
            return;
        }

        const selectedRunner = availableRunners[runnerIndex].runner;
        let stolen = false;

        if (selectedRunner.id === gameState.runners.first?.id && targetBase === 2) {
            gameState.runners.second = gameState.runners.first;
            gameState.runners.first = null;
            stolen = true;
        } else if (selectedRunner.id === gameState.runners.second?.id && targetBase === 3) {
            gameState.runners.third = gameState.runners.second;
            gameState.runners.second = null;
            stolen = true;
        } else if (selectedRunner.id === gameState.runners.third?.id && targetBase === 4) { // 本塁盗塁
            gameState.currentTeam.players[selectedRunner.index].runsScored++;
            gameState.currentTeam.runs++;
            gameState.runners.third = null;
            stolen = true;
        } else {
            alert('指定されたランナーはその塁に盗塁できません。');
            return;
        }

        if (stolen) {
            gameState.currentTeam.players[selectedRunner.index].stolenBases++;
            addHistoryEntry(`${selectedRunner.name}が**${targetBase === 4 ? '本塁' : targetBase + '塁'}に盗塁成功**！`);
            updateScoreboard();
        }
    });

    elements.advanceRunnerBtn.addEventListener('click', () => {
        storeActionState('advanceRunner');
        const availableRunners = [];
        if (gameState.runners.first) availableRunners.push({ base: '1塁', runner: gameState.runners.first });
        if (gameState.runners.second) availableRunners.push({ base: '2塁', runner: gameState.runners.second });
        if (gameState.runners.third) availableRunners.push({ base: '3塁', runner: gameState.runners.third });

        if (availableRunners.length === 0) {
            alert('塁上にランナーがいません。');
            return;
        }

        let promptMessage = 'どのランナーが何塁に進塁しますか？\n';
        availableRunners.forEach((item, index) => {
            promptMessage += `${index + 1}. ${item.runner.name} (${item.base})\n`;
        });
        promptMessage += '例: 1,2 (1番目のランナーが2塁へ進塁)';

        const input = prompt(promptMessage);
        if (!input) return;

        const [runnerIndexStr, targetBaseStr] = input.split(',').map(s => s.trim());
        const runnerIndex = parseInt(runnerIndexStr) - 1;
        const targetBase = parseInt(targetBaseStr);

        if (isNaN(runnerIndex) || runnerIndex < 0 || runnerIndex >= availableRunners.length ||
            isNaN(targetBase) || (targetBase !== 2 && targetBase !== 3 && targetBase !== 4)) {
            alert('入力が不正です。');
            return;
        }

        const selectedRunner = availableRunners[runnerIndex].runner;
        let advanced = false;
        let message = '';

        // まず現在の塁からランナーを一時的に削除
        if (selectedRunner.id === gameState.runners.first?.id) gameState.runners.first = null;
        else if (selectedRunner.id === gameState.runners.second?.id) gameState.runners.second = null;
        else if (selectedRunner.id === gameState.runners.third?.id) gameState.runners.third = null;

        // 目標の塁に配置
        if (targetBase === 2 && !gameState.runners.second) {
            gameState.runners.second = selectedRunner;
            advanced = true;
            message = `が2塁へ進塁。`;
        } else if (targetBase === 3 && !gameState.runners.third) {
            gameState.runners.third = selectedRunner;
            advanced = true;
            message = `が3塁へ進塁。`;
        } else if (targetBase === 4) { // 本塁
            gameState.currentTeam.players[selectedRunner.index].runsScored++;
            gameState.currentTeam.runs++;
            advanced = true;
            message = `が本塁生還し得点！`;
        } else {
            alert('その塁にランナーがいるか、不正な進塁です。');
            // 元に戻す
            if (selectedRunner.id === availableRunners[runnerIndex].runner.id) {
                // 元の塁に戻す
                if (availableRunners[runnerIndex].base === '1塁') gameState.runners.first = selectedRunner;
                else if (availableRunners[runnerIndex].base === '2塁') gameState.runners.second = selectedRunner;
                else if (availableRunners[runnerIndex].base === '3塁') gameState.runners.third = selectedRunner;
            }
            return;
        }

        if (advanced) {
            addHistoryEntry(`${selectedRunner.name}${message}`);
            updateScoreboard();
        }
    });


    elements.forceOutRunnerBtn.addEventListener('click', () => {
        storeActionState('forceOut');
        const availableRunners = [];
        if (gameState.runners.first) availableRunners.push({ base: '1塁', runner: gameState.runners.first });
        if (gameState.runners.second) availableRunners.push({ base: '2塁', runner: gameState.runners.second });
        if (gameState.runners.third) availableRunners.push({ base: '3塁', runner: gameState.runners.third });

        if (availableRunners.length === 0) {
            alert('塁上にランナーがいません。');
            return;
        }

        let promptMessage = 'どのランナーがアウトになりますか？\n';
        availableRunners.forEach((item, index) => {
            promptMessage += `${index + 1}. ${item.runner.name} (${item.base})\n`;
        });
        promptMessage += '番号を入力してください:';

        const input = prompt(promptMessage);
        if (!input) return;

        const runnerIndex = parseInt(input) - 1;
        if (isNaN(runnerIndex) || runnerIndex < 0 || runnerIndex >= availableRunners.length) {
            alert('入力が不正です。');
            return;
        }

        const runnerOut = availableRunners[runnerIndex].runner;
        const baseOut = availableRunners[runnerIndex].base;

        if (runnerOut.id === gameState.runners.first?.id) gameState.runners.first = null;
        else if (runnerOut.id === gameState.runners.second?.id) gameState.runners.second = null;
        else if (runnerOut.id === gameState.runners.third?.id) gameState.runners.third = null;

        recordOut(`${runnerOut.name}が${baseOut}で**アウト**になりました。`);
    });

    elements.returnRunnerBtn.addEventListener('click', () => {
        storeActionState('returnRunner');
        const availableRunners = [];
        if (gameState.runners.first) availableRunners.push({ base: '1塁', runner: gameState.runners.first });
        if (gameState.runners.second) availableRunners.push({ base: '2塁', runner: gameState.runners.second });
        if (gameState.runners.third) availableRunners.push({ base: '3塁', runner: gameState.runners.third });

        if (availableRunners.length === 0) {
            alert('塁上にランナーがいません。');
            return;
        }

        let promptMessage = 'どのランナーが前の塁に戻りますか？\n';
        availableRunners.forEach((item, index) => {
            promptMessage += `${index + 1}. ${item.runner.name} (${item.base})\n`;
        });
        promptMessage += '番号を入力してください:';

        const input = prompt(promptMessage);
        if (!input) return;

        const runnerIndex = parseInt(input) - 1;
        if (isNaN(runnerIndex) || runnerIndex < 0 || runnerIndex >= availableRunners.length) {
            alert('入力が不正です。');
            return;
        }

        const selectedRunner = availableRunners[runnerIndex].runner;
        const currentBase = availableRunners[runnerIndex].base;
        let returned = false;

        if (currentBase === '2塁' && !gameState.runners.first) {
            gameState.runners.first = selectedRunner;
            gameState.runners.second = null;
            returned = true;
        } else if (currentBase === '3塁' && !gameState.runners.second) {
            gameState.runners.second = selectedRunner;
            gameState.runners.third = null;
            returned = true;
        } else if (currentBase === '本塁' && !gameState.runners.third) { // 本塁は直接戻れないので3塁に強制
             gameState.runners.third = selectedRunner;
             returned = true;
             alert('本塁からは直接前の塁に戻れません。3塁に配置しました。');
        } else {
            alert('そのランナーを前の塁に戻せません（前の塁にランナーがいるか、不正な操作です）。');
            return;
        }

        if (returned) {
            addHistoryEntry(`${selectedRunner.name}が前の塁に戻りました。`);
            updateScoreboard();
        }
    });


    elements.clearBasesBtn.addEventListener('click', () => {
        storeActionState('clearBases');
        addHistoryEntry('塁上のランナーを**すべてクリア**しました。');
        resetBases();
        updateScoreboard(); // クリア後の状態を更新
    });


    // イニング操作ボタン
    elements.nextInningBtn.addEventListener('click', () => {
        storeActionState('nextInning');
        if (gameState.outs < 3) {
            if (!confirm('まだ3アウトではありませんが、次のイニングに進みますか？')) {
                return;
            }
        }
        nextHalfInning();
    });

    elements.endGameBtn.addEventListener('click', () => {
        storeActionState('endGame');
        if (confirm('本当に試合を終了しますか？')) {
            endGame();
        }
    });

    // 履歴セクションのボタン
    elements.clearHistoryButton.addEventListener('click', () => {
        if (confirm('試合履歴をすべてクリアしてもよろしいですか？')) {
            gameState.gameHistory = [];
            elements.gameHistoryList.innerHTML = '';
            alert('試合履歴をクリアしました。');
        }
    });

    elements.backToSetupButton.addEventListener('click', () => {
        if (confirm('試合設定画面に戻りますか？現在の試合データは失われます。')) {
            // 初期状態に戻す
            location.reload(); // 最も簡単な方法でページをリロードして初期化
        }
    });

    // --- 初期化処理 ---
    const initializeGame = () => {
        // 選手入力フィールドを初期状態で生成
        createPlayerInputFields(elements.awayPlayersDiv, 'away');
        createPlayerInputFields(elements.homePlayersDiv, 'home');

        // スコアボードのRHEヘッダーをHTMLに追加 (JSで動的に追加する場合)
        // HTMLに直接記述されているので不要だが、もし削除された場合に備えコメントアウト
        /*
        const scoreboardHeader = document.querySelector('.scoreboard-header');
        ['R', 'H', 'E'].forEach(label => {
            const rheHeader = document.createElement('div');
            rheHeader.classList.add('rhe-header', label.toLowerCase());
            rheHeader.textContent = label;
            scoreboardHeader.appendChild(rheHeader);
        });
        */

        // 各スコアボード行にRHEスコア要素をHTMLに追加 (JSで動的に追加する場合)
        const addRheScoresToRow = (rowElement) => {
            ['r', 'h', 'e'].forEach(type => {
                const rheScoreDiv = document.createElement('div');
                rheScoreDiv.classList.add('rhe-score', type);
                rheScoreDiv.textContent = '0'; // 初期値
                rowElement.appendChild(rheScoreDiv);
            });
        };
        // 既にHTMLに記述されているため、初期値設定のみ
        // addRheScoresToRow(elements.awayScoreboardRow);
        // addRheScoresToRow(elements.homeScoreboardRow);


        // 初期UI表示設定
        elements.gameSection.classList.add('hidden');
        elements.historySection.classList.add('hidden');
        elements.clearHistoryButton.classList.add('hidden');
        elements.backToSetupButton.classList.add('hidden');

        // 初回スコアボード更新
        setTeamsForInning(); // 初期チーム名表示のため
        updateScoreboard();
    };

    initializeGame();
});
